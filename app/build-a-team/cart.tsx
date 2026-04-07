"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, X, Link2, Mail, Check } from "lucide-react"
import {
  encodeCart,
  mutateCart,
  type CartRow,
} from "@/lib/build-a-team/url-state"
import { RoleSearch } from "./role-search"
import { PdfModal } from "./pdf-modal"

export function Cart({
  initialCart,
  shareUrl,
}: {
  initialCart: CartRow[]
  shareUrl: string | null
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartRow[]>(initialCart)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)

  function commit(next: CartRow[]) {
    setCart(next)
    const encoded = encodeCart(next)
    const url = encoded ? `/build-a-team?roles=${encoded}` : "/build-a-team"
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function handleAdd(slug: string, title: string) {
    const next = mutateCart(cart, slug, { addCount: 1 })
    commit(next)
  }

  function handleSetCount(slug: string, count: number) {
    const next = mutateCart(cart, slug, { setCount: count })
    commit(next)
  }

  function handleRemove(slug: string) {
    const next = mutateCart(cart, slug, { setCount: 0 })
    commit(next)
  }

  async function handleCopyShare() {
    if (typeof window === "undefined") return
    const fullUrl = window.location.href
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail in non-secure contexts; fall back to a
      // selectable input the user can copy from.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-semibold">Your team</h2>
          <span className="text-sm text-muted-foreground">
            {cart.length} role{cart.length === 1 ? "" : "s"}
          </span>
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-5">
            Search for a role below to get started, or pick a template above.
          </p>
        ) : (
          <ul className="space-y-3 mb-5">
            {cart.map((row) => (
              <CartRowItem
                key={row.slug}
                row={row}
                onSetCount={handleSetCount}
                onRemove={handleRemove}
                disabled={pending}
              />
            ))}
          </ul>
        )}

        <div>
          <label
            htmlFor="role-search"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Add a role
          </label>
          <RoleSearch onPick={handleAdd} />
        </div>
      </div>

      {cart.length > 0 ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-accent" />
                Copied
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Copy share link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4" />
            Email me a PDF
          </button>
        </div>
      ) : null}

      {pdfOpen ? (
        <PdfModal cart={cart} onClose={() => setPdfOpen(false)} />
      ) : null}
    </div>
  )
}

function CartRowItem({
  row,
  onSetCount,
  onRemove,
  disabled,
}: {
  row: CartRow
  onSetCount: (slug: string, count: number) => void
  onRemove: (slug: string) => void
  disabled: boolean
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex-1 text-sm text-foreground">{prettySlug(row.slug)}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSetCount(row.slug, Math.max(1, row.count - 1))}
          disabled={disabled || row.count <= 1}
          aria-label={`Decrease ${row.slug} count`}
          className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={row.count}
          onChange={(e) =>
            onSetCount(row.slug, Number.parseInt(e.target.value || "1", 10))
          }
          aria-label={`${row.slug} count`}
          className="w-14 text-center text-sm rounded-md border border-border bg-background py-1"
        />
        <button
          type="button"
          onClick={() => onSetCount(row.slug, row.count + 1)}
          disabled={disabled || row.count >= 999}
          aria-label={`Increase ${row.slug} count`}
          className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(row.slug)}
        aria-label={`Remove ${row.slug}`}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  )
}

// Slug-only fallback label, used until the server hydrates with a
// real title. The page server component already renders the
// authoritative breakdown table; this is the editor view.
function prettySlug(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}
