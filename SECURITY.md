# Security

- Strict env validation on startup.
- JWT `iss`/`aud`/ttl fields required.
- API keys hashed with HMAC secret and configurable prefix.
- Webhook handlers must enforce signature + dedupe key.
- Nginx applies secure headers and request rate limiting.

## 2026-04 hardening updates
- Added rotating refresh tokens persisted in `RefreshToken` table with revocation-on-use.
- Added API key scopes, expiry support, key prefix + masked return values, and bulk revoke endpoint.
- Added webhook replay protection using timestamp drift checks + Redis nonce cache.
