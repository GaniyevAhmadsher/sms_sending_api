# Backup & Recovery
- PostgreSQL: daily full + 15-minute WAL archiving.
- Redis: AOF enabled for queue durability; snapshot every 15 minutes.
- Monthly restore drills:
  1. Restore Postgres to point-in-time.
  2. Validate balances, payments, idempotency tables.
  3. Replay payment webhook DLQ.
- Data retention: usage logs 12 months, webhook raw payload 90 days.
