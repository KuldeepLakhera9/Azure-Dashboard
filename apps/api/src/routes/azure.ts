import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";
import { resourcesRouter } from "./resources";
import { costsRouter } from "./costs";
import { budgetsRouter } from "./budgets";
import { metricsRouter } from "./metrics";
import { alertsRouter } from "./alerts";
import { authenticateToken, requireScope } from "../middleware/auth";

export const azureRouter = Router();

/**
 * GET /api/azure/status
 * Explicit diagnostic endpoint confirming subscription ID configuration,
 * Azure authentication availability, and permission validation without leaking secrets.
 */
azureRouter.get("/status", async (_req, res, next) => {
  try {
    const provider = getAzureDataProvider();
    const status = await provider.getAzureStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// Protected sub-routes matching Section 15 specifications
azureRouter.use("/resources", authenticateToken, requireScope("Dashboard.Read"), resourcesRouter);
azureRouter.use("/vms", authenticateToken, requireScope("Dashboard.Read"), (_req, res, next) => {
  const provider = getAzureDataProvider();
  provider.getVmInventory()
    .then((vms) => res.json(vms))
    .catch(next);
});
azureRouter.use("/costs", authenticateToken, requireScope("Dashboard.Read"), costsRouter);
azureRouter.use("/budgets", authenticateToken, requireScope("Dashboard.Read"), budgetsRouter);
azureRouter.use("/metrics", authenticateToken, requireScope("Dashboard.Read"), metricsRouter);
azureRouter.use("/activity", authenticateToken, requireScope("Dashboard.Read"), alertsRouter);
