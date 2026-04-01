import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-heading text-base font-semibold mb-2">AI Jobs Map</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Discover how AI can save time in your specific occupation.
              Task-level analysis for 800+ roles.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 sm:mb-3">Explore</h4>
            <div className="space-y-1.5 sm:space-y-2">
              <Link href="/browse" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
                Browse All Occupations
              </Link>
              <Link href="/products" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
                Products & Pricing
              </Link>
              <Link href="/factory" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
                Configure Your System
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 sm:mb-3">Company</h4>
            <div className="space-y-1.5 sm:space-y-2">
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
                About
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border text-center text-xs text-muted-foreground">
          Data from Bureau of Labor Statistics and O*NET.
        </div>
      </div>
    </footer>
  )
}
