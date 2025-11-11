<div align="center">
  <h1>StudySpaces</h1>
  <p>Real-time campus study space finder for Duke University students.</p>
</div>

## Overview
StudySpaces pairs a FastAPI backend with a React + Tailwind PWA frontend so students can discover open seats, noise levels, and outlet availability across Duke hotspots. The MVP focuses on Duke libraries and commons areas but the data model is ready to onboard additional campuses.

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy 2.0, SQLite (dev) / PostgreSQL (prod), Pydantic, Uvicorn
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Service Worker + Manifest for PWA behavior
- **Utilities:** dotenv for env management, Alembic-ready schema, custom seeding utilities

## Repository layout
```
backend/
  main.py          # FastAPI app + routes
  models.py        # SQLAlchemy models (StudySpace & CheckIn)
  schemas.py       # Pydantic schemas
  database.py      # Engine/session helpers
  seed_data.py     # Duke seed payload
  seed_spaces.py   # Scriptable seeder
frontend/
  package.json
  src/
    index.html / index.js / App.jsx / App.css
    components/ (HomePage, SpaceList, CheckInForm, Filters, SpaceDetail)
  public/
    manifest.json, service-worker.js, icon.png
README.md
```

## Backend setup
1. **Create environment + install deps**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. **Environment variables (`backend/.env`, not checked in)**
   ```env
   DATABASE_URL=sqlite:///./backend/data/studyspaces.db
   ADMIN_TOKEN=changeme           # use a strong value in prod
   FRONTEND_ORIGINS=http://localhost:5173,https://studyspaces.app
   ANALYTICS_LOOKBACK_DAYS=7
   ```
   - For PostgreSQL on Railway/Render: `DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DB`.
3. **Initialize DB + seed Duke locations**
   ```bash
   python -m backend.seed_spaces   # idempotent
   ```
4. **Run the API**
   ```bash
   uvicorn backend.main:app --reload
   ```
5. **Key routes**
   - `GET /spaces` – all spaces with derived metrics
   - `GET /spaces/{id}` – detail + recent check-ins (30 min window)
   - `GET /spaces/{id}/recent-checkins` – last 10 check-ins
   - `POST /check-in` – submit noise/crowding/outlet report (auto anon user id)
   - `GET /analytics/peak-times` – busiest hour bucket per space (last N days)
   - `GET /analytics/space-utilization` – avg crowding + noise distribution
   - `POST /seed-spaces` *(admin)* – seed from body or built-in Duke list
   - `DELETE /check-ins/{id}` *(admin)* – cleanup old entries

## Frontend setup
1. **Install deps + run dev server**
   ```bash
   cd frontend
   npm install
   npm run dev   # served at http://localhost:5173
   ```
2. **Environment (`frontend/.env.local`)**
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. **Production build**
   ```bash
   npm run build
   npm run preview   # optional smoke test of dist/
   ```
4. **PWA**
   - `public/manifest.json` defines icons, colors, and standalone display.
   - `public/service-worker.js` precaches shell assets + provides offline cache-first fetch.
   - `src/index.js` registers the service worker automatically in supported browsers.

## Deployment notes
- **Backend (Railway/Render):**
  1. Push repo to GitHub.
  2. Provision PostgreSQL, surface its URL as `DATABASE_URL`.
  3. Set `ADMIN_TOKEN` and `FRONTEND_ORIGINS` environment variables.
  4. Use `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` as start command.
- **Frontend (Vercel/Netlify):**
  1. Set build command `npm run build`, output directory `frontend/dist`.
  2. Add `VITE_API_URL=https://<your-backend-host>` in project env vars.
  3. Ensure rewrite for SPA fallback if hosting outside Vercel.

## Testing checklist
- Backend: exercise each endpoint via Thunder Client / Hoppscotch or automated pytest (future).
- Frontend: responsive smoke test (mobile + desktop), verify filter logic, 30s refresh, offline mode, install prompt.
- PWA: run Lighthouse audit for installability + offline caching.

## Scripts & utilities
- `backend/seed_spaces.py`: Idempotently loads Duke spaces from `seed_data.py`. Importable helper `seed_spaces(list[dict])` lets admin endpoint populate arbitrary payloads.
- `backend/database.py`: Houses engine/session helpers plus `session_scope()` context manager used by scripts (ensures commits + rollbacks).
- `backend/models.py`: SQLAlchemy 2.0 models with enums for noise/crowding/outlets. Relationships configured with cascade + joined loading for fast reads.
- `backend/schemas.py`: Pydantic request/response schemas with enums + validation (user id, notes, etc.).
- `backend/main.py`: FastAPI app defining REST + analytics endpoints, CORS config, occupancy scoring, admin guards, and analytics helpers.
- `frontend/src/components/*`: Modular React components (filters, list, form, detail chart) with Tailwind utility classes for mobile-first layout.
- `frontend/public/service-worker.js`: Simple cache-first worker for offline access and add-to-home-screen readiness.
- `frontend/public/manifest.json`: Required PWA metadata for Chrome/Edge/Firefox mobile install flows.

You now have everything needed to run StudySpaces locally, iterate on new features, or ship the MVP to production hosting.
