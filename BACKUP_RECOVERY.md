# Backup & Recovery

## PostgreSQL
- Nightly full backup + WAL archiving.
- Retention: 35 days hot, 180 days cold.
- Weekly restore drill in staging.

## Redis
- AOF enabled (`appendonly yes`) and RDB snapshots.
- Redis is recoverable cache/queue state; durable source of truth remains PostgreSQL.

## Restore procedure
1. Restore latest base backup.
2. Replay WAL to target timestamp.
3. Run integrity checks (`payment`/`transaction` consistency).
4. Resume workers only after DB integrity confirmation.
