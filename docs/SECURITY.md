# Security
- Strict env schema validation at boot.
- JWT issuer/audience/expiry validated.
- Structured logs include correlation IDs.
- Protect `/metrics` and admin endpoints behind network policy.
- Rotate secrets quarterly and after incidents.

## 2026-04 hardening increment
- Added access/refresh JWT key rotation (`JWT_SECRET_ROTATION`, `JWT_REFRESH_SECRET_ROTATION`) and `kid` validation.
- Added `/auth/refresh` flow for controlled token renewal.
- Added webhook replay defense via timestamp drift (`WEBHOOK_MAX_DRIFT_SECONDS`) and Redis nonce TTL cache (`WEBHOOK_NONCE_TTL_SECONDS`).
