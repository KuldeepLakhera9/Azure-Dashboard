import {
  AzureBudgetItem,
  BudgetAlertEvent,
  MOCK_PRIMARY_BUDGET,
} from "../mock-data/costs";

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

export const budgetService = new MockBudgetService();
