import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth, adminOnly } from "../../middleware/auth.js";

const verifyIdTokenMock = vi.fn();
const prismaMock = {
    users: {
        findUnique: vi.fn(),
        update: vi.fn(),
    },
};

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: () => ({
            verifyIdToken: verifyIdTokenMock,
        }),
    },
}));

vi.mock("../../services/dbService.js", () => ({
    prisma: prismaMock,
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

        it("should return 401 if token invalid", async () => {
            req.headers.authorization = "Bearer invalidtoken";

            verifyIdTokenMock.mockRejectedValue(new Error("invalid"));

            await auth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Token invalide" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should decode token and call next() if valid", async () => {
            req.headers.authorization = "Bearer validtoken";

            const mockDecoded = { uid: "firebase-uid", email: "a@b.com" };
            verifyIdTokenMock.mockResolvedValue(mockDecoded);
            prismaMock.users.findUnique.mockResolvedValue({
                id: 1,
                email: "a@b.com",
                pseudo: "p",
                firebase_uid: "firebase-uid",
                role: "user",
            });

            await auth(req, res, next);

            expect(verifyIdTokenMock).toHaveBeenCalledWith("validtoken");
            expect(req.user).toEqual(mockDecoded);
            expect(req.dbUser).toMatchObject({ id: 1, role: "user" });
            expect(req.userId).toBe(1);
            expect(next).toHaveBeenCalled();
        });

        it("should resolve by email and link firebase uid", async () => {
            req.headers.authorization = "Bearer validtoken";

            const mockDecoded = { uid: "firebase-uid", email: "a@b.com" };
            verifyIdTokenMock.mockResolvedValue(mockDecoded);

            prismaMock.users.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 2,
                    email: "a@b.com",
                    pseudo: "p2",
                    firebase_uid: null,
                    role: "user",
                });

            prismaMock.users.update.mockResolvedValue({
                id: 2,
                email: "a@b.com",
                pseudo: "p2",
                firebase_uid: "firebase-uid",
                role: "user",
            });

            await auth(req, res, next);

            expect(prismaMock.users.update).toHaveBeenCalled();
            expect(req.userId).toBe(2);
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
            req.dbUser = { role: "user" };

            adminOnly(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() if user is admin", () => {
            req.dbUser = { role: "admin" };

            adminOnly(req, res, next);

            expect(next).toHaveBeenCalled();
        });

    });

});
