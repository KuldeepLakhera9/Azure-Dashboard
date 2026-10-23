"use client";

import React, { useEffect, useState } from "react";
import { Header } from "../components/header";
import { api } from "../lib/api";
import { SystemHealthResponse } from "@adt-ai/shared";
import {
  CheckCircle2,
  AlertTriangle,
  Server,
  Shield,
  Layers,
  ArrowRight,
  Code2,
  Cpu,
  RefreshCw,
} from "lucide-react";

export default function FoundationPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnectivity = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to reach backend health endpoint";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14]">
      {/* Shared Application Header */}
      <Header
        lastRefreshed={health?.timestamp || null}
        isRefreshing={isRefreshing}
        onRefresh={() => checkConnectivity(true)}
        status={health?.status || (error ? "error" : "healthy")}
        subscriptionName={health?.subscriptionName}
        subscriptionId={health?.subscriptionId}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Foundation Status Banner */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azure-50 dark:bg-azure-950/60 text-azure-600 dark:text-azure-400 border border-azure-200 dark:border-azure-800 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ADT-AI Azure Operations Center
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Phase 1 Foundation Active
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Production-grade cloud operations foundation for ADT-AI Training Foundation. Strict no-Docker architecture.
                </p>
              </div>
            </div>

            <button
              onClick={() => checkConnectivity(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-azure-600 hover:bg-azure-700 focus:outline-none focus:ring-2 focus:ring-azure-500/20 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Test Connectivity</span>
            </button>
          </div>
        </div>

        {/* Connectivity Status & Health Report */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System & Subsystem Health Telemetry
          </h2>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 animate-pulse">
              Verifying backend API connectivity and subsystem readiness...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-5 text-sm text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Backend Connectivity Issue:</strong>
                <p className="mt-0.5">{error}</p>
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                  Verify the Express backend is running via <code className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded">npm run dev</code> or <code className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded">npm run dev:api</code>.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {health?.subsystems.map((subsystem) => (
                <div
                  key={subsystem.name}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-card flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-azure-500" />
                      {subsystem.name}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subsystem.message || "Subsystem operational"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="h-3 w-3" />
                    Healthy
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase 1 Verification Grid */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Shield className="h-4 w-4 text-azure-500" />
            Phase 1 Foundation Verification Criteria
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                Strict No-Docker
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Native Node.js LTS execution, zero container scripts or manifests.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-azure-500" />
                Monorepo Architecture
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                TypeScript strict mode across <code className="font-mono">apps/web</code>, <code className="font-mono">apps/api</code>, and <code className="font-mono">packages/shared</code>.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                Design System & Auth Ready
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Anti-flash ThemeProvider (Light / Dark / System), semantic tokens, and Entra ID staging.
              </p>
            </div>
          </div>
        </div>

        {/* Phase Transition Callout */}
        <div className="rounded-xl border border-azure-200 dark:border-azure-900/60 bg-azure-50/50 dark:bg-azure-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-azure-900 dark:text-azure-200 text-sm">
              Phase 1 Complete — Ready for Phase 2
            </span>
            <p className="text-azure-700 dark:text-azure-400">
              Per master instructions, complete dashboard views and live data integrations will be unlocked in designated subsequent phases upon user approval.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-azure-700 dark:text-azure-300">
            <span>Awaiting User Phase 2 Approval</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>ADT-AI Training Foundation &copy; 2026. Internal Azure Operations Center.</span>
          <div className="flex items-center gap-4">
            <span>Phase 1 Foundation</span>
            <span>•</span>
            <span>No-Docker Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
