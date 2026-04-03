# Security
- Strict env validation at startup.
- JWT with issuer/audience/TTL validation.
- Webhook replay defense using timestamp drift checks + Redis nonce cache.
- API and API-key rate limiting.
- Nginx secure headers and request limits.
