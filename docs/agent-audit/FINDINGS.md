# Repository Audit Findings

## Summary

The sampled public API routes consistently validate request bodies, derive occupation data server-side, escape HTML email content, and persist lead data before attempting email delivery. The principal authorization defect is in the custom-demo lead flow: a client-controlled generation identifier is treated as sufficient authority to retrieve generated content. The public endpoints also rely on an explicitly best-effort, process-local rate limiter, which does not provide the stated limits under normal serverless scaling.

## Bugs

### Demo generation content is not authorized to the lead submission

`app/api/demo/lead/route.ts` accepts any UUID in `generationId`, stores it with the new lead, and subsequently loads `demoGenerations.generatedRole` using only that identifier. It does not verify that the generation was created by the submitting client, that it belongs to the supplied task description, or that it has not been claimed already. The loaded role (including its narrative and time estimates) is then included in an email sent to the caller-provided address. Anyone who obtains or guesses a valid generation UUID can have the associated generated content delivered to an arbitrary address. Bind generations to a server-issued, unguessable client session or one-time claim token, and enforce that binding before reading or attaching a generation to a lead.

### Public endpoint limits are not enforced across serverless instances

`lib/rate-limit.ts` keeps buckets in module-local memory; the file documents that cold starts reset them and instances do not coordinate. Routes including `app/api/demo/generate/route.ts`, `app/api/one-pager/route.ts`, and `app/api/contact/route.ts` use this helper to cap costly generation, PDF, database, and email work. Under concurrent instances, an attacker can obtain the configured allowance from each instance, and a cold start resets the allowance entirely. This makes the limits ineffective as abuse protection and can expose the email and generation services to avoidable cost and denial-of-service pressure. Use a shared, atomic rate-limit store or edge-level protection for these expensive routes.

## Feature Opportunities

1. **Saved comparison links for occupation analysis.** `app/browse/page.tsx` already computes a cached catalog-wide estimate list, while the one-pager and inquiry routes already derive detailed occupation metrics server-side. Let visitors select several occupations and generate a shareable comparison view or PDF with the same canonical calculations.
2. **A resilient delivery status and retry workflow.** `app/api/one-pager/route.ts` records `pdfSentAt` and `pdfSendError`, and the contact/demo routes retain submissions when Resend fails. Add an internal status view and scheduled retry mechanism so saved leads and requested documents are reliably followed up without relying on log monitoring.
3. **Turn custom demos into an editable scenario builder.** `app/api/demo/generate/route.ts` returns structured custom role data and `app/api/demo/lead/route.ts` already emails a generated summary. Allow users to adjust baseline time, desired agents, and occupation context before capture, then persist and email the revised scenario for a more actionable sales handoff.
