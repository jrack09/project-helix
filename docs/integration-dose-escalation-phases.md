# Integration guide: Dose Escalation Phases

How to consume the **phased dose-escalation schedule** from the Drugs API and
render it correctly in your app. The API already serves this data; this doc
explains where it lives and how to render it.

---

## 1. Endpoint

```
GET /api/public/drugs/{slug}
Authorization: Bearer <your_api_key>
```

Example: `GET /api/public/drugs/retatrutide`

## 2. Where the escalation data lives in the response

The response is wrapped in a standard envelope:

```jsonc
{
  "data": {
    "drug": { ... },
    "clinical_profile": {
      "dose_escalation_phases": [ ... ],   // <-- THE PHASED SCHEDULE (use this)
      "dose_cycle_profile": { ... },
      ...
    },
    "dose_reference": [ ... ],             // flat concentration/volume table (NOT phased)
    "protocol_timeline": [ ... ],          // narrative journey-map (NOT the dosing table)
    "reconstitution_guide": [ ... ]
  },
  "disclaimer": { ... },
  "meta": { "version": "v1", "last_updated": "2026-..." }
}
```

> **The single most common integration mistake:** binding the "Dose Escalation
> Phases" UI to `data.dose_reference` (a flat mg→units→mL concentration table)
> or to `data.protocol_timeline` (a prose journey map) instead of to
> **`data.clinical_profile.dose_escalation_phases`**. The phased week-banded
> schedule **only** comes from `dose_escalation_phases`.

## 3. Shape of each phase object

`data.clinical_profile.dose_escalation_phases` is an **array** of:

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | Stable row id, good for React keys |
| `protocol_label` | string | **Group by this.** Multiple protocols can be returned (e.g. "Standard …" and "Advanced … high-dose"). |
| `phase_label` | string | Display label for the row, e.g. `"Weeks 1-4"`, `"Week 13 onward"` |
| `start_week` | integer | First week of the phase |
| `end_week` | integer \| **null** | `null` = open-ended / maintenance phase ("onward") |
| `dose_amount` | number | e.g. `2`, `4`, `12` |
| `dose_unit` | string | e.g. `"mg"` |
| `frequency` | string | e.g. `"once weekly"` |
| `route` | string \| null | e.g. `"subcutaneous injection"` |
| `phase_purpose` | string \| null | Maps to the **GUIDANCE** column, e.g. "First escalation step." |
| `hold_or_reduce_guidance` | string \| null | Safety note for holding/reducing the dose |
| `source_id` | string (uuid) \| null | FK into `data.clinical_profile.sources[]` for the citation |
| `ordinal` | integer | **Sort by this within a protocol** |

### Example (retatrutide, abridged)

```json
[
  {
    "protocol_label": "Advanced retatrutide Phase 2 high-dose reference",
    "phase_label": "Weeks 1-4", "start_week": 1, "end_week": 4,
    "dose_amount": 2, "dose_unit": "mg", "frequency": "once weekly",
    "route": "subcutaneous injection",
    "phase_purpose": "Trial initiation and tolerability phase.",
    "hold_or_reduce_guidance": "Investigational schedule; follow prescriber or trial protocol.",
    "ordinal": 5
  },
  {
    "protocol_label": "Advanced retatrutide Phase 2 high-dose reference",
    "phase_label": "Weeks 5-8", "start_week": 5, "end_week": 8,
    "dose_amount": 4, "dose_unit": "mg", "frequency": "once weekly",
    "phase_purpose": "First escalation step.",
    "hold_or_reduce_guidance": "Do not accelerate without protocol guidance.",
    "ordinal": 6
  }
]
```

## 4. Rendering rules (important)

1. **Group by `protocol_label`.** The array can contain several protocols
   interleaved. Render one table/section per `protocol_label`, with the label as
   the heading (e.g. "ADVANCED RETATRUTIDE PHASE 2 HIGH-DOSE REFERENCE").

2. **Sort each group by `ordinal`** (ascending). Do not rely on array order or
   on `start_week` alone.

3. **Build the table columns** as:
   - PHASE → `phase_label`
   - DOSE → `` `${dose_amount} ${dose_unit}` `` (e.g. "2 mg")
   - FREQUENCY → `frequency`
   - GUIDANCE → `phase_purpose` (fall back to blank if null)

4. **Open-ended phases:** when `end_week === null`, render the range as
   "Week {start_week} onward" (the API also gives you `phase_label` already
   worded this way — prefer `phase_label`).

5. **Empty state:** if `dose_escalation_phases` is `[]`, the drug has no
   structured escalation schedule — hide the section (don't fall back to
   `dose_reference`, which is a different concept).

6. **Citations (optional):** if `source_id` is set, look it up in
   `data.clinical_profile.sources[]` (matched by `id`) to show the reference.

7. **Always render the disclaimer** from `data.disclaimer` near this content —
   these are educational population typicals, not a prescription.

## 5. Reference pseudo-code

```ts
type Phase = {
  id: string;
  protocol_label: string;
  phase_label: string;
  start_week: number;
  end_week: number | null;
  dose_amount: number;
  dose_unit: string;
  frequency: string;
  route: string | null;
  phase_purpose: string | null;
  hold_or_reduce_guidance: string | null;
  source_id: string | null;
  ordinal: number;
};

const phases: Phase[] = resp.data.clinical_profile.dose_escalation_phases ?? [];

// 1. group by protocol
const byProtocol = new Map<string, Phase[]>();
for (const p of phases) {
  (byProtocol.get(p.protocol_label) ?? byProtocol.set(p.protocol_label, []).get(p.protocol_label)!)
    .push(p);
}

// 2. sort each group by ordinal, then render
for (const [protocol, rows] of byProtocol) {
  rows.sort((a, b) => a.ordinal - b.ordinal);
  renderTable(protocol, rows.map(r => ({
    phase: r.phase_label,
    dose: `${r.dose_amount} ${r.dose_unit}`,
    frequency: r.frequency,
    guidance: r.phase_purpose ?? '',
  })));
}
```

## 6. Quick checklist for the app team

- [ ] Reading from `data.clinical_profile.dose_escalation_phases` (not `dose_reference` / `protocol_timeline`).
- [ ] Grouping rows by `protocol_label`.
- [ ] Sorting each group by `ordinal`.
- [ ] Handling `end_week === null` as an open-ended phase.
- [ ] Hiding the section when the array is empty.
- [ ] Showing `data.disclaimer`.
