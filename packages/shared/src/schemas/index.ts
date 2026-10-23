import { z } from "zod";

// --- Azure Resource Inventory ---
export const AzureResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  resourceGroup: z.string(),
  location: z.string(),
  subscriptionId: z.string(),
  tags: z.record(z.string()).default({}),
  sku: z.string().optional(),
  plan: z.string().optional(),
  provisioningState: z.string().optional(),
});

export type AzureResource = z.infer<typeof AzureResourceSchema>;

export const ResourceInventoryResponseSchema = z.object({
  resources: z.array(AzureResourceSchema),
  totalCount: z.number(),
  lastUpdated: z.string(),
  isStale: z.boolean(),
  freshnessWarning: z.string().optional(),
});

export type ResourceInventoryResponse = z.infer<typeof ResourceInventoryResponseSchema>;

// --- Virtual Machine & Live Power State ---
export const VmPowerStateEnum = z.enum([
  "running",
  "stopped",
  "deallocated",
  "starting",
  "stopping",
  "unknown",
]);

export type VmPowerState = z.infer<typeof VmPowerStateEnum>;

export const VirtualMachineSchema = z.object({
  id: z.string(),
  name: z.string(),
  resourceGroup: z.string(),
  location: z.string(),
  vmSize: z.string(),
  osType: z.enum(["Linux", "Windows", "Unknown"]),
  osDiskSizeGb: z.number().optional(),
  powerState: VmPowerStateEnum,
  displayStatus: z.string(),
  privateIpAddress: z.string().optional(),
  publicIpAddress: z.string().optional(),
  tags: z.record(z.string()).default({}),
  provisioningState: z.string(),
  lastStateChange: z.string().optional(),
});

export type VirtualMachine = z.infer<typeof VirtualMachineSchema>;

export const VmInventoryResponseSchema = z.object({
  vms: z.array(VirtualMachineSchema),
  totalCount: z.number(),
  runningCount: z.number(),
  stoppedCount: z.number(),
  deallocatedCount: z.number(),
  lastUpdated: z.string(),
  isStale: z.boolean(),
});

export type VmInventoryResponse = z.infer<typeof VmInventoryResponseSchema>;

// --- Cost Management & Billing ---
export const CostByServiceSchema = z.object({
  serviceName: z.string(),
  cost: z.number(),
  currency: z.string(),
  percentage: z.number(),
});

export type CostByService = z.infer<typeof CostByServiceSchema>;

export const DailyCostSchema = z.object({
  date: z.string(),
  cost: z.number(),
});

export type DailyCost = z.infer<typeof DailyCostSchema>;

export const CostDataResponseSchema = z.object({
  currency: z.string(),
  monthToDateTotal: z.number(),
  previousMonthTotal: z.number(),
  forecastTotal: z.number().optional(),
  changePercentage: z.number(),
  byService: z.array(CostByServiceSchema),
  dailyTrend: z.array(DailyCostSchema),
  billingPeriodStart: z.string(),
  billingPeriodEnd: z.string(),
  lastSuccessfulRefresh: z.string(),
  isStale: z.boolean(),
  cacheExpiresAt: z.string(),
  nextScheduledRefresh: z.string(),
});

export type CostDataResponse = z.infer<typeof CostDataResponseSchema>;

// --- Budgets & Alerts ---
export const BudgetThresholdSchema = z.object({
  thresholdPercentage: z.number(),
  thresholdType: z.enum(["Actual", "Forecasted"]),
  isExceeded: z.boolean(),
  contactEmails: z.array(z.string()),
});

export type BudgetThreshold = z.infer<typeof BudgetThresholdSchema>;

export const AzureBudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currentSpend: z.number(),
  currency: z.string(),
  timeGrain: z.enum(["Monthly", "Quarterly", "Annually", "BillingMonth"]),
  startDate: z.string(),
  endDate: z.string(),
  percentConsumed: z.number(),
  status: z.enum(["ok", "warning", "critical"]),
  thresholds: z.array(BudgetThresholdSchema),
});

export type AzureBudget = z.infer<typeof AzureBudgetSchema>;

export const BudgetsResponseSchema = z.object({
  budgets: z.array(AzureBudgetSchema),
  lastUpdated: z.string(),
  isStale: z.boolean(),
});

export type BudgetsResponse = z.infer<typeof BudgetsResponseSchema>;

// --- Infrastructure Performance Metrics ---
export const MetricDataPointSchema = z.object({
  timestamp: z.string(),
  average: z.number().optional(),
  maximum: z.number().optional(),
  minimum: z.number().optional(),
  total: z.number().optional(),
});

export type MetricDataPoint = z.infer<typeof MetricDataPointSchema>;

export const MetricSeriesSchema = z.object({
  metricName: z.string(),
  unit: z.string(),
  resourceId: z.string(),
  dataPoints: z.array(MetricDataPointSchema),
});

export type MetricSeries = z.infer<typeof MetricSeriesSchema>;

export const MetricsResponseSchema = z.object({
  metrics: z.array(MetricSeriesSchema),
  timeRange: z.string(),
  lastUpdated: z.string(),
});

export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;

// --- System Freshness & Health ---
export const SubsystemHealthSchema = z.object({
  name: z.string(),
  status: z.enum(["healthy", "degraded", "error", "unconfigured"]),
  lastSuccess: z.string().nullable(),
  message: z.string().optional(),
});

export type SubsystemHealth = z.infer<typeof SubsystemHealthSchema>;

export const SystemHealthResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "error"]),
  subscriptionId: z.string().nullable(),
  subscriptionName: z.string().nullable(),
  subsystems: z.array(SubsystemHealthSchema),
  timestamp: z.string(),
  version: z.string(),
  authMode: z.enum(["managed-identity", "service-principal", "mock-simulation"]),
});

export type SystemHealthResponse = z.infer<typeof SystemHealthResponseSchema>;
