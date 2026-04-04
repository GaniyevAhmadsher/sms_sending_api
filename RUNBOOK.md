# Operations Runbook

## Daily checks
- Queue depth < threshold (`queue_depth`)
- DLQ size stable (`dlq_size`)
- Provider success rate above SLO
- Webhook latency below 2s p95

## Common actions
### Restart API
```bash
docker compose -f docker-compose.production.yml restart api
```

### Restart worker
```bash
docker compose -f docker-compose.production.yml restart worker
```

### Drain queue
1. Disable new traffic at nginx.
2. Wait for queue to process.
3. Restart worker.

## Alerts
- `payment_failed_total` spike
- `provider_failure_rate` > 5%
- `dlq_size` > 0 for 10m
