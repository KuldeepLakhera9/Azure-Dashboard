"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAuthRoute = pathname === "/login" || pathname === "/unauthorized";

  // Dedicated unencumbered layout for sign-in and access denied pages
  if (isAuthRoute) {
    return <main className="min-h-screen bg-page">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-page text-primary antialiased">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Topbar */}
      <Topbar
        onOpenMobileMenu={() => setIsMobileOpen(true)}
        isSidebarCollapsed={isCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-200 overflow-x-hidden ${
          isCollapsed ? "lg:pl-18" : "lg:pl-64"
        }`}
      >
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
