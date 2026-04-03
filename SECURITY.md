# Security

- Strict env validation on startup.
- JWT `iss`/`aud`/ttl fields required.
- API keys hashed with HMAC secret and configurable prefix.
- Webhook handlers must enforce signature + dedupe key.
- Nginx applies secure headers and request rate limiting.
