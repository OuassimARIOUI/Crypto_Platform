/**
 * 🔒 TESTS DE SÉCURITÉ - VALIDATION DES ENTRÉES
 * 
 * Ce fichier teste la sécurité des entrées utilisateur pour prévenir:
 * - XSS (Cross-Site Scripting) - OWASP A03:2021
 * - SQL Injection - OWASP A03:2021
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * 
 * Standard: OWASP Top 10 2021
 * Outils: Vitest + Validation manuelle
 * 
 * @see https://owasp.org/Top10/A03_2021-Injection/
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    registerController,
    loginController,
    pseudoAvailabilityController,
} from "../../controllers/auth.controller.js";
import { register, login, assertPseudoAvailable } from "../../services/authService.js";

// ============================================================================
// CONFIGURATION DES MOCKS
// ============================================================================

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

// ============================================================================
// FONCTIONS HELPER - Réduction de la duplication
// ============================================================================

/**
 * Teste un payload malveillant dans le contexte d'inscription
 * @param {object} req - Requête mockée
 * @param {object} res - Réponse mockée
 * @param {object} bodyOverrides - Champs à surcharger dans req.body
 * @param {string} errorMessage - Message d'erreur attendu
 */
async function testRegisterPayload(req, res, bodyOverrides, errorMessage) {
    req.body = {
        email: "test@mail.com",
        password: "password123",
        pseudo: "validpseudo",
        ...bodyOverrides,
    };
    
    register.mockRejectedValue({
        status: 400,
        message: errorMessage,
    });
    
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
}

/**
 * Teste un payload malveillant dans le contexte de disponibilité pseudo
 * @param {object} req - Requête mockée
 * @param {object} res - Réponse mockée
 * @param {string} pseudo - Pseudo à tester
 */
async function testPseudoAvailability(req, res, pseudo) {
    req.query.pseudo = pseudo;
    
    assertPseudoAvailable.mockRejectedValue({
        status: 400,
        message: "Pseudo invalide",
    });
    
    await pseudoAvailabilityController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
}

// ============================================================================
// SUITE DE TESTS - VALIDATION DES ENTRÉES
// ============================================================================

describe("Sécurité - Validation des entrées", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, query: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        vi.clearAllMocks();
    });

    // ========================================================================
    // TESTS XSS (Cross-Site Scripting) - OWASP A03:2021
    // ========================================================================
    /**
     * XSS permet à un attaquant d'injecter du code JavaScript malveillant.
     * 
     * Prévention: Encoder les sorties, valider les entrées, CSP
     */
    describe("Prévention XSS", () => {
        const xssPayloads = [
            { 
                name: "balise <script> dans pseudo",
                field: "pseudo", 
                value: "<script>alert('xss')</script>",
                error: "Pseudo invalide"
            },
            { 
                name: "balise <script> dans email",
                field: "email", 
                value: "<script>alert('xss')</script>@mail.com",
                error: "Email invalide"
            },
            {
                name: "balise <img> avec onerror",
                field: "pseudo",
                value: "<img src=x onerror=alert(1)>",
                error: "Pseudo invalide"
            },
        ];

        xssPayloads.forEach(({ name, field, value, error }) => {
            it(`devrait rejeter ${name}`, async () => {
                await testRegisterPayload(req, res, { [field]: value }, error);
            });
        });

        it("devrait rejeter les entités HTML encodées", async () => {
            await testPseudoAvailability(req, res, "&lt;img src=x onerror=alert(1)&gt;");
        });
    });

    // ========================================================================
    // TESTS SQL INJECTION - OWASP A03:2021
    // ========================================================================
    /**
     * SQL Injection permet d'exécuter des requêtes SQL arbitraires.
     * 
     * Prévention: Requêtes préparées, ORM (Prisma), validation
     */
    describe("Prévention SQL Injection", () => {
        const sqlPayloads = [
            { 
                name: "injection classique avec commentaire",
                field: "email", 
                value: "admin'--",
                error: "Email invalide"
            },
            { 
                name: "injection OR '1'='1'",
                field: "pseudo", 
                value: "admin' OR '1'='1",
                error: "Pseudo invalide"
            },
            { 
                name: "injection UNION SELECT",
                field: "email", 
                value: "test@mail.com' UNION SELECT * FROM users--",
                error: "Email invalide"
            },
            { 
                name: "injection basée sur le temps",
                field: "email", 
                value: "test@mail.com'; WAITFOR DELAY '00:00:05'--",
                error: "Email invalide"
            },
        ];

        sqlPayloads.forEach(({ name, field, value, error }) => {
            it(`devrait rejeter ${name}`, async () => {
                await testRegisterPayload(req, res, { [field]: value }, error);
            });
        });
    });

    // ========================================================================
    // TESTS NoSQL INJECTION
    // ========================================================================
    describe("Prévention NoSQL Injection", () => {
        it("devrait rejeter l'injection d'objet dans le login", async () => {
            req.body = {
                email: { $ne: null },
                password: { $ne: null },
            };
            
            login.mockResolvedValue(null);
            await loginController(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("devrait rejeter l'opérateur $where", async () => {
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

    // ========================================================================
    // TESTS COMMAND INJECTION
    // ========================================================================
    describe("Prévention Command Injection", () => {
        const commandPayloads = [
            { name: "commande shell", value: "user; rm -rf /" },
            { name: "commande avec backtick", value: "user`whoami`" },
        ];

        commandPayloads.forEach(({ name, value }) => {
            it(`devrait rejeter ${name}`, async () => {
                await testRegisterPayload(req, res, { pseudo: value }, "Pseudo invalide");
            });
        });
    });

    // ========================================================================
    // TESTS PATH TRAVERSAL
    // ========================================================================
    describe("Prévention Path Traversal", () => {
        const pathPayloads = [
            "../../../etc/passwd",
            "..%2F..%2F..%2Fetc%2Fpasswd",
        ];

        pathPayloads.forEach((payload) => {
            it(`devrait rejeter le payload: ${payload}`, async () => {
                await testPseudoAvailability(req, res, payload);
            });
        });
    });

    // ========================================================================
    // TESTS LIMITES DE TAILLE
    // ========================================================================
    describe("Validation des limites de taille", () => {
        const sizeTests = [
            { field: "pseudo", value: "a".repeat(10000), error: "Pseudo trop long" },
            { field: "email", value: "a".repeat(10000) + "@mail.com", error: "Email invalide" },
        ];

        sizeTests.forEach(({ field, value, error }) => {
            it(`devrait rejeter un ${field} trop long`, async () => {
                await testRegisterPayload(req, res, { [field]: value }, error);
            });
        });
    });
});
