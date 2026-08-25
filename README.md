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

## Website (Google sign-in)

Local website:

```bash
npm run web
```

Opens at `http://localhost:5174`. Desktop Discord login stays on `npm run dev`.

### Google OAuth (local + production)

Use **one** Web OAuth client. Under that client, add:

**Authorized JavaScript origins**

| Environment | Origin |
|-------------|--------|
| Local (`npm run dev`) | `http://localhost:5173` |
| Local website (`npm run web`) | `http://localhost:5174` |
| Production | `https://your-domain.com` |

**Authorized redirect URIs** (required for the popup sign-in)

| Environment | Redirect URI |
|-------------|--------------|
| Local (`npm run dev`) | `http://localhost:5173/google-callback.html` |
| Local website (`npm run web`) | `http://localhost:5174/google-callback.html` |
| Production | `https://your-domain.com/google-callback.html` |

Keeping localhost is fine after you go live — it only enables your machine for testing.

Env vars (same Client ID in both places):

```env
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_CONVEX_URL=https://sleek-shark-313.convex.cloud
```

Also set `GOOGLE_CLIENT_ID` in [Convex Dashboard](https://dashboard.convex.dev/) → Settings → Environment Variables (backend token check).

OAuth consent screen: while in **Testing**, only Test users can sign in. For public hosting, publish the app (or add each tester).

### Deploy website on Vercel

1. In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_GOOGLE_CLIENT_ID` | your Google Client ID | Production, Preview |
| `VITE_CONVEX_URL` | `https://sleek-shark-313.convex.cloud` | Production, Preview |

`VITE_*` vars are baked in at **build** time. After adding them, click **Redeploy**.

2. Build settings (or use the included `vercel.json`):
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`

3. In Google Cloud, add your Vercel URL (example `https://cloak-xxx.vercel.app`):
   - JavaScript origin: `https://your-app.vercel.app`
   - Redirect URI: `https://your-app.vercel.app/google-callback.html`

4. In Convex Dashboard, keep `GOOGLE_CLIENT_ID` set (same Client ID).

### Publish Cloak User installer

1. Build the desktop installer:

```bash
npm run build
```

Windows installer lands at:

`C:\Users\ASUS\AppData\Local\cloak-release\<version>\Cloak.exe`

(Built outside OneDrive to avoid Windows file-lock errors.)

2. Upload that file to a GitHub Release (or any CDN).

3. Set on Vercel (and local `.env` if needed):

```env
VITE_CLOAK_DOWNLOAD_URL=https://github.com/realcaps04/Cloak/releases/latest/download/Cloak.exe
VITE_CLOAK_APP_VERSION=
```

4. Redeploy the website. The Products page **Download for Windows** button uses that URL.

### How website auth works

1. User opens the hosted site (or localhost)
2. Clicks **Sign in with Google**
3. Google returns an ID token; Convex verifies it and creates a `googleSessions` row

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

