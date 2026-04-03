# Backup & Recovery
- PostgreSQL: nightly logical backup + 15-min WAL archiving.
- Redis: AOF enabled (`appendonly yes`).
- Keep 35-day backup retention minimum.
- Test restore monthly in staging.

## Restore Drill
1. Restore Postgres dump to clean DB.
2. Replay latest WAL.
3. Start API/worker against restored DB.
4. Verify payment and sms idempotency keys still enforce uniqueness.
