# Peptide Intelligence Platform (PIP)
## Expanded Product Requirements Document (PRD)

---

# 1. Executive Summary

Peptide Intelligence Platform (PIP) is a **research-grade SaaS web application** designed to aggregate, structure, and present peptide-related scientific literature in a compliant, non-prescriptive format.

The platform transforms fragmented biomedical research into:
- Structured datasets
- Searchable insights
- Evidence-based summaries
- Non-prescriptive dosage observations

---

# 2. Product Vision

To become the **leading structured intelligence platform for peptide research**, enabling users to understand scientific literature without crossing into regulated medical guidance.

---

# 3. Product Principles

### 3.1 Compliance First
- No medical advice
- No prescribing behaviour
- No treatment instructions

### 3.2 Evidence Over Opinion
- All data must be traceable to sources
- No speculative claims

### 3.3 Structured Intelligence
- Transform unstructured research into usable insights

---

# 4. Core Problem

Peptide information is:
- Fragmented across studies
- Difficult to interpret
- Often presented with unsafe or non-compliant guidance

PIP solves this by:
- Aggregating research
- Structuring data
- Providing safe, contextual insights

---

# 5. Target Users

## Primary Users
- Biohackers (research-driven)
- Fitness users (education)
- Researchers

## Secondary Users
- Clinicians (future, gated)
- B2B partners

---

# 6. Feature Requirements

## 6.1 Peptide Knowledge Base
Each peptide must include:
- Name, aliases
- Mechanism summary
- Biological pathways
- Evidence score
- Status (investigational, research-stage)

---

## 6.2 Study Explorer
Features:
- Indexed studies
- Filtering (type, year, population)
- Metadata extraction

---

## 6.3 Observed Dosage Intelligence

### Must Display:
- Min/max dosage
- Study count
- Context (human vs animal)

### Must NOT:
- Recommend usage
- Provide instructions

---

## 6.4 Risk Layer
- Side effects
- Severity
- Frequency

---

## 6.5 AI Summary Engine

### Outputs:
- Research summary
- Evidence strength
- Limitations

### Constraints:
- No prescriptive content
- Guardrails enforced

---

# 7. Compliance & Legal

## 7.1 Content Restrictions
- No dosage recommendations
- No treatment guidance
- No optimisation advice

## 7.2 Mandatory Safeguards
- Disclaimer gating
- Terms of Service
- Region-aware messaging

---

# 8. UX Design

## 8.1 First-Time Flow
- Disclaimer acceptance required

## 8.2 Peptide Page Layout
- Header (name, score)
- AI summary
- Observed dosage (clearly labelled)
- Studies
- Risks

---

# 9. Data Model

Core tables:
- peptides
- studies
- study_dosages
- outcomes
- side_effects
- ai_summaries

Derived:
- dosage ranges

---

# 10. API Design

## Public
- GET /peptides
- GET /peptides/{slug}
- GET /studies
- GET /dosage-range

## Internal
- POST ingestion
- AI generation endpoints

---

# 11. AI Guardrails

Block phrases:
- “recommended dosage”
- “should take”
- “protocol”
- “cycle”

---

# 12. Monetisation

## Model
SaaS subscription

## Allowed
- Research access
- Data insights

## Not Allowed
- Product sales
- Affiliate links

---

# 13. Architecture

- Next.js frontend
- Supabase backend
- Stripe billing

---

# 14. Security

- RLS policies
- Auth controls
- Audit logs

---

# 15. Roadmap

## Phase 1
- MVP launch

## Phase 2
- AI features

## Phase 3
- API + B2B

---

# 16. Success Metrics

- Conversion rate
- Retention
- Engagement

---

# 17. Risks

| Risk | Mitigation |
|------|-----------|
| Regulatory | Strict compliance |
| Stripe bans | SaaS framing |
| AI misuse | Guardrails |

---

# 18. Future Enhancements

- API marketplace
- Advanced analytics
- Enterprise tier

---

# 19. Key Takeaway

This platform is:

A **research intelligence system**

NOT a:

Medical or peptide usage tool

---
