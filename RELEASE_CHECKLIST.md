# Release Checklist

- [ ] Migrations reviewed and applied on staging.
- [ ] CI green (lint, test, build, prisma validate, migration check, docker build).
- [ ] Security secrets rotated and validated.
- [ ] Smoke tests: auth, sms send, payment create/webhook, analytics.
- [ ] Alerts and dashboards verified.
- [ ] Rollback plan confirmed.
- [ ] Production deployment approved manually.
