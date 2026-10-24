import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAzureDataProvider } from "../services/azure";

export const metricsRouter = Router();

const MetricsQuerySchema = z.object({
  resourceId: z.string().optional(),
  timespan: z.string().optional(),
});

/**
 * GET /api/metrics?resourceId=...&timespan=...
 * Supported Azure Monitor infrastructure performance metrics.
 * Accurately reports missing telemetry without fabricating metrics.
 */
metricsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = MetricsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid metrics query parameters",
        details: parseResult.error.format(),
      });
      return;
    }

    const { resourceId, timespan } = parseResult.data;
    const provider = getAzureDataProvider();
    const result = await provider.getMetrics(resourceId, timespan);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
