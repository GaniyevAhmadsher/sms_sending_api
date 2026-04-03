# Scaling
- Scale `worker` horizontally first for throughput.
- Scale `api` replicas behind nginx.
- Use managed Postgres with read replicas for analytics endpoints.
- Track p95 API latency, queue depth, and provider latency before scaling decisions.
