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
  max: 300, // limit each IP to 300 requests per windowMs
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

// Routes
app.use("/api/health", healthRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/inventory", inventoryRouter); // Backwards-compatible alias
app.use("/api/costs", costsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/alerts", alertsRouter);

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

const port = config.PORT;
const server = app.listen(port, () => {
  console.log(`[API] ADT-AI Azure Operations Center API listening on port ${port} (mode: ${config.NODE_ENV})`);
});

// Graceful termination for Azure App Service & Node process signals
const shutdown = () => {
  console.log("[API] Shutting down gracefully...");
  server.close(() => {
    console.log("[API] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
