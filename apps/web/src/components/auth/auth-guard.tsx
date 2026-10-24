"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import { Button } from "../ui/button";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, sessionExpired, login, setSessionExpired } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === "/login" || pathname === "/unauthorized";

  useEffect(() => {
    // Listen for custom auth expired event from API client
    const handleExpired = () => {
      setSessionExpired(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("adt-ai-auth-expired", handleExpired);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("adt-ai-auth-expired", handleExpired);
      }
    };
  }, [setSessionExpired]);

  useEffect(() => {
    if (!isLoading && !isPublicPage) {
      if (!user) {
        router.push("/login");
      } else if (!isAuthenticated) {
        router.push("/unauthorized");
      }
    }
  }, [isLoading, isPublicPage, user, isAuthenticated, router]);

  // Loading state
  if (isLoading && !isPublicPage) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border shadow-elevation">
            <Shield className="h-7 w-7 text-accent animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-section-title font-semibold text-primary">
              Validating Microsoft Entra ID Session
            </h3>
            <p className="text-supporting text-secondary">
              Verifying cryptographic signature and delegated claims...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Session Expired Sticky Banner */}
      {sessionExpired && !isPublicPage && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-body">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-medium">
              Your Microsoft Entra ID access token has expired. API calls are restricted.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-amber-900 hover:bg-neutral-100 border-none shrink-0"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => login("staff")}
          >
            Renew Session
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
