import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    normalizeAccountStatus,
    requireRole,
    requireCanTrade,
} from "../../middleware/accessControl.js";

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        users: {
            update: vi.fn(),
        },
    },
}));

describe("Sécurité - Autorisation", () => {
    let req, res, next;

    beforeEach(() => {
        req = { dbUser: null };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe("Application du statut de compte", () => {
        it("devrait bloquer un utilisateur banni du trading", () => {
            req.dbUser = {
                id: 1,
                status: "banned",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: "Account restricted",
                status: "banned",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait bloquer un utilisateur suspendu du trading", () => {
            req.dbUser = {
                id: 1,
                status: "suspended",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: "Account restricted",
                status: "suspended",
            });
        });

        it("devrait autoriser un utilisateur actif à trader", () => {
            req.dbUser = {
                id: 1,
                status: "active",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("devrait rejeter le trading sans authentification", () => {
            req.dbUser = null;
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });
    });

    describe("Contrôle d'accès basé sur les rôles", () => {
        it("devrait bloquer un utilisateur des routes réservées aux administrateurs", () => {
            req.dbUser = { id: 1, role: "user" };
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait autoriser un administrateur à accéder aux routes admin", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("devrait autoriser un modérateur à accéder aux routes modérateur ou admin", () => {
            req.dbUser = { id: 1, role: "moderator" };
            const middleware = requireRole("moderator", "admin");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("devrait bloquer un utilisateur des routes modérateur", () => {
            req.dbUser = { id: 1, role: "user" };
            const middleware = requireRole("moderator", "admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("devrait gérer l'absence de rôle de manière sécurisée", () => {
            req.dbUser = null;
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });

        it("ne devrait pas permettre l'élévation de rôle via manipulation de paramètres", () => {
            req.dbUser = { id: 1, role: "user" };
            req.query = { role: "admin" };
            req.body = { role: "admin" };
            
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Cas limites de sécurité", () => {
        it("devrait gérer correctement un tableau de rôles", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole(["admin", "moderator"]);
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("devrait filtrer les rôles null de la liste autorisée", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole("admin", null, undefined, "moderator");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("devrait gérer un dbUser undefined de manière sécurisée", () => {
            req.dbUser = undefined;
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("devrait attacher des drapeaux de sécurité à la requête", async () => {
            req.dbUser = {
                id: 1,
                status: "active",
                role: "user",
            };
            
            await normalizeAccountStatus(req, res, next);
            
            expect(req.userRole).toBe("user");
            expect(req.accountStatus).toBe("active");
            expect(req.isBanned).toBe(false);
            expect(req.isSuspended).toBe(false);
        });
    });
});
