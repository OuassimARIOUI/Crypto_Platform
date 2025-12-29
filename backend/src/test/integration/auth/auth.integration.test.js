import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

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

  it("POST /auth/login returns 400 for wrong password", async () => {
    const email = `bad_${Date.now()}@mail.com`;
    const password = "Passw0rd!";
    const pseudo = `usr${Date.now()}`;

    const registerRes = await request(app)
      .post("/auth/register")
      .send({ email, password, pseudo });

    expect(registerRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email, password: "WrongPassw0rd!" });

    expect(loginRes.status).toBe(400);
    expect(loginRes.body).toMatchObject({ error: "Identifiants incorrects" });
  });
});
