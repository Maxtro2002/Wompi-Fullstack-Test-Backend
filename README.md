# Wompi Store Backend (Nest.js)

## Overview
This backend implements an API for a store that manages products, stock, transactions, customers, and deliveries. It supports a 5-step business process flow:
1. Product page
2. Credit Card / Delivery info
3. Summary
4. Final status
5. Product page

The backend is designed for resilience: clients should be able to recover progress after a refresh.

## Tech Stack
- Framework: Nest.js (TypeScript)
- Language: TypeScript
- Architecture: Hexagonal (Ports & Adapters)
- Use Cases: Railway Oriented Programming (ROP)
- Database: PostgreSQL
- ORM: TypeORM
- Validation: class-validator / class-transformer
- API Docs: Postman Collection

## Project Goals
- Keep business logic outside controllers (use `application` layer with ports & adapters).
- Implement use cases using ROP, returning safe success/error results.
- Seed the database with dummy Products (no endpoint required to create products).
- Securely handle sensitive data (e.g., payment details via adapters).

## Initial Folder Structure
```
src/
├── domain/
├── application/
│   ├── use-cases/
│   └── ports/
├── infrastructure/
│   ├── controllers/
│   ├── repositories/
│   └── payment/
├── shared/
```
All folders are currently empty and will be filled step-by-step.

## Contributing & Commits
I'm follow Conventional Commits, e.g.:
- `feat: add stock reservation use case`
- `fix: handle insufficient stock in checkout`
- `chore: setup CI for lint and tests`

## Next Steps
- Scaffold Nest.js app and basic configuration.
- Choose ORM (TypeORM or Prisma) and set up PostgreSQL.
- Define domain models and DB schema, then seed dummy products.
- Expose API docs (Postman) and publish a public URL.

## Environment & DB Configuration
- Copy `.env.example` to `.env` and set a single `DATABASE_URL`:

```
DATABASE_URL=postgres://postgres:Pass@localhost:5432/wompi_store
```

- Start PostgreSQL locally or via Docker, ensure the `wompi_store` database exists.
- The backend reads `DATABASE_URL` from `.env`; no DB secrets live in Postman.

## Postman Manual Testing
- Import environment: `docs/postman/Wompi Store.postman_environment.json`.
- Import collection: `docs/postman/Wompi Store API.postman_collection.json`.
- Ensure the `apiBaseUrl` variable points to your running backend (default `http://localhost:3000`).
- Note: Payment integration is not configured yet; start with health and products.

## Run
```
npm run build
npm start
```
