# Technical Audit Report — SMS Sending SaaS Backend

Date: 2026-03-17

## 1) Overall Score

**41 / 100**

## 2) Strengths

- Clear modular domain boundaries exist (`auth`, `users`, `api-keys`, `sms`, `queue`, `billing`, `providers`, `analytics`).
- Basic tenant isolation is applied in many query paths via `userId` scoping.
- Billing deduction uses a database transaction wrapper (`$transaction`) instead of detached updates.
- Provider layer already introduces an interface/token abstraction and a mock implementation, which is a good foundation.

## 3) Critical Issues (must fix before production)

1. **Application bootstrap/import graph is broken**
   - `AppModule` references `GlobalThrottleGuard` without importing it, which will fail TypeScript build.
   - `main.ts` requests `AppConfigService`, but `ConfigModule` is not imported in `AppModule`, and no env loader exists.

2. **JWT implementation is custom and non-standard/insecure by platform expectations**
   - Token format is a custom `base64(payload).hmac` (no JWT header, no standard validation controls, no key rotation, no `iss`/`aud` semantics).
   - Signature comparison is not constant-time and is vulnerable to timing-analysis style attacks.

3. **Password/API-key secrets have insecure defaults and weak crypto strategy**
   - Password hashing uses plain HMAC-SHA256 with global secret (fast hash, no salt/work factor).
   - API key hashing uses fallback default secret if env variable is missing.
   - JWT secret also defaults to weak development value.

4. **Queue system is not BullMQ-backed and is non-durable**
   - Queue implementation uses `setTimeout(..., 0)` in-process, so jobs are lost on crash/restart and not horizontally scalable.
   - No retries/backoff/dead-letter strategy.

5. **Billing-SMS consistency is non-atomic across modules**
   - SMS record creation, billing deduction, and enqueue operation happen in separate operations without one transaction boundary.
   - Failures after deduction may charge user without successful enqueue.

6. **Schema, migration, and code are inconsistent (serious drift risk)**
   - Migration defines fields not present in Prisma schema (`rateLimitRpm`, `apiKeyId`, `cost`, `queuedAt`, `deliveredAt`, etc.).
   - Code selects `rateLimitRpm` but schema model `ApiKey` does not define it.
   - Migration enum `SmsStatus` includes values not in schema enum (`PENDING`, `DELIVERED`).

7. **DTO validation layer is effectively absent**
   - DTOs have no `class-validator` decorators and global validation pipe is not configured, allowing malformed payloads.

## 4) Medium Issues (should improve)

1. `SmsService` performs manual payload validation and duplicates validation concern that should live in DTO + pipe.
2. `ApiKeyGuard` updates `lastUsedAt` on every request synchronously; this adds write amplification to the hot path.
3. Usage logging is partial (only `/sms/send` service writes logs; no centralized interceptor/middleware).
4. Google token verification depends on external tokeninfo endpoint directly in auth service (latency/failure coupling).
5. Health module exists but is not wired in `AppModule`; health response expectations are inconsistent across controllers.

## 5) Minor Issues (optional improvements)

1. Inconsistent architectural intent: infrastructure modules (`redis`, `queue-connection`, `rate-limit`, `docs`, `health`) are present but only partially integrated.
2. Naming/metadata consistency can be improved (service name repeated in multiple places).
3. Add pagination and strict caps for analytics/transactions endpoints to avoid large payloads over time.

## 6) Security Risks

- Weak password hashing primitive (fast hash, no per-user salt/work factor).
- Insecure default secrets in production-misconfig scenario.
- Custom JWT implementation misses hardened library-level protections and best-practice claims.
- Missing global validation/sanitization pipeline increases abuse surface.
- No explicit authorization policy layer beyond simple user scoping.

## 7) Scalability Risks

- In-memory queue (`setTimeout`) prevents horizontal worker scaling and durability.
- Synchronous DB writes in guards (`lastUsedAt`) can become bottlenecks under API-key traffic.
- Lack of idempotency keys/dedupe strategy can produce duplicate sends if clients retry.
- Billing and SMS state transitions are not orchestrated by a robust state machine/event workflow.

## 8) Concrete Fix Recommendations

1. **Stabilize foundation first (compile/runtime)**
   - Import and wire required infrastructure modules in `AppModule`: config, redis, rate-limit, health, etc.
   - Add strict startup config validation (`zod`/`joi`) and fail fast on missing secrets.

2. **Replace auth/crypto primitives**
   - Use `@nestjs/jwt` + `passport-jwt` for token handling.
   - Use Argon2id (or bcrypt with strong cost) for passwords.
   - Hash API keys with SHA-256 only as lookup hash + random key generation; require non-default secret or use pepper via secret manager.
   - Add key rotation strategy and `kid` support for JWT if needed.

3. **Implement real BullMQ flow**
   - Use Redis-backed queue, separate worker process, retries/backoff, dead-letter queue.
   - Persist lifecycle timestamps (`queuedAt`, `sentAt`, `failedAt`) and attempt counts.

4. **Enforce atomic billing/send orchestration**
   - Use one DB transaction to: validate balance, reserve/decrement balance, create SMS with initial state, create billing transaction, enqueue outbox event.
   - Prefer outbox pattern for guaranteed publish and eventual processing.

5. **Resolve Prisma drift immediately**
   - Align `schema.prisma` with actual desired production model and regenerate clean migration set.
   - Add missing constraints/indexes: dedupe keys, query-path indexes, optional partial indexes for active records.

6. **Harden API input and error handling**
   - Add global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
   - Decorate all DTOs with strict validators.
   - Standardize error response format via global exception filter.

7. **Observability/testing before payments**
   - Add structured logging with correlation/request IDs.
   - Add unit tests for billing race/concurrency, auth edge-cases, queue retry behavior.
   - Add e2e tests for auth → api-key → send SMS flow and failure scenarios.

## 9) Readiness Level

**NOT READY**

The system should **not** proceed to payment integration yet. Payment integration (Click/Payme) will amplify transactional and security risks; the current architecture has unresolved critical correctness, durability, and security gaps.
