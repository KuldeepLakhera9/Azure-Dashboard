/**
 * Application API Client
 * Centralized, typed HTTP client for communicating exclusively with the Express backend.
 * Browser never communicates directly with Azure SDKs or exposes Azure tokens.
 * Automatically attaches validated Microsoft Entra ID Bearer tokens to requests.
 */

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  timestamp?: string;
}

export class ApiClientError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function fetchFromApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : path.startsWith("/") ? path : `/${path}`;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Automatically attach active session Bearer token from sessionStorage if present
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("adt_ai_ops_session_user");
      if (stored) {
        const parsed = JSON.parse(stored) as { token?: string };
        if (parsed.token && !options.headers) {
          defaultHeaders["Authorization"] = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let errorJson: ApiErrorResponse | null = null;
    try {
      errorJson = (await response.json()) as ApiErrorResponse;
    } catch {
      // Non-JSON error payload
    }

    const message =
      errorJson?.message ||
      `Request failed with HTTP status ${response.status} (${response.statusText})`;

    // If 401 Unauthorized, dispatch auth expired event for UI notifications
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("adt-ai-auth-expired"));
    }

    throw new ApiClientError(message, response.status, errorJson?.details);
  }

  return response.json() as Promise<T>;
}
