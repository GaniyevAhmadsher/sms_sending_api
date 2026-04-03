# Runbook
- Check API health: `/health`
- Check queue lag via `queue_depth` and `dlq_size` metrics.
- Inspect payment webhook failures in logs with `correlationId`.
- For incident triage: validate Redis/Postgres connectivity first.
