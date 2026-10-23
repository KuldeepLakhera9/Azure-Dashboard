import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";

export const metricsRouter = Router();

// GET /api/metrics?resourceId=...
metricsRouter.get("/", async (req, res, next) => {
  try {
    const resourceId = typeof req.query.resourceId === "string" ? req.query.resourceId : undefined;
    const provider = getAzureDataProvider();
    const result = await provider.getMetrics(resourceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
