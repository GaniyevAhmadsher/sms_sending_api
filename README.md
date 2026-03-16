# SMS Sending SaaS API

Production-ready modular NestJS backend for SMS sending with API keys, auth, queue processing, billing, analytics, rate limiting, and health checks.

## Tech
- NestJS
- Prisma + PostgreSQL
- Redis
- BullMQ-oriented queue module design

## Modules
- `auth`: register/login/google login, token issuing
- `users`: user profile
- `api-keys`: create/revoke API keys, API key auth + per-key throttling
- `sms`: send SMS, status query, delivery update
- `billing`: balance + transaction history
- `analytics`: statistics and usage logs
- `providers`: provider abstraction + mock provider
- `queue`: SMS queue service + worker processor
- `health`: service/database/redis health
- `infrastructure`: config, docs, redis, queue connection, throttling

## API docs
- `GET /docs` (human-readable docs)
- `GET /openapi.json` (OpenAPI spec)

## Environment
Use `.env.example` and set:
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `SMS_PROVIDER`

## SMS flow
Client Request -> API Key Guard -> API Key Rate Limit -> Balance Check -> Save Message (PENDING) -> Queue Job (QUEUED) -> Worker Send SMS -> Update Status (SENT/FAILED/DELIVERED)

## Prisma migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

## Run
```bash
npm install
npm run build
npm run start:dev
```
