# ADT-AI Azure Operations Center

Production-grade Azure infrastructure and cloud operations monitoring dashboard built for **ADT-AI Training Foundation**.

---

## 1. Product Objective

The **ADT-AI Azure Operations Center** provides authorized engineering and operations staff with a single, secure, read-only operational dashboard to monitor an Azure subscription and all its accessible workloads, virtual machines, operational performance metrics, and cost management data.

Key capabilities:
- Azure resource inventory and real-time provisioning status.
- Virtual machine inventory with live instance view power state tracking.
- Month-to-date Azure costs and service-level financial breakdowns.
- Configured budgets, consumption burn rates, and threshold alerts.
- Infrastructure telemetry (host CPU utilization %, IOPS, network throughput).
- Controlled data freshness and error reporting (15m operational telemetry, 24h billing cycle).
- Least-privilege read-only Entra ID authorization.

---

## 2. Mandatory Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, Recharts, Microsoft Authentication Library (MSAL).
- **Backend**: Node.js, Express, TypeScript (Strict Mode), Zod schema validation, official Azure SDKs (`@azure/identity`, `@azure/arm-resourcegraph`, `@azure/arm-compute`, `@azure/arm-monitor`).
- **Hosting Targets**:
  - Frontend: Vercel.
  - Backend: Azure App Service on Linux.

---

## 3. Strict No-Docker Architecture

> **MANDATORY POLICY**: Docker, Docker Compose, Kubernetes, container images, and container-based local workflows are prohibited across this project.

The application runs natively as standard Node.js processes using npm scripts, deploys to Vercel via standard Next.js build output, and deploys to Azure App Service using the native Linux Node.js application stack.

---

## 4. Repository Structure

```
├── apps/
│   ├── web/                     # Next.js App Router frontend (Vercel target)
│   │   ├── src/
│   │   │   ├── app/             # Application layout, globals.css, pages
│   │   │   ├── components/      # UI components (Header, ThemeProvider, icons)
│   │   │   └── lib/             # API client and formatting utilities
│   │   ├── .eslintrc.json       # Next.js ESLint configuration
│   │   ├── package.json
│   │   ├── tailwind.config.ts   # Design tokens & color system
│   │   └── tsconfig.json        # Strict TypeScript configuration
│   │
│   └── api/                     # Node.js + Express backend (Azure App Service target)
│       ├── src/
│       │   ├── cache/           # Tiered in-memory & persistent cache with staleness tracking
│       │   ├── config/          # Zod-validated environment configuration
│       │   ├── middleware/      # Error sanitization and rate limiting
│       │   ├── routes/          # Express route controllers (health, inventory, costs, budgets, metrics)
│       │   ├── services/azure/  # Dual-mode Azure SDK & offline simulation providers
│       │   └── index.ts         # Server entrypoint
│       ├── .eslintrc.json       # TypeScript ESLint configuration
│       ├── package.json
│       └── tsconfig.json        # Strict TypeScript configuration
│
├── packages/
│   └── shared/                  # Shared TypeScript interfaces & Zod validation schemas
│       ├── src/                 # Domain types and validation schemas
│       ├── package.json
│       └── tsconfig.json        # Strict TypeScript composite project
│
├── PHASE_STATUS.md              # Project status tracker and phase transition ledger
├── package.json                 # Monorepo workspace orchestrator
├── .gitignore                   # Ignored files (node_modules, dist, .env)
└── README.md                    # Project documentation
```

---

## 5. Prerequisites

- **Node.js**: v20+ LTS or v24+
- **npm**: v10+ or v11+
- **OS**: Windows, macOS, or Linux

---

## 6. Environment Setup

Copy the environment example files in both applications:

### Backend (`apps/api/.env`)
```bash
cp apps/api/.env.example apps/api/.env
```
Default values for local development:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Azure Credentials (Leave blank to run in offline simulation mode)
AZURE_SUBSCRIPTION_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
USE_MOCK_AZURE=true

# Cache Configuration
OPERATIONAL_CACHE_TTL_MS=900000
BILLING_CACHE_TTL_MS=86400000
```
*Note: No Azure credentials or secrets are required to run and test the application locally.*

### Frontend (`apps/web/.env.local`)
```bash
cp apps/web/.env.example apps/web/.env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 7. Local Development Commands

All commands are managed from the repository root:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs dependencies across all workspaces and links local packages. |
| `npm run dev` | Runs both the Express API and Next.js frontend concurrently. |
| `npm run dev:api` | Runs the Express API in isolation with hot-reloading (`tsx watch`). |
| `npm run dev:web` | Runs the Next.js frontend in isolation on `http://localhost:3000`. |
| `npm run lint` | Runs ESLint checks across all packages and apps. |
| `npm run typecheck` | Runs strict TypeScript validation (`tsc --noEmit`) across all workspaces. |
| `npm run build` | Compiles shared packages, builds backend TypeScript, and generates Next.js production bundle. |

---

## 8. Verifying the Backend Health Endpoint

Start the backend:
```bash
npm run dev:api
```

Query the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "subscriptionId": "sub-adt-ai-foundation-prod-01",
  "subscriptionName": "ADT-AI Production Core",
  "timestamp": "2026-10-23T09:17:39.568Z",
  "version": "1.0.0",
  "authMode": "mock-simulation",
  "subsystems": [
    {
      "name": "Azure Resource Graph",
      "status": "healthy",
      "lastSuccess": "2026-10-23T09:17:39.568Z",
      "message": "Connected (Mock Simulation Mode)"
    },
    {
      "name": "Azure Compute InstanceView API",
      "status": "healthy",
      "lastSuccess": "2026-10-23T09:17:39.568Z",
      "message": "Power state polling active"
    },
    {
      "name": "Azure Cost Management",
      "status": "healthy",
      "lastSuccess": "2026-10-23T09:17:39.568Z",
      "message": "Cached 24h cycle operational"
    },
    {
      "name": "Azure Monitor",
      "status": "healthy",
      "lastSuccess": "2026-10-23T09:17:39.568Z",
      "message": "Host-level metrics operational"
    }
  ]
}
```

---

## 9. Design System & Theme Support

The application includes an enterprise design system adhering to a 4px grid:
- **Palette**: Midnight navy neutrals, restrained Azure blue accents, semantic green/amber/red status colors.
- **Typography**: Inter with JetBrains Mono for identifiers, IDs, and financial metrics.
- **Theme Support**: Light, Dark, and System modes with persistent local storage and anti-flash inline script execution.

---

## 10. Phase Tracking & Governance

Development follows phased milestone gates. See [PHASE_STATUS.md](file:///c:/Kuldeep%27s%20Work/Projects/Dashboard/PHASE_STATUS.md) for completed phases, test outputs, and upcoming milestone specifications.
