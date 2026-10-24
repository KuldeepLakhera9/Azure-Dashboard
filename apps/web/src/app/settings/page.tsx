"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  Lock,
  User,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useTheme } from "../../components/theme-provider";
import { useAuth } from "../../lib/auth/auth-context";
import { fetchFromApi } from "../../lib/services/api-client";

interface AuditLogRecord {
  id: string;
  timestamp: string;
  eventType: string;
  outcome: string;
  userId: string;
  userRole?: string;
  message: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [subId, setSubId] = useState("sub-adt-ai-foundation-prod-01");
  const [operationalTtl, setOperationalTtl] = useState("15");
  const [billingTtl, setBillingTtl] = useState("24");
  const [isSaved, setIsSaved] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await fetchFromApi<{ logs: AuditLogRecord[] }>("/api/auth/audit");
      setAuditLogs(data.logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs";
      setAuditError(msg);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAuditLogs();
    }
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Governance Settings"
        subtitle="Role-based access controls, identity verification, caching policies, and authentication audit logs."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Settings" }]}
      />

      <div className="space-y-6 max-w-4xl">
        {/* User Identity & Granted Scopes Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle>Authenticated Identity & Permissions</CardTitle>
              </div>
              <Badge variant={isAdmin ? "info" : "success"}>
                {user?.role ? `${user.role} Role` : "Reader"}
              </Badge>
            </div>
            <CardDescription>
              Verified Microsoft Entra ID claims extracted from your bearer token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-supporting">
              <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
                <span className="text-secondary text-xs block">User Principal Name (UPN)</span>
                <span className="font-semibold text-primary font-mono text-sm">{user?.email || "ops.staff@adt-ai.org"}</span>
              </div>
              <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
                <span className="text-secondary text-xs block">Tenant Identifier</span>
                <span className="font-semibold text-primary font-mono text-xs">{user?.tenantId || "tenant-adt-ai-foundation-prod"}</span>
              </div>
              <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
                <span className="text-secondary text-xs block">Delegated Scopes</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {user?.scopes && user.scopes.length > 0 ? (
                    user.scopes.map((s, idx) => (
                      <Badge key={idx} variant="outline" className="font-mono text-xs">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-critical text-xs">None</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-control bg-surface-elevated border border-border space-y-1">
                <span className="text-secondary text-xs block">Access Level</span>
                <span className="font-semibold text-primary">
                  {isAdmin ? "Full Operations & Administrative Settings" : "Read-Only Operations Center (Reader)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance & Theme Card */}
        <Card>
          <CardHeader>
            <CardTitle>Interface Appearance</CardTitle>
            <CardDescription>
              Select your preferred color theme or synchronize automatically with system preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-control border text-body font-medium transition-colors cursor-pointer ${
                  theme === "light"
                    ? "border-accent bg-accent/10 text-accent shadow-sm"
                    : "border-border bg-surface text-secondary hover:text-primary hover:bg-surface-elevated"
                }`}
              >
                <Sun className="h-5 w-5 mb-1.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-control border text-body font-medium transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "border-accent bg-accent/10 text-accent shadow-sm"
                    : "border-border bg-surface text-secondary hover:text-primary hover:bg-surface-elevated"
                }`}
              >
                <Moon className="h-5 w-5 mb-1.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-control border text-body font-medium transition-colors cursor-pointer ${
                  theme === "system"
                    ? "border-accent bg-accent/10 text-accent shadow-sm"
                    : "border-border bg-surface text-secondary hover:text-primary hover:bg-surface-elevated"
                }`}
              >
                <Laptop className="h-5 w-5 mb-1.5" />
                <span>System</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Polling & Cache Policy Card (Server-Side Enforced) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Telemetry & Cache Policies</CardTitle>
                <CardDescription>
                  Configure background caching thresholds to control Azure Resource Graph and Cost Management API quotas.
                </CardDescription>
              </div>
              {!isAdmin && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Admin Required</span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              {!isAdmin && (
                <div className="rounded-control bg-amber-500/10 border border-amber-500/30 p-3 text-supporting text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    You have <strong>Read-Only</strong> permissions. Only users assigned the <code>Dashboard.Admin</code> role can alter backend telemetry schedules or Azure subscription targets.
                  </span>
                </div>
              )}

              <Input
                label="Active Azure Subscription ID"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                disabled={!isAdmin}
                helperText="Target subscription for Resource Graph queries."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Operational Refresh Cycle"
                  value={operationalTtl}
                  onChange={(e) => setOperationalTtl(e.target.value)}
                  disabled={!isAdmin}
                  helperText="Resource Graph & VM power state polling."
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes (Standard)</option>
                  <option value="30">Every 30 minutes</option>
                </Select>

                <Select
                  label="Billing Cache TTL"
                  value={billingTtl}
                  onChange={(e) => setBillingTtl(e.target.value)}
                  disabled={!isAdmin}
                  helperText="Azure Cost Management query quota protection."
                >
                  <option value="12">12 hours</option>
                  <option value="24">24 hours (Mandatory Default)</option>
                  <option value="48">48 hours</option>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div className="flex items-center gap-1.5 text-supporting text-emerald-600 font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Server-Side RBAC Enforcement Active</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                disabled={!isAdmin}
              >
                {isSaved ? "Saved Successfully" : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Audit Trail (Admin-Only API Endpoint) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <CardTitle>Authentication & Security Audit Log</CardTitle>
              </div>
              <Badge variant="outline">Server Endpoint: /api/auth/audit</Badge>
            </div>
            <CardDescription>
              Chronological log of token validation events, permission grants, and administrative actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAdmin ? (
              <div className="p-6 text-center border border-dashed border-border rounded-control bg-surface-elevated/40 space-y-2">
                <Lock className="h-8 w-8 text-secondary/60 mx-auto" />
                <h4 className="text-body font-semibold text-primary">Restricted to Administrators</h4>
                <p className="text-supporting text-secondary max-w-sm mx-auto">
                  Access to the server-side security audit log requires the <code>Dashboard.Admin</code> role. Sign in as Lead Cloud Architect to inspect audit events.
                </p>
              </div>
            ) : auditLoading ? (
              <div className="py-8 text-center text-secondary text-supporting">
                Loading audit trail from backend...
              </div>
            ) : auditError ? (
              <div className="p-4 rounded-control bg-critical/10 border border-critical/30 text-critical text-supporting">
                {auditError}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-secondary text-supporting">
                No recent security audit events recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-body" aria-label="Security Audit Log">
                  <thead>
                    <tr className="border-b border-border text-supporting font-semibold uppercase tracking-wider text-secondary">
                      <th className="py-2 px-3">Timestamp (UTC)</th>
                      <th className="py-2 px-3">Event</th>
                      <th className="py-2 px-3">Outcome</th>
                      <th className="py-2 px-3">User</th>
                      <th className="py-2 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-supporting">
                    {auditLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-surface-elevated/40">
                        <td className="py-2.5 px-3 font-mono text-xs text-secondary whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-primary whitespace-nowrap">
                          {log.eventType}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge variant={log.outcome === "SUCCESS" ? "success" : "critical"}>
                            {log.outcome}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-secondary max-w-xs truncate">
                          {log.userId}
                        </td>
                        <td className="py-2.5 px-3 text-secondary text-xs truncate max-w-sm">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
