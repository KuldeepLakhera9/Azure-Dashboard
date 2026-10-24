export interface CostRecordItem {
  id: string;
  serviceName: string;
  resourceGroup: string;
  costType: "ActualCost" | "AmortizedCost";
  currency: string;
  amount: number;
  percentage: number;
  lastUpdated: string;
}

export interface CostSummaryData {
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  actualCost: number;
  amortizedCost: number;
  forecastedCost: number;
  previousPeriodActual: number;
  deltaPercentage: number;
  lastSuccessfulQuery: string;
  nextScheduledQuery: string;
  isStale: boolean;
  staleReason?: string;
  isSimulated: boolean;
}

export interface CostTrendPoint {
  date: string;
  actualCost: number;
  forecastedCost?: number;
}

export interface BudgetThresholdItem {
  thresholdPercentage: number;
  thresholdType: "Actual" | "Forecasted";
  thresholdAmount: number;
  isTriggered: boolean;
  contactEmails: string[];
  actionGroup: string;
}

export interface BudgetAlertEvent {
  id: string;
  timestamp: string;
  thresholdPercentage: number;
  thresholdType: "Actual" | "Forecasted";
  spendAtTrigger: number;
  status: "Sent" | "Acknowledged" | "Resolved";
  recipients: string[];
  message: string;
}

export interface AzureBudgetItem {
  id: string;
  name: string;
  subscriptionId: string;
  budgetAmount: number;
  currency: string;
  timeGrain: "Monthly" | "Quarterly" | "Annually";
  startDate: string;
  endDate: string;
  currentConsumption: number;
  remainingBudget: number;
  consumedPercentage: number;
  forecastedConsumption: number;
  forecastPercentage: number;
  status: "normal" | "warning" | "exceeded";
  thresholds: BudgetThresholdItem[];
  alertHistory: BudgetAlertEvent[];
  notificationStatus: {
    emailConfigured: boolean;
    actionGroupConfigured: boolean;
    webhookEnabled: boolean;
  };
  isSimulated: boolean;
}

export const MOCK_COST_RECORDS: CostRecordItem[] = [
  {
    id: "cost-001",
    serviceName: "Virtual Machines (Compute)",
    resourceGroup: "rg-adt-training-compute",
    costType: "ActualCost",
    currency: "USD",
    amount: 2940.2,
    percentage: 61.0,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
  {
    id: "cost-002",
    serviceName: "Azure OpenAI / Cognitive Services",
    resourceGroup: "rg-adt-ai-services",
    costType: "ActualCost",
    currency: "USD",
    amount: 950.4,
    percentage: 19.7,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
  {
    id: "cost-003",
    serviceName: "Storage Accounts (Hot & Archive)",
    resourceGroup: "rg-adt-data-storage",
    costType: "ActualCost",
    currency: "USD",
    amount: 480.05,
    percentage: 10.0,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
  {
    id: "cost-004",
    serviceName: "Virtual Network & Bandwidth",
    resourceGroup: "rg-adt-networking",
    costType: "ActualCost",
    currency: "USD",
    amount: 260.0,
    percentage: 5.4,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
  {
    id: "cost-005",
    serviceName: "Key Vault & Security",
    resourceGroup: "rg-adt-security",
    costType: "ActualCost",
    currency: "USD",
    amount: 190.0,
    percentage: 3.9,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
  {
    id: "cost-006",
    serviceName: "Virtual Machines (Compute)",
    resourceGroup: "rg-adt-eval-services",
    costType: "AmortizedCost",
    currency: "USD",
    amount: 320.15,
    percentage: 6.6,
    lastUpdated: "2026-10-24T00:00:00Z",
  },
];

export const MOCK_COST_SUMMARY: CostSummaryData = {
  currency: "USD",
  billingPeriodStart: "2026-10-01T00:00:00Z",
  billingPeriodEnd: "2026-10-31T23:59:59Z",
  actualCost: 4820.65,
  amortizedCost: 4750.1,
  forecastedCost: 6150.0,
  previousPeriodActual: 5210.4,
  deltaPercentage: -7.48,
  lastSuccessfulQuery: "2026-10-24T00:00:00Z",
  nextScheduledQuery: "2026-10-25T00:00:00Z",
  isStale: false,
  isSimulated: true,
};

export const MOCK_DAILY_COST_TREND: Record<string, CostTrendPoint[]> = {
  "7d": [
    { date: "Oct 18", actualCost: 198.9 },
    { date: "Oct 19", actualCost: 210.2 },
    { date: "Oct 20", actualCost: 228.6 },
    { date: "Oct 21", actualCost: 234.1 },
    { date: "Oct 22", actualCost: 215.4 },
    { date: "Oct 23", actualCost: 195.8 },
    { date: "Oct 24", actualCost: 182.5, forecastedCost: 190.0 },
  ],
  mtd: [
    { date: "Oct 01", actualCost: 154.2 },
    { date: "Oct 03", actualCost: 210.4 },
    { date: "Oct 05", actualCost: 240.6 },
    { date: "Oct 07", actualCost: 180.2 },
    { date: "Oct 09", actualCost: 215.3 },
    { date: "Oct 11", actualCost: 205.8 },
    { date: "Oct 13", actualCost: 230.1 },
    { date: "Oct 15", actualCost: 212.0 },
    { date: "Oct 17", actualCost: 204.3 },
    { date: "Oct 19", actualCost: 210.2 },
    { date: "Oct 21", actualCost: 234.1 },
    { date: "Oct 23", actualCost: 195.8 },
    { date: "Oct 25", actualCost: 0, forecastedCost: 210.0 },
    { date: "Oct 28", actualCost: 0, forecastedCost: 215.0 },
    { date: "Oct 31", actualCost: 0, forecastedCost: 220.0 },
  ],
};

export const MOCK_PRIMARY_BUDGET: AzureBudgetItem = {
  id: "/subscriptions/sub-adt-ai-foundation-prod-01/providers/Microsoft.Consumption/budgets/budget-adt-monthly-operations",
  name: "budget-adt-monthly-operations",
  subscriptionId: "sub-adt-ai-foundation-prod-01",
  budgetAmount: 6500.0,
  currency: "USD",
  timeGrain: "Monthly",
  startDate: "2026-10-01T00:00:00Z",
  endDate: "2026-10-31T23:59:59Z",
  currentConsumption: 4820.65,
  remainingBudget: 1679.35,
  consumedPercentage: 74.16,
  forecastedConsumption: 6150.0,
  forecastPercentage: 94.61,
  status: "normal",
  thresholds: [
    {
      thresholdPercentage: 80,
      thresholdType: "Actual",
      thresholdAmount: 5200.0,
      isTriggered: false,
      contactEmails: ["ops@adt-ai.org", "finance@adt-ai.org"],
      actionGroup: "ag-adt-ops-alerts",
    },
    {
      thresholdPercentage: 90,
      thresholdType: "Forecasted",
      thresholdAmount: 5850.0,
      isTriggered: true,
      contactEmails: ["ops@adt-ai.org", "lead-architect@adt-ai.org"],
      actionGroup: "ag-adt-lead-escalation",
    },
    {
      thresholdPercentage: 100,
      thresholdType: "Actual",
      thresholdAmount: 6500.0,
      isTriggered: false,
      contactEmails: ["security-alert@adt-ai.org", "finance@adt-ai.org"],
      actionGroup: "ag-adt-critical-finance",
    },
  ],
  alertHistory: [
    {
      id: "evt-001",
      timestamp: "2026-10-23T14:22:00Z",
      thresholdPercentage: 90,
      thresholdType: "Forecasted",
      spendAtTrigger: 4610.2,
      status: "Acknowledged",
      recipients: ["ops@adt-ai.org", "lead-architect@adt-ai.org"],
      message: "Forecasted month-end spend ($6,150.00) breached 90% threshold rule.",
    },
    {
      id: "evt-002",
      timestamp: "2026-09-26T10:15:00Z",
      thresholdPercentage: 80,
      thresholdType: "Actual",
      spendAtTrigger: 5240.0,
      status: "Resolved",
      recipients: ["ops@adt-ai.org", "finance@adt-ai.org"],
      message: "Previous month actual consumption surpassed 80% threshold rule ($5,200.00).",
    },
  ],
  notificationStatus: {
    emailConfigured: true,
    actionGroupConfigured: true,
    webhookEnabled: false,
  },
  isSimulated: true,
};
