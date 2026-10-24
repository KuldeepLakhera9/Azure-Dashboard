import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${
      process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || "tenant-adt-ai-foundation-prod"
    }`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  },
  cache: {
    // SessionStorage strictly prevents tokens from persisting across browser restarts or leaking
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(`[MSAL Error] ${message}`);
            break;
          case LogLevel.Warning:
            console.warn(`[MSAL Warning] ${message}`);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

const apiAudience =
  process.env.NEXT_PUBLIC_AZURE_AD_API_CLIENT_ID || "api://adt-ai-ops-api";

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    `${apiAudience}/Dashboard.Read`,
  ],
};
