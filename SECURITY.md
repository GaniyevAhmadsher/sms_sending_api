# Security Hardening

- JWT includes `iss`, `aud`, `exp`, `type`; supports previous secrets for key rotation.
- Webhooks protected by signature checks, nonce replay keys, and timestamp drift validation.
- Env vars validated at startup (fail fast).
- Use HTTPS termination at NGINX / LB.
- Rotate secrets every 90 days.
