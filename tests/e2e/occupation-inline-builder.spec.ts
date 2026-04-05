import { expect, test } from "@playwright/test"

test("occupation page supports inline builder flow", async ({ page }) => {
  await page.goto("/occupation/financial-managers")

  await expect(
    page.getByRole("heading", { name: /financial managers/i })
  ).toBeVisible()

  const stickyBuildButton = page.getByRole("button", {
    name: /build your custom ai assistant/i,
  })
  await expect(stickyBuildButton).toBeVisible()

  await page
    .getByRole("button", { name: /update financial policies/i })
    .click()

  await stickyBuildButton.click()

  await expect(
    page.getByRole("heading", { name: /shape your assistant/i })
  ).toBeVisible()

  await page.getByRole("combobox").selectOption({ label: "10+ people" })
  await page
    .getByPlaceholder("Add a task, workflow, or requirement...")
    .fill("Quarterly board packet summaries")
  await page.getByRole("button", { name: /^add$/i }).click()

  await expect(page.getByText("Quarterly board packet summaries")).toBeVisible()

  await page.getByPlaceholder("Your name").fill("Playwright Smoke Test")
  await page
    .getByPlaceholder("you@example.com")
    .fill(`playwright-${Date.now()}@example.com`)

  await page
    .getByRole("button", { name: "Send Custom Build Request Form" })
    .click()

  await expect(
    page.getByRole("heading", { name: /we received your request/i })
  ).toBeVisible()
  await expect(page.getByText(/request summary/i)).toBeVisible()
})
