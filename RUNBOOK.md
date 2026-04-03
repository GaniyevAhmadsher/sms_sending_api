# Runbook

## Queue backlog
- Inspect Redis queue depth, worker logs, and `sms_failed_total`.
- Scale workers horizontally.

## Payment webhook lag
- Check `webhook_latency` and webhook queue processor health.
- Replay from provider only after dedupe verification.

## Database pressure
- Inspect slow query logs and Prisma pool saturation.
- Enable read replicas if sustained.
