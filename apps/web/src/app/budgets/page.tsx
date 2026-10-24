"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Shield,
  Layers,
  Clock,
  Mail,
  ExternalLink,
  Sliders,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/ui/empty-state";
import { Tooltip } from "../../components/ui/tooltip";
import { budgetService } from "../../lib/services/budget-service";
import { AzureBudgetItem, BudgetAlertEvent, BudgetThresholdItem } from "../../lib/mock-data/costs";

export default function BudgetsPage() {
  const [hasBudgetConfigured, setHasBudgetConfigured] = useState<boolean>(true);
  const [budget, setBudget] = useState<AzureBudgetItem | null>(null);
  const [alertHistory, setAlertHistory] = useState<BudgetAlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastEvaluated, setLastEvaluated] = useState<string>("2026-10-24T00:00:00Z");

  const loadBudgetData = useCallback(async () => {
    setIsLoading(true);
    const controller = new AbortController();

    try {
      const [fetchedBudget, fetchedHistory] = await Promise.all([
        budgetService.getPrimaryBudget(hasBudgetConfigured, controller.signal),
        budgetService.getAlertHistory(controller.signal),
      ]);

      setBudget(fetchedBudget);
      setAlertHistory(hasBudgetConfigured ? fetchedHistory : []);
      setLastEvaluated(new Date().toISOString());
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to load Azure budget data:", err);
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [hasBudgetConfigured]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Budgets & Alert Thresholds"
        subtitle="Monitored spending limits, multi-tier notification rules, and alert delivery history for Azure subscriptions."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Cost Management", href: "/costs" }, { label: "Budgets" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick simulation mode toggle */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sliders className="h-4 w-4" />}
              onClick={() => setHasBudgetConfigured(!hasBudgetConfigured)}
              aria-label="Toggle budget state simulation"
            >
              {hasBudgetConfigured ? "Simulate Unconfigured Budget" : "Restore Sample Budget"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={() => loadBudgetData()}
              disabled={isLoading}
              aria-label="Refresh budget status"
            >
              Refresh
            </Button>
            <a
              href="https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/budgets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                Manage in Azure Portal
              </Button>
            </a>
          </div>
        }
      />

      {/* Mock Data Notice Banner */}
      <div className="rounded-card border border-accent/30 bg-accent/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-body">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-accent/20 p-2 text-accent shrink-0 mt-0.5">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Simulated Enterprise Budget Data</span>
              <Badge variant="info">Phase 5 Mock Provider</Badge>
            </div>
            <p className="text-supporting text-secondary mt-0.5">
              Live Azure Cost Management and Consumption APIs are not yet connected. All spending limits, threshold rules, and alerts represent high-fidelity mock contracts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-supporting text-secondary shrink-0 font-mono">
          <Clock className="h-4 w-4" />
          <span>Last Evaluated: {new Date(lastEvaluated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Critical Architecture & Freshness Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Governance Disclaimer */}
        <div className="rounded-card border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-body font-semibold text-primary">Budget Alerting Mechanism vs Hard Cap</h4>
            <p className="text-supporting text-secondary leading-relaxed">
              In Microsoft Azure, a budget is an <strong>alerting and notification mechanism</strong>, not a guaranteed spending ceiling. Reaching 100% of a budget does <em>not</em> automatically power off virtual machines or halt cloud services unless custom runbooks or Azure Action Groups are wired to execute shutdown operations.
            </p>
          </div>
        </div>

        {/* Freshness Disclaimer */}
        <div className="rounded-card border border-border bg-surface-elevated/40 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-body font-semibold text-primary">Billing Data Freshness & Pipeline Latency</h4>
            <p className="text-supporting text-secondary leading-relaxed">
              Azure cost processing introduces a <strong>24 to 48-hour data lag</strong>. Evaluated consumption totals reflect aggregated usage up to the latest billing query timestamp and may adjust as finalized meter records arrive from regional datacenters.
            </p>
          </div>
        </div>
      </div>

      {/* Truthful Empty State when Subscription Has No Configured Budget */}
      {!hasBudgetConfigured || !budget ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<DollarSign className="h-10 w-10 text-secondary/60" />}
              title="No Configured Azure Budget Detected"
              description="Subscription 'sub-adt-ai-foundation-prod-01' has no active budget configured in Azure Cost Management. Azure does not generate default budgets automatically. Without a configured budget, no threshold alerts or forecast warnings can be triggered."
              actionLabel="Restore Sample Budget Data"
              onAction={() => setHasBudgetConfigured(true)}
            />
            <div className="mt-8 max-w-xl mx-auto rounded-control bg-surface-elevated p-4 border border-border text-supporting text-secondary space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Info className="h-4 w-4 text-accent" />
                <span>How to configure a budget in Azure:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Navigate to Cost Management + Billing in Azure Portal.</li>
                <li>Select your subscription scope (<code>sub-adt-ai-foundation-prod-01</code>).</li>
                <li>Under <strong>Cost Management</strong>, choose <strong>Budgets</strong> &gt; <strong>+ Add</strong>.</li>
                <li>Set reset period (Monthly), budget limit, and alert email recipients.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Configured Budget */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-medium text-secondary">Configured Budget</span>
                  <Tooltip content="Configured baseline spending ceiling established in Azure Cost Management for this monthly period.">
                    <Info className="h-4 w-4 text-secondary/60 cursor-help" />
                  </Tooltip>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-primary font-mono">
                    ${budget.budgetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-supporting text-secondary font-mono">{budget.currency}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-supporting text-secondary">
                  <Badge variant="info">{budget.timeGrain}</Badge>
                  <span>Resets 1st of month</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Consumption (Actual) */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-medium text-secondary">Actual Spend (MTD)</span>
                  <Tooltip content="Total raw invoiced usage records processed by Azure up to the current evaluation window.">
                    <Info className="h-4 w-4 text-secondary/60 cursor-help" />
                  </Tooltip>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-accent font-mono">
                    ${budget.currentConsumption.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-supporting text-secondary font-mono">{budget.currency}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-supporting">
                  <span className="text-secondary">{budget.consumedPercentage.toFixed(1)}% consumed</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Within Limit</span>
                </div>
              </CardContent>
            </Card>

            {/* Remaining Budget */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-medium text-secondary">Remaining Headroom</span>
                  <Tooltip content="Calculated difference between Configured Budget Cap and Actual MTD Spend.">
                    <Info className="h-4 w-4 text-secondary/60 cursor-help" />
                  </Tooltip>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${budget.remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-supporting text-secondary font-mono">{budget.currency}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-supporting text-secondary">
                  <span>{(100 - budget.consumedPercentage).toFixed(1)}% available headroom</span>
                </div>
              </CardContent>
            </Card>

            {/* Forecasted Month-End Spend */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-supporting font-medium text-secondary">Forecasted Spend</span>
                  <Tooltip content="Machine-learning projected month-end cost generated by Azure Cost Management based on recent run-rate.">
                    <Info className="h-4 w-4 text-secondary/60 cursor-help" />
                  </Tooltip>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-kpi font-bold text-amber-600 dark:text-amber-400 font-mono">
                    ${budget.forecastedConsumption.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-supporting text-secondary font-mono">{budget.currency}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-supporting">
                  <span className="text-secondary">{budget.forecastPercentage.toFixed(1)}% of budget</span>
                  <Badge variant="warning">Alert Triggered</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Primary Budget Consumption & Threshold Visualization */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{budget.name}</CardTitle>
                    <Badge variant="success">Active Budget</Badge>
                  </div>
                  <CardDescription>
                    Subscription: <code className="font-mono text-secondary">{budget.subscriptionId}</code> | Period: Oct 1 – Oct 31, 2026 ({budget.timeGrain})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <div className="text-page-title font-bold text-primary font-mono">
                      ${budget.currentConsumption.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                      <span className="text-secondary text-body font-normal">/ ${budget.budgetAmount.toLocaleString()}</span>
                    </div>
                    <p className="text-supporting text-secondary">
                      {budget.consumedPercentage.toFixed(1)}% actual | {budget.forecastPercentage.toFixed(1)}% forecast
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual Multi-Segment Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-supporting font-medium text-secondary">
                  <span>Consumption Progress & Threshold Boundaries</span>
                  <span>{budget.currency} Currency</span>
                </div>

                <div className="relative w-full bg-surface-elevated rounded-full h-4 overflow-hidden border border-border/60">
                  {/* Forecast bar (lighter amber layer behind actual) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-amber-500/25 transition-all duration-500"
                    style={{ width: `${Math.min(budget.forecastPercentage, 100)}%` }}
                    title={`Forecasted: $${budget.forecastedConsumption.toFixed(2)} (${budget.forecastPercentage.toFixed(1)}%)`}
                  />
                  {/* Actual consumption bar (solid blue accent) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(budget.consumedPercentage, 100)}%` }}
                    title={`Actual Spend: $${budget.currentConsumption.toFixed(2)} (${budget.consumedPercentage.toFixed(1)}%)`}
                  />

                  {/* Threshold lines overlaid */}
                  {budget.thresholds.map((t, idx) => (
                    <div
                      key={idx}
                      className={`absolute top-0 bottom-0 w-0.5 z-10 ${
                        t.isTriggered ? "bg-red-500 ring-1 ring-red-400" : "bg-border-strong/90"
                      }`}
                      style={{ left: `${t.thresholdPercentage}%` }}
                    />
                  ))}
                </div>

                {/* Legend & Threshold Markers */}
                <div className="relative pt-2 text-supporting text-secondary">
                  <div className="flex justify-between items-center text-supporting">
                    <span>$0.00 (0%)</span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-accent inline-block" />
                      <span>Actual: ${budget.currentConsumption.toFixed(2)} ({budget.consumedPercentage.toFixed(1)}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/40 border border-amber-500 inline-block" />
                      <span>Forecast: ${budget.forecastedConsumption.toFixed(2)} ({budget.forecastPercentage.toFixed(1)}%)</span>
                    </span>
                    <span className="font-semibold text-primary">Cap: ${budget.budgetAmount.toLocaleString()} (100%)</span>
                  </div>
                </div>
              </div>

              {/* Threshold Rule Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                    Configured Alert Rules & Escalation Actions ({budget.thresholds.length})
                  </h4>
                  <span className="text-supporting text-secondary">Trigger condition evaluation runs every 24h</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {budget.thresholds.map((t: BudgetThresholdItem, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-control p-4 border transition-all ${
                        t.isTriggered
                          ? "bg-amber-500/5 border-amber-500/40 shadow-sm"
                          : "bg-surface-elevated/50 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-section-title font-bold font-mono text-primary">
                            {t.thresholdPercentage}%
                          </span>
                          <Badge variant={t.thresholdType === "Actual" ? "info" : "outline"}>
                            {t.thresholdType}
                          </Badge>
                        </div>
                        {t.isTriggered ? (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Rule Triggered
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Normal
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-supporting">
                        <div className="flex justify-between">
                          <span className="text-secondary">Threshold Spend Limit:</span>
                          <span className="font-mono font-semibold text-primary">
                            ${t.thresholdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Action Group:</span>
                          <span className="font-mono text-primary text-xs bg-surface px-1.5 py-0.5 rounded border border-border">
                            {t.actionGroup}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-secondary block mb-1">Notification Recipients:</span>
                          <div className="space-y-1">
                            {t.contactEmails.map((email: string, eIdx: number) => (
                              <div key={eIdx} className="flex items-center gap-1.5 text-secondary truncate">
                                <Mail className="h-3 w-3 text-secondary/60 shrink-0" />
                                <span className="font-mono text-xs truncate">{email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-Column Lower Section: Notification Channels Status & Alert Audit Trail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1-col: Notification Channels Configuration */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" />
                  <CardTitle>Notification Channels</CardTitle>
                </div>
                <CardDescription>Target endpoints for threshold breach deliveries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Delivery */}
                <div className="flex items-start justify-between p-3 rounded-control bg-surface-elevated/50 border border-border">
                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body font-medium text-primary">Direct Email Alerting</p>
                      <p className="text-supporting text-secondary">
                        3 recipients registered across FinOps and Cloud Engineering teams.
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                {/* Azure Action Groups */}
                <div className="flex items-start justify-between p-3 rounded-control bg-surface-elevated/50 border border-border">
                  <div className="flex items-start gap-2.5">
                    <Layers className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body font-medium text-primary">Azure Action Groups</p>
                      <p className="text-supporting text-secondary">
                        <code>ag-adt-ops-alerts</code> and <code>ag-adt-lead-escalation</code> wired.
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                {/* Webhooks */}
                <div className="flex items-start justify-between p-3 rounded-control bg-surface-elevated/50 border border-border">
                  <div className="flex items-start gap-2.5">
                    <ExternalLink className="h-4 w-4 text-secondary/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body font-medium text-primary">ITSM / Webhooks</p>
                      <p className="text-supporting text-secondary">
                        Slack or ServiceNow webhooks are currently unconfigured.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Right 2-col: Alert History Log */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      <CardTitle>Budget Alert Event History</CardTitle>
                    </div>
                    <CardDescription>
                      Chronological log of budget threshold breaches and notification dispatches
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{alertHistory.length} Recorded Events</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {alertHistory.length === 0 ? (
                  <EmptyState
                    title="No Budget Alert History"
                    description="No threshold events have been recorded for the active subscription in the selected period."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-body" aria-label="Budget Alert History Table">
                      <thead>
                        <tr className="border-b border-border text-supporting font-semibold uppercase tracking-wider text-secondary">
                          <th className="py-2.5 px-3">Timestamp (UTC)</th>
                          <th className="py-2.5 px-3">Rule Breached</th>
                          <th className="py-2.5 px-3 text-right">Spend at Trigger</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Event Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {alertHistory.map((evt) => (
                          <tr key={evt.id} className="hover:bg-surface-elevated/40 transition-colors">
                            <td className="py-3 px-3 text-secondary font-mono text-xs whitespace-nowrap">
                              {new Date(evt.timestamp).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-semibold text-primary font-mono mr-1.5">
                                {evt.thresholdPercentage}%
                              </span>
                              <Badge variant={evt.thresholdType === "Actual" ? "info" : "warning"}>
                                {evt.thresholdType}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium text-primary whitespace-nowrap">
                              ${evt.spendAtTrigger.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <Badge variant={evt.status === "Resolved" ? "success" : "warning"}>
                                {evt.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-supporting text-secondary max-w-xs truncate" title={evt.message}>
                              {evt.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
