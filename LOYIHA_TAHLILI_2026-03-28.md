# SMS Sending API — to‘liq texnik tahlil va hisobot

**Sana:** 2026-03-28  
**Repo:** `/workspace/sms_sending_api`  
**Stack:** NestJS 11, TypeScript, Prisma, PostgreSQL, Redis

---

## 1) Executive summary

Loyiha arxitekturasi modulli va biznes oqimlari (auth, API key, SMS queue, billing, analytics, payments) ancha yaxshi ajratilgan. API-level xavfsizlikning asosiy qatlamlari mavjud (JWT, API-key, rate-limit, webhook signature), shuningdek idempotency va retry mexanizmlari kiritilgan.

Shu bilan birga, **release readiness** nuqtai nazaridan 2 ta katta signal bor:

1. **Build hozir muvaffaqiyatsiz** (TypeScript/Prisma tip muammosi).
2. **DTO validatsiya annotatsiyalari yo‘qligi sababli global ValidationPipe to‘liq ishlamayapti** (input contract qat’iy emas).

Joriy holatda loyiha **MVP+ / early production** bosqichida; kichik hajmda ishlashi mumkin, ammo barqaror production uchun bir nechta yuqori ustuvor texnik qarzlarni yopish zarur.

---

## 2) Metodologiya (nima tekshirildi)

Tahlil quyidagi yo‘nalishlarda bajarildi:

- Kod struktura va modullarni ko‘rib chiqish (`src/app.module.ts`, modul/controller/service fayllari).
- Ma’lumotlar modeli va migratsiya holatini ko‘rish (`prisma/schema.prisma`, `prisma/migrations/*`).
- Konfiguratsiya va startup xatti-harakatlari (`main.ts`, `AppConfigService`).
- SMS yuborish pipeline (controller → service → queue → processor).
- Payments webhook oqimi va idempotency/cas yondashuvi.
- Lokal tekshiruv: `npm run build`, `npm run test -- --runInBand`.

---

## 3) Arxitektura ko‘rinishi

### 3.1 Modul kompozitsiyasi

`AppModule` ichida asosiy modullar to‘g‘ri ulanib turibdi: `Config`, `Prisma`, `Redis`, `RateLimit`, `QueueConnection`, `Auth`, `Users`, `ApiKeys`, `Providers`, `Queue`, `Billing`, `Sms`, `Analytics`, `Health`, `Payments`.

Bu modul kompozitsiya domain bo‘yicha yaxshi ajratilganligini bildiradi.

### 3.2 Request pipeline

- Global middleware: request logging.
- Global guard: throttle guard (`APP_GUARD`).
- Global pipe: `ValidationPipe(whitelist, forbidNonWhitelisted, transform)`.

Dizayn to‘g‘ri, lekin DTOlarda validator dekoratorlari bo‘lmagani uchun `ValidationPipe`dan amaliy foyda cheklangan.

### 3.3 Ma’lumotlar modeli

`schema.prisma` quyidagi asosiy obyektlarni qamrab olgan:

- `User`, `ApiKey`, `SmsMessage`, `Payment`, `WebhookEvent`, `Transaction`, `UsageLog`.
- SMS, payment, webhook holatlari uchun enumlar bor.
- Ko‘p joylarda kerakli indekslar mavjud (query patternlarga mos).

Modelning umumiy dizayni SaaS va multi-tenant yondashuvga mos.

---

## 4) Funksional oqimlar bo‘yicha baholash

### 4.1 Auth

- Register/login ishlari mavjud.
- JWT sign/verify custom HMAC asosida yozilgan, `iss/aud/exp/iat` tekshiruvlari bor.
- Parol hashing `scrypt + salt` bilan; oldingi zaif HMAC-ga nisbatan sezilarli yaxshilangan.
- Google login tokeninfo endpoint orqali tekshiriladi.

**Baholash:** o‘rta-yaxshi. Keyingi bosqichda standart `@nestjs/jwt`/Passport ecosystemga o‘tish observability va maintainability ni oshiradi.

### 4.2 API keys + rate limiting

- `x-api-key` orqali guard ishlaydi.
- `ACTIVE` kalitlar tekshiriladi va `lastUsedAt` yangilanadi.
- API-keyga bog‘liq limit strategiyasi bor.

**Baholash:** yaxshi, lekin `lastUsedAt` har so‘rovda write qilinishi yuqori RPS da DB write amplification berishi mumkin.

### 4.3 SMS yuborish

- `POST /sms/send` endpoint guardlar bilan himoyalangan.
- `SmsService` ichida payload check + idempotency + billing + queue integratsiyasi bor.
- Queue enqueue muvaffaqiyatsiz bo‘lsa SMS `FAILED` holatga tushadi.

**Baholash:** biznes oqim asosiy ehtiyojni yopadi.

### 4.4 Queue/worker

- Redis list (`RPUSH/LPOP`) bilan navbat.
- `SmsProcessor` interval polling (100ms), retry (5 attempts), exponential backoff, DLQ (`SMS_DLQ`) bilan ishlaydi.

**Baholash:** kichik yuklama uchun yetarli; katta masshtabda BullMQ/stream-based schedulerga o‘tish tavsiya qilinadi.

### 4.5 Billing/payments

- SMS yechim va payment topup transactionlarda bajariladi.
- Payment webhook `WebhookEvent` orqali dedupe qilinadi.
- `updateMany(where: {status: PENDING})` orqali concurrency guard qo‘llangan.

**Baholash:** kuchli taraflardan biri; transaction boundary va idempotency yondashuvi to‘g‘ri.

---

## 5) Aniqlangan muammolar va risklar

## 5.1 Critical

1. **Build failure (release blocker)**  
   `npm run build` da `src/modules/billing/billing.service.ts` ichida `@prisma/client` dan `Prisma` importi bo‘yicha TypeScript xatosi chiqmoqda. Bu CI/CD va deployni to‘xtatadi.

## 5.2 High

2. **DTO validation bo‘sh**  
   DTOlarda `class-validator` dekoratorlari yo‘q (`SendSmsDto`, `RegisterDto`, `LoginDto`, `CreateApiKeyDto`). Global `ValidationPipe` mavjud bo‘lsa ham request contract qat’iy nazorat qilinmaydi.

3. **SMS serviseda qo‘lda validatsiya**  
   Validatsiya service ichida regex/if bloklar bilan yozilgan. Bu yondashuv ishlaydi, ammo framework-native DTO pipe strategiyasiga nisbatan maintainability pastroq.

4. **Queue polling yondashuvi**  
   `setInterval` + `LPOP` modeli yuqori throughputda samarasiz bo‘lishi mumkin; delayed jobs uchun qayta navbatga qo‘yish aylanish xarajatini oshiradi.

## 5.3 Medium

5. **Google token tekshiruvi external endpointga bog‘liq**  
   Tashqi network nosozligida auth latency/error oshadi.

6. **API key lastUsedAt har requestda update**  
   Katta trafikda DB write load oshiradi; batched yoki sampled update model ko‘rib chiqilishi mumkin.

7. **Test coverage hajmi kichik**  
   Testlar bor, ammo umumiy soni cheklangan (8 test). Kross-modul transaction/retry edge-case e2e testlar ko‘paytirilishi kerak.

---

## 6) Kuchli tomonlar

- Modulga bo‘lingan arxitektura va domain separation yaxshi.
- Konfiguratsiyada required env fail-fast yondashuvi mavjud.
- SMS va paymentsda idempotency fikri qo‘llangan.
- Billing tranzaksion tarzda bajariladi.
- Queue retry + DLQ mexanizmi mavjud.
- Webhook uchun dedupe + status-state nazorati bor.

---

## 7) Prioritet roadmap (amaliy)

### P0 (1-3 kun)
1. Build blocker’ni tuzatish (`billing.service.ts` prisma type import/type strategy).
2. DTOlarga `class-validator` qo‘shish va API contractlarni qat’iylashtirish.
3. `npm run build`, `npm run test`, minimal e2e ni CI’da majburiy qilish.

### P1 (1-2 hafta)
4. SMS validationni DTO qatlamiga to‘liq ko‘chirish.
5. `lastUsedAt` update strategiyasini optimallashtirish (sampled/batched).
6. Observability: queue depth, retry count, fail rate, p95 latency metrikalarini qo‘shish.

### P2 (2-4 hafta)
7. Queue stackni BullMQ yoki robust delayed-job mexanizmga migratsiya rejasi.
8. Google auth verification uchun resiliency (timeout/retry/circuit breaker).
9. Payment/SMS oqimlari uchun chuqur e2e + load test ssenariylari.

---

## 8) Yakuniy baho

- **Arxitektura sifati:** 7/10
- **Xavfsizlik amaliyoti:** 6.5/10
- **Ishonchlilik (reliability):** 6/10
- **Production readiness (hozir):** 5.5/10

**Umumiy holat:** Loyiha yaxshi yo‘nalishda, lekin build blocker + validation qatlamini zudlik bilan yopmasdan turib production release tavsiya etilmaydi.
