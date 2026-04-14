import { impactRetentionFactor } from "./team-deck-data"

describe("impactRetentionFactor", () => {
  it("returns 0.15 for impact level 5 (85% reduction)", () => {
    expect(impactRetentionFactor(5)).toBe(0.15)
  })
  it("returns 0.30 for impact level 4", () => {
    expect(impactRetentionFactor(4)).toBe(0.30)
  })
  it("returns 0.50 for impact level 3", () => {
    expect(impactRetentionFactor(3)).toBe(0.50)
  })
  it("returns 0.70 for impact level 2", () => {
    expect(impactRetentionFactor(2)).toBe(0.70)
  })
  it("returns 0.85 for impact level 1 (15% reduction)", () => {
    expect(impactRetentionFactor(1)).toBe(0.85)
  })
  it("returns 0.50 for null impact level (default)", () => {
    expect(impactRetentionFactor(null)).toBe(0.50)
  })
})
