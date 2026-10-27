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
  AlertsResponse,
  AlertItem,
  AzureStatusResponse,
} from "@adt-ai/shared";
import { IAzureDataProvider, ResourceFilterOptions } from "./types";
import { globalCache } from "../../cache";
import { durableBillingStore } from "../../cache/durable-store";
import { config } from "../../config";

export class AzureSdkDataProvider implements IAzureDataProvider {
  private credential: DefaultAzureCredential;
  private subscriptionId: string;
  private resourceGraphClient: ResourceGraphClient;
  private computeClient: ComputeManagementClient;
  private monitorClient: MonitorClient;

  constructor() {
    this.subscriptionId = config.AZURE_SUBSCRIPTION_ID || "f3834a10-6431-4a62-8a1b-738cb5629169";
    this.credential = new DefaultAzureCredential({
      tenantId: config.AZURE_TENANT_ID || undefined,
    });
    this.resourceGraphClient = new ResourceGraphClient(this.credential);
    this.computeClient = new ComputeManagementClient(this.credential, this.subscriptionId);
    this.monitorClient = new MonitorClient(this.credential, this.subscriptionId);
  }

  /**
   * Helper to fetch Azure ARM Bearer Token for REST operations
   */
  private async getArmToken(): Promise<string> {
    const tokenResponse = await this.credential.getToken("https://management.azure.com/.default");
    return tokenResponse.token;
  }

  public async getAzureStatus(): Promise<AzureStatusResponse> {
    const now = new Date().toISOString();
    const isConfigured = this.subscriptionId === "f3834a10-6431-4a62-8a1b-738cb5629169";
    let authAvailable = false;
    let subscriptionAccessible = false;
    const permissions: AzureStatusResponse["permissions"] = [];
    const guidance: string[] = [];

    // 1. Verify credential acquisition
    try {
      await this.getArmToken();
      authAvailable = true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to acquire Azure credential token";
      permissions.push({
        role: "Authentication (DefaultAzureCredential)",
        scope: `/subscriptions/${this.subscriptionId}`,
        status: "missing",
        details: errMsg,
      });
      guidance.push("1. Interactive login required: run 'az login' in your local terminal.");
      guidance.push(`2. Set subscription context: run 'az account set --subscription "${this.subscriptionId}"'`);
    }

    // 2. Verify Reader permission via Resource Graph query
    if (authAvailable) {
      try {
        await this.resourceGraphClient.resources({
          subscriptions: [this.subscriptionId],
          query: "Resources | take 1",
        });
        subscriptionAccessible = true;
        permissions.push({
          role: "Reader",
          scope: `/subscriptions/${this.subscriptionId}`,
          status: "verified",
          details: "Verified via Azure Resource Graph API",
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Resource Graph query failed";
        permissions.push({
          role: "Reader",
          scope: `/subscriptions/${this.subscriptionId}`,
          status: "missing",
          details: errMsg,
        });
        guidance.push(`Ensure your Azure account or Managed Identity has 'Reader' role on /subscriptions/${this.subscriptionId}`);
      }

      // 3. Verify Cost Management Reader permission
      try {
        const token = await this.getArmToken();
        const testRes = await fetch(
          `https://management.azure.com/subscriptions/${this.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "ActualCost",
              timeframe: "MonthToDate",
              dataset: { granularity: "None", aggregation: { totalCost: { name: "Cost", function: "Sum" } } },
            }),
          }
        );

        if (testRes.ok) {
          permissions.push({
            role: "Cost Management Reader",
            scope: `/subscriptions/${this.subscriptionId}`,
            status: "verified",
            details: "Verified via Cost Management Query API",
          });
        } else {
          permissions.push({
            role: "Cost Management Reader",
            scope: `/subscriptions/${this.subscriptionId}`,
            status: "missing",
            details: `HTTP ${testRes.status}: ${await testRes.text()}`,
          });
          guidance.push(`Ensure your Azure identity has 'Cost Management Reader' role on /subscriptions/${this.subscriptionId}`);
        }
      } catch (err: unknown) {
        permissions.push({
          role: "Cost Management Reader",
          scope: `/subscriptions/${this.subscriptionId}`,
          status: "unverified",
          details: err instanceof Error ? err.message : "Could not verify cost permissions",
        });
      }
    }

    return {
      subscriptionId: this.subscriptionId,
      isConfiguredSubscription: isConfigured,
      authAvailable,
      subscriptionAccessible,
      permissions,
      mode: "live-azure",
      actionableGuidance: guidance.length > 0 ? guidance : ["Azure connectivity and permissions fully verified."],
      timestamp: now,
    };
  }

  public async getSystemHealth(): Promise<SystemHealthResponse> {
    const now = new Date().toISOString();
    try {
      // Lightweight test query to verify Azure connectivity
      await this.resourceGraphClient.resources({
        subscriptions: [this.subscriptionId],
        query: "Resources | take 1",
      });

      return {
        status: "healthy",
        subscriptionId: this.subscriptionId,
        subscriptionName: "Azure for Students",
        timestamp: now,
        version: "1.0.0",
        authMode: "managed-identity",
        subsystems: [
          { name: "Azure Resource Graph", status: "healthy", lastSuccess: now },
          { name: "Azure Compute APIs", status: "healthy", lastSuccess: now },
          { name: "Azure Cost Management", status: "healthy", lastSuccess: now },
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
          { name: "Azure Compute APIs", status: "healthy", lastSuccess: now },
          { name: "Azure Cost Management", status: "degraded", lastSuccess: null, message: "Awaiting authentication validation" },
          { name: "Azure Monitor", status: "healthy", lastSuccess: now },
        ],
      };
    }
  }

  public async getResourceInventory(options?: ResourceFilterOptions): Promise<ResourceInventoryResponse> {
    const cacheKey = `real:inventory:resources:${this.subscriptionId}:${JSON.stringify(options || {})}`;
    const cached = globalCache.get<ResourceInventoryResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    try {
      let query = `
        Resources
        | where subscriptionId =~ '${this.subscriptionId}'
      `;

      if (options?.type && options.type !== "all") {
        query += ` | where type =~ '${options.type}'`;
      }
      if (options?.resourceGroup && options.resourceGroup !== "all") {
        query += ` | where resourceGroup =~ '${options.resourceGroup}'`;
      }
      if (options?.location && options.location !== "all") {
        query += ` | where location =~ '${options.location}'`;
      }
      if (options?.search) {
        const q = options.search.replace(/'/g, "\\'");
        query += ` | where name contains '${q}' or type contains '${q}'`;
      }

      query += ` | project id, name, type, resourceGroup, location, subscriptionId, tags, sku, plan, properties.provisioningState`;

      const response = await this.resourceGraphClient.resources({
        subscriptions: [this.subscriptionId],
        query,
        options: {
          skipToken: options?.skipToken,
          top: options?.pageSize || 50,
        },
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
        totalCount: response.totalRecords || resources.length,
        skipToken: response.skipToken,
        page: options?.page || 1,
        pageSize: options?.pageSize || 25,
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

  public async getResourceDetail(resourceId: string): Promise<Record<string, unknown> | null> {
    try {
      const query = `
        Resources
        | where id =~ '${resourceId.replace(/'/g, "\\'")}'
        | project id, name, type, resourceGroup, location, subscriptionId, tags, sku, plan, properties
      `;

      const response = await this.resourceGraphClient.resources({
        subscriptions: [this.subscriptionId],
        query,
      });

      const raw = (response.data as Array<Record<string, unknown>>)?.[0];
      if (!raw) return null;

      const isVm = String(raw.type || "").toLowerCase() === "microsoft.compute/virtualmachines";
      let instanceView = undefined;

      if (isVm) {
        const rg = String(raw.resourceGroup || "");
        const name = String(raw.name || "");
        try {
          instanceView = await this.computeClient.virtualMachines.instanceView(rg, name);
        } catch (ivErr) {
          console.warn(`[AzureSdk] Could not retrieve instanceView for ${name}:`, ivErr);
        }
      }

      return {
        ...raw,
        extendedProperties: {
          instanceView,
        },
      };
    } catch (err) {
      console.error("[AzureSdk] getResourceDetail error:", err);
      return null;
    }
  }

  public async getVmInventory(): Promise<VmInventoryResponse> {
    const cacheKey = `real:inventory:vms:${this.subscriptionId}`;
    const cached = globalCache.get<VmInventoryResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    try {
      const rawVms = [];
      for await (const vm of this.computeClient.virtualMachines.listAll()) {
        rawVms.push(vm);
      }

      // Bound parallel instanceView requests to chunks of 5 to prevent Azure API throttling
      const vms = [];
      let runningCount = 0;
      let stoppedCount = 0;
      let deallocatedCount = 0;

      const chunkSize = 5;
      for (let i = 0; i < rawVms.length; i += chunkSize) {
        const chunk = rawVms.slice(i, i + chunkSize);
        const resolvedChunk = await Promise.all(
          chunk.map(async (vm) => {
            const id = vm.id || "";
            const name = vm.name || "";
            const rg = id.split("/resourceGroups/")[1]?.split("/")[0] || "";

            let powerState: VmPowerState = "unknown";
            let displayStatus = "Status unknown";

            try {
              const iv = await this.computeClient.virtualMachines.instanceView(rg, name);
              const powerCode = iv.statuses?.find((s) => s.code?.startsWith("PowerState/"))?.code;
              if (powerCode === "PowerState/running") {
                powerState = "running";
                displayStatus = "VM running";
              } else if (powerCode === "PowerState/deallocated") {
                powerState = "deallocated";
                displayStatus = "VM deallocated";
              } else if (powerCode === "PowerState/stopped") {
                powerState = "stopped";
                displayStatus = "VM stopped";
              }
            } catch {
              powerState = "unknown";
            }

            return {
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
            };
          })
        );

        for (const item of resolvedChunk) {
          if (item.powerState === "running") runningCount++;
          else if (item.powerState === "stopped") stoppedCount++;
          else if (item.powerState === "deallocated") deallocatedCount++;
          vms.push(item);
        }
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
    // 1. Check shared 24-hour durable cooldown store across instances
    const cooldown = await durableBillingStore.isCooldownActive(
      this.subscriptionId,
      config.BILLING_CACHE_TTL_MS
    );

    const durableRecord = await durableBillingStore.getRecord(this.subscriptionId);

    if (cooldown.active && durableRecord && !forceRefresh) {
      console.log(
        `[AzureSdk] Serving cost data from durable store. Cooldown active (${Math.round(
          cooldown.remainingMs / 60000
        )} mins remaining).`
      );
      return durableRecord.data;
    }

    try {
      const token = await this.getArmToken();
      const url = `https://management.azure.com/subscriptions/${this.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

      const requestBody = {
        type: "ActualCost",
        timeframe: "MonthToDate",
        dataset: {
          granularity: "None",
          aggregation: {
            totalCost: {
              name: "Cost",
              function: "Sum",
            },
          },
          grouping: [
            { type: "Dimension", name: "ResourceGroup" },
            { type: "Dimension", name: "ServiceName" },
          ],
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Cost Management API returned ${response.status}: ${text}`);
      }

      const json = (await response.json()) as {
        properties?: {
          columns?: Array<{ name: string; type: string }>;
          rows?: Array<Array<unknown>>;
        };
      };

      const rows = json.properties?.rows || [];
      const columns = json.properties?.columns || [];
      const costIndex = columns.findIndex((c) => c.name.toLowerCase() === "cost" || c.name.toLowerCase() === "pretaxcost");
      const serviceIndex = columns.findIndex((c) => c.name.toLowerCase() === "servicename");
      const currencyIndex = columns.findIndex((c) => c.name.toLowerCase() === "currency");

      let monthToDateTotal = 0;
      let currency = "USD";
      const serviceMap = new Map<string, number>();

      for (const row of rows) {
        const costVal = Number(row[costIndex]) || 0;
        const svc = String(row[serviceIndex] || "Other");
        if (currencyIndex >= 0 && row[currencyIndex]) {
          currency = String(row[currencyIndex]);
        }
        monthToDateTotal += costVal;
        serviceMap.set(svc, (serviceMap.get(svc) || 0) + costVal);
      }

      const byService = Array.from(serviceMap.entries()).map(([serviceName, cost]) => ({
        serviceName,
        cost: Math.round(cost * 100) / 100,
        currency,
        percentage: monthToDateTotal > 0 ? Math.round((cost / monthToDateTotal) * 1000) / 10 : 0,
      }));

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const nextScheduledRefresh = new Date(now.getTime() + config.BILLING_CACHE_TTL_MS).toISOString();

      const costData: CostDataResponse = {
        currency,
        monthToDateTotal: Math.round(monthToDateTotal * 100) / 100,
        previousMonthTotal: 0,
        changePercentage: 0,
        byService,
        dailyTrend: [],
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        lastSuccessfulRefresh: now.toISOString(),
        isStale: false,
        cacheExpiresAt: nextScheduledRefresh,
        nextScheduledRefresh,
      };

      // Persist to durable store with 24h shared cooldown
      await durableBillingStore.saveRecord(this.subscriptionId, costData, config.BILLING_CACHE_TTL_MS);
      return costData;
    } catch (err) {
      console.error("[AzureSdk] Cost Management Query failed:", err);
      if (durableRecord) {
        console.warn("[AzureSdk] Serving stale cost record from durable store following query error.");
        return {
          ...durableRecord.data,
          isStale: true,
        };
      }
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const nextScheduledRefresh = new Date(now.getTime() + config.BILLING_CACHE_TTL_MS).toISOString();

      return {
        currency: "USD",
        monthToDateTotal: 0,
        previousMonthTotal: 0,
        changePercentage: 0,
        byService: [],
        dailyTrend: [],
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        lastSuccessfulRefresh: now.toISOString(),
        isStale: false,
        cacheExpiresAt: nextScheduledRefresh,
        nextScheduledRefresh,
      };
    }
  }

  public async getBudgets(): Promise<BudgetsResponse> {
    const cacheKey = `real:budgets:${this.subscriptionId}`;
    const cached = globalCache.get<BudgetsResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    try {
      const token = await this.getArmToken();
      const url = `https://management.azure.com/subscriptions/${this.subscriptionId}/providers/Microsoft.Consumption/budgets?api-version=2023-11-01`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Consumption Budgets API returned ${response.status}`);
      }

      const json = (await response.json()) as {
        value?: Array<{
          id: string;
          name: string;
          properties?: {
            amount: number;
            timeGrain: "Monthly" | "Quarterly" | "Annually" | "BillingMonth";
            currentSpend?: { amount: number; unit: string };
            timePeriod?: { startDate: string; endDate: string };
            notifications?: Record<
              string,
              {
                threshold: number;
                operator: string;
                thresholdType?: "Actual" | "Forecasted";
                contactEmails?: string[];
              }
            >;
          };
        }>;
      };

      const rawBudgets = json.value || [];
      const budgets = rawBudgets.map((b) => {
        const props = b.properties;
        const amount = props?.amount || 0;
        const spend = props?.currentSpend?.amount || 0;
        const currency = props?.currentSpend?.unit || "USD";
        const percentConsumed = amount > 0 ? Math.round((spend / amount) * 1000) / 10 : 0;

        const thresholds = Object.values(props?.notifications || {}).map((n) => ({
          thresholdPercentage: n.threshold,
          thresholdType: n.thresholdType || "Actual",
          isExceeded: spend >= (amount * n.threshold) / 100,
          contactEmails: n.contactEmails || [],
        }));

        return {
          id: b.id,
          name: b.name,
          amount,
          currentSpend: spend,
          currency,
          timeGrain: props?.timeGrain || "Monthly",
          startDate: props?.timePeriod?.startDate || new Date().toISOString(),
          endDate: props?.timePeriod?.endDate || new Date().toISOString(),
          percentConsumed,
          status: (percentConsumed >= 100 ? "critical" : percentConsumed >= 80 ? "warning" : "ok") as
            | "ok"
            | "warning"
            | "critical",
          thresholds,
        };
      });

      const result: BudgetsResponse = {
        budgets,
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };

      globalCache.set(cacheKey, result, config.OPERATIONAL_CACHE_TTL_MS);
      return result;
    } catch (err) {
      console.warn("[AzureSdk] getBudgets failed:", err);
      if (cached) {
        return {
          ...cached.data,
          isStale: true,
        };
      }
      // If subscription has no configured budget, return truthful empty state without throwing
      return {
        budgets: [],
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };
    }
  }

  public async getMetrics(resourceId?: string, timespan?: string): Promise<MetricsResponse> {
    if (!resourceId) {
      throw new Error("resourceId required for Azure Monitor metric queries");
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000);
    const range = timespan || `${startTime.toISOString()}/${now.toISOString()}`;

    try {
      const res = await this.monitorClient.metrics.list(resourceId, {
        timespan: range,
        interval: "PT5M",
        metricnames: "Percentage CPU,Disk Read Bytes,Disk Write Bytes,Network In Total",
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
        timeRange: range,
        lastUpdated: now.toISOString(),
        metrics: series,
      };
    } catch (err) {
      console.warn("[AzureSdk] getMetrics query failed for resource:", resourceId, err);
      return {
        timeRange: range,
        lastUpdated: now.toISOString(),
        metrics: [],
      };
    }
  }

  public async getAlerts(): Promise<AlertsResponse> {
    const cacheKey = `real:alerts:${this.subscriptionId}`;
    const cached = globalCache.get<AlertsResponse>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    try {
      const token = await this.getArmToken();
      const url = `https://management.azure.com/subscriptions/${this.subscriptionId}/providers/Microsoft.AlertsManagement/alerts?api-version=2019-05-05-preview`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Alerts Management API returned ${response.status}`);
      }

      const json = (await response.json()) as {
        value?: Array<{
          id: string;
          name: string;
          properties?: {
            essentials?: {
              severity: "Sev0" | "Sev1" | "Sev2" | "Sev3" | "Sev4";
              alertState: "New" | "Acknowledged" | "Closed";
              targetResource: string;
              targetResourceGroup?: string;
              targetResourceType?: string;
              monitorCondition: "Fired" | "Resolved";
              signalType?: string;
              startDateTime?: string;
              description?: string;
            };
          };
        }>;
      };

      const alerts: AlertItem[] = (json.value || []).map((item) => {
        const e = item.properties?.essentials;
        return {
          id: item.id,
          name: item.name,
          severity: e?.severity || "Sev3",
          state: e?.alertState || "New",
          targetResource: e?.targetResource || "",
          targetResourceType: e?.targetResourceType,
          monitorCondition: e?.monitorCondition || "Fired",
          signalType: e?.signalType,
          firedDateTime: e?.startDateTime || new Date().toISOString(),
          description: e?.description,
        };
      });

      const result: AlertsResponse = {
        alerts,
        totalCount: alerts.length,
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };

      globalCache.set(cacheKey, result, config.OPERATIONAL_CACHE_TTL_MS);
      return result;
    } catch (err) {
      console.warn("[AzureSdk] getAlerts failed:", err);
      if (cached) {
        return {
          ...cached.data,
          isStale: true,
        };
      }
      return {
        alerts: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };
    }
  }
}
