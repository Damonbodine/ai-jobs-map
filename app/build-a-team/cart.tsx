"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, X, Link2, Mail, Check, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import {
  encodeCart,
  mutateCart,
  type CartRow,
} from "@/lib/build-a-team/url-state"
import { MODULE_REGISTRY } from "@/lib/modules"
import type { ModuleCapability } from "@/types"
import { RoleSearch } from "./role-search"
import { PdfModal } from "./pdf-modal"
import { RoleBuilder, type TaskItem } from "./role-builder"
import { TeamContactForm } from "./team-contact-form"
import { TeamDone } from "./team-done"

type RoleTaskData = {
  slug: string
  title: string
  occupationId: number
  hourlyWage: number | null
  tasks: TaskItem[]
  displayedMinutes: number
  annualValue: number
}

type Phase = "configure" | "contact" | "done"

export function Cart({
  initialCart,
  shareUrl,
  roleTaskData,
  capabilitiesByModule,
}: {
  initialCart: CartRow[]
  shareUrl: string | null
  roleTaskData: RoleTaskData[]
  capabilitiesByModule: Record<string, ModuleCapability[]>
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartRow[]>(initialCart)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("configure")
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())

  // Per-role selected task IDs — default: all tasks selected
  const [selectedTasksBySlug, setSelectedTasksBySlug] = useState<Map<string, Set<number>>>(
    () => {
      const m = new Map<string, Set<number>>()
      for (const rd of roleTaskData) {
        m.set(rd.slug, new Set(rd.tasks.map(t => t.id)))
      }
      return m
    }
  )

  // Contact form result (set when done)
  const [doneEmail, setDoneEmail] = useState("")
  const [doneTotalPeople, setDoneTotalPeople] = useState(0)
  const [doneAnnualValue, setDoneAnnualValue] = useState(0)

  function commit(next: CartRow[]) {
    setCart(next)
    const encoded = encodeCart(next)
    const url = encoded ? `/build-a-team?roles=${encoded}` : "/build-a-team"
    startTransition(() => { router.replace(url, { scroll: false }) })
  }

  function handleAdd(slug: string, _title: string) {
    commit(mutateCart(cart, slug, { addCount: 1 }))
  }

  function handleSetCount(slug: string, count: number) {
    commit(mutateCart(cart, slug, { setCount: count }))
  }

  function handleRemove(slug: string) {
    commit(mutateCart(cart, slug, { setCount: 0 }))
  }

  async function handleCopyShare() {
    if (typeof window === "undefined") return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  function toggleRoleExpand(slug: string) {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function handleToggleModule(slug: string, moduleKey: string, taskIds: number[]) {
    setSelectedTasksBySlug(prev => {
      const current = new Set(prev.get(slug) ?? [])
      const allSelected = taskIds.every(id => current.has(id))
      if (allSelected) {
        taskIds.forEach(id => current.delete(id))
      } else {
        taskIds.forEach(id => current.add(id))
      }
      const next = new Map(prev)
      next.set(slug, current)
      return next
    })
  }

  function handleToggleTask(slug: string, taskId: number) {
    setSelectedTasksBySlug(prev => {
      const current = new Set(prev.get(slug) ?? [])
      current.has(taskId) ? current.delete(taskId) : current.add(taskId)
      const next = new Map(prev)
      next.set(slug, current)
      return next
    })
  }

  // Compute total selected modules across all roles (for tier pricing)
  const allSelectedModules = new Set<string>()
  for (const rd of roleTaskData) {
    const selected = selectedTasksBySlug.get(rd.slug) ?? new Set()
    for (const task of rd.tasks) {
      if (selected.has(task.id)) allSelectedModules.add(task.moduleKey)
    }
  }

  async function handleInquirySubmit(data: {
    contactName: string
    contactEmail: string
    teamSizeLabel: string
    tierKey: string
    customRequests: string[]
  }) {
    const roles = cart.map(cartRow => {
      const rd = roleTaskData.find(r => r.slug === cartRow.slug)
      const selected = selectedTasksBySlug.get(cartRow.slug) ?? new Set()
      const selectedTaskIds = Array.from(selected)
      const selectedModules = Array.from(
        new Set(
          (rd?.tasks ?? [])
            .filter(t => selected.has(t.id))
            .map(t => t.moduleKey)
        )
      )
      return {
        slug: cartRow.slug,
        count: cartRow.count,
        selectedModules,
        selectedTaskIds,
      }
    })

    const res = await fetch("/api/build-a-team/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roles,
        teamSize: data.teamSizeLabel,
        tierKey: data.tierKey,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        customRequests: data.customRequests,
        website: "",
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? "Could not submit. Please try again.")
    }

    // Compute totals for done screen
    const totalPeople = cart.reduce((s, r) => s + r.count, 0)
    const totalAnnualValue = roleTaskData.reduce((s, rd) => {
      const cartRow = cart.find(r => r.slug === rd.slug)
      return s + rd.annualValue * (cartRow?.count ?? 0)
    }, 0)

    setDoneEmail(data.contactEmail)
    setDoneTotalPeople(totalPeople)
    setDoneAnnualValue(totalAnnualValue)
    setPhase("done")
  }

  // ── Done phase ──
  if (phase === "done") {
    return (
      <TeamDone
        email={doneEmail}
        totalPeople={doneTotalPeople}
        annualValue={doneAnnualValue}
      />
    )
  }

  // ── Contact phase ──
  if (phase === "contact") {
    return (
      <TeamContactForm
        totalModules={allSelectedModules.size}
        onSubmit={handleInquirySubmit}
        onBack={() => setPhase("configure")}
      />
    )
  }

  // ── Configure phase ──
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
          <ul className="space-y-2 mb-5">
            {cart.map(row => {
              const rd = roleTaskData.find(r => r.slug === row.slug)
              const selected = selectedTasksBySlug.get(row.slug) ?? new Set()
              const isExpanded = expandedRoles.has(row.slug)
              const selectedCount = rd ? rd.tasks.filter(t => selected.has(t.id)).length : 0
              const totalCount = rd?.tasks.length ?? 0

              return (
                <li key={row.slug} className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex-1 text-sm text-foreground font-medium">{prettySlug(row.slug)}</span>

                    {/* Task selection badge */}
                    {totalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleRoleExpand(row.slug)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
                      >
                        {selectedCount}/{totalCount} tasks
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetCount(row.slug, Math.max(1, row.count - 1))}
                        disabled={pending || row.count <= 1}
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
                        onChange={e => handleSetCount(row.slug, Number.parseInt(e.target.value || "1", 10))}
                        aria-label={`${row.slug} count`}
                        className="w-14 text-center text-sm rounded-md border border-border bg-background py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetCount(row.slug, row.count + 1)}
                        disabled={pending || row.count >= 999}
                        aria-label={`Increase ${row.slug} count`}
                        className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(row.slug)}
                      aria-label={`Remove ${row.slug}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {isExpanded && rd && (
                    <div className="px-3 pb-3 border-t border-border bg-secondary/5">
                      <RoleBuilder
                        tasks={rd.tasks}
                        selected={selected}
                        onToggleModule={(moduleKey, taskIds) => handleToggleModule(row.slug, moduleKey, taskIds)}
                        onToggleTask={taskId => handleToggleTask(row.slug, taskId)}
                      />
                    </div>
                  )}
                </li>
              )
            })}
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
            {copied ? <><Check className="h-4 w-4 text-accent" />Copied</> : <><Link2 className="h-4 w-4" />Copy share link</>}
          </button>
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email me a PDF
          </button>
          <button
            type="button"
            onClick={() => setPhase("contact")}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Build Team Assistant
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {pdfOpen ? (
        <PdfModal cart={cart} onClose={() => setPdfOpen(false)} />
      ) : null}
    </div>
  )
}

function prettySlug(slug: string): string {
  return slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
}
