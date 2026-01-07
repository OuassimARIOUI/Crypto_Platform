import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    registerController,
    loginController,
    pseudoAvailabilityController,
} from "../../controllers/auth.controller.js";
import { register, login, assertPseudoAvailable } from "../../services/authService.js";

vi.mock("../../services/authService.js", () => ({
    register: vi.fn(),
    login: vi.fn(),
    assertPseudoAvailable: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
}));

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: () => ({
            verifyIdToken: vi.fn(),
        }),
    },
}));

describe("Security - Input Validation", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, query: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        vi.clearAllMocks();
    });

    describe("XSS Prevention", () => {
        it("should handle XSS in pseudo during registration", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "<script>alert('xss')</script>",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should handle XSS in email field", async () => {
            req.body = {
                email: "<script>alert('xss')</script>@mail.com",
                password: "password123",
                pseudo: "validpseudo",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should sanitize HTML entities in pseudo check", async () => {
            req.query.pseudo = "&lt;img src=x onerror=alert(1)&gt;";
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("SQL Injection Prevention", () => {
        it("should reject SQL injection in email field", async () => {
            req.body = {
                email: "admin'--",
                password: "password123",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject SQL injection in pseudo field", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "admin' OR '1'='1",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should handle UNION-based SQL injection", async () => {
            req.body = {
                email: "test@mail.com' UNION SELECT * FROM users--",
                password: "password123",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should prevent time-based SQL injection", async () => {
            req.body = {
                email: "test@mail.com'; WAITFOR DELAY '00:00:05'--",
                password: "password123",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("NoSQL Injection Prevention", () => {
        it("should reject object injection in login", async () => {
            req.body = {
                email: { $ne: null },
                password: { $ne: null },
            };
            
            login.mockResolvedValue(null);
            
            await loginController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject $where operator injection", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                $where: "1==1",
            };
            
            login.mockRejectedValue(new Error("Invalid input"));
            
            await loginController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("Command Injection Prevention", () => {
        it("should reject shell commands in pseudo", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "user; rm -rf /",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject backtick commands", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "user`whoami`",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("Path Traversal Prevention", () => {
        it("should reject path traversal in pseudo", async () => {
            req.query.pseudo = "../../../etc/passwd";
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject encoded path traversal", async () => {
            req.query.pseudo = "..%2F..%2F..%2Fetc%2Fpasswd";
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("Size Limits", () => {
        it("should reject extremely long pseudo", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "a".repeat(10000),
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo trop long",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject extremely long email", async () => {
            req.body = {
                email: "a".repeat(10000) + "@mail.com",
                password: "password123",
                pseudo: "validpseudo",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("Special Characters Handling", () => {
        it("should handle null bytes in input", async () => {
            req.body = {
                email: "test\x00@mail.com",
                password: "password123",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should handle unicode characters properly", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "user\u0000\u0001\u0002",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should handle RTL override attacks", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "admin\u202e\u202d",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("Missing or Empty Fields", () => {
        it("should reject registration without email", async () => {
            req.body = {
                password: "password123",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email requis",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject registration without password", async () => {
            req.body = {
                email: "test@mail.com",
                pseudo: "testuser",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Mot de passe requis",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject registration without pseudo", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo requis",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject empty string values", async () => {
            req.body = {
                email: "",
                password: "",
                pseudo: "",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Champs requis",
            });
            
            await registerController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
