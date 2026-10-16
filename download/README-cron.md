# Scheduled Re-Audit Job

The `/api/cron/re-audit` endpoint re-checks every saved audit's handle and
sends an eligibility-alert email when the status has changed (e.g., a
previously-ineligible account is now eligible, or a previously-eligible
account became restricted).

## Auth

The endpoint is bearer-token protected. Set `CRON_SECRET` in `.env`:

```
CRON_SECRET=your-strong-secret-here
```

## Triggering

### Cron (Linux / macOS)

```cron
# Run every 6 hours
0 */6 * * * curl -sS -X POST -H "Authorization: Bearer your-strong-secret-here" http://localhost:3000/api/cron/re-audit
```

### Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/re-audit",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header
when `CRON_SECRET` is set as an environment variable.

### Manual trigger (dev / testing)

```bash
curl -X POST -H "Authorization: Bearer your-strong-secret-here" \
  http://localhost:3000/api/cron/re-audit
```

## Response

```json
{
  "ok": true,
  "durationMs": 1234,
  "stats": {
    "totalAudits": 12,
    "changed": 1,
    "alertsSent": 1,
    "errors": 0
  }
}
```

## What it does

1. Loads the last 1000 saved audits.
2. For each one, calls `findOrGenerateProfile(handle)` to get the current
   eligibility status (this is where you'd hook up a real TikTok API in
   production).
3. If the new status differs from the stored status:
   - Updates the audit row in the DB.
   - Fires an `eligibility_alert` email (via the active email provider —
     `console` by default, `smtp` if `EMAIL_PROVIDER=smtp` is set) to the
     user who saved the audit.
4. Returns a summary of what changed.

## Email templates

The alert email uses `src/emails/eligibility-alert-email.tsx` — a React
Email template that renders to both HTML + a plain-text fallback.

## Other cron endpoints

### /api/cron/weekly-digest — Weekly summary email

Sends a digest email to every user with saved audits summarizing their
audits' statuses + the number of new unlocks in the last 7 days. Honors
each user's NotificationSettings (eligibilityAlertsEnabled + mutedHandles).

```cron
# Every Monday at 8 AM
0 8 * * 1 curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/weekly-digest
```

### /api/cron/audit-retention — Delete old audit log entries

Deletes AuditLog, EmailLog, and WebhookDelivery rows older than
AUDIT_RETENTION_DAYS (default 90). Returns the count of deleted rows.

```cron
# Daily at midnight
0 0 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/audit-retention
```

Set `AUDIT_RETENTION_DAYS=180` in .env to keep entries for 6 months.
