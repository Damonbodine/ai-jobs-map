"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { DARK_MODE_ENABLED } from "@/lib/features"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const links = [
    { href: "/about", label: "About" },
    { href: "/browse", label: "Industries" },
    { href: "/build-a-team", label: "Build a Team" },
    { href: "/products", label: "Pricing" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 group">
            <span className="font-heading text-lg font-semibold tracking-tight">
              AI Timeback
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem render={<Link href="/" />}>
              Home
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/browse" />}>
              Browse All
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/build-a-team" />}>
              Build a Team
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/products" />}>
              Pricing
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/about" />}>
              About
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
          {DARK_MODE_ENABLED ? (
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
          ) : null}
          <Link
            href="/contact"
            className="text-sm font-semibold bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Book a Call
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
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold bg-foreground text-background rounded-lg active:opacity-80 transition-opacity"
            >
              Book a Call
            </Link>
            {DARK_MODE_ENABLED ? (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-border active:bg-secondary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}
