import { expect, test } from "@playwright/test"

for (const slug of ["life-physical-social-science", "education", "arts-media", "food-service", "installation-repair"]) {
  test(`${slug} has occupations in its category page and browse filter`, async ({ page }) => {
    await page.goto(`/category/${slug}`)
    const categoryLinks = page.locator('main a[href^="/occupation/"]')
    await expect(categoryLinks.first()).toBeVisible()
    const occupationHref = await categoryLinks.first().getAttribute("href")
    await page.goto(`/browse?category=${slug}`)
    await expect(page.locator(`main a[href="${occupationHref}"]`).first()).toBeVisible()
    await expect(page.getByText("No occupations found.", { exact: true })).not.toBeVisible()
  })
}
