"use client";

import React from "react";
import { RefreshCw, Clock } from "lucide-react";
import { StatusIndicator, StatusType } from "./status-indicator";

export interface RefreshStatusProps {
  lastRefreshed?: string | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  status?: StatusType;
  statusLabel?: string;
  className?: string;
}

export function RefreshStatus({
  lastRefreshed,
  isRefreshing = false,
  onRefresh,
  status = "success",
  statusLabel = "Operational",
  className = "",
}: RefreshStatusProps) {
  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Syncing...";

  return (
    <div className={`flex items-center gap-3 text-supporting ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border">
        <StatusIndicator status={status} label={statusLabel} pulse={status === "success"} />
      </div>

      {/* Timestamp */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-control text-secondary bg-surface-elevated/70 border border-border/80">
        <Clock className="h-3.5 w-3.5 text-secondary/70" />
        <span>Updated:</span>
        <span className="font-mono font-medium text-primary">{formattedTime}</span>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center p-1.5 rounded-control text-secondary hover:text-primary hover:bg-surface-elevated border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 cursor-pointer"
          title="Refresh operational data"
          aria-label="Refresh data"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isRefreshing ? "animate-spin text-accent" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
