# Secure E-commerce Backend

Production-grade backend for a Stripe-powered e-commerce platform. Built with security-first principles, modular architecture, and comprehensive tooling for testing and observability.

## Architecture Overview

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Payments:** Stripe Payment Intents + Webhooks
- **Auth:** JWT access/refresh tokens stored as HTTP-only cookies
- **Security Layers:** Helmet, CORS, rate limiting, request validation (Joi), mongo-sanitize, bcrypt, RBAC
- **Structure:**

```
src/
├── app.ts                # Express configuration & middleware
├── server.ts             # Bootstrap + graceful shutdown
├── config/               # Environment parsing, DB connection
├── controllers/          # HTTP handlers
├── middleware/           # Auth, validation, error handling, rate limiting
├── models/               # Mongoose schemas (User, Product, Order)
├── routes/               # Versioned API routes (/api/v1)
├── services/             # Business logic (Auth, Stripe, Products, Orders)
├── utils/                # Logger, JWT, password, time helpers
├── validators/           # Joi schemas for inputs
└── types/                # Shared TS types & Request augmentation
```

## Security Checklist

- Passwords hashed with bcrypt (12 salt rounds) and never returned in responses.
- Refresh tokens rotated on every login/refresh and stored as bcrypt hashes in the database.
- Rate limiting: general (configurable) + stricter auth limiter (5 req/min).
- Input validation via Joi for all body/params. Mongo sanitize + HPP to prevent injection/pollution.
- Stripe webhook signatures verified with `stripe.webhooks.constructEvent`.
- Centralized error handler logs full details (Pino) while returning safe responses.
- RBAC via middleware: only admins can mutate products or list all orders.

## Stripe Payment Flow

1. **Client** calls `POST /api/v1/payments/create-intent` with `{ items: [{ productId, quantity }] }`.
2. **Server** loads products from MongoDB, calculates total, creates order + Stripe PaymentIntent, returns `clientSecret`.
3. **Client** confirms payment with Stripe.js using the `clientSecret`.
4. **Stripe** calls webhook `/api/v1/payments/webhook` → signature verified → order status set to `paid` or `cancelled`.

## Environment Variables

Copy `.env.example` → `.env` and adjust values:

```
cp .env.example .env
```

Key variables:
- `MONGO_URI` – MongoDB connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` – 32+ char secrets.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` – Stripe credentials.
- `CLIENT_ORIGIN` – Allowed frontend origin for CORS.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – Optional bootstrap admin.

## Setup & Run

```powershell
npm install
npm run dev       # ts-node-dev, hot reload
npm run build     # tsc → dist/
npm start         # node dist/server.js
```

Server listens on `PORT` (default 5000). API base path: `/api/v1`.

## Testing

```powershell
npm test          # Jest (ts-jest) with mongodb-memory-server
npm run test:watch
npm run test:coverage
```

- Unit sample: `tests/unit/password.test.ts`.
- Integration sample: `tests/integration/auth.test.ts` (register/login/me).
- Tests use in-memory MongoDB, seeded env vars via `tests/setup.ts`.

## Logging & Monitoring

- Pino logger (`src/utils/logger.ts`) auto-switches to pretty logs in development.
- Errors routed through `errorHandler` middleware; logs full stack traces while returning `{ status: 'error', message }` to clients.

## Future Enhancements

- Add background job queue for email confirmations.
- Extend Stripe event handling (refunds, disputes).
- Implement product caching (Redis) and cache invalidation hooks.
- Add OpenAPI / Swagger docs for API consumers.