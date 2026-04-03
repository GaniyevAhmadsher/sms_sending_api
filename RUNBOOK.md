# Operations Runbook

## Common checks
- API health: `curl http://localhost/health`
- Metrics: `curl http://localhost/metrics`
- Queue depth: check `queue_depth` and `dlq_size`

## DLQ handling
1. Pause traffic if failure is systemic.
2. Identify failure signatures in logs with correlation ID.
3. Replay jobs after fix from DLQ.

## Payment webhook backlog
- Scale worker replicas.
- Check Redis and provider callback delivery status.
