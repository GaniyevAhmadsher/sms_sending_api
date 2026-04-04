# Deployment Guide

## Architecture
- API service (`Dockerfile.api`)
- Worker service (`Dockerfile.worker`)
- PostgreSQL 16
- Redis 7 (AOF enabled)
- Nginx reverse proxy
- Prometheus + Grafana

## Docker deployment
1. Copy `.env.example` to `.env` and fill production values.
2. Build and run stack:
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```
3. Run Prisma migration job before enabling traffic:
   ```bash
   docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy
   ```
4. Validate:
   - `GET /health`
   - `GET /metrics`
   - Grafana dashboard

## Zero-downtime release
- Use blue/green or rolling deployment.
- Drain workers before stop (`SIGTERM` + wait for active jobs).
- Deploy API first, then worker.
- Rollback on elevated `sms_failed_total` or `payment_failed_total`.
