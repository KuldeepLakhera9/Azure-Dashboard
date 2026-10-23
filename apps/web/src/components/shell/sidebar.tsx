"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  Server,
  DollarSign,
  PieChart,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Resources", href: "/resources", icon: Server },
  { label: "Costs", href: "/costs", icon: DollarSign },
  { label: "Budgets", href: "/budgets", icon: PieChart },
  { label: "Performance", href: "/performance", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-surface border-r border-border">
      {/* Brand & Toggle Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link
          href="/"
          className={`flex items-center gap-3 transition-opacity ${
            isCollapsed ? "justify-center w-full" : ""
          }`}
          onClick={onCloseMobile}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent text-white shadow-sm font-semibold">
            <Layers className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-body text-primary tracking-tight truncate">
                ADT-AI Ops Center
              </span>
              <span className="text-[11px] font-mono text-secondary truncate">
                Azure Monitoring
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-control text-secondary hover:text-primary hover:bg-surface-elevated"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-control px-3 py-2.5 text-body font-medium transition-colors ${
                isCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-surface-elevated"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-secondary group-hover:text-primary"
                }`}
              />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-surface-elevated text-secondary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Subscription Indicator & Collapse Button */}
      <div className="border-t border-border p-3 space-y-2">
        {!isCollapsed && (
          <div className="rounded-control bg-surface-elevated p-2.5 border border-border/80 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-semantic-success font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Read-Only Portal</span>
            </div>
            <p className="font-mono text-secondary truncate">
              sub-adt-ai-foundation-prod-01
            </p>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 rounded-control p-2 text-supporting text-secondary hover:text-primary hover:bg-surface-elevated transition-colors border border-border/60 cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          isCollapsed ? "w-18" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex flex-col w-64 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200 shadow-popover">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
