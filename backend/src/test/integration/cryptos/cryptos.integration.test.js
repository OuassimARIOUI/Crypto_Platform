import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { prisma } from "../../../services/dbService.js";
import { truncateAllTables } from "../_shared/dbUtils.js";
import { disableMaintenance } from "../_shared/maintenanceUtils.js";

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../../app.js"));
});

beforeEach(async () => {
  await truncateAllTables();
  await disableMaintenance();
});

describe("Integration: cryptos routes (real DB)", () => {
  it("GET /cryptos returns cryptos with latest price", async () => {
    const symbol = `t${Date.now().toString(36).slice(-7)}`.toLowerCase();

    const crypto = await prisma.cryptos.create({
      data: {
        symbol,
        name: "TestCoin",
      },
    });

    // Older price
    await prisma.crypto_prices.create({
      data: {
        crypto_id: crypto.id,
        price_usd: "100.00",
        change_percent_24h: "1.25",
        fetched_at: new Date("2024-01-01T00:00:00.000Z"),
      },
    });

    // Latest price
    await prisma.crypto_prices.create({
      data: {
        crypto_id: crypto.id,
        price_usd: "200.00",
        change_percent_24h: "-2.50",
        fetched_at: new Date("2024-01-02T00:00:00.000Z"),
      },
    });

    const res = await request(app).get("/cryptos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const row = res.body.find((c) => c.symbol === symbol);
    expect(row).toBeTruthy();

    expect(row).toMatchObject({
      symbol,
      name: "TestCoin",
      sparkline: null,
    });

    // Decimal fields might serialize as strings; compare as numbers for robustness.
    expect(Number(row.price)).toBeCloseTo(200, 6);
    expect(Number(row.change)).toBeCloseTo(-2.5, 6);
    expect(typeof row.logo).toBe("string");
    expect(row.logo).toContain(`/${symbol}/`);
  });
});
