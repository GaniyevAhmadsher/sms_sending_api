# SMS Sending SaaS API

Production-oriented NestJS backend for multi-tenant SMS delivery with JWT auth, API keys, billing, payments, queue workers, and analytics.

## Production Readiness Additions
- Dockerized API and worker images (`Dockerfile.api`, `Dockerfile.worker`)
- Full production compose stack (`docker-compose.production.yml`)
- Nginx reverse proxy hardened config (`deploy/nginx/*`)
- `/metrics` endpoint and in-app business metrics
- Structured JSON request logs with correlation ID
- Strict environment validation (fail-fast startup)
- PM2 ecosystem for non-container deployments
- CI/CD workflow with lint/test/build/prisma/docker/deploy stages
- Release and operations docs (runbook, incident response, scaling, backups)

## Quick Start
```bash
npm install
npx prisma generate
npm run start:dev
```

## Production Start (Docker)
```bash
cp .env.example .env
docker compose -f docker-compose.production.yml up -d --build
```

## Key Endpoints
- Health: `GET /health`
- Metrics: `GET /metrics`
- Send SMS: `POST /sms/send` (`x-api-key`)
- Payments webhook:
  - `POST /payments/webhook/click`
  - `POST /payments/webhook/payme`

## Docs
- `DEPLOYMENT.md`
- `RUNBOOK.md`
- `INCIDENT_RESPONSE.md`
- `SCALING.md`
- `BACKUP_RECOVERY.md`
- `SECURITY.md`
- `CUSTOMER_API_GUIDE.md`
- `RELEASE_CHECKLIST.md`
