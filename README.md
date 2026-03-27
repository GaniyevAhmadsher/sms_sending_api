# SMS Sending SaaS API

Production-oriented NestJS backend for multi-tenant SMS delivery with API-key based sending, JWT auth, queue-based dispatching, billing, and analytics.

## Stack
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Redis + BullMQ

## Modules
- `auth` (JWT, registration/login, Google OAuth token exchange)
- `users` (profile)
- `api-keys` (create/revoke keys, API key guard)
- `sms` (`POST /sms/send` with validation and queueing)
- `queue` (BullMQ queue + worker)
- `providers` (provider abstraction + mock provider)
- `billing` (balance + transaction logging)
- `analytics` (SMS stats + usage logs)
- `payments` (Click/Payme top-up, webhook verification, payment history)

## Environment variables
Create `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sms_api
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your_google_oauth_client_id
API_KEY_HASH_SECRET=change_me
CLICK_MERCHANT_ID=your_click_service_id
CLICK_SECRET_KEY=your_click_secret
PAYME_MERCHANT_ID=your_payme_merchant_id
PAYME_SECRET_KEY=your_payme_secret
PAYMENT_RETURN_URL=https://your-app.example/payments/return
```

## Run
```bash
npm install
npx prisma generate
npm run start:dev
```

## Notes
- `POST /sms/send` requires `x-api-key` header.
- Dashboard-like endpoints (`/users/me`, `/billing/*`, `/analytics/*`, `/payments/create`, `/payments/history`) use JWT bearer auth.
- Webhook endpoints are public but strictly signature-validated: `/payments/webhook/click`, `/payments/webhook/payme`.
