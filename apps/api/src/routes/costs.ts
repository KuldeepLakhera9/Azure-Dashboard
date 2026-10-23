import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";

export const costsRouter = Router();

// GET /api/costs
costsRouter.get("/", async (req, res, next) => {
  try {
    const forceRefresh = req.query.force === "true";
    const provider = getAzureDataProvider();
    const result = await provider.getCostData(forceRefresh);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
