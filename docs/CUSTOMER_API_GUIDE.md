# Customer API Guide
## Core flow
1. Register and login.
2. Create API key.
3. Top up wallet via Click/Payme.
4. Send SMS with idempotency key.
5. Track deliveries and usage analytics.

## Required headers
- `Authorization: Bearer <token>` or API key.
- `x-correlation-id` recommended.
