# Customer API Guide
Core onboarding flow:
1. Register/login to obtain JWT.
2. Create API key via `/api-keys`.
3. Fund wallet via `/payments/create`.
4. Send SMS via `/sms/send` with `x-api-key` header.
5. Monitor usage with `/analytics/*` and `/billing/*`.
