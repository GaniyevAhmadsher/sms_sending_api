# Deployment

## Docker production
1. Copy `.env.example` to `.env` and fill secrets.
2. Build and run:
   - `docker compose -f docker-compose.production.yml up -d --build`
3. Run migrations:
   - `docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy`

## Non-docker VPS
1. `npm ci && npm run build`
2. `pm2 start ecosystem.config.js`
3. `pm2 save`

## Health checks
- API: `/health`
- Metrics: `/metrics`
