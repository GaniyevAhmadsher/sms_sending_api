# SMS Sending SaaS API

Production-oriented NestJS backend for multi-tenant SMS delivery with JWT auth, API-key auth, queue-based dispatching, billing, and payment webhooks.

## Key Production Features
- Structured JSON logging with correlation IDs.
- Prometheus metrics endpoint (`/metrics`).
- Webhook replay hardening (timestamp drift + Redis nonce cache).
- Dockerized API and worker runtime.
- Nginx reverse proxy and observability stack (Prometheus + Grafana).
- CI workflows for lint/test/build/prisma/docker.

## Quickstart
```bash
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

## Docker Production Stack
```bash
docker compose -f docker-compose.production.yml up -d --build
```

## Operational Docs
- `DEPLOYMENT.md`
- `RUNBOOK.md`
- `INCIDENT_RESPONSE.md`
- `SCALING.md`
- `BACKUP_RECOVERY.md`
- `SECURITY.md`
- `CUSTOMER_API_GUIDE.md`
- `RELEASE_CHECKLIST.md`
