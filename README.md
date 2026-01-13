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

## Folder Structure (simplified)
```
src/
├── domain/                # Domain errors and core concepts
├── application/           # Use cases + ports (hexagonal core)
│   ├── use-cases/
│   └── ports/
├── infrastructure/        # Adapters: HTTP, DB, gateways
│   ├── controllers/       # REST controllers (Nest)
│   ├── repositories/      # TypeORM entities + repositories
│   └── gateways/          # External integrations (e.g. Wompi)
├── shared/                # Result type, enums, cross-cutting
```

## Contributing & Commits
This project follows Conventional Commits, e.g.:
- `feat: add stock reservation use case`
- `fix: handle insufficient stock in checkout`
- `chore: setup CI for lint and tests`

## Environment & DB Configuration
1. Copy `.env.example` to `.env` and adjust:

```
DATABASE_URL=postgres://postgres:Pass@localhost:5432/wompi_store

# Wompi UAT sandbox
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev
WOMPI_PRIVATE_KEY=prv_stagtest_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

2. Make sure the `wompi_store` database exists in PostgreSQL.
3. The backend always reads `DATABASE_URL`, `WOMPI_BASE_URL` and `WOMPI_PRIVATE_KEY` from `.env`.

## Data seed (products, stock and demo customer)

The seed lives in `src/infrastructure/repositories/seed.ts` and is executed with:

```
npm run seed
```

It performs:
- Creates tables (via `synchronize: true`) if they do not exist.
- Normalizes any legacy rows in `stocks` that have `reserved = NULL` to `0`.
- Inserts sample products with `quantity = 100` and `reserved = 0`.
- Creates (if missing) a demo customer `demo@customer.local` and prints its IDs in the console.

This makes the project reproducible on other machines without manual SQL.

## Main endpoints (purchase flow)

- `GET /health` → simple health check.
- `GET /products` → list products with available units.
- `POST /customers` → create or return a `customerId` for a given email/name (use this id in transactions/payments).
	- Body: `{ "email": string, "name": string, "phone"?: string }` → Response: `{ "customerId": string }`.
- `POST /stock/reserve` → reserve stock.
	- Body: `{ "productId": string, "quantity": number }`.
- `POST /transactions` → create a transaction (initial state PENDING).
	- Body: `{ "productId": string, "customerId": string, "quantity": number }`.
- `POST /payments` → process payment via Wompi (UAT sandbox).
	- Body: `{ "transactionId": string, "amount": number, "currency": "COP", "cardToken": string }`.
- `POST /deliveries` → create a delivery for a paid transaction.
- `GET /transactions/cart/:customerId` → aggregated cart summary for a customer.

Controllers are thin; all business logic lives in use cases under `src/application/use-cases`.

## Wompi integration (UAT Sandbox)

The Wompi adapter lives in `src/infrastructure/gateways/wompi-payment.gateway.ts` and implements `PaymentGatewayPort`.

- Uses `WOMPI_BASE_URL` + `/v1/transactions` to create charges.
- Uses `WOMPI_PRIVATE_KEY` (backend private key) as `Authorization: Bearer ...`.
- Maps error responses to a `PaymentRejectedError` with a human-readable reason.

To test an end‑to‑end payment in sandbox:

1. Generate a `cardToken` using the public Wompi API (sandbox), e.g. with curl or Postman:

	 - URL: `POST https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards`
	 - Headers:
		 - `Authorization: Bearer pub_stagtest_...` (UAT sandbox public key).
		 - `Content-Type: application/json`.
	 - Example body:
		 ```json
		 {
			 "number": "4111111111111111",
			 "cvc": "123",
			 "exp_month": "12",
			 "exp_year": "29",
			 "card_holder": "Juan Perez"
		 }
		 ```
	 - From the response, take `data.id` → `cardToken`.

2. Run the flow against this backend:
	 - `GET /products` → pick a `productId`.
	 - `POST /stock/reserve` → reserve stock.
	 - `POST /transactions` → create a transaction and keep `transactionId`.
	 - `POST /payments` → send `transactionId`, `amount`, `currency` and the `cardToken` obtained from Wompi.
	 - Optional: `POST /deliveries` after payment is approved.

## Postman Manual Testing

- Import environment: `docs/postman/Wompi Store.postman_environment.json`.
- Import collection: `docs/postman/Wompi Store API.postman_collection.json`.
- Ensure the `apiBaseUrl` variable points to `http://localhost:3000` or your backend URL.
- The collection contains requests for:
	- `GET /health`
	- `GET /products`
	- `POST /stock/reserve`
	- `POST /transactions`
	- `POST /payments`
	- `POST /deliveries`
	- `GET /transactions/cart/:customerId`

## Run & Tests

- Development:
	- `npm run start:dev`
- Build + simple production run:
	- `npm run build`
	- `npm start`
- Unit tests & coverage:
	- `npm test`
	- `npm run test:cov`
