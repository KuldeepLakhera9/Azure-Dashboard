"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Info, Bell, ArrowRight } from "lucide-react";
import { OperationalAlert } from "../../lib/mock-data/overview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export interface AlertsPanelProps {
  alerts: OperationalAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <CardTitle>Recent Operational Alerts</CardTitle>
          </div>
          <Badge variant="outline">{alerts.length} Total</Badge>
        </div>
        <CardDescription>
          Alert notifications and system events requiring awareness or review.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const isWarning = alert.severity === "warning";
          const isCritical = alert.severity === "critical";

          return (
            <div
              key={alert.id}
              className="p-3.5 rounded-control bg-surface-elevated border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-accent/40"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control mt-0.5 ${
                    isCritical
                      ? "bg-semantic-critical-bg text-semantic-critical"
                      : isWarning
                      ? "bg-semantic-warning-bg text-semantic-warning"
                      : "bg-semantic-info-bg text-semantic-info"
                  }`}
                >
                  {isCritical || isWarning ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-semibold text-primary truncate">
                      {alert.title}
                    </span>
                    <Badge variant={isCritical ? "critical" : isWarning ? "warning" : "info"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-supporting text-secondary truncate sm:whitespace-normal">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-secondary/70 font-mono">
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>•</span>
                    <span>{alert.source}</span>
                  </div>
                </div>
              </div>

              {alert.actionHref && (
                <Link
                  href={alert.actionHref}
                  className="inline-flex items-center gap-1.5 text-supporting font-medium text-accent hover:underline shrink-0 sm:self-center"
                >
                  <span>{alert.actionLabel || "Inspect"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
