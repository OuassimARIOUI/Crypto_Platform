import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { truncateAllTables } from "../_shared/dbUtils.js";

let app;

beforeAll(async () => {
  ({ default: app } = await import("../../../app.js"));
});

beforeEach(async () => {
  await truncateAllTables();
});

describe("Integration: auth routes (real DB)", () => {
  it("POST /auth/register -> POST /auth/login -> GET /auth/me", async () => {
    const email = `test_${Date.now()}@mail.com`;
    const password = "Passw0rd!";
    const pseudo = "abc123";

    const registerRes = await request(app)
      .post("/auth/register")
      .send({ email, password, pseudo });

    expect(registerRes.status).toBe(200);
    expect(registerRes.body).toMatchObject({ success: true });
    expect(registerRes.body.user).toMatchObject({ email, pseudo });

    const loginRes = await request(app).post("/auth/login").send({ email, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user).toMatchObject({ email });

    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({ email, pseudo });
    expect(meRes.body).toHaveProperty("role");
  });
});
