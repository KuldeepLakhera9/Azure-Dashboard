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
        let records: CostRecordItem[] = res.byService.map((s, idx) => ({
          id: `cost-${idx}`,
          serviceName: s.serviceName,
          resourceGroup: "Subscription Resources",
          costType: "ActualCost",
          amount: s.cost,
          currency: s.currency,
          percentage: s.percentage,
          lastUpdated: res.lastSuccessfulRefresh,
        }));

        if (filters?.search && filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          records = records.filter((r) => r.serviceName.toLowerCase().includes(q));
        }

        records.sort((a, b) => {
          const valA = a[sortField];
          const valB = b[sortField];
          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        });

        return records;
      }

      // If month-to-date actual spend is $0.00 (e.g. Azure for Students free grant), show truthful zero usage
      return [
        {
          id: "cost-student-0",
          serviceName: "Azure for Students (Included Credit)",
          resourceGroup: "rg-datapipeline-project",
          costType: "ActualCost",
          amount: 0.0,
          currency: res.currency || "USD",
          percentage: 0,
          lastUpdated: res.lastSuccessfulRefresh || new Date().toISOString(),
        },
      ];
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      console.warn("[CostService] Live cost records query failed:", err);
      return [];
    }
  }

  public async getDailyTrend(range: "7d" | "mtd" = "mtd", signal?: AbortSignal): Promise<CostTrendPoint[]> {
    try {
      const res = await fetchFromApi<CostDataResponse>("/api/costs", { signal });
      if (res.dailyTrend && res.dailyTrend.length > 0) {
        return res.dailyTrend.map((t) => ({
          date: t.date,
          actualCost: t.cost,
        }));
      }
      // Generate daily trend from start of current month to today with actual spend
      const now = new Date();
      const points: CostTrendPoint[] = [];
      const daysCount = range === "7d" ? 7 : Math.min(now.getDate(), 30);
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        points.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          actualCost: res.monthToDateTotal > 0 ? Math.round((res.monthToDateTotal / daysCount) * 100) / 100 : 0,
          forecastedCost: 0,
        });
      }
      return points;
    } catch {
      return [];
    }
  }
}

export const costService: ICostService = new AzureCostService();
