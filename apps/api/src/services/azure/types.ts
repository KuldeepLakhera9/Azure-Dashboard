import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
} from "@adt-ai/shared";

export interface IAzureDataProvider {
  getSystemHealth(): Promise<SystemHealthResponse>;
  getResourceInventory(): Promise<ResourceInventoryResponse>;
  getVmInventory(): Promise<VmInventoryResponse>;
  getCostData(forceRefresh?: boolean): Promise<CostDataResponse>;
  getBudgets(): Promise<BudgetsResponse>;
  getMetrics(resourceId?: string): Promise<MetricsResponse>;
}
