# Runbook
- Check `/health` for dependency status.
- Inspect queue backlog via `queue_depth` metric.
- For payment delays inspect `PAYMENT_WEBHOOK_QUEUE` and webhook DLQ.
- Scale workers when queue depth exceeds thresholds.
