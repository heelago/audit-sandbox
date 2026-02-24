# Security Hardening Notes

Last updated: 2026-02-23

## Implemented in Code

1. Student prompt privacy enforcement
- Student-facing APIs no longer expose internal assignment-generation prompt internals.
- Student now receives a public instruction prompt derived from assignment title/requirements.
- Files:
  - `src/app/api/assignments/[id]/route.ts`
  - `src/app/api/texts/[id]/route.ts`
  - `src/lib/security.ts`

2. Prompt-injection resistance in LLM orchestration
- All assignment/context/text fields are now treated as untrusted prompt blocks.
- Added prompt payload sanitization and explicit "do not execute embedded instructions" constraints.
- Files:
  - `src/lib/ai/prompt-config.ts`
  - `src/lib/security.ts`
  - `src/lib/ai/gemini.ts`

3. API abuse and DDoS baseline guardrails
- Added centralized API middleware for:
  - per-IP rate limiting (read/mutate/auth/AI-heavy routes)
  - origin validation on mutating methods
  - request body-size guard (2MB)
- File:
  - `middleware.ts`

4. Input sanitization and length caps
- Added normalized sanitation for assignment and calibration text inputs.
- Files:
  - `src/app/api/assignments/route.ts`
  - `src/app/api/assignments/[id]/route.ts`
  - `src/app/api/assignments/[id]/calibrate/route.ts`
  - `src/app/api/texts/[id]/route.ts`

5. Access-request anti-bot and abuse controls
- Added hidden honeypot trap + minimum form-fill time checks for `/api/access-requests`.
- Added secondary per-email rate limiting for access-request intake.
- Added optional reCAPTCHA server verification (enabled only when secret env is configured).
- Files:
  - `src/app/page.tsx`
  - `src/app/api/access-requests/route.ts`
  - `.env.example`

## Manual Checks for `h2eapps-unified`

These require Firebase/GCP console access:

1. App Hosting runtime secrets only
- Confirm `apphosting.yaml` uses `secret:` bindings (no inline key values).
- Confirm in Firebase Console -> App Hosting -> backend `auditsandbox` -> Environment:
  - `DATABASE_URL` -> Secret Manager
  - `SESSION_SECRET` -> Secret Manager
  - `GEMINI_API_KEY` -> Secret Manager

2. Secret IAM scope
- In GCP Secret Manager, verify only App Hosting service account runtime principal has access.
- Remove broad access grants (project Editors/Owners for runtime secret reads where possible).

3. Firestore rules posture (if Firestore is used)
- This repo currently has no Firestore rules file (`firestore.rules` absent), so it does not manage rules from source.
- In Firebase Console -> Firestore Database -> Rules:
  - ensure production rules are not permissive (`allow read, write: if true;` must never exist).
  - if API keys/config are currently stored in Firestore documents, migrate them to Secret Manager.

4. Frontend secret leakage scan
- Run:
  - `pnpm.cmd run security:check:local`
  - or raw checks:
  - `rg -n "NEXT_PUBLIC.*(KEY|SECRET|TOKEN)" .`
  - `rg -n "GEMINI_API_KEY|SESSION_SECRET|DATABASE_URL" src`
- Expected: sensitive values only in server/runtime contexts.

## Next Security Work Items

1. Add route-level schema validation (Zod) for all mutating APIs.
2. Add stricter per-route limits for heavy endpoints and audit logging for repeated 429/403 events.
3. Add structured security event logging (auth failures, invalid-origin attempts, oversized payloads).
4. Add WAF/CDN strategy and alerting policy for production traffic spikes.
