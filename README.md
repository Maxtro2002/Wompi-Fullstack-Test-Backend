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
I'm follow Conventional Commits, e.g.:
- `feat: add stock reservation use case`
- `fix: handle insufficient stock in checkout`
- `chore: setup CI for lint and tests`

## Environment & DB Configuration
1. Copiar `.env.example` a `.env` y ajustar:

```
DATABASE_URL=postgres://postgres:Pass@localhost:5432/wompi_store

# Wompi UAT sandbox
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev
WOMPI_PRIVATE_KEY=prv_stagtest_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

2. Asegurarse de que la base `wompi_store` exista en PostgreSQL.
3. El backend lee siempre `DATABASE_URL`, `WOMPI_BASE_URL` y `WOMPI_PRIVATE_KEY` desde `.env`.

## Seed de datos (productos, stock y cliente demo)

El seed está en `src/infrastructure/repositories/seed.ts` y se ejecuta con:

```
npm run seed
```

Hace lo siguiente:
- Crea tablas (via `synchronize: true`) si no existen.
- Normaliza cualquier fila antigua en `stocks` que tenga `reserved = NULL` a `0`.
- Inserta productos de ejemplo con `quantity = 100` y `reserved = 0`.
- Crea (si no existe) un cliente demo `demo@customer.local` y muestra sus IDs en consola.

Esto hace que el proyecto sea reproducible en otras máquinas sin SQL manual.

## Endpoints principales (flujo de compra)

- `GET /health` → health check simple.
- `GET /products` → lista productos con unidades disponibles.
- `POST /stock/reserve` → reserva stock.
	- Body: `{ "productId": string, "quantity": number }`.
- `POST /transactions` → crea una transacción (estado inicial PENDING).
	- Body: `{ "productId": string, "customerId": string, "quantity": number }`.
- `POST /payments` → procesa el pago vía Wompi (UAT sandbox).
	- Body: `{ "transactionId": string, "amount": number, "currency": "COP", "cardToken": string }`.
- `POST /deliveries` → crea la entrega para una transacción pagada.

Los controladores son delgados; toda la lógica está en los use cases bajo `src/application/use-cases`.

## Integración con Wompi (UAT Sandbox)

El adaptador Wompi vive en `src/infrastructure/gateways/wompi-payment.gateway.ts` e implementa `PaymentGatewayPort`.

- Usa `WOMPI_BASE_URL` + `/v1/transactions` para crear cargos.
- Usa `WOMPI_PRIVATE_KEY` (clave privada de backend) como `Authorization: Bearer ...`.
- Mapea respuestas de error a un `PaymentRejectedError` con motivo legible.

Para probar un pago end‑to‑end en sandbox:

1. Generar un `cardToken` usando la API pública de Wompi (sandbox), por ejemplo con curl o Postman:

	 - URL: `POST https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards`
	 - Headers:
		 - `Authorization: Bearer pub_stagtest_...` (llave pública UAT sandbox).
		 - `Content-Type: application/json`.
	 - Body de ejemplo:
		 ```json
		 {
			 "number": "4111111111111111",
			 "cvc": "123",
			 "exp_month": "12",
			 "exp_year": "29",
			 "card_holder": "Juan Perez"
		 }
		 ```
	 - De la respuesta, tomar `data.id` → `cardToken`.

2. Crear el flujo en este backend:
	 - `GET /products` → elegir `productId`.
	 - `POST /stock/reserve` → reservar stock.
	 - `POST /transactions` → crear transacción y guardar `transactionId`.
	 - `POST /payments` → enviar `transactionId`, `amount`, `currency` y `cardToken` obtenido de Wompi.
	 - Opcional: `POST /deliveries` después de pago aprobado.

## Postman Manual Testing

- Importar environment: `docs/postman/Wompi Store.postman_environment.json`.
- Importar collection: `docs/postman/Wompi Store API.postman_collection.json`.
- Verificar que `apiBaseUrl` apunta a `http://localhost:3000` o la URL donde corra el backend.
- La colección contiene requests para:
	- `GET /health`
	- `GET /products`
	- `POST /stock/reserve`
	- `POST /transactions`
	- `POST /payments`
	- `POST /deliveries`

## Run & Tests

- Desarrollo:
	- `npm run start:dev`
- Build + producción simple:
	- `npm run build`
	- `npm start`
- Tests unitarios y coverage:
	- `npm test`
	- `npm run test:cov`
