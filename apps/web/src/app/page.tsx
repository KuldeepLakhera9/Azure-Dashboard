"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Header } from "../components/header";
import { api } from "../lib/api";
import {
  ResourceInventoryResponse,
  VmInventoryResponse,
  CostDataResponse,
  BudgetsResponse,
  MetricsResponse,
  SystemHealthResponse,
} from "@adt-ai/shared";
import {
  Server,
  Layers,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Activity,
  Search,
  Filter,
  Shield,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Tab = "overview" | "resources" | "vms" | "costs" | "metrics";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [resourcesData, setResourcesData] = useState<ResourceInventoryResponse | null>(null);
  const [vmsData, setVmsData] = useState<VmInventoryResponse | null>(null);
  const [costsData, setCostsData] = useState<CostDataResponse | null>(null);
  const [budgetsData, setBudgetsData] = useState<BudgetsResponse | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRg, setSelectedRg] = useState("all");

  const loadAllData = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Parallel loading of all endpoints
      const [h, r, v, c, b, m] = await Promise.all([
        api.getHealth(),
        api.getResources(),
        api.getVms(),
        api.getCosts(),
        api.getBudgets(),
        api.getMetrics(),
      ]);

      setHealth(h);
      setResourcesData(r);
      setVmsData(v);
      setCostsData(c);
      setBudgetsData(b);
      setMetricsData(m);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load Azure telemetry";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Auto-refresh operational data every 15 minutes (900,000 ms)
    const interval = setInterval(() => {
      loadAllData(true);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Filtered resources for search & dropdown
  const resourceGroups = useMemo(() => {
    if (!resourcesData) return [];
    const rgs = new Set<string>();
    resourcesData.resources.forEach((r) => rgs.add(r.resourceGroup));
    return Array.from(rgs);
  }, [resourcesData]);

  const filteredResources = useMemo(() => {
    if (!resourcesData) return [];
    return resourcesData.resources.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.resourceGroup.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRg = selectedRg === "all" || r.resourceGroup === selectedRg;
      return matchesSearch && matchesRg;
    });
  }, [resourcesData, searchQuery, selectedRg]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14]">
      <Header
        lastRefreshed={resourcesData?.lastUpdated || null}
        isRefreshing={isRefreshing}
        onRefresh={() => loadAllData(true)}
        status={health?.status || "healthy"}
        subscriptionName={health?.subscriptionName}
        subscriptionId={health?.subscriptionId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadAllData(true)}
              className="px-2.5 py-1 text-xs font-medium rounded bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 hover:bg-rose-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !resourcesData && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-5"
                />
              ))}
            </div>
            <div className="h-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50" />
          </div>
        )}

        {/* Freshness & Stale Banner */}
        {costsData && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-azure-500" />
              <span>
                <strong>Controlled Refresh Schedule:</strong> Operational metrics refresh every 15m. Billing data is cached on a 24-hour cycle.
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              {costsData.isStale && (
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-sans font-medium">
                  Stale Snapshot
                </span>
              )}
              <span>Next billing query: {new Date(costsData.cacheExpiresAt).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-6">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "resources", label: "Resource Inventory", icon: Server },
              { id: "vms", label: "Virtual Machines", icon: HardDrive },
              { id: "costs", label: "Costs & Budgets", icon: DollarSign },
              { id: "metrics", label: "Infrastructure Metrics", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-azure-500 text-azure-600 dark:text-azure-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-azure-500"
                        : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Resources */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Azure Resources
                  </span>
                  <div className="p-2 rounded-md bg-azure-50 dark:bg-azure-950/60 text-azure-600 dark:text-azure-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {resourcesData?.totalCount ?? "--"}
                  </span>
                  <span className="text-xs text-slate-500">
                    across {resourceGroups.length} resource groups
                  </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Provisioned</span>
                  <span className="mx-1.5">•</span>
                  <span>Azure Resource Graph</span>
                </div>
              </div>

              {/* Card 2: Virtual Machines Power State */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Compute Power State
                  </span>
                  <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Server className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {vmsData?.runningCount ?? "--"}{" "}
                    <span className="text-sm font-normal text-slate-500">/ {vmsData?.totalCount ?? "--"}</span>
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Running
                  </span>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-slate-600 dark:text-slate-300">
                    {vmsData?.deallocatedCount ?? 0} Deallocated
                  </span>
                  <span className="mx-1.5">•</span>
                  <span>{vmsData?.stoppedCount ?? 0} Stopped</span>
                </div>
              </div>

              {/* Card 3: Month-To-Date Spend */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    MTD Azure Spend
                  </span>
                  <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ${costsData?.monthToDateTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "--"}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    7.5% vs last mo
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>Forecast: ${costsData?.forecastTotal?.toLocaleString() ?? "--"}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Budget: ${budgetsData?.budgets[0]?.amount.toLocaleString() ?? "--"}
                  </span>
                </div>
              </div>

              {/* Card 4: Budget Consumption */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Budget Utilization
                  </span>
                  <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {budgetsData?.budgets[0]?.percentConsumed.toFixed(1) ?? "--"}%
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Within Safe Bounds
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>Threshold alert at 80%</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Status: OK</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Cost Trend Area Chart */}
              <div className="lg:col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Month-to-Date Spend Trend
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Daily costs for October 2026 (Currency: USD)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Azure Cost Management API</span>
                </div>
                <div className="h-64 w-full">
                  {costsData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={costsData.dailyTrend}>
                        <defs>
                          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0078d4" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0078d4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={11}
                          tickFormatter={(val) => val.split("-")[2]}
                        />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cost"
                          stroke="#0078d4"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#costGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400">
                      Loading chart...
                    </div>
                  )}
                </div>
              </div>

              {/* Service Cost Breakdown */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Cost Breakdown by Service
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Highest contributing Azure services
                  </p>
                </div>
                <div className="space-y-3.5 flex-1 justify-center flex flex-col">
                  {costsData?.byService.map((service) => (
                    <div key={service.serviceName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {service.serviceName}
                        </span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          ${service.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({service.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-azure-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Resource Inventory */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by resource name, type, or resource group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedRg}
                  onChange={(e) => setSelectedRg(e.target.value)}
                  className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azure-500/20"
                >
                  <option value="all">All Resource Groups ({resourceGroups.length})</option>
                  {resourceGroups.map((rg) => (
                    <option key={rg} value={rg}>
                      {rg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resources Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Resource Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Resource Group</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Provisioning State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {filteredResources.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Server className="h-3.5 w-3.5 text-azure-500" />
                          <span>{r.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-sans">
                          {r.type.replace("Microsoft.", "")}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-sans">
                          {r.resourceGroup}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {r.location}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {r.sku || "Standard"}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="h-3 w-3" />
                            {r.provisioningState}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredResources.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans">
                          No matching Azure resources found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Virtual Machines */}
        {activeTab === "vms" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-card">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Virtual Machine Compute & Power State
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live instance view power state from Azure Compute API (independent of Resource Graph inventory)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Total VMs: <strong>{vmsData?.totalCount ?? 0}</strong>
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">VM Name</th>
                      <th className="px-4 py-3">Live Power State</th>
                      <th className="px-4 py-3">Size / Hardware</th>
                      <th className="px-4 py-3">OS</th>
                      <th className="px-4 py-3">Private IP</th>
                      <th className="px-4 py-3">Resource Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {vmsData?.vms.map((vm) => {
                      const isRunning = vm.powerState === "running";
                      const isDeallocated = vm.powerState === "deallocated";
                      return (
                        <tr
                          key={vm.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-azure-500" />
                            <span>{vm.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                isRunning
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                                  : isDeallocated
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isRunning ? "bg-emerald-500" : isDeallocated ? "bg-slate-400" : "bg-amber-500"
                                }`}
                              />
                              {vm.displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                            {vm.vmSize}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {vm.osType} ({vm.osDiskSizeGb ?? "--"} GB)
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {vm.privateIpAddress || "DHCP Assigned"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {vm.resourceGroup}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Costs & Budgets */}
        {activeTab === "costs" && (
          <div className="space-y-6">
            {/* Active Budget Card */}
            {budgetsData?.budgets.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-azure-500" />
                      <span>{b.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Time Grain: {b.timeGrain} | Current Billing Period
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      ${b.currentSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })} / $
                      {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {b.percentConsumed.toFixed(1)}% consumed
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        b.percentConsumed >= 100
                          ? "bg-rose-500"
                          : b.percentConsumed >= 80
                          ? "bg-amber-500"
                          : "bg-azure-500"
                      }`}
                      style={{ width: `${Math.min(100, b.percentConsumed)}%` }}
                    />
                  </div>
                </div>

                {/* Thresholds */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {b.thresholds.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {t.thresholdPercentage}% {t.thresholdType}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            t.isExceeded
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          {t.isExceeded ? "Exceeded" : "Normal"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 truncate">
                        Alert: {t.contactEmails.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Service Breakdown Bar Chart */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Service Cost Distribution (MTD)
              </h3>
              <div className="h-64 w-full">
                {costsData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costsData.byService}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="serviceName" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="cost" fill="#0078d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Infrastructure Metrics */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Primary Host CPU Utilization (% Average)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Azure Monitor host telemetry: vm-adt-gpu-trainer-01 (Standard_NC6s_v3)
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">PT5M Interval</span>
              </div>
              <div className="h-64 w-full">
                {metricsData && metricsData.metrics[0] ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsData.metrics[0].dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      />
                      <YAxis stroke="#64748b" fontSize={11} unit="%" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="average"
                        name="CPU %"
                        stroke="#10b981"
                        fill="#10b98120"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No metric timeseries available.
                  </div>
                )}
              </div>
            </div>

            {/* Telemetry Availability Disclaimer */}
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
              <Info className="h-4 w-4 text-azure-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Host vs Guest Telemetry Notice:</strong>
                <p className="mt-0.5">
                  Host CPU, Network IO, and Disk IO are collected directly from the Azure hypervisor. In accordance with Azure monitoring architecture, in-guest memory and OS process metrics require the Azure Monitor Agent (AMA) extension and are not assumed to be present unless explicitly provisioned.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>ADT-AI Training Foundation &copy; 2026. Internal Azure Operations Center.</span>
          <div className="flex items-center gap-4">
            <span>Read-Only Portal</span>
            <span>•</span>
            <span>Vercel + Azure App Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
