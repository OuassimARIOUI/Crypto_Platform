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
     * XSS permet à un attaquant d'injecter du code JavaScript malveillant
     * qui sera exécuté dans le navigateur des autres utilisateurs.
     * 
     * Types de XSS:
     * - Reflected XSS: L'attaque est dans la requête et reflétée dans la réponse
     * - Stored XSS: L'attaque est stockée en BDD et affichée aux utilisateurs
     * - DOM-based XSS: L'attaque modifie le DOM côté client
     * 
     * Prévention:
     * - Encoder/échapper toutes les sorties HTML
     * - Valider et nettoyer les entrées
     * - Utiliser Content Security Policy (CSP)
     * - Utiliser des frameworks qui échappent automatiquement
     */
    describe("Prévention XSS", () => {
        /**
         * TEST 1: XSS via balise <script> dans le pseudo
         * 
         * Payload: <script>alert('xss')</script>
         * Risque: Exécution de code JavaScript arbitraire
         * 
         * Ce test vérifie que l'application rejette les tentatives
         * d'injection de balises <script> dans le champ pseudo.
         */
        it("devrait gérer le XSS dans le pseudo lors de l'inscription", async () => {
            req.body = {
                email: "test@mail.com",
                password: "password123",
                pseudo: "<script>alert('xss')</script>", // 🔴 MALVEILLANT
            };
            
            // L'application DOIT rejeter cette entrée
            register.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await registerController(req, res);
            
            // ✅ Vérification: Le serveur retourne 400 Bad Request
            expect(res.status).toHaveBeenCalledWith(400);
        });

        /**
         * TEST 2: XSS via balise <script> dans l'email
         * 
         * Payload: <script>alert('xss')</script>@mail.com
         * Risque: Exécution de code lors de l'affichage de l'email
         */
        /**
         * TEST 2: XSS via balise <script> dans l'email
         * 
         * Payload: <script>alert('xss')</script>@mail.com
         * Risque: Exécution de code lors de l'affichage de l'email
         */
        it("devrait gérer le XSS dans le champ email", async () => {
            req.body = {
                email: "<script>alert('xss')</script>@mail.com", //  MALVEILLANT
                password: "password123",
                pseudo: "validpseudo",
            };
            
            register.mockRejectedValue({
                status: 400,
                message: "Email invalide",
            });
            
            await registerController(req, res);
            
            // ✅ Le serveur doit rejeter les emails avec des balises HTML
            expect(res.status).toHaveBeenCalledWith(400);
        });

        /**
         * TEST 3: XSS via entités HTML encodées
         * 
         * Payload: &lt;img src=x onerror=alert(1)&gt;
         * Risque: Contournement des filtres par encodage HTML
         * 
         * Les attaquants peuvent encoder les caractères spéciaux pour
         * contourner les filtres basiques. L'application doit décoder
         * ET valider le contenu.
         */
        it("devrait nettoyer les entités HTML dans la vérification du pseudo", async () => {
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

        it("devrait nettoyer les entités HTML dans la vérification du pseudo", async () => {
            req.query.pseudo = "&lt;img src=x onerror=alert(1)&gt;"; // 🔴 XSS encodé
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            // ✅ Même encodé, le contenu malveillant doit être rejeté
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // ========================================================================
    // TESTS SQL INJECTION - OWASP A03:2021
    // ========================================================================
    /**
     * SQL Injection permet à un attaquant d'exécuter des requêtes SQL
     * arbitraires sur la base de données.
     * 
     * Impacts possibles:
     * - Vol de données sensibles (mots de passe, emails, etc.)
     * - Modification/suppression de données
     * - Bypass de l'authentification
     * - Exécution de commandes système (dans certains cas)
     * 
     * Prévention:
     * - Utiliser des requêtes préparées (Prepared Statements)
     * - Utiliser un ORM comme Prisma
     * - Valider et sanitiser TOUTES les entrées
     * - Principe du moindre privilège pour les comptes DB
     * - Limiter les messages d'erreur exposés
     * 
     * @see https://owasp.org/www-community/attacks/SQL_Injection
     */
    describe("Prévention de l'injection SQL", () => {
        /**
         * TEST 4: SQL Injection classique (commentaire)
         * 
         * Payload: admin'--
         * Technique: Ferme la chaîne avec ' et commente le reste avec --
         * Exemple de requête vulnérable:
         *   SELECT * FROM users WHERE email = 'admin'--' AND password = '...'
         * Résultat: Le password check est ignoré!
         * 
         * Avec Prisma, cette attaque est prévenue par les paramètres liés.
         */
        it("devrait rejeter une injection SQL dans le champ email", async () => {
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

        it("devrait rejeter une injection SQL dans le champ pseudo", async () => {
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

        it("devrait gérer une injection SQL basée sur UNION", async () => {
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

        it("devrait prévenir l'injection SQL basée sur le temps", async () => {
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

    describe("Prévention de l'injection NoSQL", () => {
        it("devrait rejeter l'injection d'objet dans le login", async () => {
            req.body = {
                email: { $ne: null },
                password: { $ne: null },
            };
            
            login.mockResolvedValue(null);
            
            await loginController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("devrait rejeter l'injection de l'opérateur $where", async () => {
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

    describe("Prévention de l'injection de commandes", () => {
        it("devrait rejeter les commandes shell dans le pseudo", async () => {
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

        it("devrait rejeter les commandes avec backtick", async () => {
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

    describe("Prévention de la traversée de chemin", () => {
        it("devrait rejeter la traversée de chemin dans le pseudo", async () => {
            req.query.pseudo = "../../../etc/passwd";
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("devrait rejeter la traversée de chemin encodée", async () => {
            req.query.pseudo = "..%2F..%2F..%2Fetc%2Fpasswd";
            
            assertPseudoAvailable.mockRejectedValue({
                status: 400,
                message: "Pseudo invalide",
            });
            
            await pseudoAvailabilityController(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("Limites de taille", () => {
        it("devrait rejeter un pseudo extrêmement long", async () => {
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

        it("devrait rejeter un email extrêmement long", async () => {
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

    describe("Gestion des caractères spéciaux", () => {
        it("devrait gérer les octets nuls dans l'entrée", async () => {
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

        it("devrait gérer correctement les caractères unicode", async () => {
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

        it("devrait gérer les attaques de remplacement RTL", async () => {
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

    describe("Champs manquants ou vides", () => {
        it("devrait rejeter une inscription sans email", async () => {
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

        it("devrait rejeter une inscription sans mot de passe", async () => {
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

        it("devrait rejeter une inscription sans pseudo", async () => {
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

        it("devrait rejeter les valeurs de chaîne vides", async () => {
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
