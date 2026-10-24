import {
  AzureBudgetItem,
  BudgetAlertEvent,
  MOCK_PRIMARY_BUDGET,
} from "../mock-data/costs";
import { fetchFromApi } from "./api-client";
import { BudgetsResponse } from "@adt-ai/shared";

export interface IBudgetService {
  getPrimaryBudget(hasBudgetConfigured?: boolean, signal?: AbortSignal): Promise<AzureBudgetItem | null>;
  getAlertHistory(signal?: AbortSignal): Promise<BudgetAlertEvent[]>;
}

export class MockBudgetService implements IBudgetService {
  public async getPrimaryBudget(
    hasBudgetConfigured = true,
    signal?: AbortSignal
  ): Promise<AzureBudgetItem | null> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");
    if (!hasBudgetConfigured) return null;
    return MOCK_PRIMARY_BUDGET;
  }

  public async getAlertHistory(signal?: AbortSignal): Promise<BudgetAlertEvent[]> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");
    return MOCK_PRIMARY_BUDGET.alertHistory;
  }
}

export class AzureBudgetService implements IBudgetService {
  private fallbackService = new MockBudgetService();

  public async getPrimaryBudget(
    hasBudgetConfigured = true,
    signal?: AbortSignal
  ): Promise<AzureBudgetItem | null> {
    if (!hasBudgetConfigured) return null;
    try {
      const res = await fetchFromApi<BudgetsResponse>("/api/budgets", { signal });
      if (res.budgets && res.budgets.length > 0) {
        const b = res.budgets[0]!;
        const timeGrain: "Monthly" | "Quarterly" | "Annually" =
          b.timeGrain === "Monthly" || b.timeGrain === "Quarterly" || b.timeGrain === "Annually"
            ? b.timeGrain
            : "Monthly";

        const status: "normal" | "warning" | "exceeded" =
          b.status === "critical" ? "exceeded" : b.status === "warning" ? "warning" : "normal";

        const mapped: AzureBudgetItem = {
          id: b.id,
          name: b.name,
          subscriptionId: "f3834a10-6431-4a62-8a1b-738cb5629169",
          budgetAmount: b.amount,
          currency: b.currency,
          timeGrain,
          startDate: b.startDate,
          endDate: b.endDate,
          currentConsumption: b.currentSpend,
          remainingBudget: Math.max(0, b.amount - b.currentSpend),
          consumedPercentage: b.percentConsumed,
          forecastedConsumption: Math.round(b.currentSpend * 1.1),
          forecastPercentage: Math.round(b.percentConsumed * 1.1),
          status,
          thresholds: b.thresholds.map((t) => ({
            thresholdPercentage: t.thresholdPercentage,
            thresholdType: t.thresholdType === "Forecasted" ? "Forecasted" : "Actual",
            thresholdAmount: (b.amount * t.thresholdPercentage) / 100,
            isTriggered: t.isExceeded,
            contactEmails: t.contactEmails || [],
            actionGroup: "FinOps Alerts Action Group",
          })),
          alertHistory: MOCK_PRIMARY_BUDGET.alertHistory,
          notificationStatus: MOCK_PRIMARY_BUDGET.notificationStatus,
          isSimulated: false,
        };
        return mapped;
      }
      return null;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      console.warn("[BudgetService] Falling back to local budget data:", err);
      return this.fallbackService.getPrimaryBudget(hasBudgetConfigured, signal);
    }
  }

  public async getAlertHistory(signal?: AbortSignal): Promise<BudgetAlertEvent[]> {
    return this.fallbackService.getAlertHistory(signal);
  }
}

export const budgetService: IBudgetService = new AzureBudgetService();
