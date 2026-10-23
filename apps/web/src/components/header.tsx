"use client";

import React from "react";
import { useTheme } from "./theme-provider";
import {
  Sun,
  Moon,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Clock,
  Layers,
} from "lucide-react";

interface HeaderProps {
  lastRefreshed: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  status: "healthy" | "degraded" | "error";
  subscriptionName?: string | null;
  subscriptionId?: string | null;
}

export function Header({
  lastRefreshed,
  isRefreshing,
  onRefresh,
  status,
  subscriptionName = "ADT-AI Production Core",
  subscriptionId = "sub-adt-ai-foundation-prod-01",
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Syncing...";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Subscription */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-azure-500 text-white shadow-sm font-semibold tracking-wider">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white tracking-tight text-base">
                    ADT-AI Operations Center
                  </span>
                  <span className="inline-flex items-center rounded-full bg-azure-50 dark:bg-azure-950/60 px-2 py-0.5 text-xs font-medium text-azure-700 dark:text-azure-300 ring-1 ring-inset ring-azure-700/10 dark:ring-azure-500/20">
                    Azure Monitoring
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {subscriptionName || "Azure Subscription"}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{subscriptionId || "loading..."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status, Freshness, Actions */}
          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "healthy"
                    ? "bg-emerald-500 animate-pulse"
                    : status === "degraded"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-slate-700 dark:text-slate-300 capitalize">
                {status}
              </span>
            </div>

            {/* Last Refresh Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Refreshed:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {formattedTime}
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-azure-500/20 disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ${
                  isRefreshing ? "animate-spin text-azure-500" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Theme Selector Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Light Theme"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === "dark"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Dark Theme"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="System Theme"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Security Read-Only Indicator */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Read-Only Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
