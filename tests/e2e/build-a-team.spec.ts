import { expect, test } from "@playwright/test"

test.describe("/build-a-team page", () => {
  test("empty state shows templates", async ({ page }) => {
    await page.goto("/build-a-team")
    await expect(
      page.getByRole("heading", { name: /what would your team look like/i })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /start from a template/i })
    ).toBeVisible()
    // At least one template card should render.
    await expect(
      page.getByRole("link", { name: /small medical clinic/i })
    ).toBeVisible()
  })

  test("template click loads a populated cart", async ({ page }) => {
    await page.goto("/build-a-team")
    await page.getByRole("link", { name: /small medical clinic/i }).click()
    await expect(page).toHaveURL(/\/build-a-team\?template=clinic/)
    // Once the template loads, we should see the results card.
    await expect(
      page.getByRole("heading", { name: /what this team is worth with ai/i })
    ).toBeVisible()
  })

  test("URL state encodes the cart", async ({ page }) => {
    await page.goto("/build-a-team?roles=software-developers:3,registered-nurses:2")
    await expect(
      page.getByRole("heading", { name: /what this team is worth with ai/i })
    ).toBeVisible()
    // The total people stat should equal 5.
    await expect(page.getByText(/people in scope/i)).toBeVisible()
  })

  test("PDF modal opens and validates email", async ({ page }) => {
    await page.goto("/build-a-team?roles=software-developers:3")
    await page.getByRole("button", { name: /email me a pdf/i }).click()

    await expect(
      page.getByRole("dialog", { name: /email me the department blueprint/i })
    ).toBeVisible()

    await page.getByLabel(/^email$/i).first().fill("not-an-email")
    await page.getByRole("button", { name: /email me the pdf/i }).click()

    await expect(
      page.getByText(/please enter a valid email/i).first()
    ).toBeVisible()
  })
})

test.describe("entry points", () => {
  test("Build a Team appears in the header nav and routes correctly", async ({
    page,
  }) => {
    await page.goto("/")
    await page
      .getByRole("link", { name: /^build a team$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/build-a-team$/)
  })

  test("Add to Team button on occupation page pre-loads the cart", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    await page.getByRole("link", { name: /^add to team$/i }).click()
    await expect(page).toHaveURL(
      /\/build-a-team\?roles=software-developers:1/
    )
  })
})
