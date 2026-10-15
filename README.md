# LocalKart (Spring Boot + React)

Local shops register and list their inventory. Customers see shops within **5 km**, check what's in stock, and **call (or WhatsApp) the shop to order**. Each shop decides whether it offers home delivery, its delivery radius (up to 5 km), the minimum order and the delivery charge.

## Stack
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
| `JWT_SECRET` | dev value | **set in production**, at least 32 characters |
| `MAX_SEARCH_RADIUS_KM` | `5` | customer search radius cap |
| `CORS_ORIGIN` | `*` | comma-separated origin patterns |
| `SEED` | `true` | demo data, only inserted when the DB is empty |

## Deploy (free tier: Neon + Render + Vercel)
1. **Database:** create a PostgreSQL database on [Neon](https://neon.tech).
2. **API:** on [Render](https://render.com), create a Web Service from this repo with root directory `backend` and the Docker runtime (`backend/Dockerfile`). Set these environment variables:
   - `DB_URL` = `jdbc:postgresql://<neon-host>/<db>?sslmode=require`
   - `DB_USER`, `DB_PASSWORD` from Neon
   - `JWT_SECRET` = a random string of at least 32 characters
   - `CORS_ORIGIN` = your Vercel URL
   - `SEED` = `true` to load the demo shops, `false` for a real launch

   Render sets `PORT`, and Flyway creates the tables on first start.
3. **UI:** on [Vercel](https://vercel.com), import this repo with root directory `frontend` and set `VITE_API_URL` = `https://<render-app>.onrender.com/api`. `frontend/vercel.json` makes page refreshes on routes like `/shop/:id` work.

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

Errors are always `{"message": "..."}`.

## Code layout (`backend/src/main/java/com/localkart`)
- `shop/`: `Shop` entity, `ShopService` (nearby search, detail, updates), public + vendor controllers
- `product/`: `Product` entity, inventory service and controller
- `auth/`: register/login, JWT issuing
- `config/`: security (JWT, CORS, JSON 401s), auth rate limiter, typed `localkart.*` properties
- `common/`: geo helpers, categories, error handling
- `seed/`: demo data
