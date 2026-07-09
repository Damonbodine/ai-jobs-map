import { describe, it, expect, vi, beforeEach } from "vitest"

// Chainable drizzle stub: every method returns the builder; awaiting it
// resolves rows or rejects with a connection failure.
const state: { rows: unknown[]; fail: boolean } = { rows: [], fail: false }

function builder(): any {
  const b: any = {}
  for (const m of ["from", "where", "limit", "orderBy", "select"]) {
    b[m] = () => b
  }
  b.then = (resolve: (v: unknown[]) => void, reject: (e: Error) => void) => {
    if (state.fail) return reject(new Error("connection refused"))
    return resolve(state.rows)
  }
  return b
}

vi.mock("@/lib/db/client", () => ({
  db: { select: () => builder() },
}))

import {
  getOccupationBySlug,
  getOccupationProfile,
  getOccupationTasks,
} from "./occupation-data"

beforeEach(() => {
  state.rows = []
  state.fail = false
})

describe("occupation-data fetchers", () => {
  it("returns null for a slug that does not exist", async () => {
    state.rows = []
    await expect(getOccupationBySlug("no-such-slug")).resolves.toBeNull()
  })

  it("propagates a database failure instead of reporting not-found", async () => {
    // A DB outage must never render as a 404 or an empty catalog.
    state.fail = true
    await expect(getOccupationBySlug("registered-nurses")).rejects.toThrow(
      "connection refused"
    )
  })

  it("propagates database failures from profile and task fetchers", async () => {
    state.fail = true
    await expect(getOccupationProfile(1)).rejects.toThrow("connection refused")
    await expect(getOccupationTasks(1)).rejects.toThrow("connection refused")
  })
})
