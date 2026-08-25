# Cloak

Desktop app for joining FiveM servers without leaking IP links. This folder is the **user app** (`Cloak`). Admin side (`Cloak Admin`) comes next.

## Run it

```bash
cd Cloak
npm install
npm run dev
```

Sign in with Discord — only members of the Cloak community server can get in.

Community invite: [discord.gg/2KmAr9TUU](https://discord.gg/2KmAr9TUU)

## Discord login setup

1. Create an app at [Discord Developer Portal](https://discord.com/developers/applications).
2. OAuth2 → Redirects → add:

   `http://127.0.0.1:19283/callback`

3. Copy `.env.example` to `.env` and fill in **Client ID** and **Client Secret**.

   Guild ID, invite link, and server name are already set for the Cloak community server.

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_GUILD_ID=1541706899597299785
DISCORD_GUILD_NAME=Cloak
DISCORD_INVITE_URL=https://discord.gg/2KmAr9TUU
```

4. Restart `npm run dev`.

### How verification works

1. User joins the [Cloak Discord](https://discord.gg/2KmAr9TUU)
2. User clicks **Continue with Discord** in the app
3. Cloak checks they are a member of your server before letting them in

If they are not in the server, the app shows a **Join Cloak** button with your invite link.

## Build an installer

```bash
npm run build
```

Windows installer lands in `release/`.

## Convex backend

Real Convex deployment: `https://sleek-shark-313.convex.cloud`

Tables:
- `users` — Discord-verified members
- `sessions` — 30-day login sessions (app reopen skips Discord)

After Discord membership passes, Cloak writes the user + session to Convex and stores the session token on disk. Next launch restores from Convex automatically.

Deploy function changes:

```bash
npm run convex:deploy
```

