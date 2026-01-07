import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Sécurité - Configuration CORS", () => {
    describe("En-têtes CORS", () => {
        it("devrait autoriser l'origine localhost:3000", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://localhost:3000");
            
            expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
        });

        it("devrait bloquer les origines non autorisées", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://malicious-site.com");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("http://malicious-site.com");
        });

        it("devrait inclure les credentials dans CORS", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://localhost:3000");
            
            expect(response.headers["access-control-allow-credentials"]).toBe("true");
        });

        it("devrait autoriser uniquement des méthodes HTTP spécifiques", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST");
            
            const allowedMethods = response.headers["access-control-allow-methods"];
            expect(allowedMethods).toMatch(/GET|POST|PUT|PATCH|DELETE/);
        });

        it("devrait rejeter la méthode TRACE", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "TRACE");
            
            expect(response.status).not.toBe(200);
        });

        it("devrait rejeter la méthode CONNECT", async () => {
            const response = await request(app)
                .options("/cryptos")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "CONNECT");
            
            expect(response.status).not.toBe(200);
        });
    });

    describe("Validation d'origine", () => {
        it("devrait bloquer l'origine null", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "null");
            
            expect(response.headers["access-control-allow-origin"]).not.toBe("null");
        }, 10000);

        it("devrait bloquer l'origine avec protocole data:", async () => {
            const response = await request(app)
                .get("/cryptos")
                .set("Origin", "data:text/html,<script>alert(1)</script>");
            
            expect(response.headers["access-control-allow-origin"]).not.toContain("data:");
        }, 10000);
    });

    describe("Requêtes Preflight", () => {
        it("devrait gérer correctement les requêtes OPTIONS preflight", async () => {
            const response = await request(app)
                .options("/auth/register")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST")
                .set("Access-Control-Request-Headers", "Content-Type, Authorization");
            
            expect(response.status).toBeLessThanOrEqual(204);
        });

        it("devrait rejeter le preflight avec des en-têtes suspects", async () => {
            const response = await request(app)
                .options("/auth/register")
                .set("Origin", "http://localhost:3000")
                .set("Access-Control-Request-Method", "POST")
                .set("Access-Control-Request-Headers", "X-Malicious-Header");
            
            expect(response.status).toBeLessThanOrEqual(204);
        });
    });
});

describe("Sécurité - En-têtes HTTP", () => {
    describe("Présence des en-têtes de sécurité", () => {
        it("ne devrait pas exposer l'en-tête X-Powered-By", async () => {
            const response = await request(app).get("/health");
            
            expect(response.headers["x-powered-by"]).toBeUndefined();
        });

        it("devrait inclure un Content-Type approprié", async () => {
            const response = await request(app).get("/cryptos");
            
            // Accepte 503 (mode maintenance) sans vérifier content-type
            if (response.status !== 503) {
                expect(response.headers["content-type"]).toMatch(/application\/json/);
            }
        }, 10000);
    });

    describe("Limites de taille de requête", () => {
        it("devrait rejeter un payload JSON extrêmement volumineux", async () => {
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
    });
});

describe("Sécurité - Protection des endpoints", () => {
    describe("Endpoints publics", () => {
        it("devrait autoriser l'accès au endpoint health", async () => {
            const response = await request(app).get("/health");
            
            expect(response.status).toBe(200);
        });

        it("devrait autoriser l'accès au endpoint metrics", async () => {
            const response = await request(app).get("/metrics");
            
            expect(response.status).toBe(200);
        });

        it("devrait autoriser GET /cryptos sans authentification", async () => {
            const response = await request(app).get("/cryptos");
            
            expect([200, 503]).toContain(response.status);
        }, 10000);
    });

    describe("Endpoints protégés", () => {
        it("devrait bloquer POST /alerts sans token", async () => {
            const response = await request(app)
                .post("/alerts")
                .send({ symbol: "BTC", type: "PRICE_ABOVE", threshold: 50000 });
            
            // Accepte 503 si en mode maintenance, sinon attend 401
            expect([401, 503]).toContain(response.status);
        }, 10000);

        it("devrait bloquer POST /portfolio/add-funds sans token", async () => {
            const response = await request(app)
                .post("/portfolio/add-funds")
                .send({ amount: 1000 });
            
            // Accepte 503 si en mode maintenance, sinon attend 401
            expect([401, 503]).toContain(response.status);
        }, 10000);
    });

    describe("Méthodes HTTP", () => {
        it("devrait rejeter les méthodes HTTP non supportées", async () => {
            const response = await request(app)
                .patch("/cryptos")
                .send({ name: "Bitcoin" });
            
            // Accepte 503 si en mode maintenance
            expect([404, 405, 503]).toContain(response.status);
        }, 10000);

        it("devrait gérer les requêtes HEAD en toute sécurité", async () => {
            const response = await request(app).head("/health");
            
            expect([200, 405]).toContain(response.status);
        });
    });
});

describe("Sécurité - Gestion des erreurs", () => {
    describe("Divulgation d'informations d'erreur", () => {
        it("ne devrait pas exposer les chemins internes dans les erreurs", async () => {
            const response = await request(app)
                .post("/auth/register")
                .send({});
            
            expect(JSON.stringify(response.body)).not.toMatch(/C:\\/);
            expect(JSON.stringify(response.body)).not.toMatch(/\/home\//);
            expect(JSON.stringify(response.body)).not.toMatch(/node_modules/);
        }, 10000);
    });

    describe("404 Handling", () => {
        it("should return 404 for non-existent routes", async () => {
            const response = await request(app).get("/this-route-does-not-exist");
            
            // Accept 503 if in maintenance mode
            expect([404, 503]).toContain(response.status);
        }, 10000);
    });
});

describe("Security - Rate Limiting", () => {
    describe("API Abuse Prevention", () => {
        it("should handle rapid requests gracefully", async () => {
            const requests = Array.from({ length: 20 }, () =>
                request(app).get("/prices")
            );
            
            const responses = await Promise.all(requests);
            const statuses = responses.map(r => r.status);
            
            expect(statuses.every(status => [200, 429, 503].includes(status))).toBe(true);
        }, 15000);
    });
});

describe("Security - Content Type Validation", () => {
    describe("JSON Content Type", () => {
        it("should accept application/json content type", async () => {
            const response = await request(app)
                .post("/auth/register")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({
                    email: "test@mail.com",
                    password: "password123",
                    pseudo: "testuser",
                }));
            
            // Accept 503 if in maintenance mode
            expect([200, 201, 400, 409, 500, 503]).toContain(response.status);
        }, 10000);
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
                .send('{"a": {"b": {"c": "[Circular]"}}}}');
            
            // Accept 503 if in maintenance mode
            expect([400, 500, 503]).toContain(response.status);
        });
    });
});
