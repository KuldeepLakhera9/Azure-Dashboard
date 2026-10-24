# ADT-AI Azure Operations Center

Production-grade Azure infrastructure and cloud operations monitoring dashboard built for **ADT-AI Training Foundation**.

---

## 1. Product Objective

The **ADT-AI Azure Operations Center** provides authorized engineering and operations staff with a single, secure, read-only operational dashboard to monitor an Azure subscription and all its accessible workloads, virtual machines, operational performance metrics, and cost management data.

Key capabilities:
- **Azure Resource Inventory**: Near real-time inventory and provisioning states via Azure Resource Graph with continuation-token pagination.
- **Virtual Machine Power States**: Accurate VM instance view tracking (`PowerState/running`, `PowerState/deallocated`) distinct from provisioning states.
- **Cost Analytics**: Month-to-date Azure costs with service and resource group breakdowns, distinguishing Actual Cost, Amortized Cost, and Forecasted Cost.
- **Budget Governance**: Configured budgets, consumption burn rates, multi-marker threshold visualization, and honest unconfigured state detection.
- **Infrastructure Telemetry**: Host-level CPU utilization, disk IOPS, and network throughput (with clear boundary separating hypervisor metrics from guest OS memory).
- **Billing Query Cooldown**: Persistent 24-hour query cooldown surviving server restarts to respect Azure Cost Management API throttling limits.
- **Enterprise Authentication & RBAC**: Microsoft Entra ID dual app registration architecture with cryptographic JWKS token verification, `Dashboard.Read` scope, and `Dashboard.Admin` role protection.
- **Strict Read-Only Guarantee**: Zero resource mutation or deletion APIs, preventing accidental operational downtime.

---

## 2. Architecture & Production Deployment Topology

```
                                    +------------------------------------------+
                                    |         Microsoft Entra ID               |
                                    |  (Single Sign-On & Token Issuance)       |
                                    +--------------------+---------------------+
                                                         |
                                       Issues Bearer JWT | (Delegated Scope: Dashboard.Read)
                                                         v
+-------------------------------+               +--------------------------------------+
|       Vercel Hosting          |  HTTPS API    |   Azure App Service (Linux Node 20)  |
|  Next.js 14 App Router (SPA)  | ------------> |       Express Operational API        |
|  - MSAL Browser Auth          |  Bearer JWT   |  - Cryptographic JWKS Verification   |
|  - Skeletons & Responsive UI  |               |  - System-Assigned Managed Identity  |
|  - Dark / Light / System Mode |               |  - FileDurableBillingStore (24h)     |
+-------------------------------+               +------------------+-------------------+
                                                                   |
                                                  Official Azure SDKs | Managed Identity
                                                  (Least-Privilege)   | Reader & Cost Mgmt Reader
                                                                   v
                                                +--------------------------------------+
                                                |        Target Azure Subscription     |
                                                |  - Azure Resource Graph              |
                                                |  - Compute InstanceView API          |
                                                |  - Cost Management Query API         |
                                                |  - Consumption Budgets API           |
                                                |  - Azure Monitor Metrics             |
                                                +--------------------------------------+
```

### Hosting Architecture
- **Frontend**: Next.js 14 hosted on **Vercel** with global edge CDN, zero-config SSR, and automated branch previews.
- **Backend**: Express REST API hosted on **Azure App Service on Linux** running Node.js 20 LTS runtime.
- **Identity & Authentication**: Microsoft Entra ID with dual App Registrations (`adt-ai-ops-spa` for browser PKCE, `adt-ai-ops-api` for JWT audience validation).
- **Azure Access**: System-assigned Managed Identity (production) or `DefaultAzureCredential` (local dev) using subscription-level `Reader` and `Cost Management Reader` roles.
- **Strict No-Docker Requirement**: All components run, build, and deploy as native Node.js processes. Zero Dockerfiles, Docker containers, or container registries exist in this repository.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, Recharts, Microsoft Authentication Library (`@azure/msal-browser`, `@azure/msal-react`).
- **Backend**: Node.js 20 LTS, Express 4, TypeScript (Strict Mode), Zod schema validation, `jose` (JWKS token verification), Azure SDKs (`@azure/identity`, `@azure/arm-resourcegraph`, `@azure/arm-compute`, `@azure/arm-monitor`, `@azure/arm-consumption`).
- **Testing**: Node.js native test runner (`tsx --test`), Supertest API assertions, ESLint, TypeScript compiler.

---

## 4. Repository Structure

```
├── apps/
│   ├── web/                     # Next.js App Router frontend (Vercel deployment target)
│   │   ├── src/
│   │   │   ├── app/             # Application layout, globals.css, route pages
│   │   │   ├── components/      # UI components (Header, ThemeProvider, AppShell, Drawers)
│   │   │   └── lib/             # API client, auth context, mock data & formatters
│   │   ├── .eslintrc.json       # Next.js ESLint configuration
│   │   ├── package.json
│   │   ├── tailwind.config.ts   # Design tokens & color system
│   │   └── tsconfig.json        # Strict TypeScript configuration
│   │
│   └── api/                     # Node.js + Express backend (Azure App Service Linux target)
│       ├── src/
│       │   ├── app.ts           # Express application configuration & route binding
│       │   ├── cache/           # FileDurableBillingStore & tiered memory cache
│       │   ├── config/          # Zod-validated environment configuration
│       │   ├── middleware/      # Error sanitization, rate limiting, and auth guards
│       │   ├── routes/          # Express route controllers (health, resources, costs, budgets, metrics)
│       │   ├── services/        # Azure SDK integration, AuditService, and Mock data providers
│       │   ├── tests/           # Automated integration test suite (auth, api, billing)
│       │   └── index.ts         # Server entrypoint and graceful shutdown handler
│       ├── .eslintrc.json       # TypeScript ESLint configuration
│       ├── package.json
│       └── tsconfig.json        # Strict TypeScript configuration
│
├── packages/
│   └── shared/                  # Shared TypeScript interfaces & Zod validation schemas
│       ├── src/                 # Domain models, API contracts, and validation schemas
│       ├── package.json
│       └── tsconfig.json        # Strict TypeScript composite project
│
├── docs/                        # Enterprise architecture and security specifications
│   └── ENTERPRISE_AUTHENTICATION.md # Entra ID dual app registration guide
├── PHASE_STATUS.md              # Project status tracker and phase transition ledger
├── package.json                 # Monorepo workspace orchestrator
├── .gitignore                   # Ignored files (node_modules, dist, .cache, .env)
└── README.md                    # Project documentation
```

---

## 5. Environment Variables Reference

### Backend Configuration (`apps/api/.env`)

| Variable Name | Required | Default | Meaning & Production Usage |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port for the Express HTTP server. In Azure App Service, set to `8080`. |
| `NODE_ENV` | Optional | `development` | `production` enables strict error sanitization and disables stack traces. |
| `CORS_ORIGIN` | **Required (Prod)** | `http://localhost:3000` | Allowed frontend origin. Set to the production Vercel URL (e.g., `https://adt-ai-ops.vercel.app`). |
| `AZURE_SUBSCRIPTION_ID` | **Required** | `f3834a10-6431-4a62-8a1b-738cb5629169` | Target Azure Subscription ID for ADT-AI Training Foundation. |
| `USE_MOCK_AZURE` | Optional | `true` | When `true`, returns simulated Azure data. Set to `false` for live Azure ARM data. |
| `AZURE_USE_MANAGED_IDENTITY` | Optional | `false` | When deployed to Azure App Service, set to `true`. |
| `AZURE_RESOURCE_REFRESH_INTERVAL_MINUTES` | Optional | `15` | Polling cycle for Resource Graph and VM power state telemetry. |
| `AZURE_COST_CACHE_TTL_HOURS` | Optional | `24` | Cache cooldown for Cost Management API queries. |
| `AZURE_COST_REFRESH_INTERVAL_HOURS` | Optional | `24` | Background refresh schedule for cost summaries. |
| `OPERATIONAL_CACHE_TTL_MS` | Optional | `900000` | In-memory cache duration for inventory and metrics (15 minutes). |
| `BILLING_CACHE_TTL_MS` | Optional | `86400000` | Cooldown duration for Cost Management API queries (24 hours). |
| `ENTRA_TENANT_ID` | Optional | `""` | Microsoft Entra Tenant ID for cryptographic token verification. |
| `ENTRA_API_CLIENT_ID` | Optional | `""` | Application (client) ID of `adt-ai-ops-api`. |
| `ENTRA_API_AUDIENCE` | Optional | `api://adt-ai-ops-api` | Expected `aud` claim in incoming JWT tokens. |
| `ENTRA_REQUIRED_SCOPE` | Optional | `Dashboard.Read` | Delegated scope required on incoming tokens to access data routes. |

### Frontend Configuration (`apps/web/.env.local`)

> [!WARNING]
> **Zero Secrets Policy**: Never put Azure client secrets, service principal passwords, or subscription credentials in `NEXT_PUBLIC_` variables. Variables prefixed with `NEXT_PUBLIC_` are embedded in client-side JavaScript bundles and visible to the public internet.

| Variable Name | Required | Default | Meaning & Production Usage |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Required** | `http://localhost:5000/api` | Base URL of the Express API (e.g., `https://adt-ai-ops-api.azurewebsites.net/api`). |
| `NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID` | Optional | `f3834a10-6431-4a62-8a1b-738cb5629169` | Active subscription context displayed in UI headers and telemetry. |
| `NEXT_PUBLIC_AZURE_TENANT_ID` | Optional | `""` | Microsoft Entra ID Tenant ID for MSAL authentication. |
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | Optional | `""` | Application (client) ID of the frontend SPA registration (`adt-ai-ops-spa`). |
| `NEXT_PUBLIC_AZURE_REDIRECT_URI` | Optional | `http://localhost:3000/login` | Production redirect URI (e.g., `https://adt-ai-ops.vercel.app/login`). |
| `NEXT_PUBLIC_ENTRA_API_SCOPE` | Optional | `api://adt-ai-ops-api/Dashboard.Read` | Delegated permission scope requested during user login. |

---

## 6. Local Azure CLI Interactive Connection Steps

To connect the operations center to your live Azure subscription locally without hardcoding secrets:

1. **Install the Azure CLI** if not already present on your workstation:
   ```bash
   az --version
   ```
2. **Open a terminal in the project directory**.
3. **Sign in interactively**:
   ```bash
   az login
   ```
4. **Select the target subscription**:
   ```bash
   az account set --subscription "f3834a10-6431-4a62-8a1b-738cb5629169"
   ```
5. **Verify the selected subscription**:
   ```bash
   az account show --output table
   ```
6. **Confirm your identity can query resources**:
   ```bash
   az resource list --subscription "f3834a10-6431-4a62-8a1b-738cb5629169" --query "[].{Name:name,Type:type,Location:location}" --output table
   ```
7. **Install project dependencies using npm**:
   ```bash
   npm install
   ```
8. **Configure the local environment**:
   In `apps/api/.env`, toggle `USE_MOCK_AZURE=false` to use the authenticated Azure CLI identity via `DefaultAzureCredential`:
   ```env
   AZURE_SUBSCRIPTION_ID=f3834a10-6431-4a62-8a1b-738cb5629169
   USE_MOCK_AZURE=false
   ```
9. **Start the development server**:
   ```bash
   npm run dev
   ```
10. **Open the browser** at `http://localhost:3000/settings` and click **Test Connection** to verify live ARM telemetry and RBAC permissions.

---

## 7. Azure Role Assignments (Least-Privilege RBAC)

When deploying to Azure App Service, enable the **System-Assigned Managed Identity**. Grant strictly read-only permissions at the subscription scope:

```bash
# Get the Managed Identity Principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name adt-ai-ops-api \
  --resource-group rg-adt-ai-ops \
  --query principalId \
  --output tsv)

# 1. Reader (Resource Graph, VM InstanceViews, Monitor Metrics)
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Reader" \
  --scope "/subscriptions/f3834a10-6431-4a62-8a1b-738cb5629169"

# 2. Cost Management Reader (Cost Management Query API & Budgets)
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cost Management Reader" \
  --scope "/subscriptions/f3834a10-6431-4a62-8a1b-738cb5629169"
```

> [!CAUTION]
> **Strict Least-Privilege Requirement**: Never grant `Contributor`, `Owner`, or any write/delete roles to the dashboard's identity. The dashboard has zero mutating actions and requires only read access.

---

## 8. Local Development & Testing Commands

All commands are managed from the root using npm workspaces:

```bash
# Install dependencies across all packages
npm install

# Run automated integration tests (Auth, Operational APIs, Durable Billing Store, Azure Status)
npm run test

# Run strict TypeScript validation across all workspaces
npm run typecheck

# Run ESLint checks across all workspaces
npm run lint

# Run both Web and API concurrently in development mode
npm run dev

# Run only the backend API (port 5000 with hot-reload)
npm run dev:api

# Run only the frontend SPA (port 3000)
npm run dev:web

# Clean and compile production builds for all workspaces
npm run build
```

---

## 9. Production Deployment Procedures (No Docker)

### Backend Deployment to Azure App Service on Linux

1. **Create the App Service Plan and Web App**:
   ```bash
   # Create a resource group
   az group create --name rg-adt-ai-ops --location eastus

   # Create a Linux App Service plan (B1 or higher recommended)
   az appservice plan create \
     --name plan-adt-ai-ops \
     --resource-group rg-adt-ai-ops \
     --is-linux \
     --sku B1

   # Create the Web App with Node 20 LTS runtime
   az webapp create \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --plan plan-adt-ai-ops \
     --runtime "NODE:20-lts"
   ```

2. **Enable System-Assigned Managed Identity**:
   ```bash
   az webapp identity assign \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops
   ```

3. **Configure Startup Command & App Settings**:
   ```bash
   # Configure startup command
   az webapp config set \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --startup-file "node dist/index.js"

   # Configure environment variables
   az webapp config appsettings set \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --settings \
       PORT=8080 \
       NODE_ENV=production \
       CORS_ORIGIN="https://adt-ai-ops.vercel.app" \
       AZURE_SUBSCRIPTION_ID="<YOUR_AZURE_SUBSCRIPTION_ID>" \
       USE_MOCK_AZURE=false \
       ENTRA_TENANT_ID="<YOUR_TENANT_ID>" \
       ENTRA_API_CLIENT_ID="<API_CLIENT_ID>" \
       ENTRA_API_AUDIENCE="api://adt-ai-ops-api" \
       ENTRA_REQUIRED_SCOPE="Dashboard.Read"
   ```

4. **Enable HTTPS Only & Configure Health Probe**:
   ```bash
   # Enforce HTTPS
   az webapp update \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --https-only true

   # Set health check path
   az webapp config set \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --generic-configurations '{"healthCheckPath": "/api/health"}'
   ```

5. **Deploy Backend Build via ZIP Deploy**:
   ```bash
   # Build the project locally
   npm run build

   # Create deployment archive for the API
   cd apps/api
   npm prune --production
   zip -r api-deploy.zip dist package.json ../../node_modules

   # Deploy ZIP to Azure App Service
   az webapp deployment source config-zip \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --src api-deploy.zip
   ```

### Frontend Deployment to Vercel

1. Import the repository in **Vercel Dashboard** (`https://vercel.com/new`).
2. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_API_URL`: `https://adt-ai-ops-api.azurewebsites.net/api`
   - `NEXT_PUBLIC_AZURE_TENANT_ID`: `<YOUR_TENANT_ID>`
   - `NEXT_PUBLIC_ENTRA_CLIENT_ID`: `<FRONTEND_SPA_CLIENT_ID>`
   - `NEXT_PUBLIC_ENTRA_REDIRECT_URI`: `https://adt-ai-ops.vercel.app/login`
   - `NEXT_PUBLIC_ENTRA_API_SCOPE`: `api://adt-ai-ops-api/Dashboard.Read`
4. Deploy and verify the live production URL.

---

## 10. Verification Results & Quality Gates

The production codebase has been validated against all enterprise acceptance criteria:

| Quality Gate | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **ESLint Checks** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean across `@adt-ai/shared`, `@adt-ai/api`, `@adt-ai/web`. |
| **Strict TypeScript** | `npm run typecheck` | **PASS (0 errors)** | Full strict-mode type-safety across all 3 workspaces. |
| **Automated Tests** | `npm run test` | **PASS (15/15 passed)** | Validates 401 unauth, 403 scope/role guards, API pagination, and durable billing cooldown. |
| **Production Build** | `npm run build` | **PASS (Exit code 0)** | Compiles shared library, builds Express JS bundle, prerenders 11 Next.js routes. |
| **Strict No-Docker** | File audit | **PASS** | Zero Dockerfiles, docker-compose, or container files exist. |

---

## 11. Known Limitations & Operational Considerations

1. **Azure Cost Management Data Latency**:
   - Azure Cost Management data is not real-time; Azure processes billing records with an inherent **24 to 48-hour reporting delay**.
   - The application enforces a **24-hour durable query cooldown** via `FileDurableBillingStore`. This prevents Azure API rate-limit throttling (HTTP 429) and unnecessary billing query costs.
2. **Hypervisor vs. Guest OS Memory**:
   - Azure Monitor provides host hypervisor metrics. Deep guest operating system memory utilization requires the Azure Monitor Agent (AMA) and a Log Analytics workspace. In accordance with zero-fabrication rules, guest memory is not estimated.
3. **Strict Read-Only Release**:
   - In accordance with the Phase 1-8 scope, the application contains zero start, stop, restart, delete, or modify actions to ensure that monitoring staff cannot trigger unintended cloud outages.

---

## 12. Rollback Procedures

### Frontend Rollback (Vercel)
1. Navigate to **Deployments** in the Vercel dashboard.
2. Select the previous stable deployment.
3. Click **Promote to Production** (instant zero-downtime rollback).
4. Alternatively via CLI:
   ```bash
   vercel rollback <deployment-url>
   ```

### Backend Rollback (Azure App Service)
1. **Deployment Slots (Recommended)**:
   ```bash
   # Swap staging slot back to production
   az webapp deployment slot swap \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --slot staging \
     --target-slot production
   ```
2. **Re-deploy Previous ZIP Artifact**:
   ```bash
   az webapp deployment source config-zip \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --src previous-stable-api-deploy.zip
   ```
3. **Configuration Rollback**:
   To revert environment variables or app settings:
   ```bash
   az webapp config appsettings set \
     --name adt-ai-ops-api \
     --resource-group rg-adt-ai-ops \
     --settings <KEY>=<PREVIOUS_VALUE>
   ```
