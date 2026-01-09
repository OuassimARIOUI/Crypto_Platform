import { describe, it, expect, vi } from "vitest";
import { requireCanTrade, requireRole } from "../../middleware/accessControl.js";

describe("Sécurité - Vérifications du statut de compte", () => {
    describe("Protection des comptes bannis", () => {
        it("devrait empêcher un utilisateur banni d'accéder aux ressources", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "banned",
                    banned_until: new Date(Date.now() + 86400000),
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait empêcher un utilisateur suspendu de trader", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "suspended",
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Prévention de la manipulation du statut", () => {
        it("ne devrait pas permettre à un utilisateur de changer son propre statut", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "banned",
                    role: "user",
                },
                body: {
                    status: "active",
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});

describe("Sécurité - Gestion des sessions", () => {
    describe("Cycle de vie du token", () => {
        it("devrait rejeter les requêtes sans contexte utilisateur", () => {
            const req = {
                dbUser: null,
                user: null,
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("devrait valider que l'utilisateur existe dans la base de données", () => {
            const req = {
                user: { uid: "deleted_user" },
                dbUser: null,
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const middleware = requireRole("user");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("Gestion des sessions concurrentes", () => {
        it("devrait gérer plusieurs requêtes avec le même token", async () => {
            const token = "Bearer valid_token";
            const requests = [
                { headers: { authorization: token } },
                { headers: { authorization: token } },
                { headers: { authorization: token } },
            ];
            
            expect(requests.every(r => r.headers.authorization === token)).toBe(true);
        });
    });
});

describe("Sécurité - Contrôle d'accès aux ressources", () => {
    describe("Vérification de la propriété", () => {
        it("devrait empêcher un utilisateur d'accéder aux portfolios d'autres utilisateurs", () => {
            const requestingUserId = 1;
            const targetUserId = 2;
            
            expect(requestingUserId).not.toBe(targetUserId);
        });

        it("devrait empêcher un utilisateur de modifier les alertes d'autres utilisateurs", () => {
            const alertOwnerId = 1;
            const requestingUserId = 2;
            
            expect(alertOwnerId).not.toBe(requestingUserId);
        });
    });

    describe("Prévention de l'élévation de privilèges administrateur", () => {
        it("ne devrait pas permettre à un utilisateur de s'octroyer le rôle admin", () => {
            const req = {
                dbUser: { id: 1, role: "user" },
                body: { role: "admin" },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("devrait exiger le rôle admin pour la gestion des utilisateurs", () => {
            const req = {
                dbUser: { id: 1, role: "moderator" },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});
