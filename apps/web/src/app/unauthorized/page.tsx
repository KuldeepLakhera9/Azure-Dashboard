"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Mail, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-critical/10 border border-critical/30 text-critical shadow-elevation">
            <ShieldAlert className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-page-title font-bold tracking-tight text-primary">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-supporting text-secondary">
          403 Forbidden — Insufficient Microsoft Entra ID Delegated Permissions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <Card className="border-critical/30 shadow-popover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-critical" />
                <CardTitle>Unauthorized Account</CardTitle>
              </div>
              <Badge variant="critical">HTTP 403</Badge>
            </div>
            <CardDescription>
              Your identity does not possess the required Entra ID application claims to view monitored cloud infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identity Details */}
            <div className="rounded-control bg-surface-elevated p-4 border border-border space-y-2 text-supporting">
              <div className="flex justify-between">
                <span className="text-secondary">Signed-In Identity:</span>
                <span className="font-semibold text-primary font-mono text-xs">
                  {user?.email || user?.name || "Guest Account"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Tenant Identifier:</span>
                <span className="font-mono text-xs text-primary">
                  {user?.tenantId || "unapproved-external-tenant"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Assigned Delegated Scopes:</span>
                <span className="font-mono text-xs text-critical">
                  {user?.scopes && user.scopes.length > 0 ? user.scopes.join(", ") : "None (Missing Dashboard.Read)"}
                </span>
              </div>
            </div>

            {/* Why Access was Denied */}
            <div className="space-y-2 text-supporting text-secondary leading-relaxed">
              <h4 className="font-semibold text-primary">Why is access restricted?</h4>
              <p>
                In compliance with ADT-AI Training Foundation security policy, the Operations Center API enforces strict token claims validation:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[13px]">
                <li>Sign-in must originate from an authorized organization Microsoft Entra tenant.</li>
                <li>The bearer token must contain the <code>Dashboard.Read</code> delegated scope or <code>Dashboard.Viewer</code> app role.</li>
                <li>Frontend email addresses or route guards alone are never trusted as proof of authorization.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={() => logout()}
              >
                Sign In with Corporate Account
              </Button>
              <a
                href="mailto:it-support@adt-ai.org?subject=Request%20Access%20to%20ADT-AI%20Azure%20Operations%20Center"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Request Entra ID Role
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
