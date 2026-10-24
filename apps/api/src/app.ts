import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { healthRouter } from "./routes/health";
import { resourcesRouter } from "./routes/resources";
import { inventoryRouter } from "./routes/inventory";
import { costsRouter } from "./routes/costs";
import { budgetsRouter } from "./routes/budgets";
import { metricsRouter } from "./routes/metrics";
import { alertsRouter } from "./routes/alerts";
import { authRouter } from "./routes/auth";
import { azureRouter } from "./routes/azure";
import { authenticateToken, requireScope } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: [config.CORS_ORIGIN, "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Lightweight request logging (No auth headers or sensitive payloads logged)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Public routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/azure", azureRouter);

// Protected routes requiring valid Microsoft Entra ID Bearer Token and Dashboard.Read scope
app.use("/api/resources", authenticateToken, requireScope("Dashboard.Read"), resourcesRouter);
app.use("/api/inventory", authenticateToken, requireScope("Dashboard.Read"), inventoryRouter);
app.use("/api/costs", authenticateToken, requireScope("Dashboard.Read"), costsRouter);
app.use("/api/budgets", authenticateToken, requireScope("Dashboard.Read"), budgetsRouter);
app.use("/api/metrics", authenticateToken, requireScope("Dashboard.Read"), metricsRouter);
app.use("/api/alerts", authenticateToken, requireScope("Dashboard.Read"), alertsRouter);

// Root fallback
app.get("/", (_req, res) => {
  res.json({
    name: "ADT-AI Azure Operations Center API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
