# Discord Alerts Setup

## Why OAuth is required
A Discord *username* alone is not enough to send a DM.
Discord DMs require the **Discord user id** (snowflake) + a **Bot token**.

This project links a user’s Discord account via **Discord OAuth2 (scope: `identify`)** to retrieve the user id, then uses a Discord **Bot** to send DMs.

## Required environment variables (backend)
Set these in `backend/.env` (values depend on your Discord developer app):

- `DISCORD_API` (preferred) or `DISCORD_BOT_TOKEN`: Discord Bot token
- `DISCORD_CLIENT_ID`: OAuth2 client id
- `DISCORD_CLIENT_SECRET`: OAuth2 client secret
- `DISCORD_REDIRECT_URI`: must match the Redirect URI configured in Discord portal
  - Local dev suggested: `http://localhost:3000/discord/callback`

## Discord Developer Portal steps
1. Create an application: https://discord.com/developers/applications
2. OAuth2:
   - Add Redirect URI = your `DISCORD_REDIRECT_URI`
3. Bot:
   - Create a bot
   - Copy the Bot token → put it in `DISCORD_API`

## App flow
1. User clicks **Connect Discord** on profile.
2. They authorize in Discord.
3. Discord redirects to frontend: `/discord/callback?code=...`
4. Frontend calls backend `POST /discord/exchange` (authenticated) to store:
   - `users.discord_user_id`
   - `users.discord_username`
5. Worker job `check-alerts` scans pending alerts and, when triggered, sends a DM to the linked Discord account.

## Notes / limitations
- A bot can only DM users if the user allows DMs or shares a server with the bot (Discord platform rules). If DM fails, the alert is still marked triggered.
- Alerts are currently **one-shot** (once triggered, `is_triggered=true`). You can reset via `POST /alerts/:id/reset`.
