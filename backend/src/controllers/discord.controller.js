import { prisma } from "../services/dbService.js";
import { getDiscordAuthorizeUrl, exchangeCodeForDiscordIdentity } from "../services/discordService.js";

export async function getConnectUrlController(req, res) {
    try {
        const url = getDiscordAuthorizeUrl();
        return res.json({ url });
    } catch (err) {
        return res.status(500).json({ error: err.message || "Failed to build Discord URL" });
    }
}

export async function exchangeDiscordCodeController(req, res) {
    const { code } = req.body || {};

    if (!code) {
        return res.status(400).json({ error: "code is required" });
    }

    try {
        const identity = await exchangeCodeForDiscordIdentity(code);

        // Vérifier si ce compte Discord est déjà lié à un autre utilisateur
        const existingUser = await prisma.users.findFirst({
            where: {
                discord_user_id: identity.id,
                NOT: { id: req.userId }
            }
        });

        if (existingUser) {
            return res.status(409).json({ 
                error: `This Discord account (@${identity.username}) is already linked to another user.` 
            });
        }

        const user = await prisma.users.update({
            where: { id: req.userId },
            data: {
                discord_user_id: identity.id,
                discord_username: identity.username,
                discord_connected_at: new Date(),
            },
        });

        return res.json({ success: true, user });
    } catch (err) {
        // Gérer l'erreur de contrainte unique au cas où la vérification échoue (race condition)
        if (err.code === 'P2002' && err.meta?.target?.includes('discord_user_id')) {
            return res.status(409).json({ 
                error: "This Discord account is already linked to another user." 
            });
        }
        return res.status(500).json({ error: err.message || "Discord exchange failed" });
    }
}

export async function disconnectDiscordController(req, res) {
    try {
        const user = await prisma.users.update({
            where: { id: req.userId },
            data: {
                discord_user_id: null,
                discord_connected_at: null,
            },
        });

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ error: err.message || "Failed to disconnect Discord" });
    }
}
