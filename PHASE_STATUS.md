# ADT-AI Azure Operations Center — Phase Status Tracker

## Executive Summary
**Project:** ADT-AI Azure Operations Center  
**Organization:** ADT-AI Training Foundation  
**Current Phase:** Phase 1 — Project Architecture, Core Monorepo Setup & Operational Dashboard Foundation  
**Status:** **Completed & Verified**  
**Next Phase:** Phase 2 — Microsoft Entra ID Authentication & MSAL Browser Integration  

---

## 1. Compliance & Architecture Decisions

| Requirement | Implementation Decision | Status |
| :--- | :--- | :--- |
| **Strict No-Docker Requirement** | Zero Dockerfile, docker-compose, container manifests, or container build scripts. Pure Node.js v24.20 / npm 11.19 native workspaces. | **Verified Compliant** |
| **Frontend Architecture** | Next.js 14 (App Router) + TypeScript in strict mode + Tailwind CSS + Lucide Icons + Recharts. Targeted for Vercel deployment. | **Verified Compliant** |
| **Backend Architecture** | Express on Node.js + TypeScript strict mode + official `@azure/*` SDKs + Zod schema validation. Targeted for Azure App Service on Linux. | **Verified Compliant** |
| **Enterprise Design System** | Midnight navy neutrals (`#080c14`, `#0f172a`), restrained Azure blue (`#0078d4`), semantic status tokens (success, warning, critical), Inter typography, 4px grid tokens, anti-flash light/dark/system theme switching. | **Verified Compliant** |
| **Data Freshness & Caching** | Tiered in-memory and persistent caching. 15-minute operational telemetry refresh cycle. 24-hour separate cycle for Azure Cost Management. Stale data preserved on failure without fake zeros. | **Verified Compliant** |
| **Azure Integration** | `DefaultAzureCredential` support for Managed Identity on Azure App Service. Interface-driven provider architecture (`IAzureDataProvider`) supporting both live Azure SDK calls and localized simulation mode. | **Verified Compliant** |

---

## 2. Work Completed in Phase 1

### Monorepo Structure
- Initialized clean Git repository with comprehensive `.gitignore` avoiding node_modules, build outputs, and `.env` credentials.
- Configured root `package.json` with npm workspaces: `packages/shared`, `apps/api`, `apps/web`.
- Added orchestrator npm scripts: `dev`, `build`, `lint`, `type-check`.

### Shared Domain Package (`packages/shared`)
- Created strict Zod schemas and TypeScript models for:
  - `AzureResource` and `ResourceInventoryResponse`
  - `VirtualMachine` with distinct `VmPowerState` (`running`, `deallocated`, `stopped`)
  - `CostDataResponse` with service breakdown, daily spend trends, and 24h cache metadata
  - `AzureBudget` with spend limits and alert thresholds
  - `MetricSeries` with timeseries aggregations
  - `SystemHealthResponse` with subsystem statuses
- Compiled with `tsc -b` to common JavaScript declarations and types.

### Backend Service (`apps/api`)
- Configured Express server with security headers (`helmet`), CORS configuration, rate limiting (`express-rate-limit`), and error handler with secret/token redaction.
- Created `TieredCache` with separate operational (15m) and billing (24h) TTLs and staleness tracking.
- Implemented `MockAzureDataProvider` for realistic enterprise testing representing ADT-AI Training Foundation infrastructure (V100 GPU cluster VMs, storage accounts, Key Vaults, VNets).
- Implemented `AzureSdkDataProvider` integrating `@azure/identity` (`DefaultAzureCredential`), `@azure/arm-resourcegraph`, `@azure/arm-compute` (live instance view power state), and `@azure/arm-monitor`.
- Added Express routes:
  - `GET /api/health`
  - `GET /api/inventory/resources`
  - `GET /api/inventory/vms`
  - `GET /api/costs`
  - `GET /api/budgets`
  - `GET /api/metrics`
- Created `apps/api/.env.example`.

### Frontend Web Application (`apps/web`)
- Initialized Next.js 14 App Router project with TypeScript strict mode.
- Configured Tailwind CSS with custom design tokens:
  - Colors: Azure 50–950, Midnight 800–950, semantic status tokens.
  - Spacing, fonts (`Inter`, `JetBrains Mono`), card and button radii.
- Implemented anti-flash client `ThemeProvider` supporting Light, Dark, and System modes with local storage persistence.
- Created `Header` component with:
  - Brand and active Azure subscription pill (`sub-adt-ai-foundation-prod-01`)
  - Subsystem operational health badge
  - Data freshness & last refresh timestamp
  - Manual telemetry refresh trigger with animation
  - Theme mode switcher (Light/Dark/System)
  - Security read-only staff indicator
- Implemented `DashboardPage` (`apps/web/src/app/page.tsx`) with 5 dedicated operational views:
  1. **Overview:** 4 KPI summary cards (Total Resources, Compute Power State, MTD Spend, Budget Utilization), Recharts MTD daily spend trend area chart, and service cost distribution.
  2. **Resource Inventory:** Real-time searchable & resource-group filterable table with provisioning states and SKUs.
  3. **Virtual Machines:** Dedicated compute table with live instance view power states (`running`, `deallocated`, `stopped`), VM sizes (GPU/CPU specs), and OS details.
  4. **Costs & Budgets:** Monthly budget consumption progress bar, alert thresholds (80% actual, 90% forecasted), and service cost breakdown bar chart.
  5. **Infrastructure Metrics:** 5-minute resolution CPU utilization % chart with hypervisor host vs guest telemetry advisory notices.
- Built-in 15-minute auto-refresh cycle and 24h billing notice banner.
- Created `apps/web/.env.example`.

---

## 3. Verification & Test Results

| Test Target | Command Executed | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Shared Package Build** | `npm run build:shared` | **PASS (Exit Code 0)** | Generated TypeScript `.d.ts` and `.js` in `packages/shared/dist`. |
| **API Backend Build** | `npm run build:api` | **PASS (Exit Code 0)** | Strict compilation to `apps/api/dist`. |
| **Frontend Web Build** | `npm run build:web` | **PASS (Exit Code 0)** | Next.js production build generated static & SSR routes cleanly. |
| **Monorepo Build** | `npm run build` | **PASS (Exit Code 0)** | All workspaces built simultaneously with zero errors. |
| **Strict Type Check** | `npm run type-check` | **PASS (Exit Code 0)** | All workspaces pass `tsc --noEmit` with zero errors. |
| **Health API Runtime** | `GET http://localhost:5000/api/health` | **PASS (HTTP 200)** | Returns healthy subsystem statuses and subscription info. |
| **Resource Inventory Runtime** | `GET http://localhost:5000/api/inventory/resources` | **PASS (HTTP 200)** | Returns 6 provisioned resources across multiple resource groups. |
| **VM Power State Runtime** | `GET http://localhost:5000/api/inventory/vms` | **PASS (HTTP 200)** | Returns compute instances with distinct running and deallocated power states. |
| **Cost Management Runtime** | `GET http://localhost:5000/api/costs` | **PASS (HTTP 200)** | Returns MTD total ($4,820.65), forecast, service breakdowns, and daily history. |

---

## 4. Blockers & Risks
- **None.** All Phase 1 deliverables are functioning and strictly passing all builds and runtime tests.

---

## 5. Next Step: Phase 2 Proposal (Pending User Approval)

### Proposed Scope for Phase 2:
1. **Microsoft Entra ID Authentication & MSAL Browser:**
   - Configure `@azure/msal-react` and `@azure/msal-browser` provider in `apps/web`.
   - Add interactive Sign-in / Sign-out / Switch Account modal in the Header.
   - Display authenticated user profile details (User Principal Name, Display Name, Tenant, Role: "Reader / Read-Only Staff").
   - Add Protected Route wrapper so unauthenticated users see a refined sign-in landing screen.
2. **Backend Bearer Token Validation:**
   - Add JWT validation middleware verifying Entra ID bearer tokens in `apps/api` using `jose` or Azure JWKS public keys.
3. **Advanced Filtering & Export Features:**
   - CSV export for filtered Azure resource inventory.
   - Resource tag inspection modal.

*(Awaiting user approval before proceeding to Phase 2).*
