# Clear Road Labs — Brand Contract (Blueprint / Blueprint Light)

One design system, two surfaces. clearroadlabs.com renders it dark
(ice-on-ink); timeback.clearroadlabs.com renders it light (ink-on-ice).
This file is the canonical cross-repo reference and lives, identical, in
both repos. Change it deliberately, in both places, in the same sitting.

## Tokens

| Role | CRL (dark) | Timeback (Blueprint Light) |
|---|---|---|
| Background | ink `#0a1420` | cool paper `#f2f6f9` |
| Card/panel | `#1c2c3e` | `#ffffff` (muted tint `#e3ecf4`) |
| Foreground | ice `#e3ecf4` | ink `#0a1420` |
| Accent (fills/buttons/meters) | cyan `#6fd4ec` + ink text | cyan `#6fd4ec` + ink text |
| Accent (text/links) | cyan `#6fd4ec` | deep cyan `#0f7fa8` (AA on light) |
| Hairline | ice @ 14% | ink @ 14% |
| Muted text | ice/55–60 | `#47586b` |
| Destructive / success | `#e88a8a` / — | `#b23b35` / `#0f7a53` |
| Terminal island | — | ink `#0a1420` + ice `#e3ecf4` text (literal CRL theme) |
| Data series (charts) | — | `#0f7fa8 #6fd4ec #0a1420 #47586b #8fb4c9 #c9dbe8` |

## Type

- Display + body: **Geist**. Mono (eyebrows, stats, annotations, data):
  **Geist Mono**, `tabular-nums` wherever numbers align.
- Eyebrow style: mono, ~11px, uppercase, letter-spacing ≈ 0.18em, muted.

## Shape & texture

- Radius **0** (engineering-drawing edge). Exceptions (max 2px) must be
  listed here: *(none yet)*.
- Motifs: faint engineering grid backgrounds, 1px hairline rules,
  numbered section labels ("SEC 01", "MI 03", "FIG 02").

## CTA grammar

- Primary: cyan fill, ink text, mono uppercase, tracked (~0.14em).
- Secondary: hairline outline, foreground text, same mono treatment.
- Voice: confident/production framing; numbers over adjectives; verbs
  users act on ("Read a sample audit", "Start with an audit →").
- No public `$` pricing on CRL surfaces.

## Cross-links (the one-funnel loop)

- CRL `/sample-audit` → Timeback occupation page (the map).
- Timeback occupation page → CRL `/sample-audit` (the terrain) and
  `/enquire` (the ask).

## Enforcement

- Timeback: `lib/brand.ts` mirrors `app/globals.css` `@theme`;
  `tests/unit/brand-lockstep.test.ts` fails on drift. PDF/email/OG must
  import from `lib/brand.ts`, never hardcode.
- CRL: tokens in `src/app/globals.css` `@theme`.
