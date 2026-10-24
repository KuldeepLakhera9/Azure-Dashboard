"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Laptop,
  Bell,
  ChevronRight,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "../../lib/auth/auth-context";
import { RefreshStatus } from "../ui/refresh-status";
import { Badge } from "../ui/badge";

export interface TopbarProps {
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onOpenMobileMenu, isSidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname === "/") return ["Operations", "Overview"];
    const segment = pathname.replace("/", "");
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    return ["Operations", title];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header
      className={`sticky top-0 z-20 h-16 border-b border-border bg-surface/95 backdrop-blur transition-all duration-200 ${
        isSidebarCollapsed ? "lg:pl-18" : "lg:pl-64"
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-control text-secondary hover:text-primary hover:bg-surface-elevated"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-supporting text-secondary">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-secondary/60 shrink-0" />}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "font-medium text-primary"
                      : ""
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Refresh status, Notifications, Theme, Profile */}
        <div className="flex items-center gap-3">
          {/* Refresh indicator */}
          <RefreshStatus
            lastRefreshed={new Date().toISOString()}
            status="success"
            statusLabel="Live"
          />

          {/* Notifications placeholder */}
          <div className="relative">
            <button
              className="p-2 rounded-control text-secondary hover:text-primary hover:bg-surface-elevated transition-colors border border-transparent hover:border-border cursor-pointer"
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center rounded-control border border-border p-0.5 bg-surface-elevated">
            <button
              onClick={() => setTheme("light")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === "light"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
              title="Light Mode"
              aria-label="Light mode"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === "dark"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
              title="Dark Mode"
              aria-label="Dark mode"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                theme === "system"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
              title="System Default"
              aria-label="System mode"
            >
              <Laptop className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* User profile dropdown */}
          <div className="relative pl-2 border-l border-border" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-control hover:bg-surface-elevated transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="User account menu"
              aria-expanded={isProfileOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-semibold text-supporting shrink-0">
                {user?.avatarInitials || "SE"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-supporting font-medium text-primary leading-tight">
                  {user?.name || "Staff Engineer"}
                </span>
                <span className="text-[11px] text-secondary leading-tight">
                  {user?.role ? `${user.role} (Authorized)` : "Read-Only Staff"}
                </span>
              </div>
              <ChevronDown className="hidden md:block h-3.5 w-3.5 text-secondary/70 shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-card border border-border bg-surface text-primary shadow-popover p-3 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="pb-3 border-b border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body font-semibold text-primary">{user?.name || "Staff Engineer"}</span>
                    <Badge variant={user?.role === "Admin" ? "info" : "success"}>
                      {user?.role || "Reader"}
                    </Badge>
                  </div>
                  <p className="text-supporting text-secondary truncate font-mono text-xs">
                    {user?.email || "ops.staff@adt-ai.org"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-secondary pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="truncate">Tenant: {user?.tenantId || "adt-ai-foundation"}</span>
                  </div>
                </div>

                <div className="py-2 text-[12px] text-secondary space-y-1">
                  <div className="flex justify-between">
                    <span>Delegated Scope:</span>
                    <span className="font-mono text-xs text-primary font-medium">Dashboard.Read</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session Status:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active (Entra ID)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-supporting font-medium text-critical hover:bg-critical/10 rounded-control transition-colors cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
