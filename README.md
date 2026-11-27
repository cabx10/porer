# Adana Ev & İşyeri Kiralama Platformu

Modern full-stack real-estate web application built for the Adana region, supporting both residential and commercial listings with bilingual UI (Turkish / English), interactive Google Maps exploration, and direct chat/appointment scheduling between landlords and tenants.

## Architecture

- **Client (`/client`)**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, `@react-google-maps/api`, Socket.io-client.
- **Server (`/server`)**: Express, TypeScript, Prisma ORM, PostgreSQL, Socket.io, Multer, bcryptjs, jsonwebtoken.
- **Database**: PostgreSQL 16 Alpine containerized with persistent volume.

```
porer/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # MapView, PhotoGallery, ChatBox, etc.
│   │   ├── pages/       # Home, Search, ListingDetail, Dashboard, Auth
│   │   └── i18n.tsx     # Full Turkish / English dictionary
├── server/              # Express backend
│   ├── src/
│   │   ├── auth.ts      # Register, login, JWT middleware
│   │   ├── listings.ts  # Filtered/paginated listings CRUD
│   │   ├── appointments.ts
│   │   └── messages.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts      # Sample accounts and listings
└── docker-compose.yml   # Orchestrates db + api + client
```

## Quick start with Docker (recommended)

### 1. First-time setup (only once)
```bash
cp .env.example .env                    # creates .env template (only once!)
# Open .env and set your GOOGLE_MAPS_KEY
docker compose up --build               # builds images and starts services
docker compose exec api npx prisma db seed # populates demo listings and users
```

### 2. Normal / Daily run
```bash
docker compose up                       # starts PostgreSQL, Express API, Vite
```
*(If you make changes to packages or Dockerfiles, use `docker compose up --build`)*

To stop the containers:
```bash
docker compose down
```

Access the app at: **http://localhost:5173**

## Run locally (without Docker)
Requirements: Node.js 20+, running PostgreSQL instance.
```bash
cd server && cp .env.example .env       # set DATABASE_URL, JWT_SECRET (only once!)
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                             # http://localhost:4000

cd client && cp .env.example .env       # set VITE_GOOGLE_MAPS_KEY (only once!)
npm install && npm run dev              # http://localhost:5173
```
Enable "Maps JavaScript API" in Google Cloud Console for your key.

## Requirements coverage
- Advanced filtering: multi-district selection, multi-select room presets (1+1, 2+1, 3+1, 4+1, 5+), custom room input (extracts room count from 2+1 format, e.g. 2 for 2+1), price range, area (m²), property type (Home/Commercial), and location → `server/src/listings.ts` (Prisma, indexed, paginated) & `client/src/pages/Search.tsx`
- Sorting options: by date (newest/oldest) and by price (low to high / high to low) → `server/src/listings.ts` & `client/src/pages/Search.tsx`
- Property location on map → `client/src/components/MapView.tsx`
- Appointment request management → `server/src/appointments.ts` + `client/src/pages/Dashboard.tsx`
- Unified user account: any user can both list properties for rent and request viewing appointments to rent properties (JWT authentication)

## Next step: Kubernetes
Once comfortable with Docker Compose, the natural next step is converting these three services (db, api, client) into Kubernetes Deployments + Services, with a ConfigMap/Secret for env vars.
