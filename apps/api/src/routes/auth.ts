import { Router, Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { auditService } from "../services/audit-service";

export const authRouter = Router();

/**
 * GET /api/auth/me
 * Returns authenticated user profile, roles, and granted scopes.
 */
authRouter.get("/me", authenticateToken, (req: Request, res: Response) => {
  res.json({
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/auth/audit
 * Returns security audit logs. Protected by Dashboard.Admin role.
 */
authRouter.get("/audit", authenticateToken, requireAdmin, (_req: Request, res: Response) => {
  const logs = auditService.getRecentLogs(50);
  res.json({
    totalCount: logs.length,
    logs,
    timestamp: new Date().toISOString(),
  });
});
