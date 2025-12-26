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

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../../app.js"));
});

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAllTables();
});

describe("Integration: portfolio routes (real DB)", () => {
  it("POST /portfolio/add-funds updates balance for active user", async () => {
    // Arrange: DB user + portfolio
    const user = await prisma.users.create({
      data: {
        email: `u_${Date.now()}@mail.com`,
        pseudo: `usr${Math.floor(Math.random() * 900 + 100)}123`,
        firebase_uid: "uid_test_1",
        role: "user",
        status: "active",
        password: "test_password_hash",
      },
    });

    await prisma.portfolios.create({
      data: { user_id: user.id, balance: 0, total_deposited: 0 },
    });

    // Auth header token is validated by mocked Firebase Admin
    verifyIdTokenMock.mockResolvedValue({ uid: "uid_test_1", email: user.email });

    const res = await request(app)
      .post("/portfolio/add-funds")
      .set("Authorization", "Bearer firebase_test_token")
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, balance: 50 });

    const updated = await prisma.portfolios.findUnique({ where: { user_id: user.id } });
    expect(updated.balance).toBe(50);
    expect(updated.total_deposited).toBe(50);
  });

  it("POST /portfolio/add-funds is blocked when account is banned", async () => {
    const user = await prisma.users.create({
      data: {
        email: `b_${Date.now()}@mail.com`,
        pseudo: `ban${Math.floor(Math.random() * 900 + 100)}123`,
        firebase_uid: "uid_test_2",
        role: "user",
        status: "banned",
        password: "test_password_hash",
      },
    });

    await prisma.portfolios.create({
      data: { user_id: user.id, balance: 0, total_deposited: 0 },
    });

    verifyIdTokenMock.mockResolvedValue({ uid: "uid_test_2", email: user.email });

    const res = await request(app)
      .post("/portfolio/add-funds")
      .set("Authorization", "Bearer firebase_test_token")
      .send({ amount: 10 });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: "Account restricted", status: "banned" });
  });
});
