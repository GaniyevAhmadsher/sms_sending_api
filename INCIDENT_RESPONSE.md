# Incident Response

## Severity model
- SEV1: payment loss, global send outage
- SEV2: partial provider degradation
- SEV3: non-critical analytics or delayed reporting

## Process
1. Acknowledge incident within 5 minutes.
2. Assign incident commander.
3. Mitigate blast radius (rate limit, provider failover, webhook pause).
4. Communicate status every 15 minutes.
5. Close with root cause and corrective actions.

## Evidence checklist
- Correlation IDs
- Failed webhook payload IDs
- Queue job IDs from DLQ
