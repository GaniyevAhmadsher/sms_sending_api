# Technical Audit Report — SMS Sending SaaS Backend

Date: 2026-03-17
Scope: Full repository audit before payment integration

## Overall Score: 43 / 100

## 1) Strengths
- Clear modular folder layout (`auth`, `users`, `api-keys`, `sms`, `queue`, `providers`, `billing`, `analytics`).
- API keys are stored hashed (not plaintext), with revocation metadata and last-used tracking.
- Billing deduction and transaction creation are wrapped in a single DB transaction.
- Provider abstraction exists (`SmsProvider` interface + token-based injection), allowing a clean path to add real providers.

## 2) Critical Issues (must fix before production)
1. **Build is currently broken** (`GlobalThrottleGuard` referenced but not imported in `AppModule`).
2. **Config DI is incomplete in root module** (`AppConfigService` is consumed in bootstrap but `ConfigModule` is not imported by `AppModule`).
3. **Custom token format is not JWT compliant and misses standard claims/signing guarantees**.
4. **Password hashing is insecure for production** (HMAC-SHA256 with static secret; no salt/work-factor like Argon2/bcrypt).
5. **DTO validation framework is not used** (no `class-validator` decorators, no global `ValidationPipe`).
6. **SMS billing and message creation are non-atomic**: SMS row is created before deduction; failure can leave orphan/incorrect lifecycle state.
7. **Queue implementation is in-memory (`setTimeout`) not BullMQ**: no durability, retries, backoff, visibility timeout, or worker isolation.
8. **Prisma schema is out of sync with migration and code expectations** (fields/enums differ materially).
9. **Rate-limit guard for API keys exists but is never applied to `/sms/send`**.
10. **No idempotency strategy on send endpoint** (duplicate client retries can cause duplicate charges/messages).

## 3) Medium Issues (should improve)
- Error taxonomy is inconsistent (mix of `BadRequestException` for business errors that should be `Conflict`/`Payment Required` style domain mapping).
- Prisma service uses `any`, removing compile-time safety from data access.
- No observable correlation IDs / structured request logging for operational forensics.
- Rate limiter is fail-open on Redis failure; may be acceptable temporarily but risky in abuse scenarios.
- Provider result model has no delivery callbacks/status transitions (e.g., queued/sent/delivered) despite migration hinting delivered lifecycle.

## 4) Minor Issues (optional improvements)
- README claims BullMQ/Redis queue worker but implementation is not BullMQ.
- Env docs mention `JWT_EXPIRES_IN` and `REDIS_PASSWORD`, but config service does not expose/use them.
- Analytics is minimal and lacks percentile latency/provider-level cost and success metrics.

## 5) Security Risks
- Weak password hashing strategy (high risk).
- Non-standard JWT increases interoperability and security maintenance risk.
- Missing systematic DTO validation and transform/whitelist behavior.
- Default fallback secrets (`dev-secret`, `password-secret`, `api-key-secret`) are dangerous in prod if env is misconfigured.
- API key hash secret fallback also weakens blast radius in accidental prod defaults.

## 6) Scalability Risks
- In-memory queue prevents horizontal scaling and loses jobs on process crash/redeploy.
- No outbox/idempotency key means retries from clients/load balancers can multiply jobs and charges.
- Billing balance check + decrement susceptible to race conditions under concurrent send requests.
- Lack of partitioning/retention strategy for `usageLog` and `smsMessage` growth.

## 7) Readiness Level
**NOT READY** for payment integration.

Rationale: correctness, security, and reliability gaps (auth/token, queue durability, schema drift, transactional consistency) are too high-risk to safely layer financial flows (Click/Payme) on top.

## 8) Concrete Fix Recommendations

### A. Platform correctness first (blocker)
1. Fix compilation and dependency graph:
   - Import `GlobalThrottleGuard` in `AppModule`.
   - Import `ConfigModule`, `RateLimitModule`, `RedisModule` into root module where needed.
2. Align Prisma artifacts:
   - Reconcile `schema.prisma` with migration and with runtime code (`rateLimitRpm`, `apiKeyId`, `cost`, richer statuses).
   - Regenerate Prisma client and enforce typed Prisma service.

### B. Security hardening (blocker)
1. Replace custom token with `@nestjs/jwt` using standard JWT header/payload/signature.
2. Replace password hashing with Argon2id (`argon2`) or bcrypt with calibrated cost.
3. Enforce global input validation:
   - `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
   - Add `class-validator` decorators to all DTOs.
4. Remove insecure default secrets in production path (fail-fast when missing required env vars).

### C. SMS/Billing reliability (blocker)
1. Make send flow atomic:
   - In one transaction: lock user row, verify balance, decrement, create transaction record, create SMS in `PENDING/QUEUED`.
2. Add idempotency key on `/sms/send`:
   - unique `(userId, idempotencyKey)` constraint and return previous result on replay.
3. Implement durable queue with BullMQ:
   - Named jobs, retry/backoff policy, dead-letter queue, attempts, and stalled job handling.
4. Introduce status progression:
   - `PENDING -> QUEUED -> SENT/FAILED -> DELIVERED` (when provider callbacks are integrated).

### D. Abuse protection / ops
1. Apply `ApiKeyRateLimitGuard` on SMS endpoints.
2. Decide fail-open vs fail-closed policy per endpoint sensitivity.
3. Add structured logs (requestId, userId/apiKeyId, smsId, providerRef).

### E. Testing expansion before payments
1. Unit tests: auth/token, API key guard, billing race conditions, SMS validation.
2. Integration tests with DB+Redis containers for send flow transactionality.
3. Worker tests for retry, poison message handling, duplicate job/idempotency behavior.
4. E2E scenarios: insufficient balance, invalid API key, queue failure rollback, duplicate idempotency key.
