import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CostDataResponse } from "@adt-ai/shared";
import { FileDurableBillingStore } from "../cache/durable-store";
import path from "path";
import fs from "fs";

describe("Durable Billing Store & Cooldown Policy", () => {
  const testCacheDir = path.resolve(process.cwd(), ".cache-test");
  const store = new FileDurableBillingStore(testCacheDir);

  it("stores and retrieves a billing snapshot with 24h cooldown", async () => {
    const subId = "sub-test-cooldown-01";
    const mockData: CostDataResponse = {
      currency: "USD",
      monthToDateTotal: 4820.65,
      previousMonthTotal: 5210.4,
      changePercentage: -7.5,
      byService: [{ serviceName: "Virtual Machines", cost: 2450.0, currency: "USD", percentage: 50.8 }],
      dailyTrend: [],
      billingPeriodStart: "2026-10-01T00:00:00Z",
      billingPeriodEnd: "2026-10-31T23:59:59Z",
      lastSuccessfulRefresh: new Date().toISOString(),
      isStale: false,
      cacheExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      nextScheduledRefresh: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    // Save record with 24-hour cooldown
    await store.saveRecord(subId, mockData, 24 * 60 * 60 * 1000);

    // Retrieve record
    const retrieved = await store.getRecord(subId);
    assert.ok(retrieved !== null);
    assert.equal(retrieved.data.monthToDateTotal, 4820.65);
    assert.equal(retrieved.data.currency, "USD");

    // Check that cooldown is active immediately after query
    const cooldown = await store.isCooldownActive(subId, 24 * 60 * 60 * 1000);
    assert.equal(cooldown.active, true);
    assert.ok(cooldown.remainingMs > 0);
  });

  it("identifies expired cooldown correctly", async () => {
    const subId = "sub-test-expired-01";
    const mockData: CostDataResponse = {
      currency: "USD",
      monthToDateTotal: 100.0,
      previousMonthTotal: 100.0,
      changePercentage: 0,
      byService: [],
      dailyTrend: [],
      billingPeriodStart: "2026-10-01T00:00:00Z",
      billingPeriodEnd: "2026-10-31T23:59:59Z",
      lastSuccessfulRefresh: new Date().toISOString(),
      isStale: false,
      cacheExpiresAt: new Date().toISOString(),
      nextScheduledRefresh: new Date().toISOString(),
    };

    // Save with 1ms cooldown
    await store.saveRecord(subId, mockData, 1);

    // Wait 10ms
    await new Promise((resolve) => setTimeout(resolve, 10));

    const cooldown = await store.isCooldownActive(subId, 1);
    assert.equal(cooldown.active, false);
    assert.equal(cooldown.remainingMs, 0);
  });

  // Clean up test cache directory
  it("cleans up test cache files safely", () => {
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
    assert.equal(fs.existsSync(testCacheDir), false);
  });
});
