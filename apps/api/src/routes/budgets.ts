import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";

export const budgetsRouter = Router();

// GET /api/budgets
budgetsRouter.get("/", async (_req, res, next) => {
  try {
    const provider = getAzureDataProvider();
    const result = await provider.getBudgets();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
