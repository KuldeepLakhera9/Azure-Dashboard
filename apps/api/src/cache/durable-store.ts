import fs from "fs";
import path from "path";
import { CostDataResponse } from "@adt-ai/shared";

export interface DurableBillingRecord {
  subscriptionId: string;
  data: CostDataResponse;
  lastSuccessfulQueryTime: string;
  nextAllowedQueryTime: string;
  cooldownMs: number;
}

export interface IDurableBillingStore {
  getRecord(subscriptionId: string): Promise<DurableBillingRecord | null>;
  saveRecord(subscriptionId: string, data: CostDataResponse, cooldownMs?: number): Promise<void>;
  isCooldownActive(
    subscriptionId: string,
    cooldownMs?: number
  ): Promise<{ active: boolean; remainingMs: number; lastQuery: string | null }>;
}

/**
 * FileDurableBillingStore
 * Lightweight, robust persistent store that persists billing records across
 * Node process restarts, multiple backend processes, and deployments.
 * Stores records safely in `.cache/azure-billing-store.json`.
 */
export class FileDurableBillingStore implements IDurableBillingStore {
  private cacheFilePath: string;
  private defaultCooldownMs = 24 * 60 * 60 * 1000; // 24 hours cooldown

  constructor(customPath?: string) {
    const dir = customPath || path.resolve(process.cwd(), ".cache");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn(`[DurableStore] Unable to create cache dir at ${dir}:`, err);
      }
    }
    this.cacheFilePath = path.join(dir, "azure-billing-store.json");
  }

  private readAll(): Record<string, DurableBillingRecord> {
    try {
      if (!fs.existsSync(this.cacheFilePath)) {
        return {};
      }
      const raw = fs.readFileSync(this.cacheFilePath, "utf-8");
      return JSON.parse(raw) as Record<string, DurableBillingRecord>;
    } catch (err) {
      console.warn("[DurableStore] Error reading billing store, initializing empty:", err);
      return {};
    }
  }

  private writeAll(records: Record<string, DurableBillingRecord>): void {
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(records, null, 2), "utf-8");
    } catch (err) {
      console.error("[DurableStore] Error writing billing store to disk:", err);
    }
  }

  public async getRecord(subscriptionId: string): Promise<DurableBillingRecord | null> {
    const all = this.readAll();
    return all[subscriptionId] || null;
  }

  public async saveRecord(
    subscriptionId: string,
    data: CostDataResponse,
    cooldownMs = this.defaultCooldownMs
  ): Promise<void> {
    const all = this.readAll();
    const now = new Date();
    const nextAllowed = new Date(now.getTime() + cooldownMs);

    all[subscriptionId] = {
      subscriptionId,
      data,
      lastSuccessfulQueryTime: now.toISOString(),
      nextAllowedQueryTime: nextAllowed.toISOString(),
      cooldownMs,
    };

    this.writeAll(all);
    console.log(
      `[DurableStore] Persisted cost record for ${subscriptionId}. Cooldown active until ${nextAllowed.toISOString()}`
    );
  }

  public async isCooldownActive(
    subscriptionId: string,
    cooldownMs = this.defaultCooldownMs
  ): Promise<{ active: boolean; remainingMs: number; lastQuery: string | null }> {
    const record = await this.getRecord(subscriptionId);
    if (!record || !record.lastSuccessfulQueryTime) {
      return { active: false, remainingMs: 0, lastQuery: null };
    }

    const last = new Date(record.lastSuccessfulQueryTime).getTime();
    const elapsed = Date.now() - last;
    const effectiveCooldown = record.cooldownMs || cooldownMs;

    if (elapsed < effectiveCooldown) {
      return {
        active: true,
        remainingMs: effectiveCooldown - elapsed,
        lastQuery: record.lastSuccessfulQueryTime,
      };
    }

    return { active: false, remainingMs: 0, lastQuery: record.lastSuccessfulQueryTime };
  }
}

export const durableBillingStore = new FileDurableBillingStore();
