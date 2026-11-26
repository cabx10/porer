# Real Estate Rental

Stack: React + Vite (TS), Node + Express (TS), Prisma ORM + PostgreSQL, Google Maps JS API. Dockerized with docker-compose.

## Run with Docker (recommended)
```bash
cp .env.example .env          # put your Google Maps key in it
docker compose up --build
```
- Client: http://localhost:5173
- API: http://localhost:4000
- Postgres: localhost:5432 (user/pass: postgres/postgres, db: rental)

The `api` container runs `prisma migrate deploy` on startup. If this is the very first run and no migration exists yet, generate one once from your host (with Docker running):
```bash
docker compose run --rm api npx prisma migrate dev --name init
```

## Run without Docker (local Node)
```bash
# API — requires a local Postgres, update server/.env accordingly
cd server && cp .env.example .env
npm install && npx prisma migrate dev --name init && npm run dev

# Client (new terminal)
cd client && cp .env.example .env   # put your Google Maps key in it
npm install && npm run dev          # http://localhost:5173
```
Enable "Maps JavaScript API" in Google Cloud Console for your key.

## Requirements coverage
- Advanced filtering: multi-district selection, multi-select room presets (1+0, 1+1, 2+1, 3+1, 4+1, 5+), minimum room count ("en az 3 oda"), price range, area (m²), property type (Home/Commercial), and location → `server/src/listings.ts` (Prisma, indexed, paginated) & `client/src/pages/Search.tsx`
- Sorting options: by date (newest/oldest) and by price (low to high / high to low) → `server/src/listings.ts` & `client/src/pages/Search.tsx`
- Property location on map → `client/src/components/MapView.tsx`
- Appointment request management → `server/src/appointments.ts` + `client/src/pages/Dashboard.tsx`
- Unified user account: any user can both list properties for rent and request viewing appointments to rent properties (JWT authentication)

## Next step: Kubernetes
Once comfortable with Docker Compose, the natural next step is converting these three services (db, api, client) into Kubernetes Deployments + Services, with a ConfigMap/Secret for env vars.
