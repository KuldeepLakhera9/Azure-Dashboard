import { Router, Request, Response, NextFunction } from "express";
import { getAzureDataProvider } from "../services/azure";

export const alertsRouter = Router();

/**
 * GET /api/alerts
 * Subscription alerts from Azure Alerts Management or operational monitoring.
 */
alertsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = getAzureDataProvider();
    const alerts = await provider.getAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});
