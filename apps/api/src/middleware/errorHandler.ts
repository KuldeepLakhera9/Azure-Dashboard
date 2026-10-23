import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Sanitize any potential token or connection string before logging
  const sanitizedMessage = err.message
    .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, "$1[REDACTED]")
    .replace(/(key=|Secret=|password=)[^&;]+/gi, "$1[REDACTED]");

  console.error(`[API Error] ${sanitizedMessage}`);

  res.status(500).json({
    error: "Internal Server Error",
    message: sanitizedMessage,
    timestamp: new Date().toISOString(),
  });
}
