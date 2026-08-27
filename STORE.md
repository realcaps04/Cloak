# Microsoft Store (simple checklist)
#
# 1) Create a developer account
#    https://partner.microsoft.com/dashboard
#
# 2) Create a new app → reserve name "Cloak Desktop" (or your name)
#
# 3) Open the app → Product management → Product identity
#    Copy these 3 values into electron-builder.store.json → "appx":
#
#    Package/Identity → Name     → identityName
#    Package/Identity → Publisher → publisher   (looks like CN=XXXX-...)
#    Package/Application → Display name → displayName / publisherDisplayName
#
# 4) Build the Store package (from this repo):
#
#    npm run build:store
#
#    This regenerates Cloak-branded AppX tile icons under build/appx/
#    (required — otherwise electron-builder embeds the default Electron atom
#    and Microsoft rejects with policy 10.1.1.11 On Device Tiles).
#
#    Output:
#    C:\Users\ASUS\AppData\Local\cloak-store\<version>\*.appx
#
# 5) Before uploading, sanity-check tiles (optional):
#    Rename the .appx to .zip, open assets\ — StoreLogo / Square* / Wide*
#    must show the Cloak hooded-shield icon, NOT the Electron atom.
#
# 6) Partner Center → your app → Packages → upload the .appx
#    Fill Store listing (icon, screenshots, description) → Submit for certification
#
# 7) Certification notes (Submission options / Additional testing information):
#
#    Discord sign-in opens the system browser. If the tester cannot complete
#    Discord OAuth, use the on-screen button:
#      "Preview Cloak (Store review)"
#    That opens the main UI without hanging (fixes 10.1.2.10 indefinite load).
#    Join Cloak also auto-cancels after 90 seconds if the browser never returns.
#
#    Optional: provide a Discord test account that is already a member of the
#    Cloak Discord guild, plus steps: Join Cloak → authorize → return to app.
#
# Notes
# - Microsoft re-signs the package. You do NOT need your own code-signing cert for Store.
# - Store installs avoid Smart App Control blocks that hit unsigned Cloak.exe downloads.
# - Keep `npm run build` for GitHub portable releases; use `build:store` only for Store.
# - In-app GitHub updates are disabled when running from the Microsoft Store
#   (the Store updates the app instead).
# - If certification fails again on tiles, re-run `npm run generate:appx-assets`
#   and confirm build/appx/*.png files exist before `npm run build:store`.
