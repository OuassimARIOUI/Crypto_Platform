import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth, adminOnly } from "../../middleware/auth.js";
import jwt from "jsonwebtoken";

// Mock JWT
vi.mock("jsonwebtoken", () => ({
    default: {
        verify: vi.fn()
    }
}));

describe("Auth Middleware", () => {

    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();

        vi.clearAllMocks();
    });

    //
    // -----------------------------
    // TESTS auth()
    // -----------------------------
    //
    describe("auth()", () => {

        it("should return 401 if no Authorization header", () => {
            auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Token manquant" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 if token invalid", () => {
            req.headers.authorization = "Bearer invalidtoken";

            jwt.verify.mockImplementation(() => { throw new Error("invalid"); });

            auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Token invalide" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should decode token and call next() if valid", () => {
            req.headers.authorization = "Bearer validtoken";

            const mockDecoded = { id: 1, role: "user" };
            jwt.verify.mockReturnValue(mockDecoded);

            auth(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith("validtoken", process.env.JWT_SECRET);
            expect(req.user).toEqual(mockDecoded);
            expect(next).toHaveBeenCalled();
        });

    });

    //
    // -----------------------------
    // TESTS adminOnly()
    // -----------------------------
    //
    describe("adminOnly()", () => {

        it("should return 403 if user is not admin", () => {
            req.user = { role: "user" };

            adminOnly(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() if user is admin", () => {
            req.user = { role: "admin" };

            adminOnly(req, res, next);

            expect(next).toHaveBeenCalled();
        });

    });

});
