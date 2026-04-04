# Scaling

## Horizontal scaling
- API: stateless, scale by replicas behind nginx/LB.
- Worker: run multiple worker replicas with same Redis queue.

## Vertical scaling trigger points
- API CPU > 70% sustained 10m
- Redis memory > 75%
- DB p95 query latency > 150ms

## Capacity controls
- Per-key RPM limits
- Tenant daily spend limits
- Provider/country send quotas
