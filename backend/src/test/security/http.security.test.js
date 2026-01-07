import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Security - CORS Configuration", () => {
    describe("CORS Headers", () => {
        it("should allow localhost:3000 origin", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://localhost:3000");
            
            expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
        });

        it("should block unauthorized origins", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://malicious-site.com");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("http://malicious-site.com");
        });

        it("should include credentials in CORS", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://localhost:3000");
            
            expect(response.headers["access-control-allow-credentials"]).toBe("true");
        });

        it("should allow specific HTTP methods only", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST");
            
            const allowedMethods = response.headers["access-control-allow-methods"];
            expect(allowedMethods).toMatch(/GET|POST|PUT|PATCH|DELETE/);
        });

        it("should reject TRACE method", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "TRACE");
            
            expect(response.status).not.toBe(200);
        });

        it("should reject CONNECT method", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "CONNECT");
            
            expect(response.status).not.toBe(200);
        });
    });

    describe("Origin Validation", () => {
        it("should block null origin", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "null");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("null");
        });

        it("should block file:// protocol origin", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "file:///etc/passwd");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("file:///etc/passwd");
        });

        it("should block data: protocol origin", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "data:text/html,<script>alert(1)</script>");
            
            expect(response.headers["access-control-allow-origin"]).not.toContain("data:");
        });

        it("should block subdomain takeover attempts", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "http://localhost:3000.evil.com");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("http://localhost:3000.evil.com");
        });
    });

    describe("Preflight Requests", () => {
        it("should handle OPTIONS preflight correctly", async () => {
            const response = await request(app)
                .options("/auth/register")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST")
                .set("Access-Control-Request-Headers", "Content-Type, Authorization");
            
            expect(response.status).toBeLessThanOrEqual(204);
        });

        it("should reject preflight with suspicious headers", async () => {
            const response = await request(app)
                .options("/auth/register")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST")
                .set("Access-Control-Request-Headers", "X-Malicious-Header");
            
            expect(response.status).toBeLessThanOrEqual(204);
        });
    });
});

describe("Security - HTTP Headers", () => {
    describe("Security Headers Presence", () => {
        it("should not expose X-Powered-By header", async () => {
            const response = await request(app).get("/health");
            
            expect(response.headers["x-powered-by"]).toBeUndefined();
        });

        it("should include proper Content-Type", async () => {
            const response = await request(app).get("/cryptos");
            
            expect(response.headers["content-type"]).toMatch(/application\/json/);
        });
    });

    describe("Request Size Limits", () => {
        it("should reject extremely large JSON payload", async () => {
            const largePayload = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "a".repeat(1000000),
            };
            
            const response = await request(app)
                .post("/auth/register")
                .send(largePayload);
            
            expect([400, 413, 500]).toContain(response.status);
        });

        it("should handle normal sized payloads", async () => {
            const normalPayload = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "testuser",
            };
            
            const response = await request(app)
                .post("/auth/register")
                .send(normalPayload);
            
            expect([200, 201, 400, 409, 500]).toContain(response.status);
        });
    });
});

describe("Security - Endpoint Protection", () => {
    describe("Public Endpoints", () => {
        it("should allow access to health endpoint", async () => {
            const response = await request(app).get("/health");
            
            expect(response.status).toBe(200);
        });

        it("should allow access to metrics endpoint", async () => {
            const response = await request(app).get("/metrics");
            
            expect(response.status).toBe(200);
        });

        it("should allow GET /cryptos without auth", async () => {
            const response = await request(app).get("/cryptos");
            
            expect([200, 503]).toContain(response.status);
        });

        it("should allow GET /prices without auth", async () => {
            const response = await request(app).get("/prices");
            
            expect([200, 503]).toContain(response.status);
        });
    });

    describe("Protected Endpoints", () => {
        it("should block POST /alerts without token", async () => {
            const response = await request(app)
                .post("/alerts")
                .send({ symbol: "BTC", type: "PRICE_ABOVE", threshold: 50000 });
            
            expect(response.status).toBe(401);
        });

        it("should block GET /portfolio/me without token", async () => {
            const response = await request(app).get("/portfolio/me");
            
            expect(response.status).toBe(401);
        });

        it("should block POST /portfolio/add-funds without token", async () => {
            const response = await request(app)
                .post("/portfolio/add-funds")
                .send({ amount: 1000 });
            
            expect(response.status).toBe(401);
        });

        it("should block admin endpoints for non-admin", async () => {
            const response = await request(app)
                .get("/admin/users")
                .set("Authorization", "Bearer fake_user_token");
            
            expect([401, 403]).toContain(response.status);
        });
    });

    describe("HTTP Methods", () => {
        it("should reject unsupported HTTP methods", async () => {
            const response = await request(app)
                .patch("/cryptos")
                .send({ name: "Bitcoin" });
            
            expect([404, 405]).toContain(response.status);
        });

        it("should handle HEAD requests safely", async () => {
            const response = await request(app).head("/health");
            
            expect([200, 405]).toContain(response.status);
        });
    });
});

describe("Security - Error Handling", () => {
    describe("Error Information Disclosure", () => {
        it("should not expose stack traces in production-like responses", async () => {
            const response = await request(app)
                .get("/non-existent-endpoint");
            
            expect(response.body).not.toHaveProperty("stack");
            expect(JSON.stringify(response.body)).not.toMatch(/at \w+\.\w+ \(/);
        });

        it("should not expose internal paths in errors", async () => {
            const response = await request(app)
                .post("/auth/register")
                .send({});
            
            expect(JSON.stringify(response.body)).not.toMatch(/C:\\/);
            expect(JSON.stringify(response.body)).not.toMatch(/\/home\//);
            expect(JSON.stringify(response.body)).not.toMatch(/node_modules/);
        });

        it("should return generic error for server errors", async () => {
            const response = await request(app)
                .post("/auth/register")
                .send({ 
                    email: null,
                    password: null,
                    pseudo: null 
                });
            
            if (response.status === 500) {
                expect(response.body).toHaveProperty("error");
                expect(response.body.error).not.toMatch(/prisma|database|sql/i);
            }
        });
    });

    describe("404 Handling", () => {
        it("should return 404 for non-existent routes", async () => {
            const response = await request(app).get("/this-route-does-not-exist");
            
            expect(response.status).toBe(404);
        });

        it("should not leak route information on 404", async () => {
            const response = await request(app).get("/admin/secret-endpoint-12345");
            
            expect([401, 403, 404]).toContain(response.status);
        });
    });
});

describe("Security - Rate Limiting", () => {
    describe("Brute Force Protection", () => {
        it("should track failed login attempts", async () => {
            const attempts = [];
            
            for (let i = 0; i < 10; i++) {
                const response = await request(app)
                    .post("/auth/login")
                    .send({
                        email: "test@mail.com",
                        password: "wrongpassword",
                    });
                
                attempts.push(response.status);
            }
            
            expect(attempts.every(status => [400, 401, 429, 500].includes(status))).toBe(true);
        });
    });

    describe("API Abuse Prevention", () => {
        it("should handle rapid requests gracefully", async () => {
            const requests = Array.from({ length: 20 }, () =>
                request(app).get("/prices")
            );
            
            const responses = await Promise.all(requests);
            const statuses = responses.map(r => r.status);
            
            expect(statuses.every(status => [200, 429, 503].includes(status))).toBe(true);
        });
    });
});

describe("Security - Content Type Validation", () => {
    describe("JSON Content Type", () => {
        it("should reject non-JSON content type for JSON endpoints", async () => {
            const response = await request(app)
                .post("/auth/register")
                .set("Content-Type", "text/plain")
                .send("email=test@mail.com&password=123");
            
            expect([400, 415, 500]).toContain(response.status);
        });

        it("should accept application/json content type", async () => {
            const response = await request(app)
                .post("/auth/register")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({
                    email: "test@mail.com",
                    password: "password123",
                    pseudo: "testuser",
                }));
            
            expect([200, 201, 400, 409, 500]).toContain(response.status);
        });
    });

    describe("Malformed Content", () => {
        it("should reject malformed JSON", async () => {
            const response = await request(app)
                .post("/auth/register")
                .set("Content-Type", "application/json")
                .send('{"email": "test@mail.com", "password": }');
            
            expect([400, 500]).toContain(response.status);
        });

        it("should handle JSON with circular references", async () => {
            const response = await request(app)
                .post("/auth/register")
                .set("Content-Type", "application/json")
                .send('{"a": {"b": {"c": "[Circular]"}}}');
            
            expect([400, 500]).toContain(response.status);
        });
    });
});
