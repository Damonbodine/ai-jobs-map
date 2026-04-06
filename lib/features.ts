const TRUE_VALUES = new Set(["1", "true", "yes", "on"])

export const DARK_MODE_ENABLED = TRUE_VALUES.has(
  (process.env.NEXT_PUBLIC_ENABLE_DARK_MODE ?? "").toLowerCase()
)
