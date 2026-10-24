import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
  AlertsResponse,
  AzureStatusResponse,
} from "@adt-ai/shared";

export interface ResourceFilterOptions {
  search?: string;
  type?: string;
  resourceGroup?: string;
  location?: string;
  skipToken?: string;
  page?: number;
  pageSize?: number;
}

export interface IAzureDataProvider {
  getSystemHealth(): Promise<SystemHealthResponse>;
  getAzureStatus(): Promise<AzureStatusResponse>;
  getResourceInventory(options?: ResourceFilterOptions): Promise<ResourceInventoryResponse>;
  getResourceDetail(resourceId: string): Promise<Record<string, unknown> | null>;
  getVmInventory(): Promise<VmInventoryResponse>;
  getCostData(forceRefresh?: boolean): Promise<CostDataResponse>;
  getBudgets(): Promise<BudgetsResponse>;
  getMetrics(resourceId?: string, timespan?: string): Promise<MetricsResponse>;
  getAlerts(): Promise<AlertsResponse>;
}
