# Security
- Strict env schema validation at boot.
- JWT issuer/audience/expiry validated.
- Structured logs include correlation IDs.
- Protect `/metrics` and admin endpoints behind network policy.
- Rotate secrets quarterly and after incidents.
