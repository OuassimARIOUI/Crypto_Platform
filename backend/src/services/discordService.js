const DISCORD_API_BASE = "https://discord.com/api/v10";

function getEnv(name) {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : null;
}

function requireEnv(name) {
    const value = getEnv(name);
    if (!value) throw new Error(`${name} is required`);
    return value;
}

export function getDiscordAuthorizeUrl() {
    const clientId = requireEnv("DISCORD_CLIENT_ID");
    const redirectUri = requireEnv("DISCORD_REDIRECT_URI");

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "identify",
        prompt: "consent",
    });

    return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForDiscordIdentity(code) {
    const clientId = requireEnv("DISCORD_CLIENT_ID");
    const clientSecret = requireEnv("DISCORD_CLIENT_SECRET");
    const redirectUri = requireEnv("DISCORD_REDIRECT_URI");

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
        const msg = tokenData?.error_description || tokenData?.error || "Discord token exchange failed";
        throw new Error(msg);
    }

    const accessToken = tokenData.access_token;
    const meRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const me = await meRes.json();
    if (!meRes.ok) {
        throw new Error(me?.message || "Failed to fetch Discord user");
    }

    const username = me.global_name || me.username;

    return {
        id: me.id,
        username,
        raw: me,
    };
}

function getDiscordBotToken() {
    // The user requested DISCORD_API; we also support DISCORD_BOT_TOKEN.
    return getEnv("DISCORD_API") || getEnv("DISCORD_BOT_TOKEN");
}

export async function sendDiscordDM(discordUserId, content) {
    const botToken = getDiscordBotToken();
    if (!botToken) throw new Error("DISCORD_API (or DISCORD_BOT_TOKEN) is required to send DMs");

    // Create (or fetch) a DM channel
    const dmRes = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
        method: "POST",
        headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_id: discordUserId }),
    });

    const dm = await dmRes.json();
    if (!dmRes.ok) {
        const details = dm?.message ? `: ${dm.message}` : "";
        const code = dm?.code ? ` (code ${dm.code})` : "";
        throw new Error(`Failed to create DM channel (HTTP ${dmRes.status})${code}${details}`);
    }

    const channelId = dm.id;
    const msgRes = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
    });

    const msg = await msgRes.json();
    if (!msgRes.ok) {
        const details = msg?.message ? `: ${msg.message}` : "";
        const code = msg?.code ? ` (code ${msg.code})` : "";
        throw new Error(`Failed to send Discord message (HTTP ${msgRes.status})${code}${details}`);
    }

    return msg;
}
