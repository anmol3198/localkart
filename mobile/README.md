# LocalKart mobile app (Expo / React Native)

One app for both sides of LocalKart:

- **Customers** (no login): shops within 5 km on a list or map, search by item ("milk", "rice"), filter by category, home delivery and open now, see a shop's stock and prices, and call, WhatsApp, get directions or share.
- **Shop owners** ("Sell" tab): register in 4 steps, log in, open/close the shop and pause delivery with one switch, add/edit/delete items, flip items in or out of stock, and edit shop details and map location.

It uses the same API as the website (`../backend`). Maps are Leaflet + OpenStreetMap inside a WebView, so no Google Maps API key is needed.

## Run on your phone (Expo Go)
1. Start the API: `cd ../backend && ./mvnw spring-boot:test-run`
2. Start the app: `npm install && npx expo start`
3. Install **Expo Go** from the Play Store / App Store and scan the QR code. Your phone must be on the same Wi-Fi as the computer.

In development the app automatically calls the API on the computer running `expo start` (port 5050). Demo shop owner login: `shop1@demo.local` / `demo1234`.

`npx expo start --web` runs it in a browser too.

## Point it at a deployed API
Create `.env.local` (git-ignored):
```
EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api
```

## Build for the Play Store / App Store
Builds run in the cloud with EAS, so you don't need Android Studio or Xcode:
```
npx eas-cli@latest build --platform android
```
Release builds must use an HTTPS API URL (`EXPO_PUBLIC_API_URL`); phones block plain HTTP in store builds.

## Code layout
- `src/app/`: screens (Expo Router; every file is a route)
  - `(tabs)/index.jsx` shop list, `(tabs)/map.jsx` map, `(tabs)/owner.jsx` shop owner welcome/dashboard
  - `shop/[id].jsx` shop details, `location.jsx` choose location
  - `owner/login.jsx`, `owner/register.jsx`, `owner/item.jsx` (add/edit item), `owner/settings.jsx`
- `src/components/`: UI kit (`ui.jsx`), shop card, shop form, Leaflet map (`LeafletMap.native.jsx` / `.web.jsx`), location picker
- `src/lib/`: API client, login token storage (device keychain), location, nearby search state, theme, toasts
