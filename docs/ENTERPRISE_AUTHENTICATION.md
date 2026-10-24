# ADT-AI Azure Operations Center — Enterprise Authentication & Security Architecture

This document specifies the enterprise authentication, authorization, and role-based access control (RBAC) architecture for the ADT-AI Azure Operations Center.

---

## 1. Microsoft Entra ID Dual App Registration Architecture

To maintain zero-trust security and prevent token privilege escalation, the system uses two separate Microsoft Entra ID (formerly Azure Active Directory) application registrations.

```
┌─────────────────────────┐          MSAL Token Request          ┌─────────────────────────┐
│       Browser SPA       │ ───────────────────────────────────> │   Microsoft Entra ID    │
│   (adt-ai-ops-spa)      │ <─────────────────────────────────── │       (Azure AD)        │
└─────────────────────────┘      Access Token (Dashboard.Read)   └─────────────────────────┘
             │
             │ Authorization: Bearer <JWT>
             ▼
┌─────────────────────────┐         DefaultAzureCredential       ┌─────────────────────────┐
│     Express API GW      │ ───────────────────────────────────> │     Target Azure        │
│   (adt-ai-ops-api)      │   (Managed Identity / App Service)   │     Subscription        │
└─────────────────────────┘                                      └─────────────────────────┘
```

### App Registration 1: Protected Dashboard API (`adt-ai-ops-api`)
- **Application (client) ID:** Configured in `AZURE_AD_API_CLIENT_ID`.
- **Application ID URI:** `api://adt-ai-ops-api` (or `api://<AZURE_AD_API_CLIENT_ID>`).
- **Exposed Delegated Scopes:**
  - `Dashboard.Read`: "Read-only access to monitored Azure cloud infrastructure, resource inventory, VM metrics, and cost analytics."
- **Exposed Application Roles (`appRoles`):**
  - `Dashboard.Viewer`: Assigned to standard staff members for read-only dashboard access.
  - `Dashboard.Admin`: Assigned to cloud architects and lead administrators for governance settings and security audit log inspection.
- **Manifest snippet:**
  ```json
  "oauth2Permissions": [
    {
      "adminConsentDescription": "Allows staff to monitor Azure inventory, metrics, and costs.",
      "adminConsentDisplayName": "Read Operations Center Dashboard",
      "id": "e45a2b10-67c8-4f9e-9d21-a1b2c3d4e5f6",
      "isEnabled": true,
      "type": "User",
      "userConsentDescription": "Allows the app to display your monitored Azure resources.",
      "userConsentDisplayName": "Read Operations Center Dashboard",
      "value": "Dashboard.Read"
    }
  ]
  ```

### App Registration 2: Browser SPA (`adt-ai-ops-spa`)
- **Application (client) ID:** Configured in `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`.
- **Platform:** Single-Page Application (SPA).
- **Redirect URIs:**
  - Local Dev: `http://localhost:3000/auth/callback`, `http://localhost:3000/`
  - Production: `https://ops.adt-ai.org/auth/callback`, `https://ops.adt-ai.org/`
- **Configured API Permissions:**
  - `adt-ai-ops-api` -> `Dashboard.Read` (Delegated)
  - `Microsoft Graph` -> `User.Read` (Delegated)

---

## 2. Backend Bearer Token Cryptographic Validation

The Express backend (`apps/api`) independently validates all incoming bearer tokens using `jose` against Microsoft Entra ID public keys before serving any data route.

### Validation Checklist
1. **Signature Verification:** Validated cryptographically against Microsoft public JWKS fetched from `https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys`.
2. **Issuer Verification:** Must match the expected Entra ID tenant issuer:
   - `https://login.microsoftonline.com/{tenantId}/v2.0` (v2.0)
   - `https://sts.windows.net/{tenantId}/` (v1.0 legacy tokens)
3. **Audience Verification:** Must strictly match the API client ID or `api://adt-ai-ops-api`. Tokens issued for other services or Graph API are rejected.
4. **Token Expiration:** The `exp` claim is checked. Expired tokens are rejected with `401 Unauthorized` and `WWW-Authenticate: Bearer error="invalid_token"`.
5. **Required Delegated Scope:** The `scp` claim must contain `Dashboard.Read` (or user must possess `Dashboard.Viewer` / `Dashboard.Admin` role). Tokens lacking the scope are rejected with `403 Forbidden`.
6. **Tenant Restriction:** The `tid` claim must match the approved ADT-AI Training Foundation organization tenant. Accounts from unapproved external tenants are rejected.

---

## 3. Azure RBAC Least-Privilege Architecture

The Express backend connects to Azure using **Managed Identity** (when hosted in Azure App Service) or `DefaultAzureCredential` (during local development).

### Required Azure Roles
Only two read-only roles are granted at the target subscription scope:
- **`Reader`**: Allows subscription inventory enumeration via Azure Resource Graph, VM instanceView power state queries, and Azure Monitor performance metrics queries.
- **`Cost Management Reader`**: Allows execution of `Microsoft.CostManagement/query` and `Microsoft.Consumption/budgets` requests.

### Prohibited Roles
- **DO NOT** grant `Contributor` or `Owner`.
- The dashboard is strictly a monitoring and operations visibility tool; it contains zero resource mutation or deletion endpoints.

---

## 4. Production Security Hardening & Zero Trust Controls

- **No Secrets in Browser:** Browser storage (`sessionStorage`) holds only short-lived delegated tokens. No management tokens, Azure subscription keys, or client secrets are ever sent to or stored in the browser.
- **No Secrets in Logs:** The Express request logger and error handler sanitize all output, replacing bearer tokens and connection strings with `[REDACTED]`.
- **Audit Logging:** Every authentication attempt, token verification, permission failure, and administrative query is recorded by `AuditService` (`apps/api/src/services/audit-service.ts`) with timestamp, user UPN/OID, sanitized IP, and outcome.
- **Security Headers:** Enforced via `helmet`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
- **Rate Limiting:** Global rate limiting (300 requests per 15-minute window per IP) protects against abuse and credential stuffing.
- **CORS Allowlist:** Restricted to approved frontend origins (`http://localhost:3000` and authorized domain).
