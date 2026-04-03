# Release Checklist
- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] CI passed (lint/test/build/docker)
- [ ] Dashboards imported to Grafana
- [ ] Alerts configured for queue depth, sms_failed_total, payment_failed_total
- [ ] Backup restore drill completed in last 30 days
- [ ] Rollback plan documented
