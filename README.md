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
```

## Run
```bash
npm install
npx prisma generate
npm run start:dev
```

## Notes
- `POST /sms/send` requires `x-api-key` header.
- Dashboard-like endpoints (`/users/me`, `/billing/*`, `/analytics/*`) use JWT bearer auth.
