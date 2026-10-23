"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Laptop,
  Bell,
  User,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { RefreshStatus } from "../ui/refresh-status";

export interface TopbarProps {
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onOpenMobileMenu, isSidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

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

          {/* User profile placeholder */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-supporting">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-supporting font-medium text-primary leading-tight">
                Staff Engineer
              </span>
              <span className="text-[11px] text-secondary leading-tight">
                Read-Only Staff
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
