"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  oid: string;
  name: string;
  email: string;
  role: "Reader" | "FinOps" | "Admin" | "Guest";
  scopes: string[];
  tenantId: string;
  token: string;
  avatarInitials: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (mode?: "staff" | "admin" | "unauthorized" | "msal") => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  setSessionExpired: (expired: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRESET_USERS: Record<string, UserProfile> = {
  staff: {
    oid: "usr-staff-001",
    name: "Staff Operations Engineer",
    email: "ops.staff@adt-ai.org",
    role: "Reader",
    scopes: ["Dashboard.Read"],
    tenantId: "tenant-adt-ai-foundation-prod",
    token: "mock-token-staff-reader",
    avatarInitials: "SE",
  },
  admin: {
    oid: "usr-admin-001",
    name: "Lead Cloud Architect",
    email: "lead.architect@adt-ai.org",
    role: "Admin",
    scopes: ["Dashboard.Read", "Dashboard.Admin"],
    tenantId: "tenant-adt-ai-foundation-prod",
    token: "mock-token-admin",
    avatarInitials: "LA",
  },
  unauthorized: {
    oid: "usr-guest-999",
    name: "External Contractor",
    email: "contractor@external-partner.com",
    role: "Guest",
    scopes: [], // Missing required Dashboard.Read!
    tenantId: "external-unapproved-tenant",
    token: "mock-token-unauthorized",
    avatarInitials: "EC",
  },
};

const SESSION_STORAGE_KEY = "adt_ai_ops_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const router = useRouter();

  // Load session from sessionStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          setUser(parsed);
        } else {
          // Default initial session for immediate dashboard usability
          const defaultUser = PRESET_USERS.staff!;
          setUser(defaultUser);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(defaultUser));
        }
      }
    } catch (err) {
      console.warn("[Auth] Failed to restore session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (mode: "staff" | "admin" | "unauthorized" | "msal" = "staff") => {
      setIsLoading(true);
      setSessionExpired(false);

      try {
        if (mode === "msal") {
          // In real MSAL environment, trigger popup or redirect
          // Fallback to staff if unconfigured
          const selected = PRESET_USERS.staff!;
          setUser(selected);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(selected));
          router.push("/");
          return;
        }

        const selected = PRESET_USERS[mode] || PRESET_USERS.staff!;
        setUser(selected);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(selected));

        if (mode === "unauthorized") {
          router.push("/unauthorized");
        } else {
          router.push("/");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.token;
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && user.role !== "Guest",
    isLoading,
    sessionExpired,
    login,
    logout,
    getAccessToken,
    setSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
