# Incident Response

## Severity
- Sev1: no SMS delivery / payment corruption
- Sev2: degraded provider / queue lag
- Sev3: non-critical analytics or dashboard issues

## Procedure
1. Declare incident and assign incident commander.
2. Stabilize (rate limits / provider failover).
3. Collect timeline with correlation IDs.
4. Recover services and verify data consistency.
5. Produce RCA within 48 hours.
