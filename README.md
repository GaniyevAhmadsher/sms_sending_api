# SMS Sending SaaS API

Production-oriented NestJS backend for multi-tenant SMS delivery with JWT auth, API keys, billing, payments, queue workers, and analytics.

## Release-readiness hardening included
- Hardened env schema validation (fail-fast startup).
- JWT hardening with claims checks, refresh tokens, and secret rotation support.
- API key lifecycle improvements (prefix format, masked listing, revoke-all support).
- Webhook replay protection (timestamp drift + nonce dedupe in Redis).
- Structured request logs with correlation IDs.
- Prometheus-compatible `/metrics` endpoint and business counters.
- Expanded onboarding and analytics APIs.
- CI/CD workflows for lint/test/build/prisma/docker/deploy.
- Production docs (deployment, runbook, incident, scaling, backup, security, release checklist).

## Quick Start
```bash
npm install
npx prisma generate
npm run start:dev
```

## Core API groups
- Auth: `/auth/register`, `/auth/login`, `/auth/refresh`
- API keys: `/api-keys`
- SMS: `/sms/send`
- Payments: `/payments/create`, `/payments/webhook/*`, `/payments/history`
- Onboarding: `/onboarding/*`
- Analytics: `/analytics/*`
- Health/metrics: `/health`, `/metrics`

## Production assets
- Docker: `Dockerfile.api`, `Dockerfile.worker`
- Compose stack: `docker-compose.production.yml`
- Nginx: `deploy/nginx/nginx.conf`
- Monitoring: `deploy/prometheus`, `deploy/grafana`
- PM2 fallback: `ecosystem.config.js`
- CI/CD: `.github/workflows/*.yml`
