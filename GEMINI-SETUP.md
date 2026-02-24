# Gemini Setup (No Deploy)

This project now supports server-side Gemini calls:
- Generation model: `gemini-3-flash-preview`
- Audit agents model: `gemini-3-pro-preview`

## 1) Get an API key

Create a Gemini API key in your Google AI/GCP project and copy it.

## 2) Save the key as an App Hosting secret

Run from repo root:

```powershell
firebase apphosting:secrets:set GEMINI_API_KEY --project h2eapps-unified
```

Paste the API key when prompted.

## 3) Grant backend access to the secret

```powershell
firebase apphosting:secrets:grantaccess GEMINI_API_KEY --backend auditsandbox --project h2eapps-unified
```

For demo backend (optional):

```powershell
firebase apphosting:secrets:grantaccess GEMINI_API_KEY --backend auditsandbox-demo --project h2eapps-unified
```

## 4) Confirm runtime mapping

Already configured in `apphosting.yaml`:
- `GEMINI_API_KEY` (secret)
- `GEMINI_ASSIGNMENT_MODEL=gemini-3-flash-preview`
- `GEMINI_AUDIT_MODEL=gemini-3-pro-preview`

Demo backend is intentionally pinned to mock mode in `apphosting.demo.yaml`:
- `USE_MOCK_AI=1`

## 5) Local development (optional)

Set local env vars in `.env`:

```env
GEMINI_API_KEY=...
GEMINI_ASSIGNMENT_MODEL=gemini-3-flash-preview
GEMINI_AUDIT_MODEL=gemini-3-pro-preview
```

To force mock mode locally:

```env
USE_MOCK_AI=1
```

## 6) API behavior notes

- `POST /api/assignments/[id]/generate`
  - Gemini-first if key is configured
  - Accepts `generationStage: "pilot"` + `pilotCount` for first-pass generation
  - Falls back to mock only when Gemini is not configured

- `POST /api/assignments/[id]/analyze`
  - Runs multiple specialized agents via Gemini Pro
  - Accepts optional `agentTemplates`, `forceReanalyze`, `textIds`
  - In Gemini mode: strict behavior (if no findings return, route fails with explicit error; no silent mock fallback)
  - Stores structured preliminary report in dedicated DB tables

- `GET /api/assignments/[id]/analysis-reports`
  - Fetches structured reports (`latest=1` for latest per text)

- `POST /api/assignments/[id]/import-texts`
  - Imports instructor-provided texts (paste/file parsed on client -> JSON payload)
  - Applies server-side anonymization redactions before saving

## 7) Important placeholders (known temporary)

- Preliminary report is stored as JSON in calibration log notes.
- Instructor UI for agent-template editing is not fully wired yet.

## 8) After pulling latest code (schema update)

Roster persistence added new Prisma fields on `Assignment`, so run schema sync before app testing:

```powershell
pnpm.cmd prisma db push
```

If Prisma says `DATABASE_URL` is missing, export it in the same shell first:

```powershell
$env:DATABASE_URL = \"postgresql://...\"
pnpm.cmd prisma db push
```
