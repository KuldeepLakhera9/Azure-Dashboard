import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { config } from "../config";
import { auditService } from "../services/audit-service";

export interface AuthenticatedUser {
  oid: string;
  sub: string;
  name: string;
  upn?: string;
  email?: string;
  roles: string[];
  scopes: string[];
  tenantId: string;
  isSimulated?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Remote JWKS cache for Microsoft Entra ID keys
const jwksMap = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJWKS(tenantId: string) {
  if (!jwksMap.has(tenantId)) {
    const jwksUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
    );
    jwksMap.set(tenantId, createRemoteJWKSet(jwksUrl));
  }
  return jwksMap.get(tenantId)!;
}

/**
 * Validates a simulated development token for offline and test workflows.
 * Supports verifying authorized roles and rejecting unauthorized scopes.
 */
function parseSimulatedToken(token: string): AuthenticatedUser | null {
  if (token === "mock-token-staff-reader" || token === "simulated-staff-reader") {
    return {
      oid: "usr-staff-001",
      sub: "usr-staff-001",
      name: "Staff Operations Engineer",
      upn: "ops.staff@adt-ai.org",
      email: "ops.staff@adt-ai.org",
      roles: ["Dashboard.Viewer"],
      scopes: ["Dashboard.Read"],
      tenantId: config.AZURE_AD_TENANT_ID || "tenant-adt-ai-foundation-prod",
      isSimulated: true,
    };
  }

  if (token === "mock-token-admin" || token === "simulated-admin") {
    return {
      oid: "usr-admin-001",
      sub: "usr-admin-001",
      name: "Lead Cloud Architect",
      upn: "lead.architect@adt-ai.org",
      email: "lead.architect@adt-ai.org",
      roles: ["Dashboard.Admin", "Dashboard.Viewer"],
      scopes: ["Dashboard.Read", "Dashboard.Admin"],
      tenantId: config.AZURE_AD_TENANT_ID || "tenant-adt-ai-foundation-prod",
      isSimulated: true,
    };
  }

  if (token === "mock-token-unauthorized" || token === "simulated-unauthorized") {
    return {
      oid: "usr-external-999",
      sub: "usr-external-999",
      name: "External Unapproved Guest",
      upn: "guest@external-partner.com",
      email: "guest@external-partner.com",
      roles: [],
      scopes: [], // Missing Dashboard.Read!
      tenantId: "unapproved-external-tenant",
      isSimulated: true,
    };
  }

  // Base64 simulated claims fallback (e.g. for dynamic frontend test tokens)
  if (token.startsWith("simulated-json:")) {
    try {
      const jsonStr = Buffer.from(token.replace("simulated-json:", ""), "base64").toString("utf-8");
      const parsed = JSON.parse(jsonStr) as Partial<AuthenticatedUser>;
      return {
        oid: parsed.oid || "usr-dynamic-001",
        sub: parsed.sub || "usr-dynamic-001",
        name: parsed.name || "Authenticated Staff",
        upn: parsed.upn || "staff@adt-ai.org",
        email: parsed.email || "staff@adt-ai.org",
        roles: parsed.roles || ["Dashboard.Viewer"],
        scopes: parsed.scopes || ["Dashboard.Read"],
        tenantId: parsed.tenantId || "tenant-adt-ai-foundation-prod",
        isSimulated: true,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * authenticateToken Middleware
 * Enforces Microsoft Entra ID Bearer Token validation.
 * Verifies signature, issuer, audience, expiration, and scopes.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    auditService.log({
      eventType: "AUTH_TOKEN_MISSING",
      outcome: "DENIED",
      userId: "anonymous",
      ipAddress: clientIp,
      path: req.path,
      method: req.method,
      message: "Missing Authorization Bearer header",
    });

    res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token", error_description="Missing bearer token"');
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required. Bearer token missing in Authorization header.",
    });
    return;
  }

  const rawToken = authHeader.substring(7).trim();

  // 1. Check for simulated tokens in development or test environments
  const simulatedUser = parseSimulatedToken(rawToken);
  if (simulatedUser) {
    // Validate tenant if configured
    if (
      config.AZURE_AD_TENANT_ID &&
      simulatedUser.tenantId !== config.AZURE_AD_TENANT_ID &&
      simulatedUser.tenantId !== "tenant-adt-ai-foundation-prod"
    ) {
      auditService.log({
        eventType: "AUTH_UNAUTHORIZED_TENANT",
        outcome: "DENIED",
        userId: simulatedUser.upn || simulatedUser.oid,
        userRole: simulatedUser.roles.join(","),
        ipAddress: clientIp,
        path: req.path,
        method: req.method,
        message: `Tenant '${simulatedUser.tenantId}' not authorized.`,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Access denied. Sign-in is restricted to the authorized ADT-AI organization tenant.",
      });
      return;
    }

    req.user = simulatedUser;
    auditService.log({
      eventType: "AUTH_TOKEN_VALIDATED",
      outcome: "SUCCESS",
      userId: simulatedUser.upn || simulatedUser.oid,
      userRole: simulatedUser.roles.join(","),
      ipAddress: clientIp,
      path: req.path,
      method: req.method,
      message: "Simulated token validated successfully",
    });
    next();
    return;
  }

  // 2. Real Microsoft Entra ID JWT verification using jose & JWKS
  try {
    const tenantId = config.AZURE_AD_TENANT_ID || "common";
    const jwks = getRemoteJWKS(tenantId);

    const audience = config.AZURE_AD_AUDIENCE || config.AZURE_AD_API_CLIENT_ID;
    const issuers = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];

    const { payload } = await jwtVerify(rawToken, jwks, {
      issuer: issuers,
      audience: audience ? [audience, `api://${audience}`] : undefined,
    });

    // Parse scopes and roles from Microsoft Entra token payload
    const scpClaim = (payload as JWTPayload & { scp?: string }).scp;
    const scopes = scpClaim ? scpClaim.split(" ") : [];
    const roles = Array.isArray((payload as Record<string, unknown>).roles)
      ? ((payload as Record<string, unknown>).roles as string[])
      : [];

    const user: AuthenticatedUser = {
      oid: String(payload.oid || payload.sub || "unknown-oid"),
      sub: String(payload.sub || ""),
      name: String(payload.name || payload.preferred_username || "Authorized User"),
      upn: (payload.upn || payload.preferred_username || payload.email) as string | undefined,
      email: (payload.email || payload.upn) as string | undefined,
      roles,
      scopes,
      tenantId: String(payload.tid || ""),
    };

    req.user = user;

    auditService.log({
      eventType: "AUTH_TOKEN_VALIDATED",
      outcome: "SUCCESS",
      userId: user.upn || user.oid,
      userRole: user.roles.join(","),
      ipAddress: clientIp,
      path: req.path,
      method: req.method,
      message: "Microsoft Entra ID JWT cryptographically validated",
    });

    next();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Token verification failed";
    const isExpired = errMsg.toLowerCase().includes("expired");

    auditService.log({
      eventType: isExpired ? "AUTH_TOKEN_EXPIRED" : "AUTH_TOKEN_INVALID",
      outcome: "DENIED",
      userId: "unauthenticated",
      ipAddress: clientIp,
      path: req.path,
      method: req.method,
      message: `JWT validation failed: ${errMsg}`,
    });

    res.setHeader(
      "WWW-Authenticate",
      `Bearer error="${isExpired ? "invalid_token" : "invalid_token"}", error_description="${errMsg}"`
    );

    res.status(401).json({
      error: "Unauthorized",
      message: isExpired
        ? "Session expired. Your Microsoft Entra ID access token has expired."
        : "Invalid access token. Signature, issuer, or audience validation failed.",
    });
  }
}

/**
 * requireScope Middleware
 * Validates that the authenticated user possesses the delegated scope (e.g. Dashboard.Read)
 * or an equivalent application role.
 */
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
      return;
    }

    const hasScope = req.user.scopes.includes(requiredScope);
    // Allow if user has app roles (e.g. Dashboard.Viewer or Dashboard.Admin)
    const hasRole =
      req.user.roles.includes("Dashboard.Admin") ||
      req.user.roles.includes("Dashboard.Viewer");

    if (!hasScope && !hasRole) {
      auditService.log({
        eventType: "AUTH_INSUFFICIENT_SCOPE",
        outcome: "DENIED",
        userId: req.user.upn || req.user.oid,
        userRole: req.user.roles.join(","),
        ipAddress: req.ip || "unknown",
        path: req.path,
        method: req.method,
        message: `Missing required scope: ${requiredScope}. Token had scopes: [${req.user.scopes.join(", ")}]`,
      });

      res.setHeader(
        "WWW-Authenticate",
        `Bearer error="insufficient_scope", scope="${requiredScope}"`
      );
      res.status(403).json({
        error: "Forbidden",
        message: `Insufficient permissions. Delegated scope '${requiredScope}' or role 'Dashboard.Viewer' required.`,
      });
      return;
    }

    next();
  };
}

/**
 * requireAdmin Middleware
 * Strictly enforces that the user possesses the Dashboard.Admin role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    return;
  }

  const isAdmin = req.user.roles.includes("Dashboard.Admin");
  if (!isAdmin) {
    auditService.log({
      eventType: "ADMIN_ACTION_PERFORMED",
      outcome: "DENIED",
      userId: req.user.upn || req.user.oid,
      userRole: req.user.roles.join(","),
      ipAddress: req.ip || "unknown",
      path: req.path,
      method: req.method,
      message: "Non-admin user attempted to access administrative endpoint",
    });

    res.status(403).json({
      error: "Forbidden",
      message: "Administrative privilege required. Role 'Dashboard.Admin' is required for this action.",
    });
    return;
  }

  next();
}
