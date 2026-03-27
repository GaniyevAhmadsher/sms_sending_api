# SMS Sending bo‘yicha to‘liq hisobot

**Loyiha:** SMS Sending SaaS API  
**Hisobot sanasi:** 2026-03-27  
**Muhit:** NestJS + Prisma + PostgreSQL + Redis

---

## 1. Qisqacha xulosa (Executive Summary)

Ushbu backendda SMS yuborish jarayoni quyidagi asosiy zanjirda ishlaydi:

1. `POST /sms/send` endpointi orqali so‘rov keladi.
2. API kalit tekshiruvi (`ApiKeyGuard`) va API kalitga bog‘liq rate-limit (`ApiKeyRateLimitGuard`) qo‘llanadi.
3. `SmsService` payloadni tekshiradi, idempotency bo‘yicha dublikatdan himoya qiladi.
4. DB tranzaksiyada SMS yozuvi yaratiladi va billingdan SMS narxi yechiladi.
5. Xabar Redis queue ga yoziladi.
6. `SmsProcessor` queue ni poll qilib, provider orqali yuboradi.
7. Natijaga ko‘ra status `SENT` yoki retrylardan keyin `FAILED` ga o‘tadi.

Amaldagi implementatsiya asosiy biznes oqimini yopadi, ammo real production masshtabi uchun quyidagi yo‘nalishlar juda muhim: observability (metrikalar), queue durability/throughput, tranzaksiya-outbox arxitekturasi, hamda SLA/SLO monitoring.

---

## 2. Arxitektura va komponentlar

### 2.1 Kirish nuqtasi
- `SmsController` da `POST /sms/send` endpoint mavjud.
- Endpoint `ApiKeyGuard` va `ApiKeyRateLimitGuard` bilan himoyalangan.

### 2.2 Biznes logika
- `SmsService.send()` quyidagilarni bajaradi:
  - telefon raqami, matn, idempotency formatini tekshiradi;
  - mavjud `idempotencyKey` bo‘lsa, avvalgi xabarni qaytaradi;
  - DB tranzaksiyada `smsMessage` yozuvi yaratadi va billing deduction qiladi;
  - queue ga job qo‘shadi;
  - queue muvaffaqiyatli bo‘lsa `QUEUED`, aks holda `FAILED` holatga o‘tkazadi.

### 2.3 Queue qatlami
- `QueueService` Redis ro‘yxatiga (`RPUSH`) SMS job yozadi.
- `SmsProcessor` 250 ms interval bilan queue ni poll qilib (`LPOP`) joblarni oladi.
- `retry` mexanizmi mavjud: 5 martagacha exponential backoff bilan qayta urinish.

### 2.4 Provider qatlami
- Provider abstraksiyasi token/interfeys orqali ishlangan (`SmsProvider` contract).
- Processor yuborishda provider natijasidan `provider` va `providerRef` maydonlarini saqlaydi.

### 2.5 Ma’lumotlar modeli
`prisma/schema.prisma` da asosiy obyektlar:
- `SmsMessage` (`PENDING`, `QUEUED`, `SENT`, `FAILED`, `DELIVERED` holatlar bilan),
- `Transaction` (billing deduction/topup),
- `ApiKey` (`rateLimitRpm`),
- `UsageLog` (endpointga oid ishlatish loglari).

---

## 3. SMS yuborish jarayoni (end-to-end)

### 3.1 So‘rovdan queuegacha
1. Mijoz `x-api-key` bilan `/sms/send` ga murojaat qiladi.
2. Guard API kalitni aniqlaydi va `request.user.apiKeyId` ni to‘ldiradi.
3. Rate-limit guard API kalitga mos `rateLimitRpm` ni DBdan olib throttle qiladi.
4. `SmsService` payload validatsiya qiladi.
5. Idempotency bo‘yicha mavjud xabar topilsa, replay javobi qaytadi.
6. Yangi yuborishda:
   - `smsMessage` yaratiladi (`PENDING`),
   - billingdan 1 birlik yechiladi.
7. Queue enqueue muvaffaqiyatli bo‘lsa status `QUEUED` bo‘ladi.

### 3.2 Queuedan providergacha
1. Processor queue dan jobni oladi.
2. Agar `retryAt` hali kelmagan bo‘lsa, job qayta oxiriga qo‘yiladi.
3. Providerga yuborish uriniladi.
4. Muvaffaqiyat bo‘lsa:
   - status `SENT`,
   - `sentAt`, `provider`, `providerRef` yangilanadi.
5. Xatoda retry soni oshiriladi, limitdan oshsa `FAILED` va `errorMessage` yoziladi.

---

## 4. Kuchli tomonlar

1. **Idempotency qo‘llab-quvvatlangan** — client retry qilganda dublikat yuborish ehtimoli kamayadi.
2. **Billing deduction tranzaksiyada** — SMS yozuvi va yechim bir DB tranzaksiya ichida amalga oshadi.
3. **Queue + retry mavjud** — vaqtinchalik provider xatolarida avtomatik qayta urinish bor.
4. **API kalit bo‘yicha rate-limit** — tenant abuse holatlarini boshqarishga yordam beradi.
5. **Usage log yozuvi** — `/sms/send` chaqiriqlari audit/analytics uchun bazaviy iz qoldiradi.

---

## 5. Xavf va cheklovlar

### 5.1 Operatsion xavflar
- Processor interval pollingga tayanadi; yuqori yuklamada bu model throughput bo‘yicha cheklanishi mumkin.
- `retryAt` bo‘lmagan FIFO ro‘yxat dizayni delayed jobs uchun ideal emas (ko‘p jobda aylanish xarajati ortadi).

### 5.2 Ma’lumotlar izchilligi
- SMS yaratish+billing tranzaksiyada, ammo queue enqueue tashqi operatsiya bo‘lib qoladi. Enqueue bosqichida nosozlik bo‘lsa xabar `FAILED` bo‘ladi — bu holat biznesga qarab kompensatsiya/reversal siyosatini aniq belgilashni talab etadi.

### 5.3 Kuzatuvchanlik (Observability)
- System-level metrikalar (queue depth, processing latency, success/fail rate, retry histogram) ochiq ko‘rinishda yo‘q.
- Alerting/SLO qoidalari hujjatlashtirilmagan.

### 5.4 Delivery lifecycle
- `DELIVERED` status enumda mavjud, ammo callback/DLR (delivery receipt) oqimi bo‘yicha alohida pipeline ko‘rinmaydi.

---

## 6. KPI va monitoring bo‘yicha tavsiyalar

Quyidagi KPI larni doimiy kuzatish tavsiya etiladi:

1. **Acceptance Rate** = queue ga muvaffaqiyatli qabul qilinganlar / kelgan so‘rovlar.
2. **Send Success Rate** = `SENT` / (`SENT` + `FAILED`).
3. **P95 Queue Delay** = `queuedAt - createdAt`.
4. **P95 Provider Time** = provider call latencysi.
5. **Retry Rate** = retry bilan ketgan joblar / jami joblar.
6. **Permanent Failure Rate** = 5 urinishdan keyin `FAILED` bo‘lganlar ulushi.
7. **Cost per SMS** va **Revenue Leakage** (failed/scheduled holatlar kesimida).

Monitoring instrumentatsiyasi:
- Prometheus metrikalari + Grafana dashboard,
- structured logs (requestId, smsId, apiKeyId, providerRef),
- critical alertlar: queue backlog, failure spike, Redis unavailable, provider timeout spike.

---

## 7. Xavfsizlik va compliance tavsiyalari

1. Telefon raqamlarni loglarda maskalash (`+99890****1234` kabi).
2. API kalitdan foydalanishni audit trail bilan boyitish (IP/device fingerprint).
3. Abuse-detection: bir xil prefix/geo bo‘yicha anomal trafikni bloklash.
4. Template/payload filtering (spam/fraud kontentga qarshi).
5. Maxfiy ma’lumotlar uchun retention siyosati (message body saqlash muddati).

---

## 8. 30-60-90 kunlik amaliy reja

### 0-30 kun (Stabilizatsiya)
- Queue health endpoint + queue depth metric qo‘shish.
- SMS lifecycle bo‘yicha aniq status transition jadvali chiqarish.
- Failure holatlari uchun billing kompensatsiya siyosatini hujjatlashtirish.

### 31-60 kun (Masshtablash)
- Delayed retry uchun sorted set / dedicated scheduler pattern ga o‘tish.
- Horizontal worker scaling testlari (load test + soak test).
- Provider fallback strategiyasi (primary/secondary routing).

### 61-90 kun (Ishonchlilik va biznes optimizatsiya)
- DLR webhook oqimini ishlab chiqish (`DELIVERED` ni real-time yangilash).
- Per-tenant SLA hisobotlari.
- Cost-aware routing (operator/region bo‘yicha eng arzon provider tanlash).

---

## 9. Yakuniy baho

Joriy SMS yuborish tizimi **MVP+/early production** darajada: asosiy yuborish, billing, retry va rate-limit mavjud. Keyingi bosqichda ustuvor e’tibor **kuzatuvchanlik**, **queue ishlash samaradorligi**, va **delivery lifecycle to‘liqligi**ga qaratilsa, tizimni enterprise darajaga olib chiqish mumkin.

