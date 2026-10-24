"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, HelpCircle } from "lucide-react";
import { Tooltip } from "../ui/tooltip";
import { StatusIndicator, StatusType } from "../ui/status-indicator";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  tooltipText?: string;
  icon?: React.ReactNode;
  status?: StatusType;
  href?: string;
  isLoading?: boolean;
  isUnavailable?: boolean;
  deltaText?: string;
  deltaPositive?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  subtext,
  tooltipText,
  icon,
  status = "info",
  href,
  isLoading = false,
  isUnavailable = false,
  deltaText,
  deltaPositive = true,
  className = "",
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className={`p-5 space-y-4 shadow-card ${className}`}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8 rounded-control" />
        </div>
        <Skeleton className="h-8 w-36" />
        <div className="pt-2 border-t border-border/50">
          <Skeleton className="h-3 w-40" />
        </div>
      </Card>
    );
  }

  const content = (
    <Card
      className={`group transition-all duration-200 hover:border-accent/40 hover:shadow-popover cursor-pointer ${className}`}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        {/* Top row: Label, tooltip, icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-supporting font-semibold uppercase tracking-wider text-secondary truncate">
              {label}
            </span>
            {tooltipText && (
              <Tooltip content={tooltipText}>
                <span className="text-secondary/60 hover:text-secondary cursor-help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
              </Tooltip>
            )}
          </div>
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-elevated border border-border text-primary group-hover:border-accent/40 group-hover:text-accent transition-colors">
              {icon}
            </div>
          )}
        </div>

        {/* Center row: KPI Value */}
        <div className="flex items-baseline justify-between gap-2">
          {isUnavailable ? (
            <span className="text-2xl font-bold text-secondary font-mono">--</span>
          ) : (
            <span className="text-kpi font-bold text-primary tracking-tight font-mono">
              {value}
            </span>
          )}

          {href && (
            <span className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </span>
          )}
        </div>

        {/* Bottom row: Subtext, status or delta */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-supporting text-secondary">
          <span className="truncate">{subtext || "Operational"}</span>
          {deltaText ? (
            <span
              className={`font-medium ${
                deltaPositive ? "text-semantic-success" : "text-semantic-critical"
              }`}
            >
              {deltaText}
            </span>
          ) : (
            <StatusIndicator status={status} />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-accent rounded-card">
        {content}
      </Link>
    );
  }

  return content;
}
