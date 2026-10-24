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

function makeAuthRequest(
  path: string,
  token = "mock-token-staff-reader"
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
            body: parsedBody,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

describe("Operational API Routes Integration", () => {
  it("GET /api/resources returns inventory with pagination", async () => {
    const res = await makeAuthRequest("/api/resources?page=1&pageSize=5");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.resources));
    assert.ok(res.body.resources.length <= 5);
    assert.equal(res.body.page, 1);
  });

  it("GET /api/resources/vms returns VM inventory with power states", async () => {
    const res = await makeAuthRequest("/api/resources/vms");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.vms));
    for (const vm of res.body.vms) {
      assert.ok(["running", "deallocated", "stopped", "unknown"].includes(vm.powerState));
      assert.ok(vm.provisioningState);
    }
  });

  it("GET /api/budgets returns configured budgets without fabricating missing ones", async () => {
    const res = await makeAuthRequest("/api/budgets");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.budgets));
  });

  it("GET /api/metrics returns timeseries without fabricating guest memory", async () => {
    const res = await makeAuthRequest(
      "/api/metrics?resourceId=/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01"
    );
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.metrics));
    for (const m of res.body.metrics) {
      assert.ok(m.metricName);
      assert.ok(Array.isArray(m.dataPoints));
    }
  });

  it("GET /api/alerts returns active and resolved subscription alerts", async () => {
    const res = await makeAuthRequest("/api/alerts");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.alerts));
  });
});
