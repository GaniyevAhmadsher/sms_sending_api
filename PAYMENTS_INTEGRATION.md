# Payments Integration (Click + Payme)

## 1) Prisma schema updates

- `Payment` modeli qo‘shildi (`provider`, `status`, `externalId`, `amount`, `userId`).
- `TransactionType` enumiga `PAYMENT_TOPUP` qo‘shildi.

## 2) Module structure

```text
src/modules/payments/
  payments.module.ts
  payments.controller.ts
  payments.service.ts
  dto/create-payment.dto.ts
  providers/
    payment-provider.interface.ts
    payment.constants.ts
    click.provider.ts
    payme.provider.ts
```

## 3) API endpoints

### POST /payments/create
Auth: Bearer JWT

Request:
```json
{
  "amount": 5000,
  "provider": "click"
}
```

Response:
```json
{
  "id": "f4de4c09-8a91-4b9c-8a26-84a4ec9402f5",
  "amount": 5000,
  "provider": "CLICK",
  "status": "PENDING",
  "externalId": "click-f4de4c09-...",
  "paymentUrl": "https://my.click.uz/services/pay?...",
  "params": {
    "merchantId": "...",
    "amount": "5000.00",
    "merchantTransId": "click-f4de4c09-...",
    "returnUrl": "https://.../payments/return"
  }
}
```

### POST /payments/webhook/click
Auth: provider signature (header/body)

Request example:
```json
{
  "transaction_id": "click-f4de4c09-...",
  "amount": 5000,
  "status": "success",
  "sign_time": "1710000000",
  "signature": "<hmac_sha256>"
}
```

Response:
```json
{
  "accepted": true,
  "ignored": false,
  "status": "SUCCESS"
}
```

### POST /payments/webhook/payme
Auth: provider signature (header/body)

Request example:
```json
{
  "external_id": "payme-f4de4c09-...",
  "amount": 5000,
  "status": "success",
  "timestamp": "1710000000",
  "signature": "<hmac_sha256>"
}
```

Response:
```json
{
  "accepted": true,
  "ignored": false,
  "status": "SUCCESS"
}
```

### GET /payments/history
Auth: Bearer JWT

Response:
```json
[
  {
    "id": "...",
    "userId": "...",
    "amount": 5000,
    "provider": "CLICK",
    "status": "SUCCESS",
    "externalId": "click-...",
    "createdAt": "2026-03-27T12:00:00.000Z",
    "updatedAt": "2026-03-27T12:00:01.000Z"
  }
]
```

## 4) Correctness and idempotency

- Webhooklar `externalId` orqali topiladi (`unique`).
- `status !== PENDING` bo‘lsa, callback xavfsiz `ignored` qilinadi.
- Success holatida `payment` holatini `updateMany(where: { status: PENDING })` bilan CAS usulida yangilash orqali race-condition himoyasi qo‘llangan.
- Balance increment + transaction yozuvi + payment status o‘zgarishi bitta DB transaction ichida bajariladi.

## 5) Security

- Har provider uchun alohida signature verifikatsiyasi.
- Noto‘g‘ri signature holatida `403 Forbidden`.
- Provider mismatch / not found holatlari log qilinadi va xavfsiz tarzda `ignored` qilinadi.
