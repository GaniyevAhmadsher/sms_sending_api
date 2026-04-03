# Backup & Recovery

## PostgreSQL
- Daily full backup, 15-min WAL archiving.
- Retention: 35 days hot, 180 days cold.

## Redis
- AOF enabled + hourly RDB snapshot.

## Restore drill
- Monthly restore to staging and checksum SMS/payment tables.
