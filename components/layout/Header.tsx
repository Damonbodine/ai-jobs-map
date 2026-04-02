"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Menu, X, Sun, Moon } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const links = [
    { href: "/", label: "Map" },
    { href: "/browse", label: "Browse" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Search className="h-4 w-4 text-accent transition-colors group-hover:text-foreground" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            AI Jobs Map
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <Link
            href="/browse"
            className="text-sm font-semibold bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Find Your Role
          </Link>
        </nav>

        <button
          className="sm:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-2 space-y-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block py-3 px-3 -mx-1 rounded-lg text-sm font-medium transition-colors active:bg-secondary",
                pathname === link.href
                  ? "text-foreground bg-secondary/50"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 mt-1 border-t border-border flex items-center gap-2">
            <Link
              href="/browse"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold bg-foreground text-background rounded-lg active:opacity-80 transition-opacity"
            >
              Find Your Role
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-border active:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
