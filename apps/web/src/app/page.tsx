"use client";

import React, { useState } from "react";
import {
  Server,
  Layers,
  DollarSign,
  Shield,
  Activity,
  HardDrive,
  Download,
  RefreshCw,
  Plus,
} from "lucide-react";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StatusIndicator } from "../components/ui/status-indicator";
import { Modal } from "../components/ui/modal";
import { Input } from "../components/ui/input";

export default function OverviewPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Operations Overview"
        subtitle="Operational summary of monitored resources, compute power states, and subscription status."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Overview" }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => alert("Report generation scheduled for subsequent phase.")}
            >
              Export Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleRefresh}
            >
              Sync Telemetry
            </Button>
          </>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                Total Resources
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent/10 text-accent">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">6</span>
              <span className="text-supporting text-secondary">across 5 groups</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <StatusIndicator status="success" label="100% Provisioned" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                Compute Power
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-semantic-success-bg text-semantic-success">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">2 / 3</span>
              <span className="text-supporting text-semantic-success font-medium">Running</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-supporting text-secondary">
              <span>1 Deallocated</span>
              <span>0 Stopped</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                Month-to-Date Spend
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent/10 text-accent">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">$4,820</span>
              <span className="text-supporting text-semantic-success font-medium">-7.5% vs last mo</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-supporting text-secondary">
              <span>Forecast: $6,150</span>
              <Badge variant="outline">24h Cache</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                Budget Consumed
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-semantic-warning-bg text-semantic-warning">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-kpi font-bold text-primary">74.2%</span>
              <span className="text-supporting text-secondary">of $6,500</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-supporting">
              <span className="text-secondary">Alert threshold: 80%</span>
              <Badge variant="success">Normal</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Structural Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Resource Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Resource Deployments</CardTitle>
                <CardDescription>
                  Structural sample of Azure resources tracked in the operational inventory.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDemoModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Inspect Design System
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-supporting">
                <thead className="border-b border-border text-secondary font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Resource Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Resource Group</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-primary font-sans flex items-center gap-2">
                      <Server className="h-4 w-4 text-accent" />
                      vm-adt-gpu-trainer-01
                    </td>
                    <td className="py-3 px-3 text-secondary font-sans">Compute/virtualMachines</td>
                    <td className="py-3 px-3 text-secondary font-sans">rg-adt-training-compute</td>
                    <td className="py-3 px-3 font-sans">
                      <Badge variant="success">Running</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-primary font-sans flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-accent" />
                      saadtdatasetsprod
                    </td>
                    <td className="py-3 px-3 text-secondary font-sans">Storage/storageAccounts</td>
                    <td className="py-3 px-3 text-secondary font-sans">rg-adt-data-storage</td>
                    <td className="py-3 px-3 font-sans">
                      <Badge variant="success">Available</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-primary font-sans flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      kv-adt-prod-secrets
                    </td>
                    <td className="py-3 px-3 text-secondary font-sans">KeyVault/vaults</td>
                    <td className="py-3 px-3 text-secondary font-sans">rg-adt-security</td>
                    <td className="py-3 px-3 font-sans">
                      <Badge variant="info">Secure</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System & Architecture Advisory */}
        <Card>
          <CardHeader>
            <CardTitle>Architecture Status</CardTitle>
            <CardDescription>
              Phase 2 Design System verification and structural layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-control bg-surface-elevated border border-border text-supporting space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Activity className="h-4 w-4 text-accent" />
                <span>Phase 2 Design Verification</span>
              </div>
              <p className="text-secondary">
                All semantic design tokens, responsive sidebar modes, dark/light theme switching, and shared components are active.
              </p>
            </div>

            <div className="space-y-2 text-supporting">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-secondary">Strict No-Docker</span>
                <span className="font-semibold text-semantic-success">Enforced</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-secondary">Theme Modes</span>
                <span className="font-semibold text-primary">Light, Dark, System</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-secondary">Connected Azure</span>
                <span className="font-semibold text-secondary">Deferred to Phase 3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Design System Showcase Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Design System Component Showcase"
        description="Interactive validation of Phase 2 shared components."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Acknowledge
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Sample Text Input" placeholder="Search resources or enter filter..." />
          <div className="space-y-1.5">
            <span className="block text-supporting font-medium text-primary">Badge Variants</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="critical">Critical</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
