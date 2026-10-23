"use client";

import React, { useState } from "react";
import { Cpu, HardDrive, Wifi, Info } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Tabs } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";

export default function PerformancePage() {
  const [activeMetric, setActiveMetric] = useState("cpu");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrastructure Performance"
        subtitle="Host-level telemetry, CPU utilization, network throughput, and disk IOPS from Azure Monitor."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Performance" }]}
      />

      {/* Host vs Guest Notice */}
      <div className="flex items-start gap-3 p-4 rounded-card border border-border bg-surface text-supporting text-secondary">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-primary font-semibold">Telemetry Boundary Architecture:</strong>
          <p className="mt-0.5">
            Metrics displayed reflect hypervisor-level metrics collected directly from Azure Monitor without requiring in-guest agents. Deep in-guest OS telemetry (guest RAM, process tables) requires the Azure Monitor Agent (AMA) extension.
          </p>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <Tabs
        items={[
          { id: "cpu", label: "CPU Percentage", icon: <Cpu className="h-4 w-4" /> },
          { id: "disk", label: "Disk IOPS & Throughput", icon: <HardDrive className="h-4 w-4" /> },
          { id: "network", label: "Network Bandwidth", icon: <Wifi className="h-4 w-4" /> },
        ]}
        activeId={activeMetric}
        onChange={setActiveMetric}
      />

      {/* Metric Visualizer Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {activeMetric === "cpu"
                  ? "Primary Host CPU Utilization (% Average)"
                  : activeMetric === "disk"
                  ? "Disk Read/Write Bytes per Second"
                  : "Network In / Out Aggregate Traffic"}
              </CardTitle>
              <CardDescription>
                Target Resource: vm-adt-gpu-trainer-01 (Standard_NC6s_v3) | 5-minute sampling
              </CardDescription>
            </div>
            <Badge variant="outline">PT1H Timeseries</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Structural Chart Skeleton */}
          <div className="h-64 w-full rounded-control border border-border/80 bg-surface-elevated/40 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center text-supporting text-secondary">
              <span>100%</span>
              <span className="font-mono text-xs">vm-adt-gpu-trainer-01</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4" />
              <Skeleton className="h-2 w-5/6" />
            </div>
            <div className="flex justify-between text-supporting text-secondary">
              <span>13:30</span>
              <span>13:45</span>
              <span>14:00</span>
              <span>14:15</span>
              <span>14:30</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
