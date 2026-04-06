"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"
import { DARK_MODE_ENABLED } from "@/lib/features"

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={DARK_MODE_ENABLED}
      forcedTheme={DARK_MODE_ENABLED ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  )
}
