"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Cpu,
  Server,
  Layers,
} from "lucide-react";
import { AzureResourceItem } from "../../lib/mock-data/inventory";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";

export interface ResourceDrawerProps {
  resource: AzureResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResourceDrawer({ resource, isOpen, onClose }: ResourceDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !resource) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(resource.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVm = resource.type.includes("virtualMachines");
  const portalUrl = `https://portal.azure.com/#@adt-ai.org/resource${encodeURI(resource.id)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        className="relative w-full max-w-xl bg-surface border-l border-border h-full flex flex-col justify-between shadow-popover z-10 animate-in slide-in-from-right duration-200 overflow-y-auto"
        role="dialog"
        aria-label="Resource Details"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-border">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent/10 text-accent">
                {isVm ? <Server className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-section-title font-bold text-primary truncate">
                    {resource.name}
                  </h2>
                  <Badge variant="outline">{resource.locationDisplay}</Badge>
                </div>
                <p className="text-supporting text-secondary truncate mt-0.5">
                  {resource.type}
                </p>
              </div>
            </div>

            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close drawer"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </IconButton>
          </div>

          {/* Operational States: Provisioning vs Power State */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-card bg-surface-elevated border border-border">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                ARM Provisioning State
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={
                    resource.provisioningState === "Succeeded"
                      ? "success"
                      : resource.provisioningState === "Failed"
                      ? "critical"
                      : "warning"
                  }
                >
                  {resource.provisioningState}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                VM Power State
              </span>
              <div className="mt-1 flex items-center gap-2">
                {isVm && resource.powerState ? (
                  <Badge
                    variant={
                      resource.powerState === "running"
                        ? "success"
                        : resource.powerState === "deallocated"
                        ? "warning"
                        : "critical"
                    }
                  >
                    {resource.powerState.toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-supporting text-secondary">Not Applicable (Non-Compute)</span>
                )}
              </div>
            </div>
          </div>

          {/* Resource Identification */}
          <div className="space-y-3">
            <h3 className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              Resource Identification
            </h3>
            <div className="p-3 rounded-control bg-surface-elevated border border-border text-supporting space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">Azure Resource ID:</span>
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 text-accent hover:underline cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-semantic-success" />
                      <span className="text-semantic-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[11px] text-primary break-all bg-surface p-2 rounded border border-border/60">
                {resource.id}
              </p>
            </div>
          </div>

          {/* Location & Resource Group */}
          <div className="grid grid-cols-2 gap-4 text-supporting">
            <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
              <span className="text-secondary text-[11px]">Resource Group</span>
              <p className="font-medium text-primary">{resource.resourceGroup}</p>
            </div>
            <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
              <span className="text-secondary text-[11px]">Region</span>
              <p className="font-medium text-primary">{resource.locationDisplay} ({resource.location})</p>
            </div>
          </div>

          {/* Virtual Machine Hardware Details (If applicable) */}
          {isVm && resource.vmDetails && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <h3 className="text-supporting font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-accent" />
                Virtual Machine Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3 text-supporting">
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">Hardware SKU</span>
                  <p className="font-mono font-semibold text-primary">{resource.vmDetails.vmSize}</p>
                </div>
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">vCPU & Memory</span>
                  <p className="font-mono font-semibold text-primary">
                    {resource.vmDetails.vCpuCount} vCPU • {resource.vmDetails.memoryGb} GB RAM
                  </p>
                </div>
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">Operating System</span>
                  <p className="font-semibold text-primary">{resource.vmDetails.osType}</p>
                </div>
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">OS Disk</span>
                  <p className="font-mono font-semibold text-primary">
                    {resource.vmDetails.osDiskSizeGb} GB ({resource.vmDetails.osDiskType})
                  </p>
                </div>
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">Private IP</span>
                  <p className="font-mono font-semibold text-primary">{resource.vmDetails.privateIpAddress}</p>
                </div>
                <div className="p-2.5 rounded-control bg-surface-elevated border border-border space-y-0.5">
                  <span className="text-[11px] text-secondary">Public IP</span>
                  <p className="font-mono font-semibold text-primary">
                    {resource.vmDetails.publicIpAddress || "None (Private)"}
                  </p>
                </div>
              </div>

              {/* Dedicated GPU line if present */}
              {resource.vmDetails.gpuModel && (
                <div className="p-2.5 rounded-control bg-accent/5 border border-accent/20 text-supporting">
                  <span className="text-[11px] text-accent font-semibold">Attached GPU Accelerator:</span>
                  <p className="font-mono font-medium text-primary mt-0.5">{resource.vmDetails.gpuModel}</p>
                </div>
              )}

              {/* Guest Telemetry Status Indicator */}
              <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-secondary text-xs">Azure Monitor Agent (AMA):</span>
                  <Badge variant={resource.vmDetails.amaAgentInstalled ? "success" : "warning"}>
                    {resource.vmDetails.amaAgentInstalled ? "Active" : "Not Installed"}
                  </Badge>
                </div>
                <p className="text-[11px] text-secondary">
                  {resource.vmDetails.amaAgentInstalled
                    ? "Guest OS telemetry extension installed. Memory utilization metrics available."
                    : "Hypervisor metrics only. In-guest RAM telemetry requires AMA installation."}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <h3 className="text-supporting font-semibold uppercase tracking-wider text-secondary">
              Resource Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(resource.tags).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] border border-border text-secondary font-mono"
                >
                  <strong className="text-primary font-sans">{k}:</strong> {v}
                </span>
              ))}
              {Object.keys(resource.tags).length === 0 && (
                <span className="text-supporting text-secondary italic">No tags configured</span>
              )}
            </div>
          </div>

          {/* Last Observed Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-secondary border-t border-border/60 pt-3">
            <span>Last observed:</span>
            <span className="font-mono font-medium text-primary">
              {new Date(resource.lastObserved).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-elevated border-t border-border flex items-center justify-between gap-3">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-supporting text-secondary hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in Azure Portal</span>
          </a>

          {isVm && (
            <Link href={`/performance?resource=${encodeURIComponent(resource.id)}`} onClick={onClose}>
              <Button variant="primary" size="sm" leftIcon={<Activity className="h-4 w-4" />}>
                View Performance
              </Button>
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
