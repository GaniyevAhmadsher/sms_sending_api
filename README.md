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

## Notes
- `POST /sms/send` requires `x-api-key` header.
- Dashboard-like endpoints (`/users/me`, `/billing/*`, `/analytics/*`, `/payments/create`, `/payments/history`) use JWT bearer auth.
- Webhook endpoints are public but strictly signature-validated: `/payments/webhook/click`, `/payments/webhook/payme`.


## Production readiness assets
- Docker: `Dockerfile.api`, `Dockerfile.worker`
- Compose stack: `docker-compose.prod.yml`
- Reverse proxy: `deploy/nginx/nginx.conf`
- Monitoring: `/metrics`, Prometheus config, Grafana dashboard JSON
- PM2 fallback: `ecosystem.config.js`
- Release/ops docs: `docs/`
- CI/CD: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
