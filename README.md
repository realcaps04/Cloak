# Cloak

Desktop app for joining FiveM servers without leaking IP links. This folder is the **user app** (`Cloak`). Admin side (`Cloak Admin`) comes next.

## Run it

```bash
cd Cloak
npm install
npm run dev
```

Use **Preview the app** on the login screen to explore the UI before Discord is wired up.

## Discord login setup

1. Create a Discord server for Cloak access.
2. Create an app at [Discord Developer Portal](https://discord.com/developers/applications).
3. OAuth2 → Redirects → add:

   `http://127.0.0.1:19283/callback`

4. Copy `.env.example` to `.env` and fill in:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_REDIRECT_URI=http://127.0.0.1:19283/callback
```

5. Restart `npm run dev`, then use **Continue with Discord**.

If `DISCORD_GUILD_ID` is set, only members of that Discord server can sign in.

## Build an installer

```bash
npm run build
```

Windows installer lands in `release/`.

## What’s next

- Real protected FiveM join flow
- Clipboard leak detection
- **Cloak Admin** desktop app for alerts
