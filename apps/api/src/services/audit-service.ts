export type AuditEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_TOKEN_VALIDATED"
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_INSUFFICIENT_SCOPE"
  | "AUTH_INVALID_AUDIENCE"
  | "AUTH_UNAUTHORIZED_TENANT"
  | "AUTH_LOGOUT"
  | "ADMIN_ACTION_PERFORMED";

export type AuditOutcome = "SUCCESS" | "DENIED" | "FAILURE";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  outcome: AuditOutcome;
  userId: string; // user OID or UPN
  userRole?: string;
  ipAddress: string;
  path: string;
  method: string;
  message: string;
}

export class AuditService {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 500;

  public log(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Structured logging to console without printing sensitive tokens or credentials
    const color =
      entry.outcome === "SUCCESS"
        ? "\x1b[32m" // Green
        : entry.outcome === "DENIED"
        ? "\x1b[33m" // Yellow
        : "\x1b[31m"; // Red
    const reset = "\x1b[0m";

    console.log(
      `[AUDIT] ${color}${entry.outcome}${reset} ${entry.eventType} | User: ${entry.userId} | ${entry.method} ${entry.path} | ${entry.message}`
    );

    return fullEntry;
  }

  public getRecentLogs(limit = 100): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }
}

export const auditService = new AuditService();
