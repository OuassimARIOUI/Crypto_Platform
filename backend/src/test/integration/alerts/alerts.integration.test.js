import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Mock Firebase verification ONLY (external dependency)
const { verifyIdTokenMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
}));

vi.mock("../../../services/firebaseAdmin.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: verifyIdTokenMock,
    }),
  },
}));

import { prisma } from "../../../services/dbService.js";
import { truncateAllTables } from "../_shared/dbUtils.js";
import { disableMaintenance } from "../_shared/maintenanceUtils.js";

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../../app.js"));
});

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAllTables();
  await disableMaintenance();
});

describe("Integration: alerts routes (real DB)", () => {
  it("POST /alerts -> GET /alerts -> DELETE /alerts/:id", async () => {
    const user = await prisma.users.create({
      data: {
        email: `a_${Date.now()}@mail.com`,
        pseudo: `alert_${Math.floor(Math.random() * 900 + 100)}_${Date.now()}`,
        firebase_uid: "uid_alert_1",
        role: "user",
        status: "active",
        password: "test_password_hash",
      },
    });

    const symbol = `t${Date.now().toString(36).slice(-7)}`.toLowerCase();

    await prisma.cryptos.create({
      data: {
        symbol,
        name: "TestCoin",
      },
    });

    verifyIdTokenMock.mockResolvedValue({ uid: "uid_alert_1", email: user.email });

    const createRes = await request(app)
      .post("/alerts")
      .set("Authorization", "Bearer firebase_test_token")
      .send({ symbol, type: "PRICE_ABOVE", threshold: 100 });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({ success: true });
    expect(createRes.body.alert).toHaveProperty("id");

    const createdId = createRes.body.alert.id;
    const inDb = await prisma.alerts.findUnique({ where: { id: createdId } });
    expect(inDb).toBeTruthy();
    expect(inDb.user_id).toBe(user.id);

    const listRes = await request(app)
      .get("/alerts")
      .set("Authorization", "Bearer firebase_test_token");

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    const listed = listRes.body.find((a) => a.id === createdId);
    expect(listed).toBeTruthy();
    expect(listed).toMatchObject({
      user_id: user.id,
      alert_type: "PRICE_ABOVE",
    });
    expect(listed.cryptos).toMatchObject({ symbol });

    const alertId = createdId;

    const deleteRes = await request(app)
      .delete(`/alerts/${alertId}`)
      .set("Authorization", "Bearer firebase_test_token");

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ success: true });

    const listAfter = await request(app)
      .get("/alerts")
      .set("Authorization", "Bearer firebase_test_token");

    expect(listAfter.status).toBe(200);
    expect(listAfter.body).toEqual([]);
  });
});
