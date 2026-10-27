import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Cart } from "./cart"

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }))

const role = (slug: string, firstId: number) => ({
  slug, title: slug, occupationId: firstId, hourlyWage: 50, displayedMinutes: 60, annualValue: 1000,
  tasks: [0, 1].map(offset => ({
    id: firstId + offset, task_name: `${slug} task ${offset}`, displayLow: 20, displayHigh: 40,
    ai_impact_level: 4, ai_how_it_helps: null, moduleKey: "documentation",
  })),
})
const nurses = role("registered-nurses", 10)
const developers = role("software-developers", 20)
const shared = { shareUrl: null, capabilitiesByModule: {} }

afterEach(() => vi.unstubAllGlobals())

describe("team cart navigation", () => {
  it("populates editable roles when a template arrives after the empty page", () => {
    const { rerender } = render(<Cart {...shared} initialCart={[]} roleTaskData={[]} />)
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
    rerender(<Cart {...shared} initialCart={[{ slug: nurses.slug, count: 3 }]} roleTaskData={[nurses]} />)
    expect(screen.getByRole("spinbutton", { name: "registered-nurses count" })).toHaveValue(3)
    expect(screen.getByRole("button", { name: "2/2 tasks" })).toBeVisible()
    expect(screen.getByRole("button", { name: /build team assistant/i })).toBeVisible()
    rerender(<Cart {...shared} initialCart={[]} roleTaskData={[]} />)
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
  })

  it("defaults new roles to all tasks while preserving intentional deselection through count changes and submission", async () => {
    const firstCart = [{ slug: nurses.slug, count: 1 }]
    const { rerender } = render(<Cart {...shared} initialCart={firstCart} roleTaskData={[nurses]} />)
    fireEvent.click(screen.getByRole("button", { name: "2/2 tasks" }))
    fireEvent.click(screen.getByRole("button", { name: "Selected" }))
    expect(screen.getByRole("button", { name: "0/2 tasks" })).toBeVisible()
    const addedCart = [...firstCart, { slug: developers.slug, count: 1 }]
    rerender(<Cart {...shared} initialCart={addedCart} roleTaskData={[nurses, developers]} />)
    expect(screen.getByRole("button", { name: "0/2 tasks" })).toBeVisible()
    expect(screen.getByRole("button", { name: "2/2 tasks" })).toBeVisible()
    rerender(<Cart {...shared} initialCart={[firstCart[0], { slug: developers.slug, count: 2 }]} roleTaskData={[nurses, developers]} />)
    expect(screen.getByRole("spinbutton", { name: "software-developers count" })).toHaveValue(2)
    expect(screen.getByRole("button", { name: "0/2 tasks" })).toBeVisible()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)
    fireEvent.click(screen.getByRole("button", { name: /build team assistant/i }))
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "qa@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: /send me the team blueprint/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).roles).toEqual([
      { slug: nurses.slug, count: 1, selectedTaskIds: [], selectedModules: [] },
      { slug: developers.slug, count: 2, selectedTaskIds: [20, 21], selectedModules: ["documentation"] },
    ])
  })
})
