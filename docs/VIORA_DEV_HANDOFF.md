# Viora Developer Handoff — PIP Support Companion Integration

Use this document as the implementation brief for integrating PIP companion content into Viora.

## 1) Integration Summary

Viora will consume PIP's public API and render drug companion content inside the Viora app companion tab.

- Viora owns user accounts, trackers, notifications, and app UX.
- PIP owns drug companion content and support guidance payloads.
- All content must be displayed as general information only (not medical advice).

## 2) Environment and Credentials

Provide these values to the Viora backend developer:

- `PIP_BASE_URL`: `https://<your-pip-domain>/api/public`
- `PIP_API_KEY`: `pip_<your_secret_token>`

### Security Requirements

- Store `PIP_API_KEY` server-side only.
- Do not expose API keys in mobile/web client bundles.
- Use `Authorization: Bearer <PIP_API_KEY>` on all requests.

## 3) Required Endpoints (V1)

Implement these endpoints first:

1. `GET /drugs`
2. `GET /drugs/:slug`
3. `GET /drugs/:slug/expectations?week=<number>`
4. `GET /drugs/:slug/tracker-hints`

Base URL prefix for all calls:

`https://<your-pip-domain>/api/public`

## 4) API Contract Source of Truth

Use these files as canonical references:

- `docs/openapi.yaml`
- `docs/VIORA_INTEGRATION.md`

If implementation behavior differs from assumptions, default to `docs/openapi.yaml`.

## 5) Mandatory Compliance Rendering

Every API response includes:

- `disclaimer.text`
- `disclaimer.version`
- `disclaimer.as_of`

Viora must:

- Render `disclaimer.text` prominently on every companion screen.
- Store `disclaimer.version` locally and re-surface if version changes.
- Never suppress disclaimer content when caching.

## 6) Error Handling and Retry Behavior

Handle these statuses explicitly:

- `401` Unauthorized (missing/invalid key): show integration/auth error and stop retries.
- `404` Drug not found/unpublished: show not-available state.
- `429` Rate limit: exponential backoff + retry.
- `500` Server error: retry with backoff, then show temporary unavailable state.

Recommended retry strategy:

- Retry delays: 1s, 2s, 4s (max 3 retries)
- Add request timeout (e.g. 8-10s)
- Log request ID/correlation ID if available

## 7) Caching Guidance

Recommended cache behavior:

- Drug list (`/drugs`): cache 1 hour, stale-while-revalidate
- Drug profile (`/drugs/:slug`): cache 1 hour, stale-while-revalidate
- Expectations by week: cache 24 hours
- Tracker hints: cache long-lived per slug (invalidate on app release/config refresh)

## 8) Data Mapping Notes for Viora

Confirm and implement:

- `drug.slug` drives routing/keying in Viora companion tab.
- `tracker_hints.biomarkers` maps to Viora trackers.
- `expectations` supports optional week filter for "This week" card.
- Optional arrays (`food_guidance`, `tips`, `side_effects`) can be empty; UI should degrade gracefully.

Suggested biomarker-to-UI mapping:

- `weight_kg` -> Weight tracker
- `waist_cm` -> Waist measurement tracker
- `nausea_0_10` -> Nausea symptom scale
- `appetite_0_10` -> Appetite scale
- `energy_0_10` -> Energy scale
- `hydration_l` -> Hydration tracker
- `blood_glucose_mmol` -> Blood glucose tracker
- `injection_site_reaction` -> Injection reaction toggle

## 9) Pre-Go-Live Acceptance Checklist

Complete all checks before production enablement:

- [ ] `GET /drugs` returns `200` with `data.drugs.length > 0`
- [ ] `GET /drugs/semaglutide-wegovy` returns full companion payload
- [ ] `GET /drugs/semaglutide-wegovy/expectations?week=1` returns week-specific data
- [ ] `GET /drugs/semaglutide-wegovy/tracker-hints` returns biomarker hints
- [ ] `disclaimer.text` is visibly rendered in companion UI
- [ ] `401` behavior validated with invalid key
- [ ] `429` behavior validated with throttled test
- [ ] Empty optional sections render safely without crashes
- [ ] Companion screens handle offline/network failure fallback gracefully

## 10) Production Values to Fill In

Fill these in before sending to Viora:

- Production API domain: `____________________________`
- Viora production origin(s): `____________________________`
- Viora staging origin(s): `____________________________`
- Initial supported slug(s): `____________________________`
- Delivery contact (PIP): `____________________________`
- Escalation contact (incident): `____________________________`

## 11) Copy-Paste Message You Can Send

Subject: PIP Companion API Integration Pack (V1)

Hi team,

Please integrate the PIP companion API into Viora using the attached contract/docs:

- `docs/openapi.yaml` (source of truth)
- `docs/VIORA_INTEGRATION.md` (implementation guidance)
- `docs/VIORA_DEV_HANDOFF.md` (delivery checklist)

Environment:

- Base URL: `https://<your-pip-domain>/api/public`
- API key delivery: sent via secure channel (server-side use only)

Priority endpoints:

1. `GET /drugs`
2. `GET /drugs/:slug`
3. `GET /drugs/:slug/expectations?week=<n>`
4. `GET /drugs/:slug/tracker-hints`

Critical requirement:

- Render `disclaimer.text` prominently on every companion screen.

Please complete the acceptance checklist in `docs/VIORA_DEV_HANDOFF.md` and confirm results for production sign-off.

Thanks.

