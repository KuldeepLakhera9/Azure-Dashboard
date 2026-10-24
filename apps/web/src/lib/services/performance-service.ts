export type PerformanceTimeRange = "PT1H" | "PT6H" | "PT24H" | "P7D";

export interface MetricDataPoint {
  timestamp: string;
  formattedTime: string;
  average?: number;
  maximum?: number;
  minimum?: number;
}

export interface MetricSeries {
  metricName: string;
  unit: string;
  resourceId: string;
  dataPoints: MetricDataPoint[];
}

export interface GuestMemoryTelemetry {
  isConfigured: boolean;
  statusMessage: string;
  agentName?: string;
  currentPercentageUsed?: number;
  totalMemoryGb?: number;
  dataPoints?: MetricDataPoint[];
}

export interface ResourcePerformanceResult {
  resourceId: string;
  resourceName: string;
  timeRange: PerformanceTimeRange;
  lastUpdated: string;
  hostCollectionStatus: "healthy" | "degraded" | "no-data" | "insufficient-permissions";
  cpuSeries: MetricSeries;
  diskSeries: MetricSeries;
  networkSeries: MetricSeries;
  guestMemory: GuestMemoryTelemetry;
}

export interface IPerformanceService {
  getPerformance(
    resourceId: string,
    timeRange: PerformanceTimeRange,
    forceStatus?: "healthy" | "no-data" | "insufficient-permissions",
    signal?: AbortSignal
  ): Promise<ResourcePerformanceResult>;
}

export class MockPerformanceService implements IPerformanceService {
  public async getPerformance(
    resourceId: string,
    timeRange: PerformanceTimeRange,
    forceStatus: "healthy" | "no-data" | "insufficient-permissions" = "healthy",
    signal?: AbortSignal
  ): Promise<ResourcePerformanceResult> {
    if (signal?.aborted) throw new DOMException("Query aborted", "AbortError");

    const now = Date.now();
    const parts = resourceId.split("/");
    const resourceName = parts[parts.length - 1] || "Selected Resource";

    if (forceStatus === "no-data") {
      return {
        resourceId,
        resourceName,
        timeRange,
        lastUpdated: new Date(now).toISOString(),
        hostCollectionStatus: "no-data",
        cpuSeries: { metricName: "Percentage CPU", unit: "Percent", resourceId, dataPoints: [] },
        diskSeries: { metricName: "Disk Read/Write Bytes/sec", unit: "BytesPerSecond", resourceId, dataPoints: [] },
        networkSeries: { metricName: "Network In Total", unit: "Bytes", resourceId, dataPoints: [] },
        guestMemory: {
          isConfigured: false,
          statusMessage: "No metric timeseries returned for the selected resource window.",
        },
      };
    }

    if (forceStatus === "insufficient-permissions") {
      return {
        resourceId,
        resourceName,
        timeRange,
        lastUpdated: new Date(now).toISOString(),
        hostCollectionStatus: "insufficient-permissions",
        cpuSeries: { metricName: "Percentage CPU", unit: "Percent", resourceId, dataPoints: [] },
        diskSeries: { metricName: "Disk Read/Write Bytes/sec", unit: "BytesPerSecond", resourceId, dataPoints: [] },
        networkSeries: { metricName: "Network In Total", unit: "Bytes", resourceId, dataPoints: [] },
        guestMemory: {
          isConfigured: false,
          statusMessage: "Authorization Denied: Insufficient Azure RBAC permissions to read telemetry.",
        },
      };
    }

    // Number of points based on interval
    let pointCount = 12;
    let stepMs = 5 * 60 * 1000; // 5 min for 1H
    if (timeRange === "PT6H") {
      pointCount = 24;
      stepMs = 15 * 60 * 1000;
    } else if (timeRange === "PT24H") {
      pointCount = 24;
      stepMs = 60 * 60 * 1000;
    } else if (timeRange === "P7D") {
      pointCount = 28;
      stepMs = 6 * 3600 * 1000;
    }

    const generatePoints = (baseVal: number, variance: number, maxCap = 100) => {
      const pts: MetricDataPoint[] = [];
      for (let i = pointCount; i >= 0; i--) {
        const t = new Date(now - i * stepMs);
        const jitter = Math.sin(i * 0.7) * variance + (Math.random() * variance * 0.5);
        const val = Math.max(1, Math.min(maxCap, Math.round((baseVal + jitter) * 10) / 10));
        pts.push({
          timestamp: t.toISOString(),
          formattedTime: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          average: val,
        });
      }
      return pts;
    };

    // Determine if guest telemetry (Azure Monitor Agent) is configured
    const hasAmaInstalled = resourceName.includes("eval-worker");

    let guestMemory: GuestMemoryTelemetry;
    if (hasAmaInstalled) {
      guestMemory = {
        isConfigured: true,
        agentName: "Azure Monitor Agent (AMA)",
        statusMessage: "Guest OS telemetry active and reporting memory metrics.",
        currentPercentageUsed: 42.8,
        totalMemoryGb: 16,
        dataPoints: generatePoints(42.8, 6, 100),
      };
    } else {
      guestMemory = {
        isConfigured: false,
        statusMessage:
          "Guest OS Memory Telemetry Not Configured. Azure Monitor collects hypervisor metrics by default; in-guest RAM metrics require the Azure Monitor Agent (AMA) extension.",
      };
    }

    return {
      resourceId,
      resourceName,
      timeRange,
      lastUpdated: new Date(now).toISOString(),
      hostCollectionStatus: "healthy",
      cpuSeries: {
        metricName: "Percentage CPU",
        unit: "Percent",
        resourceId,
        dataPoints: generatePoints(68.4, 14, 100),
      },
      diskSeries: {
        metricName: "Disk Read/Write Bytes/sec",
        unit: "MB/s",
        resourceId,
        dataPoints: generatePoints(45.2, 12, 500),
      },
      networkSeries: {
        metricName: "Network Traffic (In/Out)",
        unit: "MB/s",
        resourceId,
        dataPoints: generatePoints(18.5, 8, 200),
      },
      guestMemory,
    };
  }
}

export const performanceService = new MockPerformanceService();
