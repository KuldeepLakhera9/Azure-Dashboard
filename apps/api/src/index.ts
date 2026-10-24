import app from "./app";
import { config } from "./config";

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
