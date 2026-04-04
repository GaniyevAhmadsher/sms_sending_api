# Customer API Guide

## Onboarding flow
1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /onboarding/api-keys`
4. `POST /onboarding/wallet/fund`
5. `POST /sms/send`

## Customer operations
- Usage: `GET /onboarding/usage`
- Invoices: `GET /onboarding/invoices`
- Delivery report: `GET /onboarding/delivery-report`
- Callback registration: `POST /onboarding/webhook-callbacks`

## Auth
- User APIs: Bearer JWT
- Sending API: `x-api-key`
