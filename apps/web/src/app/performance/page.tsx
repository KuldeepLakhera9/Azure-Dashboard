"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Cpu,
  HardDrive,
  AlertTriangle,
  Clock,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "../../components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { ErrorState } from "../../components/ui/error-state";
import { EmptyState } from "../../components/ui/empty-state";
import {
  performanceService,
  PerformanceTimeRange,
  ResourcePerformanceResult,
} from "../../lib/services/performance-service";
import { inventoryService } from "../../lib/services/inventory-service";
import { AzureResourceItem } from "../../lib/mock-data/inventory";

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}

function CustomChartTooltip({ active, payload, label, unit = "" }: CustomChartTooltipProps) {
  if (active && payload && payload.length > 0) {
    const val = payload[0]?.value ?? 0;
    return (
      <div className="rounded-control border border-border bg-surface text-primary p-2.5 shadow-popover text-supporting font-sans">
        <p className="text-secondary text-xs">{label}</p>
        <p className="font-bold text-accent font-mono text-body mt-0.5">
          {val.toFixed(1)} {unit}
        </p>
      </div>
    );
  }
  return null;
}

function PerformanceContent() {
  const searchParams = useSearchParams();
  const paramResource = searchParams.get("resource");

  const [availableResources, setAvailableResources] = useState<AzureResourceItem[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>(paramResource || "");
  const [timeRange, setTimeRange] = useState<PerformanceTimeRange>("PT1H");
  const [simulatedStatus, setSimulatedStatus] = useState<"healthy" | "no-data" | "insufficient-permissions">("healthy");

  const [perfData, setPerfData] = useState<ResourcePerformanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real resources on mount to populate the resource selector
  useEffect(() => {
    inventoryService.getResources({ pageSize: 100 }).then((res) => {
      if (res.resources && res.resources.length > 0) {
        setAvailableResources(res.resources);
        // Default to a VM if available, or the first resource
        if (!paramResource) {
          const vm = res.resources.find((r) => r.type.toLowerCase().includes("virtualmachines"));
          setSelectedResourceId(vm ? vm.id : res.resources[0]!.id);
        }
      }
    });
  }, [paramResource]);

  const fetchPerformance = useCallback(
    async (isManual = false) => {
      if (!selectedResourceId) return;
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      const controller = new AbortController();
      try {
        const data = await performanceService.getPerformance(
          selectedResourceId,
          timeRange,
          simulatedStatus,
          controller.signal
        );
        setPerfData(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to load performance telemetry:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }

      return () => controller.abort();
    },
    [selectedResourceId, timeRange, simulatedStatus]
  );

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const selectedResource = availableResources.find((r) => r.id === selectedResourceId);
  const isVm = selectedResource?.type.includes("virtualMachines");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Infrastructure Performance"
        subtitle="Host-level hypervisor telemetry, CPU utilization, disk metrics, and guest telemetry status."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Performance" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => fetchPerformance(true)}
            >
              Sync Metrics
            </Button>
          </div>
        }
      />

      {/* Control Selector Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Resource Selector */}
            <div className="md:col-span-2">
              <Select
                label="Target Azure Resource"
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
              >
                {availableResources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type.replace("Microsoft.", "")} — {r.location})
                  </option>
                ))}
              </Select>
            </div>

            {/* Time-Range Selector */}
            <div>
              <Select
                label="Sampling Time Window"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as PerformanceTimeRange)}
              >
                <option value="PT1H">Last 1 Hour (5m sampling)</option>
                <option value="PT6H">Last 6 Hours (15m sampling)</option>
                <option value="PT24H">Last 24 Hours (1h sampling)</option>
                <option value="P7D">Last 7 Days (6h sampling)</option>
              </Select>
            </div>
          </div>

          {/* Diagnostic simulation state switcher (allows QA testing no-data and error states) */}
          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-supporting text-secondary">
            <span className="text-xs">Diagnostic Telemetry Test Modes:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSimulatedStatus("healthy")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  simulatedStatus === "healthy"
                    ? "bg-semantic-success-bg text-semantic-success border border-semantic-success/30"
                    : "bg-surface-elevated text-secondary hover:text-primary"
                }`}
              >
                Active Telemetry
              </button>
              <button
                onClick={() => setSimulatedStatus("no-data")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  simulatedStatus === "no-data"
                    ? "bg-semantic-warning-bg text-semantic-warning border border-semantic-warning/30"
                    : "bg-surface-elevated text-secondary hover:text-primary"
                }`}
              >
                Simulate No Data
              </button>
              <button
                onClick={() => setSimulatedStatus("insufficient-permissions")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  simulatedStatus === "insufficient-permissions"
                    ? "bg-semantic-critical-bg text-semantic-critical border border-semantic-critical/30"
                    : "bg-surface-elevated text-secondary hover:text-primary"
                }`}
              >
                Simulate 403 Forbidden
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Resource Summary & Telemetry Boundary Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selected Resource Card */}
        <Card className="p-4 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-accent/10 text-accent font-semibold">
              {isVm ? <Server className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div>
              <span className="font-semibold text-body text-primary">{selectedResource?.name}</span>
              <p className="text-[11px] text-secondary font-mono">
                {selectedResource?.sku || "Standard"} • {selectedResource?.locationDisplay}
              </p>
            </div>
          </div>
          <Badge variant={selectedResource?.powerState === "running" ? "success" : "default"}>
            {selectedResource?.powerState?.toUpperCase() || selectedResource?.provisioningState}
          </Badge>
        </Card>

        {/* Hypervisor Metric Status */}
        <Card className="p-4 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-semantic-success-bg text-semantic-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-body text-primary">Host Hypervisor Metrics</span>
              <p className="text-[11px] text-secondary">Azure Monitor Host Pipeline</p>
            </div>
          </div>
          <Badge variant="success">Operational</Badge>
        </Card>

        {/* Guest Telemetry Collection Status */}
        <Card className="p-4 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-semantic-info-bg text-semantic-info">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-body text-primary">Guest AMA Agent</span>
              <p className="text-[11px] text-secondary">
                {perfData?.guestMemory.isConfigured ? "Installed & Reporting" : "Not Installed"}
              </p>
            </div>
          </div>
          <Badge variant={perfData?.guestMemory.isConfigured ? "success" : "warning"}>
            {perfData?.guestMemory.isConfigured ? "Active" : "Optional"}
          </Badge>
        </Card>
      </div>

      {/* Handling of Error / No-data / Loading States */}
      {isLoading && !perfData ? (
        <Card className="p-8 text-center space-y-4 animate-pulse">
          <div className="h-4 w-48 mx-auto bg-border/60 rounded" />
          <div className="h-64 w-full bg-border/40 rounded" />
        </Card>
      ) : simulatedStatus === "insufficient-permissions" ? (
        <ErrorState
          title="Insufficient Azure Monitor Permissions"
          message="Your account lacks the 'Monitoring Reader' or 'Reader' RBAC role to query metrics for this resource. Request least-privilege telemetry access from your Azure subscription administrator."
          onRetry={() => setSimulatedStatus("healthy")}
        />
      ) : simulatedStatus === "no-data" ? (
        <EmptyState
          icon={<Clock className="h-8 w-8 text-secondary/60" />}
          title="No Metric Timeseries Returned"
          description="Azure Monitor returned zero telemetry points for the selected resource and time range. Ensure the resource is active and generating metric events."
          actionLabel="Reset to Active Telemetry"
          onAction={() => setSimulatedStatus("healthy")}
        />
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Host CPU Utilization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-accent" />
                    <CardTitle>Host CPU Utilization (% Average)</CardTitle>
                  </div>
                  <CardDescription>
                    Direct hypervisor metrics collected from Azure Monitor (5-minute resolution).
                  </CardDescription>
                </div>
                <Badge variant="outline">Hypervisor Metric</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full" aria-label="Host CPU utilization chart">
                {perfData?.cpuSeries.dataPoints && perfData.cpuSeries.dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perfData.cpuSeries.dataPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="formattedTime"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#94A3B8", opacity: 0.2 }}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip content={<CustomChartTooltip unit="%" />} />
                      <Area
                        type="monotone"
                        dataKey="average"
                        name="CPU %"
                        stroke="#16A34A"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#cpuGrad)"
                        activeDot={{ r: 5, fill: "#16A34A", stroke: "#FFFFFF", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-secondary">
                    No data points available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guest Memory Metrics — Specifically distinguishing unconfigured telemetry from 0% */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    <CardTitle>Guest OS Memory Utilization</CardTitle>
                  </div>
                  <CardDescription>
                    Requires Azure Monitor Agent (AMA). Cannot be inferred from host hypervisor.
                  </CardDescription>
                </div>
                <Badge variant={perfData?.guestMemory.isConfigured ? "success" : "warning"}>
                  {perfData?.guestMemory.isConfigured ? "Configured" : "Telemetry Missing"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {perfData?.guestMemory.isConfigured && perfData.guestMemory.dataPoints ? (
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between text-supporting pb-2 border-b border-border/60">
                    <div>
                      <span className="text-secondary">Current RAM Used: </span>
                      <span className="font-bold text-primary font-mono text-body">
                        {perfData.guestMemory.currentPercentageUsed}% ({perfData.guestMemory.totalMemoryGb} GB Total)
                      </span>
                    </div>
                    <span className="text-semantic-success text-xs font-medium">
                      Agent: {perfData.guestMemory.agentName}
                    </span>
                  </div>

                  <div className="h-56 w-full" aria-label="Guest OS memory utilization chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perfData.guestMemory.dataPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                        <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomChartTooltip unit="%" />} />
                        <Area
                          type="monotone"
                          dataKey="average"
                          name="RAM %"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#memGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                /* Unconfigured Telemetry Display — Strictly NOT showing 0% */
                <div className="p-6 rounded-control border border-dashed border-border bg-surface-elevated/40 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-semantic-warning-bg text-semantic-warning mx-auto">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h4 className="text-body font-semibold text-primary">
                    Guest OS Memory Telemetry Not Configured
                  </h4>
                  <p className="text-supporting text-secondary max-w-lg mx-auto">
                    In accordance with Azure monitoring architecture, in-guest memory and OS process metrics are not collected by default at the hypervisor level. To enable memory telemetry, install the Azure Monitor Agent (AMA) extension on this virtual machine.
                  </p>
                  <div className="pt-2">
                    <Badge variant="outline">Missing Telemetry (Not 0% Utilization)</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 3: Disk Metrics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-accent" />
                    <CardTitle>Disk Throughput (Read / Write MB/s)</CardTitle>
                  </div>
                  <CardDescription>
                    Host-level disk input/output transfer speed metrics.
                  </CardDescription>
                </div>
                <Badge variant="outline">MB/s</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full" aria-label="Disk throughput chart">
                {perfData?.diskSeries.dataPoints && perfData.diskSeries.dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perfData.diskSeries.dataPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="diskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333EA" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                      <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} unit=" MB/s" tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomChartTooltip unit="MB/s" />} />
                      <Area
                        type="monotone"
                        dataKey="average"
                        name="MB/s"
                        stroke="#9333EA"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#diskGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-secondary">
                    No data points available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-secondary">Loading performance module...</div>}>
      <PerformanceContent />
    </Suspense>
  );
}
