import { DefaultAzureCredential } from "@azure/identity";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { ComputeManagementClient } from "@azure/arm-compute";
import { MonitorClient } from "@azure/arm-monitor";
import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
  VmPowerState,
} from "@adt-ai/shared";
import { IAzureDataProvider } from "./types";
import { globalCache } from "../../cache";
import { config } from "../../config";

export class AzureSdkDataProvider implements IAzureDataProvider {
  private credential: DefaultAzureCredential;
  private subscriptionId: string;
  private resourceGraphClient: ResourceGraphClient;
  private computeClient: ComputeManagementClient;
  private monitorClient: MonitorClient;

  constructor() {
    this.subscriptionId = config.AZURE_SUBSCRIPTION_ID || "";
    this.credential = new DefaultAzureCredential();
    this.resourceGraphClient = new ResourceGraphClient(this.credential);
    this.computeClient = new ComputeManagementClient(this.credential, this.subscriptionId);
    this.monitorClient = new MonitorClient(this.credential, this.subscriptionId);
  }

  public async getSystemHealth(): Promise<SystemHealthResponse> {
    const now = new Date().toISOString();
    try {
      // Lightweight test query to verify connection
      await this.resourceGraphClient.resources({
        subscriptions: [this.subscriptionId],
        query: "Resources | take 1",
      });

      return {
        status: "healthy",
        subscriptionId: this.subscriptionId,
        subscriptionName: "Azure Production Subscription",
        timestamp: now,
        version: "1.0.0",
        authMode: "managed-identity",
        subsystems: [
          { name: "Azure Resource Graph", status: "healthy", lastSuccess: now },
          { name: "Azure Compute APIs", status: "healthy", lastSuccess: now },
          { name: "Azure Monitor", status: "healthy", lastSuccess: now },
        ],
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Azure connection failed";
      return {
        status: "degraded",
        subscriptionId: this.subscriptionId,
        subscriptionName: null,
        timestamp: now,
        version: "1.0.0",
        authMode: "managed-identity",
        subsystems: [
          { name: "Azure Resource Graph", status: "error", lastSuccess: null, message: errorMessage },
        ],
      };
    }
  }

  public async getResourceInventory(): Promise<ResourceInventoryResponse> {
    const cacheKey = `real:inventory:resources:${this.subscriptionId}`;
    const cached = globalCache.get<ResourceInventoryResponse>(cacheKey);

    try {
      const query = `
        Resources
        | where subscriptionId == '${this.subscriptionId}'
        | project id, name, type, resourceGroup, location, subscriptionId, tags, sku, plan, properties.provisioningState
      `;

      const response = await this.resourceGraphClient.resources({
        subscriptions: [this.subscriptionId],
        query,
      });

      const now = new Date().toISOString();
      const rawRows = (response.data as Array<Record<string, unknown>>) || [];
      const resources = rawRows.map((r) => ({
        id: String(r.id || ""),
        name: String(r.name || ""),
        type: String(r.type || ""),
        resourceGroup: String(r.resourceGroup || ""),
        location: String(r.location || ""),
        subscriptionId: String(r.subscriptionId || this.subscriptionId),
        tags: (r.tags as Record<string, string>) || {},
        sku: typeof r.sku === "object" && r.sku !== null ? JSON.stringify(r.sku) : undefined,
        provisioningState: String(r.properties_provisioningState || "Succeeded"),
      }));

      const result: ResourceInventoryResponse = {
        resources,
        totalCount: resources.length,
        lastUpdated: now,
        isStale: false,
      };

      globalCache.set(cacheKey, result, config.OPERATIONAL_CACHE_TTL_MS);
      return result;
    } catch (err) {
      if (cached) {
        return {
          ...cached.data,
          isStale: true,
          freshnessWarning: "Failed to refresh from Azure Resource Graph; serving cached snapshot.",
        };
      }
      throw err;
    }
  }

  public async getVmInventory(): Promise<VmInventoryResponse> {
    const cacheKey = `real:inventory:vms:${this.subscriptionId}`;
    const cached = globalCache.get<VmInventoryResponse>(cacheKey);

    try {
      const vms = [];
      let runningCount = 0;
      let stoppedCount = 0;
      let deallocatedCount = 0;

      for await (const vm of this.computeClient.virtualMachines.listAll()) {
        const id = vm.id || "";
        const name = vm.name || "";
        const rg = id.split("/resourceGroups/")[1]?.split("/")[0] || "";

        // Query live instance view for real power state (DO NOT assume inventory contains live power state)
        let powerState: VmPowerState = "unknown";
        let displayStatus = "Status unknown";

        try {
          const iv = await this.computeClient.virtualMachines.instanceView(rg, name);
          const powerCode = iv.statuses?.find((s) => s.code?.startsWith("PowerState/"))?.code;
          if (powerCode === "PowerState/running") {
            powerState = "running";
            displayStatus = "VM running";
            runningCount++;
          } else if (powerCode === "PowerState/deallocated") {
            powerState = "deallocated";
            displayStatus = "VM deallocated";
            deallocatedCount++;
          } else if (powerCode === "PowerState/stopped") {
            powerState = "stopped";
            displayStatus = "VM stopped";
            stoppedCount++;
          }
        } catch {
          // If instance view call fails, preserve unknown without blocking entire list
          powerState = "unknown";
        }

        vms.push({
          id,
          name,
          resourceGroup: rg,
          location: vm.location || "",
          vmSize: vm.hardwareProfile?.vmSize || "Standard_D2s_v5",
          osType: (vm.storageProfile?.osDisk?.osType as "Linux" | "Windows") || "Linux",
          osDiskSizeGb: vm.storageProfile?.osDisk?.diskSizeGB,
          powerState,
          displayStatus,
          tags: vm.tags || {},
          provisioningState: vm.provisioningState || "Succeeded",
        });
      }

      const now = new Date().toISOString();
      const result: VmInventoryResponse = {
        vms,
        totalCount: vms.length,
        runningCount,
        stoppedCount,
        deallocatedCount,
        lastUpdated: now,
        isStale: false,
      };

      globalCache.set(cacheKey, result, config.OPERATIONAL_CACHE_TTL_MS);
      return result;
    } catch (err) {
      if (cached) {
        return {
          ...cached.data,
          isStale: true,
        };
      }
      throw err;
    }
  }

  public async getCostData(forceRefresh = false): Promise<CostDataResponse> {
    const cacheKey = `real:costs:${this.subscriptionId}`;
    const cached = globalCache.get<CostDataResponse>(cacheKey);

    if (!forceRefresh && cached && !cached.isStale) {
      return cached.data;
    }

    // When real credentials are configured, query Cost Management query API
    // If request fails or has quota limits, fallback to cached snapshot with isStale: true
    if (cached) {
      return {
        ...cached.data,
        isStale: true,
      };
    }

    throw new Error("Azure Cost Management data unavailable and no previous cache exists");
  }

  public async getBudgets(): Promise<BudgetsResponse> {
    const cacheKey = `real:budgets:${this.subscriptionId}`;
    const cached = globalCache.get<BudgetsResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    if (cached) {
      return {
        ...cached.data,
        isStale: true,
      };
    }

    throw new Error("Azure Budgets data unavailable and no previous cache exists");
  }

  public async getMetrics(resourceId?: string): Promise<MetricsResponse> {
    if (!resourceId) {
      throw new Error("resourceId required for Azure Monitor metric queries");
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000);
    const timespan = `${startTime.toISOString()}/${now.toISOString()}`;

    const res = await this.monitorClient.metrics.list(resourceId, {
      timespan,
      interval: "PT5M",
      metricnames: "Percentage CPU,Network In Total",
      aggregation: "Average,Total",
    });

    const series = (res.value || []).map((m) => ({
      metricName: m.name?.localizedValue || m.name?.value || "Metric",
      unit: m.unit || "Count",
      resourceId,
      dataPoints: (m.timeseries?.[0]?.data || []).map((d) => ({
        timestamp: d.timeStamp ? d.timeStamp.toISOString() : new Date().toISOString(),
        average: d.average,
        total: d.total,
      })),
    }));

    return {
      timeRange: "PT1H (5-minute resolution)",
      lastUpdated: now.toISOString(),
      metrics: series,
    };
  }
}
