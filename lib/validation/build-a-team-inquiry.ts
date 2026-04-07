import { z } from "zod"

export const buildATeamInquirySchema = z.object({
  roles: z
    .array(
      z.object({
        slug: z.string().trim().regex(/^[a-z0-9-]{1,200}$/),
        count: z.coerce.number().int().min(1).max(999),
        selectedModules: z.array(z.string()).min(0),
        selectedTaskIds: z.array(z.number().int()),
      })
    )
    .min(1, "Add at least one role")
    .max(20),
  teamSize: z.string().trim().max(60),
  tierKey: z.string().trim().max(60),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  customRequests: z.array(z.string().trim().max(500)).max(10),
  website: z.string().optional(), // honeypot
})

export type BuildATeamInquiryInput = z.infer<typeof buildATeamInquirySchema>
