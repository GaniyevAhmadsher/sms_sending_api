# Backup and Recovery

## PostgreSQL
- Daily full backups + WAL archiving.
- Retention: 35 days online, 12 months cold.

## Redis
- Enable AOF and periodic RDB snapshots.

## Restore drill
1. Restore DB to staging from latest backup.
2. Rehydrate Redis if needed.
3. Run integrity checks: balances, payment records, sms statuses.
4. Document RTO and RPO achieved.
