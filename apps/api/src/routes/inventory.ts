import { Router } from "express";
import { getAzureDataProvider } from "../services/azure";

export const inventoryRouter = Router();

// GET /api/inventory/resources
inventoryRouter.get("/resources", async (_req, res, next) => {
  try {
    const provider = getAzureDataProvider();
    const result = await provider.getResourceInventory();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/vms
inventoryRouter.get("/vms", async (_req, res, next) => {
  try {
    const provider = getAzureDataProvider();
    const result = await provider.getVmInventory();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
