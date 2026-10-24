import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../app";
import http from "http";

let server: http.Server;
let port: number;

before((_, done) => {
  server = app.listen(0, () => {
    const addr = server.address();
    if (addr && typeof addr !== "string") {
      port = addr.port;
      done();
    }
  });
});

after((_, done) => {
  server.close(done);
});

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(rawData);
          } catch {
            parsedBody = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

describe("Security & Token Validation Middleware", () => {
  it("rejects unauthenticated request to /api/resources with 401 Unauthorized", async () => {
    const res = await makeRequest("/api/resources");
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Unauthorized");
    assert.match(String(res.headers["www-authenticate"]), /invalid_token/);
  });

  it("rejects unauthenticated request to /api/costs with 401 Unauthorized", async () => {
    const res = await makeRequest("/api/costs");
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Unauthorized");
  });

  it("allows health endpoint without authentication for load balancers", async () => {
    const res = await makeRequest("/api/health");
    assert.equal(res.status, 200);
    assert.ok(res.body.status === "healthy" || res.body.status === "degraded");
  });

  it("accepts valid bearer token with Dashboard.Read scope", async () => {
    const res = await makeRequest("/api/resources", {
      headers: { Authorization: "Bearer mock-token-staff-reader" },
    });
    assert.equal(res.status, 200);
    const body = res.body as { resources: unknown[]; totalCount: number };
    assert.ok(Array.isArray(body.resources));
    assert.ok(body.totalCount > 0);
  });

  it("rejects unauthorized token lacking Dashboard.Read scope with 403 Forbidden", async () => {
    const res = await makeRequest("/api/resources", {
      headers: { Authorization: "Bearer mock-token-unauthorized" },
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "Forbidden");
    assert.match(String(res.headers["www-authenticate"]), /insufficient_scope/);
  });

  it("enforces admin-only role on /api/auth/audit", async () => {
    // Non-admin reader fails
    const readerRes = await makeRequest("/api/auth/audit", {
      headers: { Authorization: "Bearer mock-token-staff-reader" },
    });
    assert.equal(readerRes.status, 403);

    // Admin succeeds
    const adminRes = await makeRequest("/api/auth/audit", {
      headers: { Authorization: "Bearer mock-token-admin" },
    });
    assert.equal(adminRes.status, 200);
    const body = adminRes.body as { logs: unknown[] };
    assert.ok(Array.isArray(body.logs));
  });

  it("returns authenticated profile on /api/auth/me", async () => {
    const res = await makeRequest("/api/auth/me", {
      headers: { Authorization: "Bearer mock-token-staff-reader" },
    });
    assert.equal(res.status, 200);
    const body = res.body as { user: { email: string; scopes: string[] } };
    assert.equal(body.user.email, "ops.staff@adt-ai.org");
    assert.ok(body.user.scopes.includes("Dashboard.Read"));
  });
});
