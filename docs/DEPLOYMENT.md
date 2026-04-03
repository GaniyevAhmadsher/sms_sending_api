# Deployment
Use `docker-compose.prod.yml` for production-like deployment. Run migrations before rollout.

## Steps
1. `cp .env.example .env` and fill secrets.
2. `npm ci && npm run build`.
3. `npx prisma migrate deploy`.
4. `docker compose -f docker-compose.prod.yml up -d --build`.

## Health validation
- API: `/health`
- Metrics: `/metrics`
