/**
 * Live QA test against production — actually submits forms and checks results.
 * Run with: npx playwright test tests/e2e/live-qa.spec.ts --headed
 */

import { test, expect } from "@playwright/test"

const BASE = "https://ai-jobs-map.vercel.app"
const TEST_EMAIL = "damon@placetostandagency.com"
const TEST_NAME = "QA Test"

test("homepage branding + nav", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" })
  await expect(page).toHaveTitle(/AI Timeback/)
  await expect(page.locator("header")).toContainText("AI Timeback")
  await expect(page.locator("header")).toContainText("Build a Team")
})

test("one-pager form submits and shows success", async ({ page }) => {
  await page.goto(`${BASE}/occupation/registered-nurses`)
  await expect(page.getByRole("heading", { name: /registered nurses/i })).toBeVisible()

  // Open modal
  const btn = page.getByRole("button", { name: /download one-pager/i })
  await expect(btn).toBeVisible()
  await btn.click()

  // Modal has email field only (no name field)
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 })
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByRole("button", { name: /email me the one-pager/i }).click()

  // Success state shows "On its way."
  await expect(page.getByText(/on its way/i)).toBeVisible({ timeout: 15000 })
})

test("build-a-team: configure roles + submit inquiry", async ({ page }) => {
  await page.goto(`${BASE}/build-a-team?roles=registered-nurses:2,software-developers:1`)

  // Use first() to avoid strict mode violation from multiple matching elements
  await expect(page.getByText("Registered Nurses").first()).toBeVisible()
  await expect(page.getByText("Software Developers").first()).toBeVisible()

  // Click "Build Team Assistant" CTA
  const cta = page.getByRole("button", { name: /build team assistant/i })
  await expect(cta).toBeVisible()
  await cta.click()

  // Contact phase — email field appears
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 })
  await page.getByLabel(/email/i).fill(TEST_EMAIL)

  // Submit
  const submit = page.getByRole("button", { name: /send|submit|request|build/i }).last()
  await submit.click()

  // Done phase — Calendly embed should appear
  await expect(page.locator("iframe[src*='calendly']")).toBeVisible({ timeout: 20000 })
})

test("contact form submits", async ({ page }) => {
  await page.goto(`${BASE}/contact`)

  await page.getByLabel("Name").fill(TEST_NAME)
  await page.getByLabel("Email").fill(TEST_EMAIL)
  await page.getByLabel(/what are you trying to build/i).fill("Live QA automated test — please ignore.")
  await page.getByRole("button", { name: /send message/i }).click()

  // Success state shows "Message received"
  await expect(page.getByText(/message received/i)).toBeVisible({ timeout: 10000 })
})
