# Security
- Strict env schema validation at boot.
- JWT issuer/audience/expiry validated.
- Structured logs include correlation IDs.
- Protect `/metrics` and admin endpoints behind network policy.
- Rotate secrets quarterly and after incidents.


## Webhook Replay Protection
- Incoming payment webhooks must provide `x-webhook-timestamp` (unix seconds).
- Optional `x-webhook-nonce` is recommended; when omitted, server derives a deterministic fingerprint.
- Nonces are cached in Redis using `SET NX EX` and duplicates are rejected.
- Requests exceeding `WEBHOOK_MAX_DRIFT_SECONDS` are rejected to block delayed replay attempts.
