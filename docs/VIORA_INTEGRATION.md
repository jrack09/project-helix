# Viora ↔ PIP Integration Guide

## Overview

PIP (project-helix) is the content backend for Viora. It provides per-drug companion content via a versioned REST API. Viora authenticates using a pre-issued API key and renders the content inside its existing companion tab.

Viora owns: user accounts, tracking (weight, meals, calories), push notifications, reminders, app UI.
PIP owns: drug metadata, clinical support metadata, weekly expectations, food guidance, tips, side-effect coping strategies.

---

## Authentication

All public API requests require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer pip_<your_key>
```

Keys are issued manually for V1:
1. An editor signs into PIP admin.
2. Run the following SQL in Supabase to create a key (replace values):

```sql
insert into public.api_keys (user_id, key_prefix, key_hash, name, rate_limit_per_minute)
values (
  '<editor_user_id>',
  'pip_viora',
  encode(digest('pip_<your_secret_token>', 'sha256'), 'hex'),
  'Viora production key',
  120
);
```

3. Store `pip_<your_secret_token>` in Viora's server-side environment as `PIP_API_KEY`. Never expose it in client-side bundles.

---

## Base URL

| Environment | Base URL |
|---|---|
| Local dev | `http://localhost:3000/api/public` |
| Production | `https://<your-pip-domain>/api/public` |

---

## Response Envelope

Every response wraps data in a standard envelope:

```json
{
  "data": { ... },
  "disclaimer": {
    "text": "General information. Not medical advice. Always follow your prescriber.",
    "version": "1.0",
    "as_of": "2026-04-20"
  },
  "meta": {
    "version": "v1",
    "last_updated": "2026-04-20T09:12:00.000Z"
  }
}
```

**Viora MUST render `disclaimer.text` prominently on every companion screen** — e.g. in a footer or collapsible disclaimer banner. This is a hard requirement.

---

## Endpoints

### GET /drugs

List all published drug companions.

**Query params**
| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `20` | Results per page (max 50) |

**Response `data`**
```json
{
  "drugs": [
    {
      "id": "uuid",
      "slug": "semaglutide-wegovy",
      "name": "Semaglutide (Wegovy)",
      "generic_name": "semaglutide",
      "brand_names": ["Wegovy"],
      "drug_class": "GLP-1 receptor agonist",
      "short_description": "...",
      "administration_route": "subcutaneous_injection",
      "prescription_required": true,
      "evidence_score": null,
      "updated_at": "2026-04-20T..."
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### GET /drugs/:slug

Full companion profile for a single drug.

**Response `data`**
```json
{
  "drug": {
    "id": "uuid",
    "slug": "semaglutide-wegovy",
    "name": "Semaglutide (Wegovy)",
    "generic_name": "semaglutide",
    "brand_names": ["Wegovy"],
    "drug_class": "GLP-1 receptor agonist",
    "administration_route": "subcutaneous_injection",
    "typical_dosing_schedule": "Weekly subcutaneous injection...",
    "prescription_required": true,
    "short_description": "...",
    "mechanism_summary": "...",
    "evidence_score": null,
    "updated_at": "2026-04-20T..."
  },
  "expectations": [
    {
      "id": "uuid",
      "week_number": 1,
      "milestone": "First injection",
      "description": "You may experience mild nausea...",
      "is_common": true
    }
  ],
  "food_guidance": [
    { "id": "uuid", "category": "prefer", "item": "Lean protein", "rationale": "Supports muscle retention", "evidence_level": "editorial", "ordinal": 0 },
    { "id": "uuid", "category": "avoid", "item": "High-fat meals", "rationale": "Can worsen nausea", "evidence_level": "editorial", "ordinal": 1 }
  ],
  "tips": [
    { "id": "uuid", "category": "hydration", "title": "Stay hydrated", "body_markdown": "Drink at least 2L of water daily...", "ordinal": 0 }
  ],
  "side_effects": [
    {
      "id": "uuid",
      "effect": "Nausea",
      "severity": "mild–moderate",
      "frequency": "common",
      "drug_side_effect_tips": [
        { "id": "uuid", "strategy": "Eat smaller, more frequent meals", "when_to_seek_help": "If vomiting persists beyond 48h, contact your prescriber", "ordinal": 0 }
      ]
    }
  ],
  "clinical_profile": {
    "contraindications": "Do not use if...",
    "interactions": [
      { "drug": "Insulin and insulin secretagogues", "interaction": "Increased hypoglycaemia risk.", "severity": "significant" }
    ],
    "storage_handling": "Store refrigerated at 2-8C until use...",
    "pharmacokinetics": {
      "half_life": "Approximately 1 week",
      "tmax": "24-72 hours"
    },
    "warnings": [
      { "id": "uuid", "severity": "boxed_warning", "title": "Thyroid C-cell tumour warning", "body": "...", "source_id": "uuid", "ordinal": 1 }
    ],
    "missed_dose_rules": [
      { "id": "uuid", "formulation": "pen", "max_delay_hours": 120, "instruction": "...", "restart_guidance": "...", "source_id": "uuid", "ordinal": 1 }
    ],
    "approved_indications": [
      { "id": "uuid", "region": "AU", "authority": "TGA", "approval_status": "approved", "indication": "...", "population": "...", "source_id": "uuid", "ordinal": 1 }
    ],
    "dose_escalation_phases": [
      { "id": "uuid", "protocol_label": "Standard Wegovy escalation", "phase_label": "Weeks 1-4", "start_week": 1, "end_week": 4, "dose_amount": 0.25, "dose_unit": "mg", "frequency": "once weekly", "route": "subcutaneous injection", "phase_purpose": "Tolerability initiation dose.", "hold_or_reduce_guidance": "...", "source_id": "uuid", "ordinal": 1 }
    ],
    "storage": [
      { "id": "uuid", "formulation": "single-dose pen", "storage_state": "before use", "temperature": "2-8C", "protect_from_light": true, "do_not_freeze": true, "expiry_after_opening": null, "expiry_after_reconstitution": null, "handling_notes": "...", "source_id": "uuid", "ordinal": 1 }
    ],
    "side_effect_thresholds": [
      { "id": "uuid", "side_effect_id": "uuid", "effect": "Vomiting", "threshold": "Repeated vomiting or inability to keep fluids down.", "action": "contact_prescriber", "action_label": "Contact your prescriber promptly.", "source_id": "uuid", "ordinal": 1 }
    ],
    "sources": [
      { "id": "uuid", "source_type": "prescribing_information", "label": "Wegovy prescribing information", "url": "https://www.novo-pi.com/wegovy.pdf", "region": "US", "authority": "FDA", "citation_text": "...", "retrieved_at": "2026-04-27", "ordinal": 1 }
    ]
  },
  "reconstitution_guide": [],
  "dose_reference": []
}
```

All `clinical_profile` arrays are optional from a rendering perspective and may be empty while PIP fills content across drugs. Viora should display warnings, missed-dose rules, thresholds, and citations as general information only, alongside the required disclaimer.

---

### GET /drugs/:slug/expectations

Returns expectations for a drug. Optionally filtered by week.

**Query params**
| Param | Description |
|---|---|
| `week` | Integer — return only this week's entry |

**Use case:** Viora's "This week" card — call with `?week=<current_week_on_drug>`.

---

### GET /drugs/:slug/tracker-hints

Returns which biomarkers Viora should prompt for this drug and at what cadence.

**Response `data`**
```json
{
  "tracker_hints": {
    "biomarkers": ["weight_kg", "waist_cm", "appetite_0_10", "nausea_0_10", "energy_0_10", "hydration_l", "injection_site_reaction"],
    "cadence": "weekly",
    "notes": "Weight and waist measurements are most meaningful when taken at the same time each week."
  }
}
```

**Biomarker IDs**

| ID | Description |
|---|---|
| `weight_kg` | Body weight in kg |
| `waist_cm` | Waist circumference in cm |
| `nausea_0_10` | Nausea severity 0–10 |
| `appetite_0_10` | Appetite level 0–10 |
| `energy_0_10` | Energy level 0–10 |
| `hydration_l` | Daily fluid intake in litres |
| `blood_glucose_mmol` | Blood glucose mmol/L (for diabetes-adjacent drugs) |
| `injection_site_reaction` | Boolean — reaction at injection site |

---

## Error Responses

| Status | Body | Cause |
|---|---|---|
| `401` | `{ "error": "Unauthorized. Provide a valid Bearer API key." }` | Missing or invalid key |
| `404` | `{ "error": "Drug not found." }` | Slug doesn't exist or drug is not published |
| `429` | `{ "error": "Rate limit exceeded. Please retry shortly." }` | Exceeded `rate_limit_per_minute` for this key |
| `500` | `{ "error": "Failed to fetch drugs." }` | DB error |

---

## Caching Recommendations

PIP content changes infrequently (when editors publish). Viora should cache responses aggressively:

```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

Suggested Viora strategy:
- Drug list: SWR with 1h TTL, revalidate in background
- Drug full profile: SWR with 1h TTL
- Expectations for current week: SWR with 24h TTL (content changes weekly at most)
- Tracker hints: cache forever per drug slug (invalidate on app update)

---

## CORS

The PIP API allows origins listed in `VIORA_ALLOWED_ORIGINS` (comma-separated env var on the PIP server). For V1, set this to Viora's production domain and any dev proxy.

---

## Disclaimer Rendering Requirement

Viora must render `disclaimer.text` visibly on every companion screen. Acceptable patterns:
- A fixed footer on the companion tab
- A collapsible "Important information" banner at the top
- A disclosure modal shown once per session with the user acknowledging

The disclaimer version (`disclaimer.version`) can be stored locally; if it changes, re-surface the banner.

---

## V1 Rollout Checklist

- [ ] PIP deployed to production URL
- [ ] API key provisioned and stored in Viora's `.env` as `PIP_API_KEY`
- [ ] `VIORA_ALLOWED_ORIGINS` set on PIP server to Viora's domain
- [ ] At least Wegovy companion content authored and published in PIP admin
- [ ] Viora hits `GET /drugs` — receives >0 results
- [ ] Viora hits `GET /drugs/semaglutide-wegovy` — receives full companion payload
- [ ] Disclaimer text rendered on companion screen
- [ ] `GET /drugs/semaglutide-wegovy/tracker-hints` — Viora enables correct tracking inputs
