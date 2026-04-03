# Deployment
Use `docker-compose.production.yml` for a full production stack (api, worker, postgres, redis, nginx, prometheus, grafana).

## Steps
1. Copy `.env.example` to `.env` and set secrets.
2. `docker compose -f docker-compose.production.yml build`
3. `docker compose -f docker-compose.production.yml up -d`
4. Run DB migrations: `docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy`
5. Validate health: `curl http://localhost/health` and `curl http://localhost/metrics`.
