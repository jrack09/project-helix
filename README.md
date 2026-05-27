# Peptide Intelligence Platform Starter

This is a Next.js + Supabase starter aligned to a research-only peptide intelligence product.

## Scope

- Educational and research reference only
- No medical advice
- No personalised dosing
- No protocol builder
- No supplier links
- Subscription access is for research content only

## Included

- Supabase schema and RLS policies
- Auth callback and login/signup pages
- Profile bootstrap SQL trigger
- Disclaimer acceptance gate
- Stripe checkout and webhook sync
- Compliance guardrails for AI output

## Quick start

1. Copy `.env.example` to `.env.local`
2. Create a Supabase project
3. Run the SQL migration in `supabase/migrations/0001_init.sql`
4. Install dependencies: `npm install`
5. Run locally: `npm run dev`

## Stripe notes

Your Stripe product should be framed as:

> Subscription access to a biomedical research reference platform that organises published literature into searchable summaries.

Do not frame it as dosage guidance, treatment planning, or peptide product access.
