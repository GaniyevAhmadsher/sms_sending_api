# Customer API Guide

## Onboarding flow
1. Register user
2. Login and get JWT
3. Create API key
4. Top up wallet via Click/Payme
5. Send SMS with `x-api-key`

## Core endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /api-keys`
- `POST /payments/create`
- `GET /payments/history`
- `POST /sms/send`
- `GET /analytics/*`

## New auth and key-management endpoints
- `POST /auth/refresh` rotates refresh token and issues a new access/refresh pair.
- `DELETE /api-keys` revokes all active API keys for the authenticated tenant/user.
- `POST /api-keys` now accepts `scopes` and `expiresInDays`.
