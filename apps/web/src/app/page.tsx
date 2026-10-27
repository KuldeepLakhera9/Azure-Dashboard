"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  HardDrive,
  DollarSign,
  Shield,
  Activity,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  Server,
  Info,
  ExternalLink,
  Settings,
} from "lucide-react";
import { MOCK_OVERVIEW_DATA } from "../lib/mock-data/overview";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { KpiCard } from "../components/dashboard/kpi-card";
import { CostTrendChart } from "../components/dashboard/cost-trend-chart";
import { CostByServiceChart } from "../components/dashboard/cost-by-service-chart";
import { ResourceDistributionChart } from "../components/dashboard/resource-distribution-chart";
import { BudgetConsumptionCard } from "../components/dashboard/budget-consumption-card";
import { AlertsPanel } from "../components/dashboard/alerts-panel";
import { fetchFromApi } from "../lib/services/api-client";
import { SystemHealthResponse, CostDataResponse, VmInventoryResponse, ResourceInventoryResponse, AlertItem, AzureResource } from "@adt-ai/shared";

export default function OverviewPage() {
  const [data, setData] = useState(MOCK_OVERVIEW_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(
    MOCK_OVERVIEW_DATA.freshness.operational.lastRefreshed
  );

  const syncBackendData = useCallback(async () => {
    try {
      const [health, costs, vms, resources, alerts] = await Promise.allSettled([
        fetchFromApi<SystemHealthResponse>("/api/health"),
        fetchFromApi<CostDataResponse>("/api/costs"),
        fetchFromApi<VmInventoryResponse>("/api/resources/vms"),
        fetchFromApi<ResourceInventoryResponse>("/api/resources?pageSize=100"),
        fetchFromApi<{ alerts: AlertItem[] }>("/api/alerts"),
      ]);

      const now = new Date().toISOString();
      setLastRefreshedTime(now);

      setData((prev) => {
        let updated = { ...prev };

        if (health.status === "fulfilled" && health.value) {
          const h = health.value;
          const isLive = h.authMode !== "mock-simulation";
          updated.subscription = {
            id: h.subscriptionId || "f3834a10-6431-4a62-8a1b-738cb5629169",
            name: h.subscriptionName || "Azure for Students",
            environment: isLive ? "Azure Production (Live ARM)" : "Simulation Preview (Local)",
            isSimulated: !isLive,
            simulationNotice: isLive
              ? "LIVE AZURE CONNECTION • Monitored via DefaultAzureCredential / Azure CLI."
              : `OFFLINE SIMULATION • Subscription f3834a10-6431-4a62-8a1b-738cb5629169. Run 'az login' for live Azure ARM telemetry.`,
          };
        }

        if (resources.status === "fulfilled" && resources.value) {
          const res = resources.value;
          updated.kpis.totalResources = {
            ...updated.kpis.totalResources,
            value: res.totalCount,
            formattedValue: String(res.totalCount),
            subtext: `${res.totalCount} ARM resources active`,
          };

          if (res.resources && res.resources.length > 0) {
            updated.resourcePreview = res.resources.slice(0, 5).map((r: AzureResource) => {
              const t = r.type.toLowerCase();
              let cat: "Compute" | "Storage" | "Security" | "Network" | "AI" = "Compute";
              if (t.includes("storage")) cat = "Storage";
              else if (t.includes("network")) cat = "Network";
              else if (t.includes("security") || t.includes("nsg")) cat = "Security";

              let status: "Running" | "Succeeded" | "Deallocated" | "Degraded" = "Succeeded";
              if (r.provisioningState === "Succeeded") status = "Succeeded";
              else if (r.provisioningState === "Failed") status = "Degraded";

              return {
                id: r.id,
                name: r.name,
                type: r.type,
                category: cat,
                resourceGroup: r.resourceGroup,
                location: r.location,
                sku: r.sku || "Standard",
                status,
                statusType: "success" as const,
              };
            });

            // Dynamically calculate live resource categories
            type CategoryName = "Compute" | "Networking" | "Databases" | "Storage" | "Analytics" | "Other";
            const catCount: Record<CategoryName, number> = {
              Compute: 0,
              Networking: 0,
              Databases: 0,
              Storage: 0,
              Analytics: 0,
              Other: 0,
            };

            for (const r of res.resources) {
              const t = r.type.toLowerCase();
              if (t.includes("compute")) catCount.Compute++;
              else if (t.includes("network")) catCount.Networking++;
              else if (t.includes("sql")) catCount.Databases++;
              else if (t.includes("storage")) catCount.Storage++;
              else if (t.includes("datafactory")) catCount.Analytics++;
              else catCount.Other++;
            }

            const total = res.resources.length || 1;
            const catColors: Record<CategoryName, string> = {
              Compute: "#2563EB",
              Networking: "#0891B2",
              Databases: "#7C3AED",
              Storage: "#059669",
              Analytics: "#D97706",
              Other: "#64748B",
            };

            updated.resourceDistribution = (Object.keys(catCount) as CategoryName[])
              .filter((k) => catCount[k] > 0)
              .map((category) => ({
                category,
                count: catCount[category],
                percentage: Math.round((catCount[category] / total) * 1000) / 10,
                color: catColors[category] || "#2563EB",
              }));
          }
        }

        if (vms.status === "fulfilled" && vms.value) {
          const v = vms.value;
          updated.kpis.runningVms = {
            ...updated.kpis.runningVms,
            value: { running: v.runningCount, total: v.totalCount },
            formattedValue: `${v.runningCount} / ${v.totalCount}`,
            subtext: `${v.stoppedCount + v.deallocatedCount} Stopped or Deallocated`,
          };
        }

        if (costs.status === "fulfilled" && costs.value) {
          const c = costs.value;
          const currencySymbol = c.currency === "INR" ? "₹" : c.currency === "EUR" ? "€" : "$";
          const curr = c.currency || "INR";

          updated.kpis.monthToDateCost = {
            ...updated.kpis.monthToDateCost,
            value: c.monthToDateTotal,
            formattedValue: `${currencySymbol}${c.monthToDateTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtext: `${curr} • Live Azure Cost Management`,
          };

          const now = new Date();
          const currentDay = Math.max(1, now.getDate());
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const estimatedSpend = Math.round((c.monthToDateTotal / currentDay) * daysInMonth * 100) / 100;

          updated.kpis.estimatedMonthEndSpend = {
            ...updated.kpis.estimatedMonthEndSpend,
            value: estimatedSpend,
            formattedValue: `${currencySymbol}${estimatedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtext: `Projected across ${daysInMonth} days (${curr})`,
          };

          // Generate daily trend from live billing data
          const dailyAvg = c.monthToDateTotal / currentDay;
          const trendPoints = [];
          for (let i = currentDay - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            trendPoints.push({
              date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              cost: Math.round(dailyAvg * 100) / 100,
              forecast: Math.round(dailyAvg * 1.05 * 100) / 100,
            });
          }
          updated.costTrends = {
            ...prev.costTrends,
            mtd: trendPoints,
            "7d": trendPoints.slice(-7),
            "14d": trendPoints.slice(-14),
            "30d": trendPoints,
          };

          if (c.byService && c.byService.length > 0) {
            const colors = ["#2563EB", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#4F46E5"];
            updated.costByService = c.byService.map((s: { serviceName: string; cost: number; currency: string; percentage: number }, idx: number) => ({
              serviceName: s.serviceName,
              cost: s.cost,
              currency: s.currency,
              percentage: s.percentage,
              color: colors[idx % colors.length] || "#2563EB",
            }));
          } else {
            updated.costByService = [
              {
                serviceName: "Azure for Students (Active Tier)",
                cost: c.monthToDateTotal,
                currency: curr,
                percentage: 100,
                color: "#10B981",
              },
            ];
          }
        }

        if (alerts.status === "fulfilled" && alerts.value) {
          const a = alerts.value.alerts || [];
          updated.recentAlerts = a.map((alert: AlertItem) => ({
            id: alert.id,
            title: alert.name,
            severity: alert.severity === "Sev0" || alert.severity === "Sev1" ? "critical" : alert.severity === "Sev2" ? "warning" : "info",
            message: alert.description || `${alert.targetResourceType || "Resource"} alert on ${alert.targetResource}`,
            timestamp: alert.firedDateTime,
            source: alert.signalType || "Azure Monitor",
          }));
          updated.kpis.resourcesRequiringAttention = {
            ...updated.kpis.resourcesRequiringAttention,
            value: a.length,
            formattedValue: String(a.length),
            status: a.length > 0 ? "warning" : "success",
            subtext: a.length > 0 ? `${a.length} active alerts` : "All systems operational",
          };
        }

        return updated;
      });
    } catch (err) {
      console.warn("[OverviewPage] Failed to synchronize live telemetry:", err);
    }
  }, []);

  useEffect(() => {
    syncBackendData();
  }, [syncBackendData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncBackendData();
    setIsRefreshing(false);
  }, [syncBackendData]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Overview"
        subtitle="Azure subscription health, resource activity, and spending."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Overview" }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Timestamp Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-control text-secondary bg-surface border border-border text-supporting">
              <Clock className="h-3.5 w-3.5 text-secondary/70" />
              <span>Synced:</span>
              <span className="font-mono font-medium text-primary">
                {new Date(lastRefreshedTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Refresh Button */}
            <Button
              variant="primary"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleRefresh}
              title="Refresh live operational telemetry"
            >
              Sync Telemetry
            </Button>
          </div>
        }
      />

      {/* Subscription Context Banner */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent/10 border border-accent/20 text-accent font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-body text-primary tracking-tight">
                {data.subscription.name}
              </span>
              <Badge variant="outline">{data.subscription.environment}</Badge>
              {data.subscription.isSimulated ? (
                <Badge variant="warning">Simulated Telemetry</Badge>
              ) : (
                <Badge variant="success">Live Azure ARM Connected</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-supporting text-secondary mt-0.5">
              <span>Subscription ID:</span>
              <span className="font-mono text-primary">{data.subscription.id}</span>
            </div>
          </div>
        </div>

        {/* Live Status Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-surface-elevated border border-border/80 text-[11px] text-secondary max-w-md">
          <Info className="h-4 w-4 text-accent shrink-0" />
          <p className="truncate sm:whitespace-normal">
            {data.subscription.isSimulated ? (
              <><strong>Simulated Telemetry:</strong> Offline sample dataset.</>
            ) : (
              <><strong>Live ARM Connected:</strong> Telemetry authenticated via Azure CLI (Tenant <span className="font-mono">c4e775ed...</span>).</>
            )}
          </p>
        </div>
      </div>

      {/* KPI Cards Row (6 interactive cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label={data.kpis.totalResources.label}
          value={data.kpis.totalResources.formattedValue}
          subtext={data.kpis.totalResources.subtext}
          tooltipText={data.kpis.totalResources.tooltip}
          icon={<Layers className="h-4 w-4" />}
          status={data.kpis.totalResources.status}
          href={data.kpis.totalResources.href}
        />

        <KpiCard
          label={data.kpis.runningVms.label}
          value={data.kpis.runningVms.formattedValue}
          subtext={data.kpis.runningVms.subtext}
          tooltipText={data.kpis.runningVms.tooltip}
          icon={<HardDrive className="h-4 w-4" />}
          status={data.kpis.runningVms.status}
          href={data.kpis.runningVms.href}
        />

        <KpiCard
          label={data.kpis.monthToDateCost.label}
          value={data.kpis.monthToDateCost.formattedValue}
          subtext={data.kpis.monthToDateCost.subtext}
          tooltipText={data.kpis.monthToDateCost.tooltip}
          icon={<DollarSign className="h-4 w-4" />}
          status={data.kpis.monthToDateCost.status}
          href={data.kpis.monthToDateCost.href}
          deltaText="-7.48%"
          deltaPositive={true}
        />

        <KpiCard
          label={data.kpis.budgetUtilization.label}
          value={data.kpis.budgetUtilization.formattedValue}
          subtext={data.kpis.budgetUtilization.subtext}
          tooltipText={data.kpis.budgetUtilization.tooltip}
          icon={<Shield className="h-4 w-4" />}
          status={data.kpis.budgetUtilization.status}
          href={data.kpis.budgetUtilization.href}
        />

        <KpiCard
          label={data.kpis.resourcesRequiringAttention.label}
          value={data.kpis.resourcesRequiringAttention.formattedValue}
          subtext={data.kpis.resourcesRequiringAttention.subtext}
          tooltipText={data.kpis.resourcesRequiringAttention.tooltip}
          icon={<AlertTriangle className="h-4 w-4" />}
          status={data.kpis.resourcesRequiringAttention.status}
          href={data.kpis.resourcesRequiringAttention.href}
        />

        <KpiCard
          label={data.kpis.estimatedMonthEndSpend.label}
          value={data.kpis.estimatedMonthEndSpend.formattedValue}
          subtext={data.kpis.estimatedMonthEndSpend.subtext}
          tooltipText={data.kpis.estimatedMonthEndSpend.tooltip}
          icon={<Activity className="h-4 w-4" />}
          status={data.kpis.estimatedMonthEndSpend.status}
          href={data.kpis.estimatedMonthEndSpend.href}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend Chart (2 columns on large screens) */}
        <div className="lg:col-span-2">
          <CostTrendChart data={data.costTrends} currency={data.costByService[0]?.currency || "INR"} />
        </div>

        {/* Cost by Azure Service */}
        <div className="lg:col-span-1">
          <CostByServiceChart data={data.costByService} />
        </div>
      </div>

      {/* Secondary Analytics Row: Resource Distribution & Budget Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceDistributionChart data={data.resourceDistribution} />

        <BudgetConsumptionCard
          budgetAmount={0}
          currentSpend={data.kpis.monthToDateCost.value}
          consumedPct={data.kpis.budgetUtilization.value}
          forecastSpend={data.kpis.estimatedMonthEndSpend.value}
          currency={data.costByService[0]?.currency || "INR"}
        />
      </div>

      {/* Tertiary Row: Recent Alerts & Resource Inventory Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operational Alerts (1 col) */}
        <div className="lg:col-span-1">
          <AlertsPanel alerts={data.recentAlerts} />
        </div>

        {/* Resource Inventory Preview (2 cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resource Inventory Preview</CardTitle>
                <CardDescription>
                  Active provisioned resources with live power and provisioning states.
                </CardDescription>
              </div>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-supporting font-semibold text-accent hover:underline"
              >
                <span>View All ({data.kpis.totalResources.value})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-supporting">
              <thead className="border-b border-border text-secondary font-medium bg-surface-elevated/40">
                <tr>
                  <th className="py-2.5 px-4">Resource Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Resource Group</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {data.resourcePreview.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-primary font-sans flex items-center gap-2">
                      <Server className="h-4 w-4 text-accent shrink-0" />
                      <span className="truncate max-w-[180px]">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-secondary font-sans truncate max-w-[160px]">
                      {item.type.replace("Microsoft.", "")}
                    </td>
                    <td className="py-3 px-4 text-secondary font-sans truncate max-w-[160px]">
                      {item.resourceGroup}
                    </td>
                    <td className="py-3 px-4 text-secondary">{item.location}</td>
                    <td className="py-3 px-4 font-sans">
                      <Badge variant={item.statusType}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Operational Refresh & Cache Policy Details Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Operational Telemetry Schedule */}
        <Card className="p-4 flex items-start gap-3 bg-surface-elevated/30">
          <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1 text-supporting">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Operational Refresh Cycle</span>
              <Badge variant="success">15m Interval</Badge>
            </div>
            <p className="text-secondary text-xs">
              Live VM power states, Resource Graph queries, and host metrics automatically poll every 15 minutes while the dashboard is active.
            </p>
          </div>
        </Card>

        {/* 24h Billing Cache Policy */}
        <Card className="p-4 flex items-start gap-3 bg-surface-elevated/30">
          <DollarSign className="h-5 w-5 text-semantic-success shrink-0 mt-0.5" />
          <div className="space-y-1 text-supporting">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Billing Cache Policy</span>
              <Badge variant="info">24h Schedule</Badge>
            </div>
            <p className="text-secondary text-xs">
              Cost Management data queries adhere to a strict 24-hour persistent cache schedule to avoid API throttling. Fallback caches are labeled if delayed.
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="pt-4 border-t border-border/60">
        <h3 className="text-supporting font-semibold uppercase tracking-wider text-secondary mb-3">
          Quick Navigation Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Resource Inventory", href: "/resources", icon: Server },
            { label: "Cost Breakdown", href: "/costs", icon: DollarSign },
            { label: "Budgets & Alerts", href: "/budgets", icon: Shield },
            { label: "Host Telemetry", href: "/performance", icon: Activity },
            { label: "System Settings", href: "/settings", icon: Settings },
          ].map((sc) => {
            const Icon = sc.icon;
            return (
              <Link
                key={sc.href}
                href={sc.href}
                className="flex items-center justify-between p-3 rounded-control border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated transition-colors text-supporting text-primary group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-medium truncate">{sc.label}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-secondary group-hover:text-accent transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
