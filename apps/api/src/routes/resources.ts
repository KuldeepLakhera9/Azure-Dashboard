import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAzureDataProvider } from "../services/azure";

export const resourcesRouter = Router();

const ResourceQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  resourceGroup: z.string().optional(),
  location: z.string().optional(),
  skipToken: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

/**
 * GET /api/resources
 * Subscription-scoped resource inventory using Azure Resource Graph.
 * Supports filtering, search, and continuation-token / page-based pagination.
 */
resourcesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = ResourceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid query parameters",
        details: parseResult.error.format(),
      });
      return;
    }

    const provider = getAzureDataProvider();
    const inventory = await provider.getResourceInventory(parseResult.data);
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/resources/detail?id=...
 * Safe endpoint to retrieve full details, tags, and VM instanceView for any Azure resource ID.
 */
resourcesRouter.get("/detail", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Resource ID query parameter 'id' is required",
      });
      return;
    }

    const provider = getAzureDataProvider();
    const detail = await provider.getResourceDetail(id);
    if (!detail) {
      res.status(404).json({
        error: "Not Found",
        message: `Resource '${id}' not found in subscription inventory`,
      });
      return;
    }

    res.json(detail);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/resources/vms
 * Dedicated endpoint for Virtual Machine inventory with live compute instanceView power states.
 */
resourcesRouter.get("/vms", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = getAzureDataProvider();
    const vms = await provider.getVmInventory();
    res.json(vms);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/resources/:id
 * Path parameter support for resource IDs.
 */
resourcesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceId = req.params.id;
    if (!resourceId || resourceId === "detail" || resourceId === "vms") {
      next();
      return;
    }

    const provider = getAzureDataProvider();
    const detail = await provider.getResourceDetail(resourceId);
    if (!detail) {
      res.status(404).json({
        error: "Not Found",
        message: `Resource '${resourceId}' not found in subscription inventory`,
      });
      return;
    }

    res.json(detail);
  } catch (err) {
    next(err);
  }
});
