# Production Technical Audit – SMS Sending SaaS Backend

## 1) Overall Score

**34 / 100**

This repository has good intent and a mostly sensible domain model, but it is **not currently production-ready** and is not yet safe to begin payment integration without core reliability/security fixes.

---

## 2) Strengths

- Clear domain separation in source tree (`auth`, `users`, `api-keys`, `sms`, `queue`, `billing`, `providers`, `analytics`) that aligns with SaaS concerns.  
- Prisma schema has foundational multi-tenant linkage (`userId` on API keys, SMS, transactions, usage logs) and useful baseline indexes for user-scoped queries.  
- API key values are not stored in plaintext; only HMAC hash is persisted (`keyHash`).  
- SMS provider is abstracted via `SmsProvider` interface and injection token, enabling provider swap without touching business call sites.  
- Billing deduction and transaction logging are placed in a DB transaction block.

---

## 3) Critical Issues (must fix before production)

1. **Application does not compile (`npm run build` fails)** due to missing import/symbol in `AppModule` (`GlobalThrottleGuard`).
2. **Custom JWT implementation is non-standard and insecure by design** (no JOSE header, no issuer/audience checks, no key rotation strategy, no alg enforcement beyond hardcoded HMAC).
3. **Password hashing is cryptographically inappropriate** (`HMAC(secret, password)`), lacking per-user salt and memory-hard KDF (Argon2/bcrypt/scrypt).
4. **DTO validation is largely absent** (no `class-validator` decorators, no global `ValidationPipe`), leaving request shape/type/range validation weak and inconsistent.
5. **Queue is not BullMQ-backed in practice**: `setTimeout(...,0)` pseudo-queue in-process means jobs are lost on process crash/restart and no distributed worker semantics.
6. **Billing/SMS flow is not atomic end-to-end**: balance deduction may succeed while enqueue step silently fails, creating charge-without-delivery scenario.
7. **Code references schema fields that do not exist** (`rateLimitRpm` in `ApiKeyRateLimitGuard`), indicating runtime/type drift.
8. **Health/docs/rate-limit/config infrastructure modules are implemented but not wired into root module**, creating false confidence and dead security/ops code.

---

## 4) Medium Issues (should improve)

- **Auth module dependency declaration is incomplete**: `AuthService` depends on `PrismaService` without explicit module import; works only because Prisma is marked global.
- **Global rate limit strategy fail-open on Redis failure** (`RateLimitService`) can permit abuse under infra degradation.
- **`ApiKeyGuard` performs DB write (`lastUsedAt`) on every request synchronously**, adding latency and write amplification.
- **Google token verification uses tokeninfo endpoint ad hoc** without stronger claim checks (e.g., hosted domain policy if required).
- **SMS status model misses `PENDING`/`PROCESSING` intermediate states**, making lifecycle observability coarse.
- **No idempotency key for `/sms/send`**; clients retrying on network timeouts can produce duplicate sends/charges.
- **Prisma service typed as `any`**, reducing type safety and increasing production bug risk.

---

## 5) Minor Issues (optional improvements)

- Duplicate health endpoints (`AppController` and `HealthController`), with only one likely mounted.
- Minimal tests only cover health checks; no business-path tests for auth/api keys/sms/billing/queue.
- Manual OpenAPI JSON is static and likely to drift from code behavior.
- `.env.example` is incomplete vs runtime usage (`PASSWORD_HASH_SECRET`, `API_KEY_HASH_SECRET`, `GOOGLE_CLIENT_ID`).

---

## 6) Security Risks

- Weak password storage strategy (offline cracking risk amplified if DB leaked).
- Homegrown JWT format may break interoperability and invites subtle verification mistakes.
- Missing robust input validation / transformation pipeline.
- Default fallback secrets (`dev-secret`, `password-secret`, `api-key-secret`) are dangerous if env misconfigured.
- API key hash approach is deterministic HMAC (acceptable) but still needs secret rotation/versioning strategy.
- No explicit authorization policy layers beyond guard-level authentication checks.

---

## 7) Scalability Risks

- In-process queue (`setTimeout`) prevents horizontal scaling and durability.
- No backpressure/priority/dead-letter behavior for SMS pipeline.
- `billing -> queue` sequential flow without outbox/event pattern risks inconsistency at scale.
- Per-request API key updates and possible hot-key Redis counters can create contention.
- Lack of observability hooks (structured metrics/tracing) limits incident response under load.

---

## 8) Concrete Fix Recommendations

### A. Stabilize runtime first (blocker)

- Fix compile failure by importing `GlobalThrottleGuard` in `app.module.ts` and ensure required modules are imported there (`ConfigModule`, `RedisModule`, `RateLimitModule`, `HealthModule`, `DocsModule`).

### B. Replace custom auth primitives

- Use official Nest JWT stack (`@nestjs/jwt`, Passport strategy) and RFC-compliant JWTs.
- Replace password hashing with Argon2id (`argon2` package) and migration strategy for existing hashes.

### C. Enforce strict request validation

- Add `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in bootstrap.
- Decorate DTOs with `class-validator`:
  - `@IsEmail()` for email
  - `@MinLength(8)` for password
  - `@Matches(...)` for E.164 phone
  - `@MaxLength(...)` bounds for text fields

### D. Make billing + enqueue reliable

- Introduce **transactional outbox** table (e.g., `SmsDispatchOutbox`) written in same transaction as balance deduction and `SmsMessage` create.
- Worker polls outbox and enqueues to BullMQ; mark outbox records sent with retry/backoff.
- Add refund/compensation flow if provider terminal failure policy requires it.

### E. Implement real BullMQ pipeline

- Use Redis-backed queue with job options (`attempts`, exponential backoff, removeOnComplete/Fail, dedupe key).
- Move processor to isolated worker process.
- Add idempotency key (`clientMessageId`) unique per user to prevent duplicate bill/send.

### F. Strengthen data model

- Add missing `rateLimitRpm` field if intended or remove guard usage.
- Extend `SmsStatus` enum (`PENDING`, `PROCESSING`, `RETRYING`, `DELIVERED` if provider supports receipts).
- Add unique constraints for idempotency and indexes for operational queries (e.g., `(status, createdAt)`).

### G. Expand testing gates before payments

- Add unit tests for auth hashing/token logic, billing edge cases, SMS service flow, provider failure behavior.
- Add e2e tests for `/auth/*`, `/api-keys`, `/sms/send`, `/billing/*`, `/analytics/*`.
- Add concurrency test for parallel sends validating no negative balance.

---

## 9) Readiness Level

**NOT READY**

### Payment Integration Gate Decision

The backend should **not** proceed to Click/Payme integration yet. Payment flows will amplify current integrity risks (atomicity gaps, queue durability gaps, weak auth primitives). Resolve critical issues first, then re-audit.
