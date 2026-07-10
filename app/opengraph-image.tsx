import { ImageResponse } from "next/og"
import { SITE, AGENCY } from "@/lib/site"
import { BRAND } from "@/lib/brand"

export const alt = `${SITE.name} — ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: BRAND.background,
          color: BRAND.foreground,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              backgroundColor: BRAND.cyan,
              color: BRAND.foreground,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE.name}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
            See exactly how much time AI gives back — role by role.
          </div>
          <div style={{ fontSize: 30, color: BRAND.mutedForeground }}>
            800+ occupations, mapped task by task.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: BRAND.mutedForeground,
          }}
        >
          <div>{`A project by ${AGENCY.name}`}</div>
          <div style={{ color: BRAND.accent, fontWeight: 600 }}>
            {SITE.url.replace("https://", "")}
          </div>
        </div>
      </div>
    ),
    size
  )
}
