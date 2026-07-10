// app/occupation/[slug]/error.tsx
"use client"

export default function OccupationError() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
      <p className="text-muted-foreground text-sm">
        This occupation page is temporarily unavailable. Please try again shortly.
      </p>
    </div>
  )
}
