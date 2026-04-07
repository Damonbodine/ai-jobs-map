import { expect, test } from "@playwright/test"

test.describe("occupation one-pager download", () => {
  test("button is visible and opens a modal with email input", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    const button = page.getByRole("button", { name: /download one-pager/i })
    await expect(button).toBeVisible()
    await button.click()

    await expect(
      page.getByRole("dialog", { name: /download the .* one-pager/i })
    ).toBeVisible()
    await expect(page.getByLabel(/^email$/i).first()).toBeVisible()
    await expect(
      page.getByRole("button", { name: /email me the one-pager/i })
    ).toBeVisible()
  })

  test("modal shows inline validation error for a bad email", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    await page.getByRole("button", { name: /download one-pager/i }).click()

    await page.getByLabel(/^email$/i).first().fill("not-an-email")
    await page
      .getByRole("button", { name: /email me the one-pager/i })
      .click()

    await expect(
      page.getByText(/please enter a valid email/i).first()
    ).toBeVisible()
  })

  test("modal closes when backdrop is clicked", async ({ page }) => {
    await page.goto("/occupation/software-developers")
    await page.getByRole("button", { name: /download one-pager/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // Click the backdrop (the fixed inset-0 wrapper, not the inner card)
    const dialog = page.getByRole("dialog")
    const box = await dialog.boundingBox()
    if (!box) throw new Error("Dialog has no bounding box")
    await page.mouse.click(box.x + 5, box.y + 5)

    await expect(dialog).not.toBeVisible()
  })
})
