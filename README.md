# SMS Sending SaaS API

Production-oriented NestJS backend for multi-tenant SMS delivery with API-key based sending, JWT auth, queue-based dispatching, billing, and analytics.

## Stack
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Redis + BullMQ
- Production deployment with Docker + NGINX + Prometheus + Grafana

## Modules
- `auth` (JWT + refresh flow, registration/login, Google OAuth token exchange)
- `users` (profile)
- `api-keys` (create/revoke keys, API key guard)
- `sms` (`POST /sms/send` with validation and queueing)
- `queue` (BullMQ queue + worker + DLQ)
- `providers` (provider abstraction + mock provider)
- `billing` (balance + transaction logging)
- `analytics` (SMS stats + usage logs)
- `payments` (Click/Payme top-up, webhook verification, payment history)
- `health` (`/health`) and observability (`/metrics`)

## Production quick start
```bash
cp .env.example .env
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy
```

Endpoints:
- API: `http://localhost`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Non-container mode (PM2)
```bash
npm ci
npm run build
pm2 start ecosystem.config.cjs
```

## Key docs
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [RUNBOOK.md](RUNBOOK.md)
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)
- [SCALING.md](SCALING.md)
- [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md)
- [SECURITY.md](SECURITY.md)
- [CUSTOMER_API_GUIDE.md](CUSTOMER_API_GUIDE.md)
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
