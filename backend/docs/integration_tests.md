# Integration tests (real DB)

This backend uses **Vitest + Supertest** for integration tests that hit real Express routes and a **real Postgres** database (via Prisma).

## 1) Start the test database

From `backend/`:

- Start Postgres:
  - `docker compose -f docker-compose.test.yml up -d`

The DB will be available on `localhost:5435`.

## 2) Configure env

The repo includes `backend/.env.test` with:

- `DATABASE_URL` pointing to the test Postgres
- `JWT_SECRET` for backend JWT auth tests

Adjust if needed.

## 3) Prepare schema

From `backend/`:

- `npm run test:integration:prepare`

This runs `prisma db push` (without `--force-reset`) against the **test** `DATABASE_URL` from `backend/.env.test`.

## 4) Run integration tests

From `backend/`:

- `npm run test:integration`

Tests are located under `backend/src/test/integration/`.

## Common pitfall

- Use `npm run test:integration` (no spaces).
- Do **not** run `npm run test : integration`.
  - That runs the `test` script with extra arguments (it does *not* use `vitest.integration.config.mjs`).
  - In that case Prisma will typically use your normal `.env` DATABASE_URL (often `db:5432`) and you’ll get: "Can't reach database server at `db:5432`".
