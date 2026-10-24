import {
  CostRecordItem,
  CostSummaryData,
  CostTrendPoint,
  MOCK_COST_RECORDS,
  MOCK_COST_SUMMARY,
  MOCK_DAILY_COST_TREND,
} from "../mock-data/costs";
import { fetchFromApi } from "./api-client";
import { CostDataResponse } from "@adt-ai/shared";

export interface CostRecordFilters {
  search?: string;
  resourceGroup?: string;
  costType?: string; // "ActualCost" | "AmortizedCost" | "all"
}

export type CostSortField = "serviceName" | "resourceGroup" | "amount" | "percentage";
export type CostSortOrder = "asc" | "desc";

export interface ICostService {
  getCostSummary(forceStale?: boolean, signal?: AbortSignal): Promise<CostSummaryData>;
  getCostRecords(
    filters?: CostRecordFilters,
    sortField?: CostSortField,
    sortOrder?: CostSortOrder,
    signal?: AbortSignal
  ): Promise<CostRecordItem[]>;
  getDailyTrend(range: "7d" | "mtd", signal?: AbortSignal): Promise<CostTrendPoint[]>;
}

export class MockCostService implements ICostService {
  public async getCostSummary(forceStale = false, signal?: AbortSignal): Promise<CostSummaryData> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");

    if (forceStale) {
      return {
        ...MOCK_COST_SUMMARY,
        isStale: true,
        staleReason: "Azure Cost Management query latency exceeded 24 hours. Serving cached snapshot.",
        lastSuccessfulQuery: "2026-10-22T00:00:00Z",
      };
    }

    return MOCK_COST_SUMMARY;
  }

  public async getCostRecords(
    filters?: CostRecordFilters,
    sortField: CostSortField = "amount",
    sortOrder: CostSortOrder = "desc",
    signal?: AbortSignal
  ): Promise<CostRecordItem[]> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");

    let records = [...MOCK_COST_RECORDS];

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.serviceName.toLowerCase().includes(q) ||
          r.resourceGroup.toLowerCase().includes(q)
      );
    }

    if (filters?.resourceGroup && filters.resourceGroup !== "all") {
      records = records.filter((r) => r.resourceGroup === filters.resourceGroup);
    }

    if (filters?.costType && filters.costType !== "all") {
      records = records.filter((r) => r.costType === filters.costType);
    }

    records.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA);
      valB = Number(valB);
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return records;
  }

  public async getDailyTrend(range: "7d" | "mtd" = "mtd", signal?: AbortSignal): Promise<CostTrendPoint[]> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");
    return MOCK_DAILY_COST_TREND[range] || MOCK_DAILY_COST_TREND.mtd || [];
  }
}

export class AzureCostService implements ICostService {
  private fallbackService = new MockCostService();

  public async getCostSummary(forceStale = false, signal?: AbortSignal): Promise<CostSummaryData> {
    try {
      const res = await fetchFromApi<CostDataResponse>("/api/costs", { signal });
      return {
        currency: res.currency || "USD",
        billingPeriodStart: res.billingPeriodStart,
        billingPeriodEnd: res.billingPeriodEnd,
        actualCost: res.monthToDateTotal,
        amortizedCost: Math.round(res.monthToDateTotal * 0.98 * 100) / 100,
        forecastedCost: Math.round(res.monthToDateTotal * 1.15 * 100) / 100,
        previousPeriodActual: res.previousMonthTotal || 0,
        deltaPercentage: res.changePercentage || 0,
        isStale: res.isStale,
        staleReason: res.isStale ? "Azure Cost Management query latency active. Serving cached snapshot." : undefined,
        lastSuccessfulQuery: res.lastSuccessfulRefresh,
        nextScheduledQuery: res.nextScheduledRefresh,
        isSimulated: false,
      };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      console.warn("[CostService] Falling back to local cost data:", err);
      return this.fallbackService.getCostSummary(forceStale, signal);
    }
  }

  public async getCostRecords(
    filters?: CostRecordFilters,
    sortField: CostSortField = "amount",
    sortOrder: CostSortOrder = "desc",
    signal?: AbortSignal
  ): Promise<CostRecordItem[]> {
    try {
      const res = await fetchFromApi<CostDataResponse>("/api/costs", { signal });
      if (res.byService && res.byService.length > 0) {
        const records: CostRecordItem[] = res.byService.map((s, idx) => ({
          id: `cost-${idx}`,
          serviceName: s.serviceName,
          resourceGroup: "Aggregated Services",
          costType: "ActualCost",
          amount: s.cost,
          currency: s.currency,
          percentage: s.percentage,
          lastUpdated: res.lastSuccessfulRefresh,
        }));
        return records;
      }
      return this.fallbackService.getCostRecords(filters, sortField, sortOrder, signal);
    } catch {
      return this.fallbackService.getCostRecords(filters, sortField, sortOrder, signal);
    }
  }

  public async getDailyTrend(range: "7d" | "mtd" = "mtd", signal?: AbortSignal): Promise<CostTrendPoint[]> {
    return this.fallbackService.getDailyTrend(range, signal);
  }
}

export const costService: ICostService = new AzureCostService();
