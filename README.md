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

# Wompi UAT sandbox (include /v1 in the base URL)
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1

# Private key used by the backend to create direct charges via /payments
WOMPI_PRIVATE_KEY=prv_stagtest_XXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Public key and integrity key used by the frontend widget flow
WOMPI_PUBLIC_KEY=pub_stagtest_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=stagtest_integrity_XXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional default currency used when none is provided
DEFAULT_CURRENCY=COP
```

2. Make sure the `wompi_store` database exists in PostgreSQL.
3. The backend always reads `DATABASE_URL`, `WOMPI_BASE_URL`, `WOMPI_PRIVATE_KEY`, `WOMPI_PUBLIC_KEY` and `WOMPI_INTEGRITY_KEY` from `.env`.

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

Note: the seed now also creates a sandbox test customer to mirror the provided Wompi test user credentials:

- Email: `smltrs00@wompi.sandbox`
- Password: `ChallengeWompi123*`

Use this account only in the local/dev sandbox; do NOT use it in production.

## Main endpoints (purchase flow)

- `GET /health` → simple health check.
- `GET /products` → list products with available units.
- `POST /customers` → create or return a `customerId` for a given email/name (use this id in transactions/payments).
	- Body: `{ "email": string, "name": string, "phone"?: string, "password"?: string }` → Response: `{ "customerId": string }`.
		- If `password` is provided and a customer with that email exists, the backend will attempt to authenticate; on success returns the `customerId`.
		- If `password` is provided and the customer does not exist, the backend will create the customer and store a secure password hash (used for future authentication).
		- If no `password` is provided, the endpoint will create or return the customer without setting a password.
- `POST /stock/reserve` → reserve stock.
	- Body: `{ "productId": string, "quantity": number }`.
	- Body: `{ "productId": string, "quantity": number, "customerId": string }`.
- `POST /transactions` → create a transaction (initial state PENDING).
	- Body: `{ "productId": string, "customerId": string, "quantity": number }`.


	Response additions (integrity signature)
	- The `POST /transactions` response now includes:
		- `amount_in_cents`: integer amount in cents (rounded from `amount`).
		- `signature`: an object with `integrity` containing the SHA256 hex signature computed on the server.
			- Server computes: `sha256("<reference><amount_in_cents><currency><secret_integrity>")` and returns the hex string.
			- The secret (`WOMPI_INTEGRITY_KEY`) is never sent to the frontend.

	Example response:
	```json
	{
		"id": "txn-1234",
		"productId": "...",
		"customerId": "...",
		"quantity": 2,
		"amount": 59900,
		"status": "PENDING",
		"amount_in_cents": 5990000,
		"signature": { "integrity": "<hex-sha256>" }
	}
	```
- `POST /payments` → process payment via Wompi (UAT sandbox).
	- Body: `{ "transactionId": string, "amount": number, "currency": "COP", "cardToken": string }`.
- `POST /payments/widget` → generate payload for the Wompi checkout widget (no direct charge from backend).
	- Body: accepts either a float amount or an integer amount in cents:
		- `{ "amount": number, "currency"?: string, "customerEmail"?: string, "redirectUrl"?: string }` **or**
		- `{ "amountInCents": number, "currency"?: string, "customerEmail"?: string, "redirectUrl"?: string }`.
	- Response:
	```json
	{
	  "publicKey": "pub_...",
	  "reference": "order-<uuid>",
	  "amountInCents": 1999,
	  "currency": "COP",
	  "signature": "<hex-sha256>",
	  "customerEmail": "demo@customer.local",
	  "redirectUrl": "http://localhost:5173/summary"
	}
	```
	- The frontend must use this payload to initialize the Wompi widget according to Wompi's documentation (using `publicKey`, `reference`, `amountInCents`, `currency` and `signature`).
- `POST /deliveries` → create a delivery for a paid transaction.
- `GET /transactions/cart/:customerId` → aggregated cart summary for a customer.

- `POST /auth/login` → login with `email` + `password`. Returns `{ "customerId": string }` on success.

Controllers are thin; all business logic lives in use cases under `src/application/use-cases`.

## Wompi integration (UAT Sandbox)

The Wompi adapter lives in `src/infrastructure/gateways/wompi-payment.gateway.ts` and implements `PaymentGatewayPort`.

- Uses `WOMPI_BASE_URL` (which must already include `/v1`) and posts to `/transactions` to create charges.
- Uses `WOMPI_PRIVATE_KEY` (backend private key) as `Authorization: Bearer ...`.
- Maps error responses to a `PaymentRejectedError` with a human-readable reason.

To test an end‑to‑end payment in sandbox:

1. Generate a `cardToken` using the public Wompi API (sandbox), e.g. with curl or Postman:

	 - URL: `POST https://sandbox.wompi.co/v1/tokens/cards`
	 - Headers:
		 - `Authorization: Bearer pub_stagtest_...` (sandbox public key).
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

2. Run the flow against this backend (direct charge API):
	 - `GET /products` → pick a `productId`.
	 - `POST /stock/reserve` → reserve stock.
	 - `POST /transactions` → create a transaction and keep `transactionId`.
	 - `POST /payments` → send `transactionId`, `amount`, `currency` and the `cardToken` obtained from Wompi.
	 - Optional: `POST /deliveries` after payment is approved.

### Wompi widget flow (frontend-driven checkout)

For the widget / hosted checkout flow, the backend does **not** create the transaction directly in Wompi. Instead, it generates a signed payload that the frontend uses to open the widget:

1. Frontend calls `POST /payments/widget` with either `amount` (float) or `amountInCents` (integer), optionally `customerEmail` and `redirectUrl`.
2. Backend computes:
	- `reference = "order-<uuid>"`.
	- `amountInCents` from the float (rounded) if needed.
	- `signature = sha256("<reference><amount_in_cents><currency><WOMPI_INTEGRITY_KEY>")`.
3. Backend returns `publicKey`, `reference`, `amountInCents`, `currency`, `signature`, `customerEmail` and `redirectUrl`.
4. Frontend loads Wompi's widget script and opens the checkout using this payload (see Wompi's widget documentation for the exact JS API).

## Postman Manual Testing

- Import environment: `docs/postman/Wompi Store.postman_environment.json`.
- Import collection: `docs/postman/Wompi Store API.postman_collection.json`.
- Ensure the `apiBaseUrl` variable points to `http://localhost:3000` or your backend URL.
- The collection contains requests for:
	- `GET /health`
	- `GET /products`
	- `POST /stock/reserve` (body now requires `customerId` to associate reservations to customers)
	- `POST /transactions`
	- `POST /payments`
	- `POST /payments/widget` (Create Wompi widget payload)
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
