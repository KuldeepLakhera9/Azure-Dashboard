import { AzureResourceItem, MOCK_RESOURCES, ProvisioningState, VmPowerState } from "../mock-data/inventory";
import { fetchFromApi } from "./api-client";
import { ResourceInventoryResponse } from "@adt-ai/shared";

export interface ResourceFilterParams {
  search?: string;
  resourceType?: string;
  region?: string;
  resourceGroup?: string;
  status?: string; // Succeeded, Running, Deallocated, Stopped, Failed
}

export type ResourceSortField = "name" | "type" | "resourceGroup" | "location" | "provisioningState" | "lastObserved";
export type SortOrder = "asc" | "desc";

export interface ResourceQueryParams {
  filters?: ResourceFilterParams;
  sortField?: ResourceSortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export interface ResourceQueryResult {
  resources: AzureResourceItem[];
  totalCount: number;
  filteredCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isStale: boolean;
  lastUpdated: string;
  isSimulated: boolean;
}

export interface IInventoryService {
  getResources(params: ResourceQueryParams, signal?: AbortSignal): Promise<ResourceQueryResult>;
  getResourceById(id: string, signal?: AbortSignal): Promise<AzureResourceItem | null>;
  getFilterOptions(): Promise<{
    types: string[];
    regions: string[];
    resourceGroups: string[];
    statuses: string[];
  }>;
}

export class MockInventoryService implements IInventoryService {
  public async getResources(
    params: ResourceQueryParams,
    signal?: AbortSignal
  ): Promise<ResourceQueryResult> {
    if (signal?.aborted) {
      throw new DOMException("Query aborted", "AbortError");
    }

    const {
      filters = {},
      sortField = "name",
      sortOrder = "asc",
      page = 1,
      pageSize = 10,
    } = params;

    let items = [...MOCK_RESOURCES];

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.resourceGroup.toLowerCase().includes(q)
      );
    }

    if (filters.resourceType && filters.resourceType !== "all") {
      items = items.filter((r) => r.type === filters.resourceType);
    }

    if (filters.region && filters.region !== "all") {
      items = items.filter((r) => r.locationDisplay === filters.region || r.location === filters.region);
    }

    if (filters.resourceGroup && filters.resourceGroup !== "all") {
      items = items.filter((r) => r.resourceGroup === filters.resourceGroup);
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((r) => {
        if (filters.status === "Running (VM)") return r.powerState === "running";
        if (filters.status === "Deallocated (VM)") return r.powerState === "deallocated";
        if (filters.status === "Stopped (VM)") return r.powerState === "stopped";
        return r.provisioningState === filters.status;
      });
    }

    const filteredCount = items.length;

    items.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const paginatedItems = items.slice(startIdx, startIdx + pageSize);

    return {
      resources: paginatedItems,
      totalCount: MOCK_RESOURCES.length,
      filteredCount,
      page: safePage,
      pageSize,
      totalPages,
      isStale: false,
      lastUpdated: new Date().toISOString(),
      isSimulated: true,
    };
  }

  public async getResourceById(id: string, signal?: AbortSignal): Promise<AzureResourceItem | null> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");
    const item = MOCK_RESOURCES.find((r) => r.id === id);
    return item || null;
  }

  public async getFilterOptions() {
    const types = Array.from(new Set(MOCK_RESOURCES.map((r) => r.type))).sort();
    const regions = Array.from(new Set(MOCK_RESOURCES.map((r) => r.locationDisplay))).sort();
    const resourceGroups = Array.from(new Set(MOCK_RESOURCES.map((r) => r.resourceGroup))).sort();
    const statuses = ["Succeeded", "Running (VM)", "Deallocated (VM)", "Stopped (VM)", "Failed"];

    return { types, regions, resourceGroups, statuses };
  }
}

export class AzureInventoryService implements IInventoryService {
  private fallbackService = new MockInventoryService();

  public async getResources(
    params: ResourceQueryParams,
    signal?: AbortSignal
  ): Promise<ResourceQueryResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set("page", String(params.page));
      if (params.pageSize) queryParams.set("pageSize", String(params.pageSize));
      if (params.filters?.search) queryParams.set("search", params.filters.search);
      if (params.filters?.resourceType && params.filters.resourceType !== "all") {
        queryParams.set("type", params.filters.resourceType);
      }
      if (params.filters?.resourceGroup && params.filters.resourceGroup !== "all") {
        queryParams.set("resourceGroup", params.filters.resourceGroup);
      }
      if (params.filters?.region && params.filters.region !== "all") {
        queryParams.set("location", params.filters.region);
      }

      const res = await fetchFromApi<ResourceInventoryResponse>(
        `/api/resources?${queryParams.toString()}`,
        { signal }
      );

      const mapped: AzureResourceItem[] = res.resources.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        resourceGroup: r.resourceGroup,
        location: r.location,
        locationDisplay: r.location,
        provisioningState: (r.provisioningState as ProvisioningState) || "Succeeded",
        tags: r.tags || {},
        lastObserved: res.lastUpdated,
        sku: r.sku,
        powerState: r.type.toLowerCase().includes("virtualmachines") ? ("running" as VmPowerState) : undefined,
      }));

      const pageSize = params.pageSize || 10;
      const totalPages = Math.max(1, Math.ceil(res.totalCount / pageSize));

      return {
        resources: mapped,
        totalCount: res.totalCount,
        filteredCount: res.totalCount,
        page: params.page || 1,
        pageSize,
        totalPages,
        isStale: res.isStale,
        lastUpdated: res.lastUpdated,
        isSimulated: false,
      };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      console.warn("[InventoryService] Falling back to local data:", err);
      return this.fallbackService.getResources(params, signal);
    }
  }

  public async getResourceById(id: string, signal?: AbortSignal): Promise<AzureResourceItem | null> {
    try {
      const res = await fetchFromApi<{ resource: AzureResourceItem }>(
        `/api/resources/${encodeURIComponent(id)}`,
        { signal }
      );
      return res.resource || null;
    } catch {
      return this.fallbackService.getResourceById(id, signal);
    }
  }

  public async getFilterOptions() {
    return this.fallbackService.getFilterOptions();
  }
}

export const inventoryService: IInventoryService = new AzureInventoryService();
