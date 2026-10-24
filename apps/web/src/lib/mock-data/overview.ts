export interface SubscriptionContext {
  id: string;
  name: string;
  environment: string;
  isSimulated: boolean;
  simulationNotice: string;
}

export interface KpiMetric<T = number> {
  value: T;
  formattedValue: string;
  label: string;
  subtext: string;
  tooltip: string;
  status: "success" | "warning" | "critical" | "info";
  href: string;
  delta?: {
    value: number;
    formatted: string;
    isPositiveGood: boolean;
  };
}

export interface OverviewKpis {
  totalResources: KpiMetric<number>;
  runningVms: KpiMetric<{ running: number; total: number }>;
  monthToDateCost: KpiMetric<number>;
  budgetUtilization: KpiMetric<number>;
  resourcesRequiringAttention: KpiMetric<number>;
  estimatedMonthEndSpend: KpiMetric<number>;
}

export interface DailyCostPoint {
  date: string;
  cost: number;
  forecast?: number;
}

export type TimeRangeOption = "7d" | "14d" | "mtd" | "30d";

export interface ServiceCostItem {
  serviceName: string;
  cost: number;
  currency: string;
  percentage: number;
  color: string;
}

export interface ResourceCategoryItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  source: string;
  actionHref?: string;
  actionLabel?: string;
}

export interface ResourcePreviewItem {
  id: string;
  name: string;
  type: string;
  category: "Compute" | "Storage" | "Security" | "Network" | "AI";
  resourceGroup: string;
  location: string;
  sku: string;
  status: "Running" | "Succeeded" | "Deallocated" | "Degraded";
  statusType: "success" | "warning" | "critical" | "info";
}

export interface DataFreshnessInfo {
  operational: {
    lastRefreshed: string;
    refreshIntervalMinutes: number;
    status: "healthy" | "degraded";
    isSimulated: boolean;
  };
  billing: {
    lastRefreshed: string;
    cacheIntervalHours: number;
    nextScheduledQuery: string;
    isStale: boolean;
    currency: string;
    isSimulated: boolean;
  };
}

export interface OverviewDashboardData {
  subscription: SubscriptionContext;
  kpis: OverviewKpis;
  costTrends: Record<TimeRangeOption, DailyCostPoint[]>;
  costByService: ServiceCostItem[];
  resourceDistribution: ResourceCategoryItem[];
  recentAlerts: OperationalAlert[];
  resourcePreview: ResourcePreviewItem[];
  freshness: DataFreshnessInfo;
}

export const MOCK_OVERVIEW_DATA: OverviewDashboardData = {
  subscription: {
    id: "f3834a10-6431-4a62-8a1b-738cb5629169",
    name: "ADT-AI Production Core",
    environment: "Production (Read-Only)",
    isSimulated: true,
    simulationNotice:
      "ADT-AI OPERATIONS CENTER • Configured subscription f3834a10-6431-4a62-8a1b-738cb5629169. Connect with 'az login' for live Azure ARM telemetry.",
  },
  kpis: {
    totalResources: {
      value: 6,
      formattedValue: "6",
      label: "Total Azure Resources",
      subtext: "Across 4 resource groups",
      tooltip: "Total count of provisioned ARM resources currently tracked in Resource Graph.",
      status: "success",
      href: "/resources",
      delta: {
        value: 0,
        formatted: "Unchanged",
        isPositiveGood: true,
      },
    },
    runningVms: {
      value: { running: 2, total: 3 },
      formattedValue: "2 / 3",
      label: "Running Virtual Machines",
      subtext: "1 Deallocated (Compute Cost Paused)",
      tooltip: "Virtual machines with active live power state: running.",
      status: "success",
      href: "/resources",
    },
    monthToDateCost: {
      value: 4820.65,
      formattedValue: "$4,820.65",
      label: "Month-to-Date Cost",
      subtext: "-7.48% vs last month ($5,210.40)",
      tooltip: "Cumulative Azure consumption charges accrued in current billing month (USD).",
      status: "info",
      href: "/costs",
      delta: {
        value: -7.48,
        formatted: "-7.48%",
        isPositiveGood: true,
      },
    },
    budgetUtilization: {
      value: 74.2,
      formattedValue: "74.2%",
      label: "Budget Utilization",
      subtext: "$4,820.65 of $6,500.00 Limit",
      tooltip: "Actual spend vs configured monthly Azure budget. First alert set at 80%.",
      status: "warning",
      href: "/budgets",
      delta: {
        value: 74.2,
        formatted: "Within Safe Bounds",
        isPositiveGood: true,
      },
    },
    resourcesRequiringAttention: {
      value: 1,
      formattedValue: "1",
      label: "Resources Requiring Attention",
      subtext: "vm-adt-gpu-trainer-02 deallocated",
      tooltip: "Resources flagged with stopped/deallocated states or non-optimal health status.",
      status: "warning",
      href: "/resources",
    },
    estimatedMonthEndSpend: {
      value: 6150.0,
      formattedValue: "$6,150.00",
      label: "Estimated Month-End Spend",
      subtext: "Projected 94.6% of Budget",
      tooltip: "Algorithmic projection of total monthly spend based on current daily run rate.",
      status: "info",
      href: "/costs",
    },
  },
  costTrends: {
    "7d": [
      { date: "Oct 17", cost: 204.3 },
      { date: "Oct 18", cost: 198.9 },
      { date: "Oct 19", cost: 210.2 },
      { date: "Oct 20", cost: 228.6 },
      { date: "Oct 21", cost: 234.1 },
      { date: "Oct 22", cost: 215.4 },
      { date: "Oct 23", cost: 195.8 },
    ],
    "14d": [
      { date: "Oct 10", cost: 220.0 },
      { date: "Oct 11", cost: 205.8 },
      { date: "Oct 12", cost: 218.4 },
      { date: "Oct 13", cost: 230.1 },
      { date: "Oct 14", cost: 225.5 },
      { date: "Oct 15", cost: 212.0 },
      { date: "Oct 16", cost: 218.7 },
      { date: "Oct 17", cost: 204.3 },
      { date: "Oct 18", cost: 198.9 },
      { date: "Oct 19", cost: 210.2 },
      { date: "Oct 20", cost: 228.6 },
      { date: "Oct 21", cost: 234.1 },
      { date: "Oct 22", cost: 215.4 },
      { date: "Oct 23", cost: 195.8 },
    ],
    mtd: [
      { date: "Oct 01", cost: 154.2 },
      { date: "Oct 03", cost: 210.4 },
      { date: "Oct 05", cost: 240.6 },
      { date: "Oct 07", cost: 180.2 },
      { date: "Oct 09", cost: 215.3 },
      { date: "Oct 11", cost: 205.8 },
      { date: "Oct 13", cost: 230.1 },
      { date: "Oct 15", cost: 212.0 },
      { date: "Oct 17", cost: 204.3 },
      { date: "Oct 19", cost: 210.2 },
      { date: "Oct 21", cost: 234.1 },
      { date: "Oct 23", cost: 195.8 },
    ],
    "30d": [
      { date: "Sep 24", cost: 188.0 },
      { date: "Sep 27", cost: 192.4 },
      { date: "Sep 30", cost: 180.1 },
      { date: "Oct 03", cost: 210.4 },
      { date: "Oct 06", cost: 235.0 },
      { date: "Oct 09", cost: 215.3 },
      { date: "Oct 12", cost: 218.4 },
      { date: "Oct 15", cost: 212.0 },
      { date: "Oct 18", cost: 198.9 },
      { date: "Oct 21", cost: 234.1 },
      { date: "Oct 23", cost: 195.8 },
    ],
  },
  costByService: [
    { serviceName: "Virtual Machines (Compute)", cost: 2940.2, currency: "USD", percentage: 61.0, color: "#2563EB" },
    { serviceName: "Azure OpenAI / Cognitive", cost: 950.4, currency: "USD", percentage: 19.7, color: "#0284C7" },
    { serviceName: "Storage Accounts", cost: 480.05, currency: "USD", percentage: 10.0, color: "#16A34A" },
    { serviceName: "Virtual Network & Bandwidth", cost: 260.0, currency: "USD", percentage: 5.4, color: "#D97706" },
    { serviceName: "Key Vault & Security", cost: 190.0, currency: "USD", percentage: 3.9, color: "#9333EA" },
  ],
  resourceDistribution: [
    { category: "Virtual Machines", count: 3, percentage: 50.0, color: "#2563EB" },
    { category: "Storage Accounts", count: 1, percentage: 16.7, color: "#16A34A" },
    { category: "Key Vaults", count: 1, percentage: 16.7, color: "#9333EA" },
    { category: "Virtual Networks", count: 1, percentage: 16.6, color: "#0284C7" },
  ],
  recentAlerts: [
    {
      id: "alert-001",
      severity: "warning",
      title: "Forecasted Budget Threshold Alert (90%)",
      message: "Forecasted month-end spend ($6,150.00) exceeds 90% of budget limit ($6,500.00).",
      timestamp: "2026-10-24T08:30:00Z",
      source: "Azure Budgets API",
      actionHref: "/budgets",
      actionLabel: "View Budget Details",
    },
    {
      id: "alert-002",
      severity: "info",
      title: "Compute Instance Deallocated",
      message: "vm-adt-gpu-trainer-02 is in deallocated state; compute costs are currently halted.",
      timestamp: "2026-10-23T18:15:00Z",
      source: "Azure Compute InstanceView",
      actionHref: "/resources",
      actionLabel: "Inspect Compute",
    },
    {
      id: "alert-003",
      severity: "info",
      title: "Controlled 24h Billing Snapshot Updated",
      message: "Daily persistent cache sync completed successfully. Next cycle scheduled in 14 hours.",
      timestamp: "2026-10-24T00:00:00Z",
      source: "Cost Management Cache",
      actionHref: "/costs",
      actionLabel: "Review Breakdown",
    },
  ],
  resourcePreview: [
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01",
      name: "vm-adt-gpu-trainer-01",
      type: "Microsoft.Compute/virtualMachines",
      category: "Compute",
      resourceGroup: "rg-adt-training-compute",
      location: "East US 2",
      sku: "Standard_NC6s_v3 (6 vCPU, 112 GB, 1x V100)",
      status: "Running",
      statusType: "success",
    },
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-02",
      name: "vm-adt-gpu-trainer-02",
      type: "Microsoft.Compute/virtualMachines",
      category: "Compute",
      resourceGroup: "rg-adt-training-compute",
      location: "East US 2",
      sku: "Standard_NC6s_v3 (6 vCPU, 112 GB, 1x V100)",
      status: "Deallocated",
      statusType: "warning",
    },
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-eval-services/providers/Microsoft.Compute/virtualMachines/vm-adt-eval-worker-01",
      name: "vm-adt-eval-worker-01",
      type: "Microsoft.Compute/virtualMachines",
      category: "Compute",
      resourceGroup: "rg-adt-eval-services",
      location: "East US 2",
      sku: "Standard_D4s_v5 (4 vCPU, 16 GB)",
      status: "Running",
      statusType: "success",
    },
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-data-storage/providers/Microsoft.Storage/storageAccounts/saadtdatasetsprod",
      name: "saadtdatasetsprod",
      type: "Microsoft.Storage/storageAccounts",
      category: "Storage",
      resourceGroup: "rg-adt-data-storage",
      location: "East US 2",
      sku: "Standard_ZRS (Hot Tier)",
      status: "Succeeded",
      statusType: "success",
    },
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-security/providers/Microsoft.KeyVault/vaults/kv-adt-prod-secrets",
      name: "kv-adt-prod-secrets",
      type: "Microsoft.KeyVault/vaults",
      category: "Security",
      resourceGroup: "rg-adt-security",
      location: "East US 2",
      sku: "Standard (FIPS 140-2 Level 2)",
      status: "Succeeded",
      statusType: "success",
    },
    {
      id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-networking/providers/Microsoft.Network/virtualNetworks/vnet-adt-core-eastus2",
      name: "vnet-adt-core-eastus2",
      type: "Microsoft.Network/virtualNetworks",
      category: "Network",
      resourceGroup: "rg-adt-networking",
      location: "East US 2",
      sku: "Address Space: 10.0.0.0/16",
      status: "Succeeded",
      statusType: "success",
    },
  ],
  freshness: {
    operational: {
      lastRefreshed: new Date().toISOString(),
      refreshIntervalMinutes: 15,
      status: "healthy",
      isSimulated: true,
    },
    billing: {
      lastRefreshed: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      cacheIntervalHours: 24,
      nextScheduledQuery: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
      isStale: false,
      currency: "USD",
      isSimulated: true,
    },
  },
};
