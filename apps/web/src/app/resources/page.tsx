"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Server,
  Search,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  HardDrive,
  Layers,
  Shield,
  Globe,
  Brain,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/ui/empty-state";
import { TableRowSkeleton } from "../../components/ui/skeleton";
import { ResourceDrawer } from "../../components/resources/resource-drawer";
import {
  inventoryService,
  ResourceSortField,
  SortOrder,
  ResourceQueryResult,
} from "../../lib/services/inventory-service";
import { AzureResourceItem } from "../../lib/mock-data/inventory";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [rgFilter, setRgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortField, setSortField] = useState<ResourceSortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [result, setResult] = useState<ResourceQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    types: string[];
    regions: string[];
    resourceGroups: string[];
    statuses: string[];
  }>({ types: [], regions: [], resourceGroups: [], statuses: [] });

  const [selectedResource, setSelectedResource] = useState<AzureResourceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    inventoryService.getFilterOptions().then(setFilterOptions);
  }, []);

  // Fetch resources with query cancellation support
  const fetchResources = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const controller = new AbortController();

      try {
        const res = await inventoryService.getResources(
          {
            filters: {
              search,
              resourceType: typeFilter,
              region: regionFilter,
              resourceGroup: rgFilter,
              status: statusFilter,
            },
            sortField,
            sortOrder,
            page,
            pageSize,
          },
          controller.signal
        );
        setResult(res);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("Failed to load resources:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }

      return () => controller.abort();
    },
    [search, typeFilter, regionFilter, rgFilter, statusFilter, sortField, sortOrder, page, pageSize]
  );

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Handle sort header click
  const handleSort = (field: ResourceSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setRegionFilter("all");
    setRgFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== "" ||
      typeFilter !== "all" ||
      regionFilter !== "all" ||
      rgFilter !== "all" ||
      statusFilter !== "all"
    );
  }, [search, typeFilter, regionFilter, rgFilter, statusFilter]);

  const handleRowClick = (resource: AzureResourceItem) => {
    setSelectedResource(resource);
    setIsDrawerOpen(true);
  };

  const getResourceIcon = (type: string) => {
    if (type.includes("virtualMachines")) return Server;
    if (type.includes("storageAccounts")) return HardDrive;
    if (type.includes("vaults")) return Shield;
    if (type.includes("virtualNetworks") || type.includes("networkSecurityGroups")) return Globe;
    if (type.includes("CognitiveServices")) return Brain;
    return Layers;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Resource Inventory"
        subtitle="Discovered Azure resources, ARM provisioning states, and VM power states across subscriptions."
        breadcrumbs={[{ label: "Operations", href: "/" }, { label: "Resources" }]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => fetchResources(true)}
              title="Refresh inventory without clearing filters"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Simulation & Freshness Advisory Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-card border border-border bg-surface text-supporting text-secondary">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-accent shrink-0" />
          <span>
            <strong>Simulated Telemetry:</strong> Live VM power state is separate from ARM provisioning state.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>Observed: {result?.lastUpdated ? new Date(result.lastUpdated).toLocaleTimeString() : "Just now"}</span>
          <Badge variant="outline">Sample Data</Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                placeholder="Search resources by name, type, or resource ID..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Quick Filter Reset */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                leftIcon={<X className="h-4 w-4" />}
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            {/* Filter by Type */}
            <Select
              label="Resource Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Types ({filterOptions.types.length})</option>
              {filterOptions.types.map((t) => (
                <option key={t} value={t}>
                  {t.replace("Microsoft.", "")}
                </option>
              ))}
            </Select>

            {/* Filter by Region */}
            <Select
              label="Region"
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Regions ({filterOptions.regions.length})</option>
              {filterOptions.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>

            {/* Filter by Resource Group */}
            <Select
              label="Resource Group"
              value={rgFilter}
              onChange={(e) => {
                setRgFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Groups ({filterOptions.resourceGroups.length})</option>
              {filterOptions.resourceGroups.map((rg) => (
                <option key={rg} value={rg}>
                  {rg}
                </option>
              ))}
            </Select>

            {/* Filter by Status */}
            <Select
              label="Operational Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Succeeded">Provisioning: Succeeded</option>
              <option value="Running">Power State: Running</option>
              <option value="Deallocated">Power State: Deallocated</option>
              <option value="Stopped">Power State: Stopped</option>
              <option value="Failed">Provisioning: Failed</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-supporting text-secondary px-1">
        <span>
          Showing{" "}
          <strong className="text-primary font-mono">{result?.filteredCount ?? 0}</strong> of{" "}
          <strong className="text-primary font-mono">{result?.totalCount ?? 0}</strong> resources
        </span>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-border bg-surface px-2 py-1 text-supporting text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Main Resource Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-supporting">
            <thead className="border-b border-border text-secondary font-medium bg-surface-elevated/40">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Resource Name</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("type")}
                  className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("resourceGroup")}
                  className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Resource Group</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("location")}
                  className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Region</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                  </div>
                </th>
                <th className="py-3 px-4 select-none">
                  <span>ARM Provisioning</span>
                </th>
                <th className="py-3 px-4 select-none">
                  <span>VM Power State</span>
                </th>
                <th
                  onClick={() => handleSort("lastObserved")}
                  className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Observed</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-secondary/70" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={7} />
                ))
              ) : result && result.resources.length > 0 ? (
                result.resources.map((item) => {
                  const Icon = getResourceIcon(item.type);
                  const isVm = !!item.powerState;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-primary font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface border border-border text-accent group-hover:border-accent">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="truncate max-w-[200px] text-accent group-hover:underline">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-secondary font-sans truncate max-w-[160px]">
                        {item.type.replace("Microsoft.", "")}
                      </td>

                      {/* Resource Group */}
                      <td className="py-3.5 px-4 text-secondary font-sans truncate max-w-[160px]">
                        {item.resourceGroup}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-secondary">
                        {item.locationDisplay}
                      </td>

                      {/* ARM Provisioning State */}
                      <td className="py-3.5 px-4 font-sans">
                        <Badge
                          variant={
                            item.provisioningState === "Succeeded"
                              ? "success"
                              : item.provisioningState === "Failed"
                              ? "critical"
                              : "warning"
                          }
                        >
                          {item.provisioningState}
                        </Badge>
                      </td>

                      {/* VM Power State (Only for VMs!) */}
                      <td className="py-3.5 px-4 font-sans">
                        {isVm && item.powerState ? (
                          <Badge
                            variant={
                              item.powerState === "running"
                                ? "success"
                                : item.powerState === "deallocated"
                                ? "warning"
                                : "critical"
                            }
                          >
                            {item.powerState.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-secondary/50 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Last Observed */}
                      <td className="py-3.5 px-4 text-secondary text-xs">
                        {new Date(item.lastObserved).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : null}
            </tbody>
          </table>

          {/* Empty State */}
          {!isLoading && (!result || result.resources.length === 0) && (
            <div className="p-8">
              <EmptyState
                icon={<SlidersHorizontal className="h-8 w-8 text-secondary/60" />}
                title="No resources match filter criteria"
                description={`No resources found matching the specified search query or filters. Reset filters to view all ${result?.totalCount ?? 0} resources.`}
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-supporting pt-2">
          <span className="text-secondary">
            Page <strong className="text-primary font-mono">{result.page}</strong> of{" "}
            <strong className="text-primary font-mono">{result.totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={result.page <= 1}
              onClick={() => setPage(result.page - 1)}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={result.page >= result.totalPages}
              onClick={() => setPage(result.page + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Resource Details Drawer */}
      <ResourceDrawer
        resource={selectedResource}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedResource(null);
        }}
      />
    </div>
  );
}
