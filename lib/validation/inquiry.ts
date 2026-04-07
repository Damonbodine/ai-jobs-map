import { z } from "zod"

/**
 * Authoritative validation for POST /api/inquiries.
 * Used by both the client-side preflight (in occupation-builder.tsx)
 * and the server-side route handler.
 *
 * Tier keys must stay in sync with lib/pricing.ts PRICING_TIERS.
 */
export const inquirySchema = z.object({
  // occupationId is numeric in this codebase (bigserial primary key).
  // z.coerce.number() accepts JSON `123` or `"123"` — both round-trip safely.
  occupationId: z.coerce.number().int().positive("Missing occupation id"),
  occupationTitle: z.string().trim().min(1).max(200),
  occupationSlug: z.string().trim().min(1).max(200),
  selectedModules: z
    .array(z.string().min(1))
    .min(1, "Select at least one module"),
  selectedCapabilities: z.array(z.string().min(1)).default([]),
  // Task IDs are also numeric in the schema. Coerce for flexibility.
  selectedTaskIds: z.array(z.coerce.number().int()).default([]),
  customRequests: z
    .array(z.string().trim().min(1).max(500))
    .max(20)
    .default([]),
  teamSize: z.string().trim().max(40).default(""),
  tierKey: z.enum(["starter", "recommended", "enterprise"]),
  // Pre-computed display values — we revalidate from the DB server-side
  // before generating the PDF, so client tampering can only affect the
  // copy, not the underlying numbers.
  displayedMinutes: z.number().int().min(0).max(600),
  displayedAnnualValue: z.number().min(0).max(1_000_000),
  contactName: z.string().trim().max(120).default(""),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  website: z.string().optional(), // honeypot
})

export type InquiryInput = z.infer<typeof inquirySchema>
