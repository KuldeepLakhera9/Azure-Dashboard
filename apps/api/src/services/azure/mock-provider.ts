import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
} from "@adt-ai/shared";
import { IAzureDataProvider } from "./types";
import { globalCache } from "../../cache";
import { config } from "../../config";

export class MockAzureDataProvider implements IAzureDataProvider {
  public async getSystemHealth(): Promise<SystemHealthResponse> {
    const now = new Date().toISOString();
    return {
      status: "healthy",
      subscriptionId: config.AZURE_SUBSCRIPTION_ID || "sub-adt-ai-foundation-prod-01",
      subscriptionName: "ADT-AI Production Core",
      timestamp: now,
      version: "1.0.0",
      authMode: "mock-simulation",
      subsystems: [
        {
          name: "Azure Resource Graph",
          status: "healthy",
          lastSuccess: now,
          message: "Connected (Mock Simulation Mode)",
        },
        {
          name: "Azure Compute InstanceView API",
          status: "healthy",
          lastSuccess: now,
          message: "Power state polling active",
        },
        {
          name: "Azure Cost Management",
          status: "healthy",
          lastSuccess: now,
          message: "Cached 24h cycle operational",
        },
        {
          name: "Azure Monitor",
          status: "healthy",
          lastSuccess: now,
          message: "Host-level metrics operational",
        },
      ],
    };
  }

  public async getResourceInventory(): Promise<ResourceInventoryResponse> {
    const cacheKey = "mock:inventory:resources";
    const cached = globalCache.get<ResourceInventoryResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    const now = new Date().toISOString();
    const data: ResourceInventoryResponse = {
      resources: [
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01",
          name: "vm-adt-gpu-trainer-01",
          type: "Microsoft.Compute/virtualMachines",
          resourceGroup: "rg-adt-training-compute",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          sku: "Standard_NC6s_v3",
          tags: { Environment: "Production", Workload: "LLM-FineTuning", Owner: "ADT-AI-MLOps" },
          provisioningState: "Succeeded",
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-02",
          name: "vm-adt-gpu-trainer-02",
          type: "Microsoft.Compute/virtualMachines",
          resourceGroup: "rg-adt-training-compute",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          sku: "Standard_NC6s_v3",
          tags: { Environment: "Production", Workload: "LLM-FineTuning", Owner: "ADT-AI-MLOps" },
          provisioningState: "Succeeded",
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-eval-services/providers/Microsoft.Compute/virtualMachines/vm-adt-eval-worker-01",
          name: "vm-adt-eval-worker-01",
          type: "Microsoft.Compute/virtualMachines",
          resourceGroup: "rg-adt-eval-services",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          sku: "Standard_D4s_v5",
          tags: { Environment: "Staging", Workload: "Automated-Evaluation", Owner: "ADT-AI-QA" },
          provisioningState: "Succeeded",
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-data-storage/providers/Microsoft.Storage/storageAccounts/saadtdatasetsprod",
          name: "saadtdatasetsprod",
          type: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-adt-data-storage",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          sku: "Standard_ZRS",
          tags: { Environment: "Production", Tier: "Hot-Datasets" },
          provisioningState: "Succeeded",
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-security/providers/Microsoft.KeyVault/vaults/kv-adt-prod-secrets",
          name: "kv-adt-prod-secrets",
          type: "Microsoft.KeyVault/vaults",
          resourceGroup: "rg-adt-security",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          sku: "Standard",
          tags: { Compliance: "FedRAMP-Ready", SecurityZone: "Core" },
          provisioningState: "Succeeded",
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-networking/providers/Microsoft.Network/virtualNetworks/vnet-adt-core-eastus2",
          name: "vnet-adt-core-eastus2",
          type: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-adt-networking",
          location: "eastus2",
          subscriptionId: "sub-adt-ai-foundation-prod-01",
          tags: { Scope: "Foundation-VNet" },
          provisioningState: "Succeeded",
        },
      ],
      totalCount: 6,
      lastUpdated: now,
      isStale: false,
    };

    globalCache.set(cacheKey, data, config.OPERATIONAL_CACHE_TTL_MS);
    return data;
  }

  public async getVmInventory(): Promise<VmInventoryResponse> {
    const cacheKey = "mock:inventory:vms";
    const cached = globalCache.get<VmInventoryResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    const now = new Date().toISOString();
    const data: VmInventoryResponse = {
      vms: [
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01",
          name: "vm-adt-gpu-trainer-01",
          resourceGroup: "rg-adt-training-compute",
          location: "eastus2",
          vmSize: "Standard_NC6s_v3 (6 vCPU, 112 GiB RAM, 1x NVIDIA Tesla V100)",
          osType: "Linux",
          osDiskSizeGb: 256,
          powerState: "running",
          displayStatus: "VM running",
          privateIpAddress: "10.0.4.15",
          provisioningState: "Succeeded",
          lastStateChange: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          tags: { Environment: "Production", Workload: "LLM-FineTuning" },
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-02",
          name: "vm-adt-gpu-trainer-02",
          resourceGroup: "rg-adt-training-compute",
          location: "eastus2",
          vmSize: "Standard_NC6s_v3 (6 vCPU, 112 GiB RAM, 1x NVIDIA Tesla V100)",
          osType: "Linux",
          osDiskSizeGb: 256,
          powerState: "deallocated",
          displayStatus: "VM deallocated",
          privateIpAddress: "10.0.4.16",
          provisioningState: "Succeeded",
          lastStateChange: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
          tags: { Environment: "Production", Workload: "LLM-FineTuning" },
        },
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-eval-services/providers/Microsoft.Compute/virtualMachines/vm-adt-eval-worker-01",
          name: "vm-adt-eval-worker-01",
          resourceGroup: "rg-adt-eval-services",
          location: "eastus2",
          vmSize: "Standard_D4s_v5 (4 vCPU, 16 GiB RAM)",
          osType: "Linux",
          osDiskSizeGb: 128,
          powerState: "running",
          displayStatus: "VM running",
          privateIpAddress: "10.0.5.21",
          provisioningState: "Succeeded",
          lastStateChange: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          tags: { Environment: "Staging", Workload: "Automated-Evaluation" },
        },
      ],
      totalCount: 3,
      runningCount: 2,
      stoppedCount: 0,
      deallocatedCount: 1,
      lastUpdated: now,
      isStale: false,
    };

    globalCache.set(cacheKey, data, config.OPERATIONAL_CACHE_TTL_MS);
    return data;
  }

  public async getCostData(forceRefresh = false): Promise<CostDataResponse> {
    const cacheKey = "mock:costs:data";
    const cached = globalCache.get<CostDataResponse>(cacheKey);

    if (!forceRefresh && cached && !cached.isStale) {
      return cached.data;
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const refreshTimestamp = now.toISOString();
    const expiresAt = new Date(now.getTime() + config.BILLING_CACHE_TTL_MS).toISOString();

    const data: CostDataResponse = {
      currency: "USD",
      monthToDateTotal: 4820.65,
      previousMonthTotal: 5210.4,
      forecastTotal: 6150.0,
      changePercentage: -7.48,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      lastSuccessfulRefresh: refreshTimestamp,
      isStale: false,
      cacheExpiresAt: expiresAt,
      nextScheduledRefresh: expiresAt,
      byService: [
        { serviceName: "Virtual Machines", cost: 2940.2, currency: "USD", percentage: 61.0 },
        { serviceName: "Azure OpenAI / Cognitive", cost: 950.4, currency: "USD", percentage: 19.7 },
        { serviceName: "Storage Accounts", cost: 480.05, currency: "USD", percentage: 10.0 },
        { serviceName: "Virtual Network & Bandwidth", cost: 260.0, currency: "USD", percentage: 5.4 },
        { serviceName: "Key Vault & Security", cost: 190.0, currency: "USD", percentage: 3.9 },
      ],
      dailyTrend: [
        { date: "2026-10-01", cost: 154.2 },
        { date: "2026-10-02", cost: 162.8 },
        { date: "2026-10-03", cost: 210.4 },
        { date: "2026-10-04", cost: 195.1 },
        { date: "2026-10-05", cost: 240.6 },
        { date: "2026-10-06", cost: 235.0 },
        { date: "2026-10-07", cost: 180.2 },
        { date: "2026-10-08", cost: 190.4 },
        { date: "2026-10-09", cost: 215.3 },
        { date: "2026-10-10", cost: 220.0 },
        { date: "2026-10-11", cost: 205.8 },
        { date: "2026-10-12", cost: 218.4 },
        { date: "2026-10-13", cost: 230.1 },
        { date: "2026-10-14", cost: 225.5 },
        { date: "2026-10-15", cost: 212.0 },
        { date: "2026-10-16", cost: 218.7 },
        { date: "2026-10-17", cost: 204.3 },
        { date: "2026-10-18", cost: 198.9 },
        { date: "2026-10-19", cost: 210.2 },
        { date: "2026-10-20", cost: 228.6 },
        { date: "2026-10-21", cost: 234.1 },
        { date: "2026-10-22", cost: 215.4 },
        { date: "2026-10-23", cost: 110.2 },
      ],
    };

    globalCache.set(cacheKey, data, config.BILLING_CACHE_TTL_MS);
    return data;
  }

  public async getBudgets(): Promise<BudgetsResponse> {
    const cacheKey = "mock:budgets";
    const cached = globalCache.get<BudgetsResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    const now = new Date();
    const data: BudgetsResponse = {
      budgets: [
        {
          id: "/subscriptions/sub-adt-ai-foundation-prod-01/providers/Microsoft.Consumption/budgets/budget-adt-monthly-operations",
          name: "budget-adt-monthly-operations",
          amount: 6500.0,
          currentSpend: 4820.65,
          currency: "USD",
          timeGrain: "Monthly",
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
          percentConsumed: 74.16,
          status: "ok",
          thresholds: [
            {
              thresholdPercentage: 80,
              thresholdType: "Actual",
              isExceeded: false,
              contactEmails: ["ops@adt-ai.org", "finance@adt-ai.org"],
            },
            {
              thresholdPercentage: 90,
              thresholdType: "Forecasted",
              isExceeded: true,
              contactEmails: ["ops@adt-ai.org", "lead-architect@adt-ai.org"],
            },
            {
              thresholdPercentage: 100,
              thresholdType: "Actual",
              isExceeded: false,
              contactEmails: ["security-alert@adt-ai.org", "finance@adt-ai.org"],
            },
          ],
        },
      ],
      lastUpdated: now.toISOString(),
      isStale: false,
    };

    globalCache.set(cacheKey, data, config.BILLING_CACHE_TTL_MS);
    return data;
  }

  public async getMetrics(resourceId?: string): Promise<MetricsResponse> {
    const now = Date.now();
    const targetId =
      resourceId ||
      "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01";

    const generatePoints = (baseVal: number, variance: number) => {
      const points = [];
      for (let i = 12; i >= 0; i--) {
        const time = new Date(now - i * 5 * 60 * 1000).toISOString();
        const jitter = (Math.sin(i) * variance) + (Math.random() * (variance / 2));
        points.push({
          timestamp: time,
          average: Math.max(1, Math.min(100, Math.round((baseVal + jitter) * 10) / 10)),
        });
      }
      return points;
    };

    return {
      timeRange: "PT1H (5-minute resolution)",
      lastUpdated: new Date(now).toISOString(),
      metrics: [
        {
          metricName: "Percentage CPU",
          unit: "Percent",
          resourceId: targetId,
          dataPoints: generatePoints(68, 12),
        },
        {
          metricName: "Disk Read Bytes / sec",
          unit: "BytesPerSecond",
          resourceId: targetId,
          dataPoints: generatePoints(45000000, 10000000),
        },
        {
          metricName: "Network In Total",
          unit: "Bytes",
          resourceId: targetId,
          dataPoints: generatePoints(12000000, 3000000),
        },
      ],
    };
  }
}
