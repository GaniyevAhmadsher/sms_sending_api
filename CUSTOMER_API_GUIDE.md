# Customer API Guide

## Onboarding flow
1. Register/login (`/auth/register`, `/auth/login`).
2. Create API key (`/api-keys`).
3. Fund wallet (`/payments/create` + webhook completion).
4. Send SMS (`/sms/send` with `x-api-key`).
5. Read usage (`/analytics/*`) and billing history (`/payments/history`).

## Webhooks
- Register callback URL + secret per tenant (recommended extension).
- Validate signatures and replay headers.
