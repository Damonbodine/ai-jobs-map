import { z } from "zod"

/**
 * Validation for POST /api/build-a-team/pdf.
 *
 * Two concerns: (1) the cart payload is recomputed server-side from
 * the live DB, so we don't trust client-sent display values — we only
 * need the slug + count pairs and the email; (2) honeypot enforced
 * before zod in the route handler.
 */
export const buildATeamPdfSchema = z.object({
  cart: z
    .array(
      z.object({
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]{1,200}$/, "Invalid occupation slug"),
        count: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1, "Add at least one role to your team")
    .max(20, "Too many roles in one cart"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  // Optional context — what kind of team they're building.
  teamLabel: z.string().trim().max(120).optional(),
  website: z.string().optional(), // honeypot
})

export type BuildATeamPdfInput = z.infer<typeof buildATeamPdfSchema>
