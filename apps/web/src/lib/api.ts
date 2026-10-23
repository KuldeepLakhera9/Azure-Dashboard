import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
} from "@adt-ai/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    // Avoid caching issues in Next.js SSR / client fetching
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => fetchJson<SystemHealthResponse>("/health"),
  getResources: () => fetchJson<ResourceInventoryResponse>("/inventory/resources"),
  getVms: () => fetchJson<VmInventoryResponse>("/inventory/vms"),
  getCosts: (forceRefresh = false) =>
    fetchJson<CostDataResponse>(`/costs${forceRefresh ? "?force=true" : ""}`),
  getBudgets: () => fetchJson<BudgetsResponse>("/budgets"),
  getMetrics: (resourceId?: string) =>
    fetchJson<MetricsResponse>(`/metrics${resourceId ? `?resourceId=${encodeURIComponent(resourceId)}` : ""}`),
};
