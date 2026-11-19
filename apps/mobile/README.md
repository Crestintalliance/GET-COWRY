# JoinCowry phone app

The iPhone and Android app, built with Expo. It uses the same API as joincowry.com.

## What it does

- Search destinations, or browse by region (Africa, Caribbean, Latin America)
- Pick several countries for one trip
- Choose a plan, enter an email and pay on Stripe's page
- Watch the eSIM get issued, then install it with one tap, or by QR code or by hand
- My eSIMs keeps every eSIM bought on the phone
- English, French, Spanish, Portuguese and German; starts in the phone's language

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On a computer with Node 22: `cd apps/mobile && npm install && npx expo start`
3. Scan the QR code in the terminal with your phone's camera (iPhone) or with Expo Go (Android).

The app talks to `https://cowry-api.onrender.com` (set in `app.json` → `extra.apiUrl`).
To use an API on your computer instead: `EXPO_PUBLIC_API_URL=http://<your-computer-ip>:4000 npx expo start`.

## Store releases

Builds run in the cloud with EAS, so no Mac is needed:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios      # needs an Apple Developer account
npx eas-cli@latest submit --platform android  # needs a Google Play developer account
```

Bundle ID on both stores: `com.crestintalliance.joincowry`.

## Notes

- This folder has its own `package-lock.json` and is left out of the pnpm workspace,
  so the website and API builds on Render don't install the app's dependencies.
- Always add packages with `npx expo install <name>`, which picks versions that match the Expo SDK.
- Checks: `npx tsc --noEmit` and `npx expo lint`.
