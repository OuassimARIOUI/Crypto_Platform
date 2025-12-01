import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import express from "express";

/* -----------------------------
   MOCK DES CONTROLEURS
----------------------------- */

vi.mock("../../controllers/alerts.controller.js", () => ({
    alertsController: vi.fn((req, res) => res.json({ ok: "alerts" }))
}));

vi.mock("../../controllers/auth.controller.js", () => ({
    registerController: vi.fn((req, res) => res.json({ ok: "register" })),
    loginController: vi.fn((req, res) => res.json({ ok: "login" })),
    meController: vi.fn((req, res) => res.json({ ok: "me" }))
}));

vi.mock("../../controllers/cryptos.controller.js", () => ({
    getAllCryptosController: vi.fn((req, res) => res.json({ ok: "cryptos" }))
}));

vi.mock("../../controllers/indicators.controller.js", () => ({
    indicatorsController: vi.fn((req, res) =>
        res.json({ ok: "indicators", symbol: req.params.symbol })
    )
}));

vi.mock("../../controllers/portfolio.controller.js", () => ({
    getMyPortfolioController: vi.fn((req, res) => res.json({ ok: "portfolio" })),
    buyCryptoController: vi.fn((req, res) => res.json({ ok: "buy" })),
    sellCryptoController: vi.fn((req, res) => res.json({ ok: "sell" })),
    addFundsController: vi.fn((req, res) => res.json({ ok: "addfunds" }))
}));

vi.mock("../../controllers/price.controller.js", () => ({
    getLatestPricesController: vi.fn((req, res) =>
        res.json({ ok: "latestprices" })
    )
}));

vi.mock("../../controllers/priceHistory.controller.js", () => ({
    getPriceHistoryController: vi.fn((req, res) =>
        res.json({ ok: "history", symbol: req.params.symbol })
    )
}));

/* -----------------------------
   MOCK DU MIDDLEWARE AUTH
----------------------------- */

vi.mock("../../middleware/auth.js", () => ({
    auth: vi.fn((req, res, next) => {
        req.user = { id: 99, role: "user" };
        next();
    })
}));

/* -----------------------------
   IMPORT DES ROUTES
----------------------------- */

import alertsRoutes from "../../routes/alerts.routes.js";
import authRoutes from "../../routes/auth.routes.js";
import cryptosRoutes from "../../routes/cryptos.routes.js";
import indicatorsRoutes from "../../routes/indicators.routes.js";
import portfolioRoutes from "../../routes/portfolio.routes.js";
import pricesRoutes from "../../routes/prices.routes.js";

/* -----------------------------
   INSTALLATION D’UNE APP EXPRESS DE TEST
----------------------------- */

const app = express();
app.use(express.json());

app.use("/alerts", alertsRoutes);
app.use("/auth", authRoutes);
app.use("/cryptos", cryptosRoutes);
app.use("/indicators", indicatorsRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/prices", pricesRoutes);

/* -----------------------------
   TESTS DES ROUTES
----------------------------- */

describe("TEST COMPLET DES ROUTES", () => {

    it("GET /alerts", async () => {
        const res = await request(app).get("/alerts");
        expect(res.body).toEqual({ ok: "alerts" });
    });

    it("POST /auth/register", async () => {
        const res = await request(app).post("/auth/register");
        expect(res.body).toEqual({ ok: "register" });
    });

    it("POST /auth/login", async () => {
        const res = await request(app).post("/auth/login");
        expect(res.body).toEqual({ ok: "login" });
    });

    it("GET /auth/me", async () => {
        const res = await request(app).get("/auth/me");
        expect(res.body).toEqual({ ok: "me" });
    });

    it("GET /cryptos", async () => {
        const res = await request(app).get("/cryptos");
        expect(res.body).toEqual({ ok: "cryptos" });
    });

    it("GET /indicators/:symbol", async () => {
        const res = await request(app).get("/indicators/btc");
        expect(res.body).toEqual({ ok: "indicators", symbol: "btc" });
    });

    /* ---------- PORTFOLIO (protégé par auth) ---------- */

    it("GET /portfolio/me", async () => {
        const res = await request(app).get("/portfolio/me");
        expect(res.body).toEqual({ ok: "portfolio" });
    });

    it("POST /portfolio/buy", async () => {
        const res = await request(app).post("/portfolio/buy").send({ symbol: "btc", quantity: 1 });
        expect(res.body).toEqual({ ok: "buy" });
    });

    it("POST /portfolio/sell", async () => {
        const res = await request(app).post("/portfolio/sell").send({ symbol: "btc", quantity: 1 });
        expect(res.body).toEqual({ ok: "sell" });
    });

    it("POST /portfolio/add-funds", async () => {
        const res = await request(app).post("/portfolio/add-funds").send({ amount: 200 });
        expect(res.body).toEqual({ ok: "addfunds" });
    });

    /* ---------- PRICES ---------- */

    it("GET /prices", async () => {
        const res = await request(app).get("/prices");
        expect(res.body).toEqual({ ok: "latestprices" });
    });

    it("GET /prices/history/:symbol", async () => {
        const res = await request(app).get("/prices/history/eth");
        expect(res.body).toEqual({ ok: "history", symbol: "eth" });
    });

});
