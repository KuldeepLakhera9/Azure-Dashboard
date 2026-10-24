"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Clock,
  TrendingDown,
  Info,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  Layers,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ErrorState } from "../../components/ui/error-state";
import {
  costService,
  CostSortField,
  CostSortOrder,
} from "../../lib/services/cost-service";
import { CostRecordItem, CostSummaryData, CostTrendPoint } from "../../lib/mock-data/costs";
import { exportToCsv } from "../../lib/utils/csv-export";

interface CostTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CostCustomTooltip({ active, payload, label }: CostTooltipProps) {
  if (active && payload && payload.length > 0) {
    return (
      <div className="rounded-control border border-border bg-surface text-primary p-2.5 shadow-popover text-supporting font-sans">
        <p className="font-semibold text-secondary">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="font-mono text-body font-bold mt-0.5">
            <span className={entry.name === "ActualCost" ? "text-accent" : "text-purple-500"}>
              {entry.name}:
            </span>{" "}
            ${entry.value.toFixed(2)} USD
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function CostsPage() {
  const [summary, setSummary] = useState<CostSummaryData | null>(null);
  const [records, setRecords] = useState<CostRecordItem[]>([]);
  const [trendPoints, setTrendPoints] = useState<CostTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<"7d" | "mtd">("mtd");

  const [search, setSearch] = useState("");
  const [rgFilter, setRgFilter] = useState("all");
  const [costTypeFilter, setCostTypeFilter] = useState("all");

  const [sortField, setSortField] = useState<CostSortField>("amount");
  const [sortOrder, setSortOrder] = useState<CostSortOrder>("desc");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulatedState, setSimulatedState] = useState<"healthy" | "stale" | "error">("healthy");

  const fetchCostData = useCallback(async () => {
    setIsRefreshing(true);
    const controller = new AbortController();

    try {
      if (simulatedState === "error") {
        setIsRefreshing(false);
        return;
      }

      const isStale = simulatedState === "stale";
      const [sum, recs, trend] = await Promise.all([
        costService.getCostSummary(isStale, controller.signal),
        costService.getCostRecords(
          { search, resourceGroup: rgFilter, costType: costTypeFilter },
          sortField,
          sortOrder,
          controller.signal
        ),
        costService.getDailyTrend(trendRange, controller.signal),
      ]);

      setSummary(sum);
      setRecords(recs);
      setTrendPoints(trend);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to load cost analytics:", err);
    } finally {
      setIsRefreshing(false);
    }

    return () => controller.abort();
  }, [simulatedState, search, rgFilter, costTypeFilter, sortField, sortOrder, trendRange]);

  useEffect(() => {
    fetchCostData();
  }, [fetchCostData]);

  const handleSort = (field: CostSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleExportCsv = () => {
    const filename = `azure-cost-breakdown-${new Date().toISOString().slice(0, 10)}`;
    exportToCsv<CostRecordItem>(
      filename,
      [
        { header: "Service Name", accessor: (r) => r.serviceName },
        { header: "Resource Group", accessor: (r) => r.resourceGroup },
        { header: "Cost Type", accessor: (r) => r.costType },
        { header: "Currency", accessor: (r) => r.currency },
        { header: "Amount (USD)", accessor: (r) => r.amount.toFixed(2) },
        { header: "Percentage (%)", accessor: (r) => `${r.percentage}%` },
        { header: "Last Updated", accessor: (r) => r.lastUpdated },
      ],
      records
    );
  };

  // Group by Resource Group for RG-level breakdown
  const rgBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      map.set(r.resourceGroup, (map.get(r.resourceGroup) || 0) + r.amount);
    });
    const total = summary?.actualCost || 1;
    return Array.from(map.entries()).map(([rg, amt]) => ({
      resourceGroup: rg,
      amount: amt,
      percentage: Math.round((amt / total) * 1000) / 10,
    }));
  }, [records, summary?.actualCost]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Cost Analytics & Financial Breakdown"
        subtitle="Month-to-date Azure consumption, actual vs amortized dimensions, and service-level cost allocations."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Costs" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="h-4 w-4 text-semantic-success" />}
              onClick={handleExportCsv}
              title="Download filtered cost rows as CSV"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchCostData}
            >
              Sync Billing Cache
            </Button>
          </div>
        }
      />

      {/* Freshness & Billing Lag Disclosures Banner */}
      <div className="rounded-card border border-border bg-surface p-4 text-supporting text-secondary space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-accent shrink-0" />
            <span className="font-semibold text-primary">
              Azure Cost Management Freshness & Latency Notice
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Last Cache Query:</span>
            <strong className="text-primary font-mono">
              {summary?.lastSuccessfulQuery ? new Date(summary.lastSuccessfulQuery).toLocaleDateString() : "Today"}
            </strong>
            <Badge variant={summary?.isStale ? "warning" : "success"}>
              {summary?.isStale ? "Stale Snapshot" : "Cache Fresh"}
            </Badge>
          </div>
        </div>
        <p className="text-xs">
          Azure cost data reflects usage records processed by Azure Cost Management and may lag behind live resource consumption by 24 to 48 hours. Totals can adjust as delayed usage records are processed. Cost estimates displayed here do not represent finalized legal invoices.
        </p>
      </div>

      {/* Stale Warning Banner (if simulated or upstream delay) */}
      {summary?.isStale && (
        <div className="p-3.5 rounded-card bg-semantic-warning-bg border border-semantic-warning/30 text-semantic-warning text-supporting flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Stale Data Advisory:</strong> {summary.staleReason || "Serving cached snapshot due to Azure billing query latency."}
            </span>
          </div>
          <span className="font-mono text-xs">Query Schedule: 24h</span>
        </div>
      )}

      {/* Diagnostic simulation state switcher */}
      <div className="flex items-center justify-between text-xs text-secondary px-1">
        <span>Diagnostic Simulation Controls:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSimulatedState("healthy")}
            className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              simulatedState === "healthy"
                ? "bg-accent/10 text-accent font-semibold border border-accent/30"
                : "bg-surface-elevated text-secondary"
            }`}
          >
            Fresh Cache
          </button>
          <button
            onClick={() => setSimulatedState("stale")}
            className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              simulatedState === "stale"
                ? "bg-semantic-warning-bg text-semantic-warning font-semibold border border-semantic-warning/30"
                : "bg-surface-elevated text-secondary"
            }`}
          >
            Simulate Stale Cache
          </button>
          <button
            onClick={() => setSimulatedState("error")}
            className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              simulatedState === "error"
                ? "bg-semantic-critical-bg text-semantic-critical font-semibold border border-semantic-critical/30"
                : "bg-surface-elevated text-secondary"
            }`}
          >
            Simulate Query Error
          </button>
        </div>
      </div>

      {simulatedState === "error" ? (
        <ErrorState
          title="Azure Cost Management Query Failed"
          message="Unable to communicate with the Azure Cost Management API. Retaining previous cached billing records to prevent operational blind spots."
          onRetry={() => setSimulatedState("healthy")}
        />
      ) : (
        <>
          {/* Key Metric Financial KPI Cards: Distinct Actual vs Amortized vs Forecast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Actual Cost */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                    Actual Cost (MTD)
                  </span>
                  <div className="p-1.5 rounded-control bg-accent/10 text-accent">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-primary font-mono">
                    ${summary?.actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-supporting text-semantic-success flex items-center font-medium">
                    <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                    7.48%
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2 border-t border-border/60 text-[11px] text-secondary flex justify-between">
                  <span>Currency: USD (No Conversion)</span>
                  <span>vs last mo: $5,210.40</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Amortized Cost */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                    Amortized Cost
                  </span>
                  <div className="p-1.5 rounded-control bg-purple-500/10 text-purple-500">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-primary font-mono">
                    ${summary?.amortizedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant="outline">Adjusted</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2 border-t border-border/60 text-[11px] text-secondary">
                  <span>Accounts for prepaid reservations</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Forecasted Cost */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                    Month-End Forecast
                  </span>
                  <div className="p-1.5 rounded-control bg-accent/10 text-accent">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-primary font-mono">
                    ${summary?.forecastedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant="warning">Estimate</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2 border-t border-border/60 text-[11px] text-secondary">
                  <span>Algorithmic 30-day run rate projection</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Configured Budget Comparison */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                    Monthly Budget Cap
                  </span>
                  <div className="p-1.5 rounded-control bg-semantic-warning-bg text-semantic-warning">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-primary font-mono">$6,500.00</span>
                  <span className="text-supporting text-secondary">Limit</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2 border-t border-border/60 text-[11px] text-secondary flex justify-between">
                  <span>Remaining: $1,679.35</span>
                  <span className="text-accent font-semibold">74.2% used</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Cost Trend Chart with Actual vs Forecast Separation */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Daily Cost Trend & Forecast</CardTitle>
                  <CardDescription>
                    Explicitly separated ActualCost (solid blue) and ForecastedCost (purple dashed) dimensions.
                  </CardDescription>
                </div>
                <div className="flex items-center rounded-control bg-surface-elevated p-1 border border-border">
                  <button
                    onClick={() => setTrendRange("7d")}
                    className={`px-3 py-1 text-supporting rounded-md font-medium transition-colors cursor-pointer ${
                      trendRange === "7d"
                        ? "bg-surface text-primary shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTrendRange("mtd")}
                    className={`px-3 py-1 text-supporting rounded-md font-medium transition-colors cursor-pointer ${
                      trendRange === "mtd"
                        ? "bg-surface text-primary shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    Month to Date
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full" aria-label="Daily cost trend and forecast chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333EA" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
                    <Tooltip content={<CostCustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="actualCost"
                      name="ActualCost"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#actualGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecastedCost"
                      name="ForecastedCost"
                      stroke="#9333EA"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#forecastGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Section: By Service & By Resource Group */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service-Level Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Service-Level Breakdown</CardTitle>
                <CardDescription>Top contributing Azure service dimensions (MTD Actual Cost).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {records.map((r) => (
                  <div key={r.id} className="space-y-1">
                    <div className="flex justify-between text-body">
                      <span className="font-medium text-primary">{r.serviceName}</span>
                      <span className="font-mono text-primary font-semibold">
                        ${r.amount.toFixed(2)} ({r.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resource-Group Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Group Allocations</CardTitle>
                <CardDescription>Direct cost allocations tracked per active resource group container.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {rgBreakdown.map((item) => (
                  <div key={item.resourceGroup} className="space-y-1">
                    <div className="flex justify-between text-body">
                      <span className="font-medium text-primary font-mono text-xs">{item.resourceGroup}</span>
                      <span className="font-mono text-primary font-semibold">
                        ${item.amount.toFixed(2)} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Interactive Cost Data Table with Filters and Sorting */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Itemized Azure Cost Records</CardTitle>
                  <CardDescription>
                    Sortable and filterable dataset. Use the Export button above to generate a CSV.
                  </CardDescription>
                </div>
                <div className="text-supporting text-secondary font-mono">
                  Showing {records.length} records
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Table Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Filter by service or resource group..."
                  leftIcon={<Search className="h-4 w-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select
                  value={rgFilter}
                  onChange={(e) => setRgFilter(e.target.value)}
                >
                  <option value="all">All Resource Groups</option>
                  <option value="rg-adt-training-compute">rg-adt-training-compute</option>
                  <option value="rg-adt-ai-services">rg-adt-ai-services</option>
                  <option value="rg-adt-data-storage">rg-adt-data-storage</option>
                  <option value="rg-adt-networking">rg-adt-networking</option>
                  <option value="rg-adt-security">rg-adt-security</option>
                </Select>
                <Select
                  value={costTypeFilter}
                  onChange={(e) => setCostTypeFilter(e.target.value)}
                >
                  <option value="all">All Cost Types</option>
                  <option value="ActualCost">ActualCost (Direct Incurred)</option>
                  <option value="AmortizedCost">AmortizedCost (Reservation Adjusted)</option>
                </Select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-control border border-border">
                <table className="w-full text-left text-supporting">
                  <thead className="border-b border-border text-secondary font-medium bg-surface-elevated/40">
                    <tr>
                      <th
                        onClick={() => handleSort("serviceName")}
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Service Dimension</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("resourceGroup")}
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Resource Group</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Cost Type</th>
                      <th
                        onClick={() => handleSort("amount")}
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Accrued Amount</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("percentage")}
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>% of Total</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-surface-elevated/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-primary font-sans">
                          {rec.serviceName}
                        </td>
                        <td className="py-3 px-4 text-secondary font-sans">
                          {rec.resourceGroup}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <Badge variant={rec.costType === "ActualCost" ? "default" : "outline"}>
                            {rec.costType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-primary">
                          ${rec.amount.toFixed(2)} {rec.currency}
                        </td>
                        <td className="py-3 px-4 text-right text-secondary">
                          {rec.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
