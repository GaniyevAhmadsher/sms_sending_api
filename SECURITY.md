# Security Baseline

- Strict fail-fast env validation at startup.
- JWT claim enforcement (`iss`,`aud`,`exp`) + previous-secret verification for key rotation.
- Refresh token flow enabled.
- API keys use prefixed format (`sms_live_`/`sms_test_`) and hashed-at-rest storage.
- Webhook replay protection via timestamp drift + nonce TTL cache in Redis.
- Request correlation IDs and structured logs for auditability.
