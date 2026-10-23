"use client";

import React, { useState } from "react";
import { Save, ShieldCheck, Moon, Sun, Laptop } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { useTheme } from "../../components/theme-provider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [subId, setSubId] = useState("sub-adt-ai-foundation-prod-01");
  const [operationalTtl, setOperationalTtl] = useState("15");
  const [billingTtl, setBillingTtl] = useState("24");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Governance"
        subtitle="Operational telemetry polling intervals, caching policies, and authentication configuration."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Settings" }]}
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
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

        {/* Polling & Cache Policy Card */}
        <Card>
          <CardHeader>
            <CardTitle>Telemetry & Cache Policies</CardTitle>
            <CardDescription>
              Configure background caching thresholds to control Azure Resource Graph and Cost Management API quotas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Active Azure Subscription ID"
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              helperText="Target subscription for Resource Graph queries."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Operational Refresh Cycle"
                value={operationalTtl}
                onChange={(e) => setOperationalTtl(e.target.value)}
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
                helperText="Azure Cost Management query quota protection."
              >
                <option value="12">12 hours</option>
                <option value="24">24 hours (Mandatory Default)</option>
                <option value="48">48 hours</option>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="flex items-center gap-1.5 text-supporting text-semantic-success font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Read-Only Least-Privilege Enforced</span>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
            >
              {isSaved ? "Saved Successfully" : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
