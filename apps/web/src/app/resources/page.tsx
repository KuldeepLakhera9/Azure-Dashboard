"use client";

import React, { useState } from "react";
import { Server, Search, RefreshCw, HardDrive, Shield, Globe } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/ui/empty-state";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [rgFilter, setRgFilter] = useState("all");

  const sampleResources = [
    {
      id: "1",
      name: "vm-adt-gpu-trainer-01",
      type: "Microsoft.Compute/virtualMachines",
      group: "rg-adt-training-compute",
      location: "eastus2",
      sku: "Standard_NC6s_v3",
      status: "Succeeded",
      icon: Server,
    },
    {
      id: "2",
      name: "saadtdatasetsprod",
      type: "Microsoft.Storage/storageAccounts",
      group: "rg-adt-data-storage",
      location: "eastus2",
      sku: "Standard_ZRS",
      status: "Succeeded",
      icon: HardDrive,
    },
    {
      id: "3",
      name: "kv-adt-prod-secrets",
      type: "Microsoft.KeyVault/vaults",
      group: "rg-adt-security",
      location: "eastus2",
      sku: "Standard",
      status: "Succeeded",
      icon: Shield,
    },
    {
      id: "4",
      name: "vnet-adt-core-eastus2",
      type: "Microsoft.Network/virtualNetworks",
      group: "rg-adt-networking",
      location: "eastus2",
      sku: "Enterprise",
      status: "Succeeded",
      icon: Globe,
    },
  ];

  const filtered = sampleResources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    const matchesRg = rgFilter === "all" || r.group === rgFilter;
    return matchesSearch && matchesRg;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Inventory"
        subtitle="Operational inventory of Azure resources discovered across all accessible resource groups."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Resources" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {}}
          >
            Refresh Inventory
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search resources by name or type..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 sm:w-64">
              <Select
                value={rgFilter}
                onChange={(e) => setRgFilter(e.target.value)}
              >
                <option value="all">All Resource Groups (4)</option>
                <option value="rg-adt-training-compute">rg-adt-training-compute</option>
                <option value="rg-adt-data-storage">rg-adt-data-storage</option>
                <option value="rg-adt-security">rg-adt-security</option>
                <option value="rg-adt-networking">rg-adt-networking</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table or Empty State */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-supporting">
              <thead className="border-b border-border text-secondary font-medium bg-surface-elevated/40">
                <tr>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-4">Resource Type</th>
                  <th className="py-3 px-4">Resource Group</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Provisioning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-primary font-sans flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-accent shrink-0" />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-secondary font-sans">
                        {item.type.replace("Microsoft.", "")}
                      </td>
                      <td className="py-3.5 px-4 text-secondary font-sans">
                        {item.group}
                      </td>
                      <td className="py-3.5 px-4 text-secondary">{item.location}</td>
                      <td className="py-3.5 px-4 text-secondary">{item.sku}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <Badge variant="success">{item.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No resources match filter"
          description={`No Azure resources found matching "${search}". Clear or adjust your filters to view resources.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch("");
            setRgFilter("all");
          }}
        />
      )}
    </div>
  );
}
