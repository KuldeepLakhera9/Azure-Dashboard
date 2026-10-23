"use client";

import React from "react";
import { Clock, TrendingDown, Info, Download } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function CostsPage() {
  const services = [
    { name: "Virtual Machines (Compute)", cost: 2940.2, pct: 61.0 },
    { name: "Azure OpenAI / Cognitive", cost: 950.4, pct: 19.7 },
    { name: "Storage Accounts", cost: 480.05, pct: 10.0 },
    { name: "Virtual Network & Bandwidth", cost: 260.0, pct: 5.4 },
    { name: "Key Vault & Security", cost: 190.0, pct: 3.9 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Management"
        subtitle="Month-to-date Azure consumption, billing cycle trends, and service-level financial breakdowns."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Costs" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {}}
          >
            Export CSV
          </Button>
        }
      />

      {/* 24-hour Billing Cache Notice */}
      <div className="flex items-start gap-3 p-4 rounded-card border border-border bg-surface text-supporting text-secondary">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-primary font-semibold">24-Hour Billing Cache Policy:</strong>
          <p className="mt-0.5">
            Azure Cost Management data queries run on a controlled 24-hour persistent cache schedule. In the event of an upstream billing API delay, the previous valid response is retained and marked stale.
          </p>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              MTD Spend Total
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">$4,820.65</span>
              <span className="text-supporting text-semantic-success flex items-center">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                7.5%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-supporting text-secondary border-t border-border/60 pt-2">
              Billing Period: Current Month (USD)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              Projected Month-End
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">$6,150.00</span>
              <Badge variant="outline">Forecast</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-supporting text-secondary border-t border-border/60 pt-2">
              Based on historical 30-day velocity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              Last Cache Query
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary font-mono text-2xl">Today</span>
              <Badge variant="success">Fresh</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-supporting text-secondary border-t border-border/60 pt-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-secondary/70" />
              Next refresh: Tomorrow at 00:00 UTC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service-Level Distribution Card */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Level Consumption Breakdown</CardTitle>
          <CardDescription>
            Structural breakdown of services generating consumption during the active billing period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div className="flex justify-between text-body">
                <span className="font-medium text-primary">{s.name}</span>
                <span className="font-mono text-primary font-semibold">
                  ${s.cost.toFixed(2)} ({s.pct}%)
                </span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border/40">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
