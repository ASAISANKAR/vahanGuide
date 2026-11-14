# VahanGuide MVP

A buyer-first purchase co-pilot for people buying a new car or bike in India.

## What is implemented

### Frontend
- Responsive React + TypeScript + Vite dashboard.
- Purchase setup for vehicle type, model, variant, city, and purchase stage.
- Editable on-road cost estimate with live total.
- PDI checklist statuses and notes for items marked **Issue found**.
- Document readiness checklist.
- Printable purchase report, including flagged inspection issues.
- API-backed workspace: loads the latest purchase project from Spring Boot and saves edits to PostgreSQL through the REST API.
- Debounced saves: edits are sent after a short pause instead of issuing a request on every keystroke.
- Local recovery cache: the previous browser workspace is kept in `localStorage` as a fallback and is migrated to PostgreSQL if the API has no purchase records.
- Save status in the header shows whether the app is connecting, saving, saved to PostgreSQL, or using local fallback.

The local cache is only a recovery aid; PostgreSQL is the source of truth when the API is connected. This MVP has no authentication or per-user access control yet. Do not expose it publicly or store sensitive identity/financial documents until authentication and authorization are implemented.

## Run the frontend

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

To check a production build:

```bash
npm run build
```

## Backend scaffold (Java 21 + Spring Boot + PostgreSQL)

The `backend/` directory contains a REST API scaffold for purchase projects. `docker-compose.yml` starts a local PostgreSQL database.

Requirements: Java 21, Maven, and Docker Compose.

Terminal 1 — start the database from the project root:

```bash
docker compose up -d postgres
```

Terminal 2 — run the API:

```bash
cd backend
mvn spring-boot:run
```

API base URL: `http://localhost:8080/api/purchases`

Available endpoints:

- `GET /api/purchases` — list purchase projects
- `POST /api/purchases` — create a purchase project
- `GET /api/purchases/{id}` — fetch one project
- `PUT /api/purchases/{id}` — update a project
- `DELETE /api/purchases/{id}` — delete a project

Database connection settings can be overridden using `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. The default credentials are for local development only; do not use them in production.

### Current limitation

The frontend calls `/api/purchases`; Vite proxies those requests to `http://localhost:8080` during development. Ensure the Spring Boot API is running before opening the frontend. Authentication, authorization, production migrations, and deployment configuration are not implemented yet.
