# Deployment Guide

## Production stack
- API container (`Dockerfile.api`)
- Worker container (`Dockerfile.worker`)
- PostgreSQL 16
- Redis 7 with AOF
- NGINX reverse proxy
- Prometheus + Grafana

## Steps
1. Copy `.env.example` to `.env` and set secrets.
2. Build and start: `docker compose -f docker-compose.production.yml up -d --build`.
3. Run migrations: `docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy`.
4. Verify `/health` and `/metrics`.

## Non-Docker mode
Use `ecosystem.config.cjs` with PM2:
- `pm2 start ecosystem.config.cjs`
- `pm2 save`
