# Access + Email Setup

This project now supports this instructor access flow:

1. Instructor submits request from landing page.
2. Optional automatic admin alert email is queued on submission (if `ACCESS_REQUEST_ALERT_EMAILS` is configured).
3. Admin approves access request (code is generated).
4. On approval, onboarding email is queued automatically to the requester.
5. Admin can still resend manually from dashboard if delivery fails.

## 1) Install Firebase Trigger Email extension

In Firebase Console (`h2eapps-unified`):

1. Go to `Extensions`.
2. Install extension: `Trigger Email` (official Firebase extension).
3. Use collection path: `mail` (or set a different value and match `FIREBASE_EMAIL_COLLECTION`).
4. Configure SMTP provider credentials in extension setup.

This app writes email jobs into Firestore (collection `mail` by default), and the extension sends the email.

## 2) Environment variables

Required:

- `ACCESS_ADMIN_CODES` (comma-separated codes, uppercase)

Recommended:

- `PUBLIC_APP_URL` (used in email body)
- `FIREBASE_EMAIL_COLLECTION` (defaults to `mail`)
- `ACCESS_REQUEST_ALERT_EMAILS` (comma-separated recipients for new-request alerts)

Optional for local development:

- `FIREBASE_SERVICE_ACCOUNT_JSON` (if local ADC is not configured)

If deploying to App Hosting, create/update secrets:

```powershell
firebase apphosting:secrets:set ACCESS_ADMIN_CODES
firebase apphosting:secrets:set ACCESS_REQUEST_ALERT_EMAILS
```

## 3) Database update

Apply Prisma schema update:

```powershell
pnpm.cmd prisma db push
pnpm.cmd prisma generate
```

Tracking fields on `AccessRequest`:

- `inviteEmailStatus`
- `inviteEmailAttemptedAt`
- `inviteEmailSentAt`
- `inviteEmailMessageId`
- `inviteEmailError`

## 4) Dashboard behavior

In instructor dashboard access panel:

1. `אישור, הפקת קוד ושליחת מייל` creates code and queues onboarding email.
2. `בדיקת סטטוס` checks queued delivery status (`queued`/`sent`/`failed`).
3. `שליחת מייל הצטרפות` remains available for resend when needed.
