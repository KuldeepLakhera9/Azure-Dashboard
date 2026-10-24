import { Router, Request, Response, NextFunction } from "express";
import { getAzureDataProvider } from "../services/azure";
import { durableBillingStore } from "../cache/durable-store";
import { config } from "../config";

export const costsRouter = Router();

/**
 * GET /api/costs
 * Subscription cost analytics.
 * Enforces shared 24-hour durable cooldown across backend instances.
 * Browser refreshes cannot bypass the 24-hour cooldown.
 */
costsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.query.force === "true";
    const subId = config.AZURE_SUBSCRIPTION_ID || "sub-adt-ai-foundation-prod-01";

    const cooldown = await durableBillingStore.isCooldownActive(
      subId,
      config.BILLING_CACHE_TTL_MS
    );

    const provider = getAzureDataProvider();
    const result = await provider.getCostData(forceRefresh);

    res.setHeader("X-Billing-Cooldown-Active", cooldown.active ? "true" : "false");
    if (cooldown.active) {
      res.setHeader("X-Billing-Cooldown-Remaining-Ms", String(cooldown.remainingMs));
    }

    res.json({
      ...result,
      cooldown: {
        active: cooldown.active,
        remainingMs: cooldown.remainingMs,
        remainingMinutes: Math.round(cooldown.remainingMs / 60000),
      },
    });
  } catch (err) {
    next(err);
  }
});
