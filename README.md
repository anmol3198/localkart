# LocalKart (Spring Boot + React)

Local shops register and list their inventory. Customers see shops within **5 km**, check what's in stock, and **call (or WhatsApp) the shop to order**. Each shop decides whether it offers home delivery, its delivery radius (up to 5 km), the minimum order and the delivery charge.

## Stack
- **mobile/**: Expo (React Native) app for customers and shop owners. See `mobile/README.md`.
- **backend/**: Java 21, Spring Boot 4.1, Spring Data JPA, PostgreSQL, Flyway, Spring Security (stateless JWT, HS256), Bean Validation
- **frontend/**: React + Vite + MUI, Leaflet/OpenStreetMap maps (no API key needed)

## Run locally

**1. API (port 5050).** No database install is needed. `spring-boot:test-run` starts an embedded PostgreSQL that keeps its data in `backend/.pgdata`, and seeds demo shops on first run.
```bash
cd backend && ./mvnw spring-boot:test-run
```
**2. UI (port 5173).** It proxies `/api` to the backend.
```bash
cd frontend && npm install && npm run dev
```
Demo vendor login: `shop1@demo.local` / `demo1234`. The demo shops are around Koramangala, Bengaluru. "Far Away Mart" is about 7.5 km away and correctly does not appear.

### Using a real PostgreSQL
```bash
docker compose up -d   # or any PostgreSQL 14+
cd backend && DB_URL=jdbc:postgresql://localhost:5432/localkart DB_USER=localkart DB_PASSWORD=localkart \
  JWT_SECRET='<at least 32 random chars>' SEED=false ./mvnw spring-boot:run
```
Flyway creates the schema (`src/main/resources/db/migration`). For production, build with `./mvnw package` and run `java -jar target/localkart-api-*.jar`.

| Env var | Default | |
|---|---|---|
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/localkart`, `localkart`, `localkart` | |
| `JWT_SECRET` | none (required) | random, at least 32 characters (`openssl rand -base64 48`) |
| `MAX_SEARCH_RADIUS_KM` | `5` | customer search radius cap |
| `CORS_ORIGIN` | `*` | comma-separated origin patterns |
| `SEED` | `true` | demo data, only inserted when the DB is empty |

## Deploy (free tier: Neon + Render + Cloudflare Pages)
1. **Database:** create a PostgreSQL database on [Neon](https://neon.tech) (use the direct host, not `-pooler`, since Flyway needs it).
2. **API:** on [Render](https://render.com), create a Web Service from this repo with root directory `backend` and the Docker runtime (`backend/Dockerfile`), health check path `/api/health`. Set these environment variables:
   - `DB_URL` = `jdbc:postgresql://<neon-host>/<db>?sslmode=require`
   - `DB_USER`, `DB_PASSWORD` from Neon
   - `JWT_SECRET` = a random string of at least 32 characters
   - `CORS_ORIGIN` = your website address, e.g. `https://localkart.pages.dev`
   - `SEED` = `true` to load the demo shops, `false` for a real launch
   - `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` for the first super admin

   Render sets `PORT`, and Flyway creates the tables on first start.
3. **Website:** on [Cloudflare Pages](https://pages.cloudflare.com) (Workers & Pages → Create → Pages → Import an existing Git repository): root directory `frontend`, build command `npm run build`, output directory `dist`, and variables `VITE_API_URL` = `https://<render-app>.onrender.com/api` and `NODE_VERSION` = `22`. `frontend/public/_headers` adds the security headers. (Vercel also works: `frontend/vercel.json`.)
4. **App:** set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` in `mobile/eas.json` to the live addresses, then build with EAS.

Live now: website https://localkart.pages.dev, API https://https-localkart-onrender-com.onrender.com/api.

## Shop insights (customer activity)
The website and app report when a customer opens a shop page (`VIEW`) or taps Call, WhatsApp or Directions. Shop owners see the numbers on the dashboard's **Insights** tab (web) and the **Insights** screen (app): totals, the change against the previous period, a day-by-day chart and where customers came from.

- **Counted once per visitor:** each device keeps a random visitor id, and repeats inside 30 minutes (views) or 5 minutes (taps) are ignored, including simultaneous double taps. Owners viewing their own shop are not counted.
- **Privacy:** only a salted one-way hash of the visitor id (or of IP + user agent when there is no id) is stored, never the raw value or IP.
- **Abuse limits:** 300 events per IP per 15 minutes; invalid types, sources or ids are rejected with a clear message.
- Days are counted in India time (Asia/Kolkata). Demo shops get ~45 days of sample activity the first time the app starts with `SEED=true`.

## Barcode scanning and QR poster
- **Scan to add / update:** items can have an optional barcode (unique within a shop). In the app, **Scan** opens the camera: a known item shows a stock switch and Edit; a new product opens Add item with the name filled in when Open Food Facts knows it (coverage of Indian brands is partial, so the owner may type the name once). On the website, scanning with a USB barcode scanner (or typing a code and pressing Enter) in the inventory search does the same. Retail codes (EAN-8/13, UPC-A, GTIN-14) are checked with their check digit, so typos are caught. Set `BARCODE_LOOKUP=false` to turn the outside lookup off.
- **QR poster:** owners print an A4 poster (website: dashboard → QR poster; app: My Shop → QR poster) whose QR opens their shop page. On the app set `EXPO_PUBLIC_WEB_URL` to the live website address so posters point to it.

## WhatsApp order cart
Customers tap **Add** on in-stock items, adjust quantities, choose **pickup** or **home delivery**, and send the order to the shop as a ready-made WhatsApp message (website and app). Shops with a landline get "copy order and call" instead.
- **Checks before sending:** at least one item; delivery only if the shop delivers to the customer's location and the minimum order is met ("Add ₹X more"); a full address for delivery; optional name and note lengths. Just before sending, the latest stock and prices are fetched: removed or out-of-stock items are dropped and price changes are shown, so the customer re-checks before anything is sent.
- **Privacy:** orders are not stored on LocalKart's servers; the message goes from the customer's WhatsApp to the shop. The cart, name and address are remembered only on the customer's device. LocalKart counts that an order was sent (`ORDER` event), shown to the shop as "Orders sent" in Insights and in the admin dashboard.
- Payment and delivery are between the customer and the shop.

## Roles, shop review and the admin area
| Role | Who | Can |
|---|---|---|
| (none) | Customers | Browse approved shops, call/WhatsApp, no login needed |
| `SHOP_OWNER` | Registered shops | Manage their own shop, items and insights (`/api/vendor/**`) |
| `ADMIN` | LocalKart staff | Review and moderate shops, see the dashboard and audit log (`/api/admin/**`) |
| `SUPER_ADMIN` | You | Everything an admin can, plus add/deactivate admins (`/api/admin/admins/**`) |

The role is in the login token and checked by the API on every request.

- **New shops start as `PENDING` and are invisible to customers** (search, shop page, activity) until staff approve them. Staff can reject (with a note the owner sees), suspend a live shop (hidden, owner can't make changes), or reinstate it. Owners see their status on the dashboard and can fix their details and resubmit. Every action goes to the audit log.
- **Admin area:** `/admin` on the website (not linked from the public pages, marked noindex): dashboard with app-wide numbers, review queue, all shops, audit log, and admin accounts for super admins.
- **First super admin:** set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` (10+ characters with letters and numbers) on the API; it is created on start-up if that email has no account. Add more admins from the admin area. Admin accounts can't be created through public sign-up.
- **Local dev:** `spring-boot:test-run` creates `admin@localkart.test` / `LocalAdmin2026` (only on your computer).
- Not yet: business-document upload and shopfront photo (step 2), phone OTP (step 3), 2-step verification for admins.

## Security
- **`JWT_SECRET` is required.** The API refuses to start without it (or with a short or publicly known value), so logins can't be forged. Generate one with `openssl rand -base64 48`. Local dev (`spring-boot:test-run`) sets a throwaway one.
- Passwords are hashed with bcrypt; 8+ characters with letters and numbers. Login timing doesn't reveal which emails are registered.
- **Limits:** per IP: 50 login/register attempts, 300 activity events and 600 public browsing requests per 15 minutes (429 with `Retry-After`). Per account: 10 wrong passwords lock that account for 15 minutes. Behind a proxy the real client IP is used (`server.forward-headers-strategy=native`, trusting only private proxy addresses). Limits are in memory, so use Redis or similar when running several instances.
- **Sessions:** tokens last 7 days and carry a version; "Log out other devices" and password changes invalidate all older tokens.
- Owners can only read or change their own shop and items. All SQL is parameterised, inputs are validated on the server, and errors never include internal details.
- **Website headers** (`frontend/public/_headers` for Cloudflare Pages/Netlify, `vercel.json` for Vercel): CSP, HSTS, no framing, nosniff, strict referrer, permissions policy. If the API isn't on `*.onrender.com`, add its origin to `connect-src`.
- Set `CORS_ORIGIN` to the website's address in production (the default allows any origin).
- Dependabot (`.github/dependabot.yml`) proposes library updates; turn on Dependabot alerts and security updates in the GitHub repo settings.
- Not yet: password reset (needs email/SMS, planned with phone OTP), admin approval of new shops, and monitoring/alerting.

## Install without an app store (free)
- **Website as an app (iPhone and Android):** the site has a web app manifest, icons and a service worker (`frontend/public/manifest.webmanifest`, `sw.js`), so phones can add it to the home screen and it opens full-screen. Android/Chrome shows an **Install** button; iPhone visitors get Share → Add to Home Screen steps. Footer link: **Get the app**. The service worker caches only the site's own files; API data, maps and fonts always load live. Bump `VERSION` in `sw.js` if you change its caching.
- **Android APK:** `cd mobile && npx eas-cli build -p android --profile preview` builds an installable APK on Expo's free plan and prints a download link to share. People tap it and allow "install unknown apps". The `preview` profile uses the live API and website addresses and includes only ARM code (`armeabi-v7a,arm64-v8a`, what real phones use), which roughly halves the APK. Play Store builds (AAB) are split per phone automatically.

## Privacy Policy, Terms and account deletion
- The website has `/privacy` and `/terms` (`frontend/src/pages/Privacy.jsx`, `Terms.jsx`); the app links to them on the website. Contact and Grievance Officer details are in `frontend/src/lib/legal.js`.
- Sign-up requires accepting both: the API rejects registrations without `acceptTerms: true` and stores when and which version was accepted (`terms_accepted_at`, `terms_version`). When the documents change, update `LAST_UPDATED` in `legal.js` and `Legal.TERMS_VERSION` in the API.
- Shop owners can delete their shop (account, items and activity) under **Shop settings → Password & security**, after re-entering their password (`POST /api/vendor/account/delete`). App stores require in-app account deletion.

## Tests
```bash
cd backend && ./mvnw test
```
Integration tests run against a real embedded PostgreSQL. They cover the 5 km cutoff, the radius cap, product search, the delivery filter and "delivers to you", register/login, inventory CRUD, partial updates, validation, and that a vendor cannot touch another shop's items.

## How the 5 km search works
`ShopService.nearby` first narrows candidates with a lat/lng **bounding box**, using the `(latitude, longitude)` index. It then computes the exact **Haversine** distance, keeps shops ≤ radius, and sorts nearest first. The radius is capped server-side at `MAX_SEARCH_RADIUS_KM`. `q` matches the shop name or any product in its inventory. `deliversToYou` = shop delivers **and** customer distance ≤ the shop's delivery radius.

If the app outgrows a single city, switch to PostGIS (`geography(Point)` + `ST_DWithin` with a GiST index). The service is the only place that changes.

## API
| Method | Path | Auth |
|---|---|---|
| GET | `/api/shops/nearby?lat&lng&q&category&delivery=true&radiusKm` | public |
| GET | `/api/shops/{id}?lat&lng` | public (shop + inventory) |
| GET | `/api/meta` | public (categories, max radius) |
| POST | `/api/auth/register`, `/api/auth/login` | public, rate-limited; returns JWT |
| GET / PUT | `/api/vendor/shop` | Bearer (PUT is partial) |
| GET / POST / PUT / DELETE | `/api/vendor/products[/{id}]` | Bearer |
| GET | `/api/vendor/products/barcode/{code}` | Bearer (scan-to-find the shop's item) |
| POST | `/api/vendor/logout-all` | Bearer (signs out every other device; returns a fresh token) |
| PUT | `/api/vendor/password` | Bearer (`currentPassword`, `newPassword`; signs out other devices) |
| POST | `/api/vendor/shop/resubmit` | Bearer, shop owner (send a rejected shop for review again) |
| POST | `/api/admin/auth/login` | public, rate-limited (staff sign-in) |
| GET | `/api/admin/stats`, `/api/admin/shops?status&q&page`, `/api/admin/shops/{id}`, `/api/admin/audit` | admin |
| POST | `/api/admin/shops/{id}/approve` · `reject` · `suspend` · `reinstate` (`{"reason"}`) | admin |
| GET / POST / PUT | `/api/admin/admins`, `/api/admin/admins/{id}/active` | super admin |
| GET | `/api/vendor/barcode-lookup/{code}` | Bearer (suggested name/section for a retail barcode, from Open Food Facts) |
| POST | `/api/shops/{id}/events` | public, rate-limited: `{"type", "source", "visitorId"}`: type VIEW, CALL, WHATSAPP, DIRECTIONS or ORDER; source WEB, ANDROID or IOS |
| GET | `/api/vendor/insights?days=7` (7, 30 or 90) | Bearer (views, calls, WhatsApp, directions: totals, previous period, daily, by source) |

Errors are always `{"message": "..."}`.

## Code layout (`backend/src/main/java/com/localkart`)
- `shop/`: `Shop` entity, `ShopService` (nearby search, detail, updates), public + vendor controllers
- `product/`: `Product` entity, inventory service and controller
- `auth/`: register/login, JWT issuing
- `config/`: security (JWT, CORS, JSON 401s), auth rate limiter, typed `localkart.*` properties
- `common/`: geo helpers, categories, error handling
- `seed/`: demo data
