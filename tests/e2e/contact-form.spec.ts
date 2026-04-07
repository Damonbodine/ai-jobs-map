import { expect, test } from "@playwright/test"

test.describe("/contact page", () => {
  test("renders trust copy and form fields", async ({ page }) => {
    await page.goto("/contact")

    await expect(
      page.getByRole("heading", { name: /let['’]s talk/i })
    ).toBeVisible()

    await expect(
      page.getByText(/place to stand agency/i).first()
    ).toBeVisible()

    await expect(page.getByLabel(/your name/i)).toBeVisible()
    await expect(page.getByLabel(/^email$/i)).toBeVisible()
    await expect(page.getByLabel(/company \(optional\)/i)).toBeVisible()
    await expect(page.getByLabel(/what are you trying to build/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /send message/i })
    ).toBeVisible()

    // Email fallback link
    await expect(
      page.getByRole("link", { name: /damon@placetostandagency\.com/i }).first()
    ).toBeVisible()
  })

  test("shows inline validation errors for empty submission", async ({
    page,
  }) => {
    await page.goto("/contact")
    await page.getByRole("button", { name: /send message/i }).click()

    await expect(page.getByText(/please enter your name/i)).toBeVisible()
    await expect(
      page.getByText(/please enter a valid email address/i)
    ).toBeVisible()
    await expect(
      page.getByText(/few details about what you're looking to build/i)
    ).toBeVisible()
  })
})

test.describe("header navigation", () => {
  test("Book a Call CTA routes to /contact", async ({ page }) => {
    await page.goto("/")
    await page
      .getByRole("link", { name: /^book a call$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})

test.describe("footer trust links", () => {
  test("Security, Terms, and Privacy are reachable from footer", async ({
    page,
  }) => {
    await page.goto("/")

    await page
      .getByRole("link", { name: /^security$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/security$/)
    await expect(
      page.getByRole("heading", { name: /how we handle your data/i })
    ).toBeVisible()

    await page.goto("/")
    await page.getByRole("link", { name: /terms of service/i }).click()
    await expect(page).toHaveURL(/\/terms$/)
    await expect(
      page.getByRole("heading", { name: /terms of service/i })
    ).toBeVisible()

    await page.goto("/")
    await page.getByRole("link", { name: /privacy policy/i }).click()
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(
      page.getByRole("heading", { name: /privacy policy/i })
    ).toBeVisible()
  })
})

test.describe("/security page", () => {
  test("renders pillars and compliance copy", async ({ page }) => {
    await page.goto("/security")

    await expect(
      page.getByRole("heading", { name: /how we handle your data/i })
    ).toBeVisible()
    await expect(page.getByText(/your data stays yours/i)).toBeVisible()
    await expect(
      page.getByText(/infrastructure you can audit/i)
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^llm data handling$/i })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^regulated data$/i })
    ).toBeVisible()
  })
})
