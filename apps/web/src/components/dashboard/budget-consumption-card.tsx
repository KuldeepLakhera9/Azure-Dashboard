"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, Shield, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export interface BudgetConsumptionCardProps {
  budgetAmount: number;
  currentSpend: number;
  consumedPct: number;
  forecastSpend?: number;
  currency?: string;
}

export function BudgetConsumptionCard({
  budgetAmount,
  currentSpend,
  consumedPct,
  forecastSpend = 6150.0,
  currency = "USD",
}: BudgetConsumptionCardProps) {
  const isOverWarning = consumedPct >= 80;
  const isOverCritical = consumedPct >= 100;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Budget Consumption</CardTitle>
              <Badge variant={isOverCritical ? "critical" : isOverWarning ? "warning" : "success"}>
                {isOverCritical ? "Exceeded" : isOverWarning ? "Attention" : "Healthy"}
              </Badge>
            </div>
            <CardDescription>
              Monthly spend tracked against configured Azure budget caps.
            </CardDescription>
          </div>
          <Link
            href="/budgets"
            className="flex items-center gap-1 text-supporting font-medium text-accent hover:underline"
          >
            <span>Manage</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Main spend figures */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-3xl font-bold font-mono text-primary">
              ${currentSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-secondary font-mono text-body">
              {" "}
              / ${budgetAmount.toLocaleString()} {currency}
            </span>
          </div>
          <span className="text-body font-bold text-accent font-mono">
            {consumedPct.toFixed(1)}% Consumed
          </span>
        </div>

        {/* Multi-tier progress bar with threshold indicators */}
        <div className="space-y-1.5">
          <div className="relative w-full bg-surface-elevated rounded-full h-3.5 overflow-hidden border border-border/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverCritical
                  ? "bg-semantic-critical"
                  : isOverWarning
                  ? "bg-semantic-warning"
                  : "bg-accent"
              }`}
              style={{ width: `${Math.min(100, consumedPct)}%` }}
            />
          </div>
          {/* Threshold marker indicators */}
          <div className="flex justify-between text-[11px] text-secondary font-mono pt-1">
            <span>$0</span>
            <span className="text-secondary/80">80% Alert ($5,200)</span>
            <span className="text-semantic-warning">90% Forecast ($5,850)</span>
            <span className="font-semibold text-primary">Cap: $6,500</span>
          </div>
        </div>

        {/* Forecast and alert summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-supporting">
          <div className="p-2.5 rounded-control bg-surface-elevated border border-border/60 space-y-1">
            <span className="text-secondary text-[11px] flex items-center gap-1">
              <Shield className="h-3 w-3 text-accent" />
              Projected End of Month
            </span>
            <p className="font-mono font-bold text-primary text-body">
              ${forecastSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-semantic-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Exceeds 90% forecast rule
            </span>
          </div>

          <div className="p-2.5 rounded-control bg-surface-elevated border border-border/60 space-y-1">
            <span className="text-secondary text-[11px] flex items-center gap-1">
              <Bell className="h-3 w-3 text-accent" />
              Automated Notification Rules
            </span>
            <p className="font-medium text-primary text-supporting">
              2 Active Alert Rules
            </p>
            <span className="text-[10px] text-secondary">
              Email alerts to ops@adt-ai.org
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
