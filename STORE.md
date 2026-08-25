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
#    Output:
#    C:\Users\ASUS\AppData\Local\cloak-store\<version>\*.appx
#
# 5) Partner Center → your app → Packages → upload the .appx
#    Fill Store listing (icon, screenshots, description) → Submit for certification
#
# Notes
# - Microsoft re-signs the package. You do NOT need your own code-signing cert for Store.
# - Store installs avoid Smart App Control blocks that hit unsigned Cloak.exe downloads.
# - Keep `npm run build` for GitHub portable releases; use `build:store` only for Store.
# - In-app GitHub updates are disabled when running from the Microsoft Store
#   (the Store updates the app instead).
