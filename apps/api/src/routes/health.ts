import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    const provider = getAzureDataProvider();
    const health = await provider.getSystemHealth();
    res.json(health);
  } catch (err) {
    next(err);
  }
});
