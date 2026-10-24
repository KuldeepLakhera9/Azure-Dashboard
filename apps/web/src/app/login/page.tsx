"use client";

import React, { useState } from "react";
import { Shield, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<"staff" | "admin" | "unauthorized">("staff");

  const handleSignIn = async () => {
    await login(selectedPersona);
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-elevation">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-page-title font-bold tracking-tight text-primary">
          ADT-AI Azure Operations Center
        </h2>
        <p className="mt-2 text-center text-supporting text-secondary">
          Protected single-pane-of-glass infrastructure monitoring. Sign in with your corporate Microsoft Entra ID account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <Card className="shadow-popover border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                <CardTitle>Enterprise Identity Authentication</CardTitle>
              </div>
              <Badge variant="info">Entra ID (Azure AD)</Badge>
            </div>
            <CardDescription>
              Access is restricted to authorized ADT-AI Training Foundation personnel with verified <code>Dashboard.Read</code> delegated permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Microsoft Entra ID Sign-In Button */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-3 font-semibold py-3 text-body"
                onClick={handleSignIn}
                disabled={isLoading}
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span>Sign in with Microsoft Entra ID</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <p className="text-[11px] text-center text-secondary">
                Secured via MSAL and cryptographically validated Bearer tokens.
              </p>
            </div>

            {/* Test Persona Selector for Reviewers / Offline Development */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-supporting font-semibold uppercase tracking-wider text-secondary">
                  Security Persona Simulation Selector
                </span>
                <span className="text-[11px] text-secondary">Phase 7 Entra Test Matrix</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Persona 1: Authorized Staff Reader */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                    selectedPersona === "staff"
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-border bg-surface-elevated/40 hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="persona"
                    value="staff"
                    checked={selectedPersona === "staff"}
                    onChange={() => setSelectedPersona("staff")}
                    className="mt-1"
                  />
                  <div className="space-y-0.5 text-supporting">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">Staff Operations Engineer</span>
                      <Badge variant="success">Authorized</Badge>
                      <Badge variant="outline">Reader</Badge>
                    </div>
                    <p className="text-secondary">
                      <code>ops.staff@adt-ai.org</code> — Possesses <code>Dashboard.Read</code> delegated scope. Read-only access to all dashboards.
                    </p>
                  </div>
                </label>

                {/* Persona 2: Authorized Admin */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                    selectedPersona === "admin"
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-border bg-surface-elevated/40 hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="persona"
                    value="admin"
                    checked={selectedPersona === "admin"}
                    onChange={() => setSelectedPersona("admin")}
                    className="mt-1"
                  />
                  <div className="space-y-0.5 text-supporting">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">Lead Cloud Architect</span>
                      <Badge variant="success">Authorized</Badge>
                      <Badge variant="info">Admin</Badge>
                    </div>
                    <p className="text-secondary">
                      <code>lead.architect@adt-ai.org</code> — Possesses <code>Dashboard.Read</code> and <code>Dashboard.Admin</code> application roles.
                    </p>
                  </div>
                </label>

                {/* Persona 3: Unauthorized External User */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                    selectedPersona === "unauthorized"
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-border bg-surface-elevated/40 hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="persona"
                    value="unauthorized"
                    checked={selectedPersona === "unauthorized"}
                    onChange={() => setSelectedPersona("unauthorized")}
                    className="mt-1"
                  />
                  <div className="space-y-0.5 text-supporting">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">External Contractor (Unapproved)</span>
                      <Badge variant="critical">Access Denied Test</Badge>
                    </div>
                    <p className="text-secondary">
                      <code>guest@external-partner.com</code> — External tenant lacking <code>Dashboard.Read</code>. Demonstrates 403 Forbidden rejection.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Security Architecture Guarantees */}
            <div className="rounded-control bg-surface-elevated p-3 border border-border text-[12px] text-secondary space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-primary">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Zero Trust Architecture Enforcement</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>No Azure management credentials or API secrets are stored in the browser.</li>
                <li>Backend independently validates signature, issuer, audience, and scopes via JWKS.</li>
                <li>Frontend route guards alone are never trusted as sufficient authorization.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
