# Scaling Guide

## Horizontal scale
- API: stateless; scale pods by CPU + request duration.
- Worker: scale by queue depth and processing latency.

## Redis
- Use managed Redis with persistence and replicas.

## PostgreSQL
- Connection pooling via PgBouncer.
- Add read replicas for analytics-heavy endpoints.
