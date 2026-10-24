import { AzureResourceItem, MOCK_RESOURCES } from "../mock-data/inventory";

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
    // Check abort signal
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

    // 1. Search by name or resource ID
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Resource Type
    if (filters.resourceType && filters.resourceType !== "all") {
      items = items.filter((r) => r.type === filters.resourceType);
    }

    // 3. Filter by Region
    if (filters.region && filters.region !== "all") {
      items = items.filter((r) => r.location === filters.region || r.locationDisplay === filters.region);
    }

    // 4. Filter by Resource Group
    if (filters.resourceGroup && filters.resourceGroup !== "all") {
      items = items.filter((r) => r.resourceGroup === filters.resourceGroup);
    }

    // 5. Filter by Status (distinguishing VM power state from resource provisioning state!)
    if (filters.status && filters.status !== "all") {
      const s = filters.status.toLowerCase();
      items = items.filter((r) => {
        if (s === "running" || s === "deallocated" || s === "stopped") {
          return r.powerState?.toLowerCase() === s;
        }
        return r.provisioningState.toLowerCase() === s;
      });
    }

    // 6. Sorting
    items.sort((a, b) => {
      let valA: string = (a[sortField] || "").toString();
      let valB: string = (b[sortField] || "").toString();

      if (sortField === "provisioningState") {
        valA = a.powerState || a.provisioningState;
        valB = b.powerState || b.provisioningState;
      }

      const cmp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const filteredCount = items.length;
    const totalPages = Math.ceil(filteredCount / pageSize) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (safePage - 1) * pageSize;
    const pagedResources = items.slice(startIndex, startIndex + pageSize);

    return {
      resources: pagedResources,
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

export const inventoryService = new MockInventoryService();
