"use client";

import React from "react";
import { Bell, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function BudgetsPage() {
  const budget = {
    name: "budget-adt-monthly-operations",
    amount: 6500.0,
    currentSpend: 4820.65,
    percent: 74.2,
    timeGrain: "Monthly",
    thresholds: [
      { pct: 80, type: "Actual", exceeded: false, emails: ["ops@adt-ai.org", "finance@adt-ai.org"] },
      { pct: 90, type: "Forecasted", exceeded: true, emails: ["ops@adt-ai.org", "lead@adt-ai.org"] },
      { pct: 100, type: "Actual", exceeded: false, emails: ["security@adt-ai.org", "finance@adt-ai.org"] },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets & Alert Thresholds"
        subtitle="Manage configured financial spending limits and notification rules across monitored Azure subscriptions."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Budgets" }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {}}
          >
            New Alert Threshold
          </Button>
        }
      />

      {/* Primary Budget Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{budget.name}</CardTitle>
                <Badge variant="success">Active</Badge>
              </div>
              <CardDescription>Time Grain: {budget.timeGrain} | Current Billing Period</CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-page-title font-bold text-primary font-mono">
                ${budget.currentSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-secondary font-mono text-body"> / ${budget.amount.toLocaleString()}</span>
              <p className="text-supporting text-secondary">{budget.percent}% consumed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-surface-elevated rounded-full h-3 overflow-hidden border border-border/40">
              <div
                className="bg-accent h-3 rounded-full transition-all duration-300"
                style={{ width: `${budget.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-supporting text-secondary">
              <span>$0.00</span>
              <span>50%</span>
              <span className="font-semibold text-primary">Budget Cap: ${budget.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Alert Thresholds Grid */}
          <div className="space-y-3">
            <h4 className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              Configured Alert Notifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {budget.thresholds.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-control bg-surface-elevated p-4 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-body font-semibold text-primary">
                      {t.pct}% {t.type}
                    </span>
                    {t.exceeded ? (
                      <Badge variant="warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Triggered
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Normal
                      </Badge>
                    )}
                  </div>
                  <div className="text-supporting text-secondary truncate flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 shrink-0 text-secondary/70" />
                    <span className="truncate">{t.emails.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
