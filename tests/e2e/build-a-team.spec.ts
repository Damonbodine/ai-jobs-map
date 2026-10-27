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
    await expect(page.getByRole("spinbutton", { name: "registered-nurses count", exact: true })).toHaveValue("3")
    await expect(page.getByRole("spinbutton", { name: "medical-secretaries-and-administrative-assistants count", exact: true })).toHaveValue("2")
    await expect(page.getByRole("spinbutton", { name: "bookkeeping-accounting-and-auditing-clerks count", exact: true })).toHaveValue("1")
    await expect(page.getByRole("button", { name: /build team assistant/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /email me a pdf/i })).toBeVisible()
    // Both the editable cart and server-rendered totals must update without reloading.
    await expect(
      page.getByRole("heading", { name: /what ai gives this team back/i })
    ).toBeVisible()
  })

  test("URL state encodes the cart", async ({ page }) => {
    await page.goto("/build-a-team?roles=software-developers:3,registered-nurses:2")
    await expect(
      page.getByRole("heading", { name: /what ai gives this team back/i })
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


test("newly searched roles select all tasks without reloading", async ({ page }) => {
  await page.goto("/build-a-team")
  await page.getByRole("textbox", { name: "Add a role", exact: true }).fill("software developer")
  await page.getByRole("button", { name: /Software developers.*Computer/ }).click()
  await expect(page.getByRole("spinbutton", { name: "software-developers count", exact: true })).toHaveValue("1")
  const tasks = page.getByRole("button", { name: /^\d+\/\d+ tasks$/ })
  await expect(tasks).toBeVisible()
  const match = (await tasks.innerText()).match(/(\d+)\/(\d+) tasks/)!
  expect(Number(match[1])).toBeGreaterThan(0)
  expect(match[1]).toBe(match[2])

  await tasks.click()
  await page.getByRole("button", { name: "Selected", exact: true }).first().click()
  const editedTasks = await tasks.innerText()
  expect(editedTasks).not.toBe(match[0])
  await page.getByRole("button", { name: "Increase software-developers count", exact: true }).click()
  await expect(page.getByRole("spinbutton", { name: "software-developers count", exact: true })).toHaveValue("2")
  await expect(tasks).toHaveText(editedTasks)

  await page.getByRole("textbox", { name: "Add a role", exact: true }).fill("registered nurse")
  await page.getByRole("button", { name: /Registered nurses.*Healthcare/ }).click()
  await expect(page.getByRole("spinbutton", { name: "registered-nurses count", exact: true })).toHaveValue("1")
  const nurseRow = page.getByRole("listitem").filter({ has: page.getByRole("spinbutton", { name: "registered-nurses count", exact: true }) })
  const nurseTasks = await nurseRow.getByRole("button", { name: /^\d+\/\d+ tasks$/ }).innerText()
  const nurseMatch = nurseTasks.match(/(\d+)\/(\d+) tasks/)!
  expect(Number(nurseMatch[1])).toBeGreaterThan(0)
  expect(nurseMatch[1]).toBe(nurseMatch[2])
})
