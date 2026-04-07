import Link from "next/link"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-heading text-base font-semibold mb-2">
              {SITE.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-3">
              Task-level AI analysis for 800+ occupations. A project by{" "}
              <a
                href={AGENCY.url}
                target="_blank"
                rel="noopener"
                className="text-foreground hover:text-accent transition-colors"
              >
                {AGENCY.name}
              </a>
              .
            </p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {CONTACT.email}
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <div className="space-y-2">
              <Link
                href="/browse"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Occupations
              </Link>
              <Link
                href="/products"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <div className="space-y-2">
              <Link
                href="/about"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Trust</h4>
            <div className="space-y-2">
              <Link
                href="/security"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {year} {AGENCY.name}. Built from public occupation data and our
            own task-level analysis.
          </p>
          <p>
            Data sources: U.S. Bureau of Labor Statistics &middot; O*NET
          </p>
        </div>
      </div>
    </footer>
  )
}
