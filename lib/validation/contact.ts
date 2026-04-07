import { z } from "zod"

/**
 * Single source of truth for contact form validation. Used by:
 * - app/contact/contact-form.tsx (client-side preflight)
 * - app/api/contact/route.ts (authoritative server-side validation)
 *
 * Never trust client-side validation alone. The server revalidates.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(254, "Email is too long"),
  company: z
    .string()
    .trim()
    .max(200, "Company name is too long")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please include a few details about what you're looking to build")
    .max(5000, "Message is too long (max 5000 characters)"),
  // Honeypot: real users leave it empty. Bots fill every field.
  // If this has ANY value, silently succeed but don't do anything.
  website: z.string().max(0).optional().or(z.literal("")),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>
