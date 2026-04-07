import { z } from "zod"

/**
 * Authoritative validation for POST /api/one-pager.
 * The one-pager is a softer capture — we only ask for email and the
 * occupation slug. No name, no company. Friction minimized.
 */
export const onePagerSchema = z.object({
  occupationSlug: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  website: z.string().optional(), // honeypot
})

export type OnePagerInput = z.infer<typeof onePagerSchema>
