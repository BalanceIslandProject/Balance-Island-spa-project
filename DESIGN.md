# THERAPICK — MASTER DESIGN SYSTEM & UI ENGINEERING RULES
> Typeset terminal on white paper — Inspired by the Vercel Light Design System

## 1. Mission & Scope
This design system and engineering standard applies exclusively to the Therapick digital experience and all Therapick-related sections:
* **Main customer-facing website**: `www.booktherapick.com`
* **Customer booking flow**: Modal and multistep booking interfaces
* **Treatment and service pages**: `/explore`, rituals, service areas
* **Booking confirmation and payment interfaces**: `/payment/success`, `/invoice/[id]`
* **Partner portal**: `partners.booktherapick.com` / `/partners/*`
* **Partner workflows**: Registration, authentication, dashboard, calendar, referrals, commissions, and payout interfaces
* **Admin interfaces**: Therapick booking management and affiliate CRM
* **All responsive layouts**: Mobile interfaces, forms, menus, modals, and reusable components

Do not apply these rules to unrelated applications or other brand views in the workspace.

---

## 2. Core Visual Principles — Disciplined Monochrome on Paper White
Therapick's design system is an exercise in disciplined monochrome:
* **Canvas**: A near-white paper canvas (`#fafafa`), pure white card surfaces (`#ffffff`), and hairline borders (`#ebebeb`).
* **Complete absence of decorative color**: Depth is created through surface tonal value shifts (`#fafafa` → `#ebebeb` → `#171717`) rather than drop shadows or color splashes.
* **Typography Hierarchy**:
  * Primary Interface: `Plus Jakarta Sans` / `Geist Sans` with tight tracking (`-0.05em` to `-0.06em`) on headlines, weight 400–450, leading 1.0–1.1.
  * Monospace Eyebrows & Meta: `Geist Mono` / `font-mono` stamps labels, metadata, booking IDs, and code samples in 11–12px uppercase with wide letter-spacing (`0.071em`).
* **Border Radii**:
  * Sharp **6px radius** (`rounded-[6px]`) for cards, buttons, form inputs, and rectangular containers.
  * Full pill **9999px radius** (`rounded-full`) reserved strictly for compact action pills and category filter tags.
  * Never use exaggerated bubble radii (e.g. `rounded-[28px]`, `rounded-[40px]`).
* **Zero Drop Shadows**: Elevation is achieved via 1px hairline borders (`#ebebeb`) and stacked hairline rings (`0 0 0 1px rgba(0, 0, 0, 0.08)`).
* **Terminal Green (`#297a3a`)**: The only chromatic accent permitted for verified links, status tags, confirmations, and checkmarks.

---

## 3. Tokens — Colors & Surfaces

| Name | Hex Value | Token | Role |
| :--- | :--- | :--- | :--- |
| **Paper White** | `#fafafa` | `--color-paper-white` | Page canvas, outer backgrounds, neutral button states |
| **Pure White** | `#ffffff` | `--color-pure-white` | Elevated card surfaces, inputs, modal dialog containers |
| **Hairline** | `#ebebeb` | `--color-hairline` | 1px borders on buttons, links, cards, and dividers |
| **Ash** | `#c9c9c9` | `--color-ash` | Disabled text, subtle borders |
| **Smoke** | `#a8a8a8` | `--color-smoke` | Tertiary text, placeholder copy, subtle icon fills |
| **Stone** | `#666666` | `--color-stone` | Muted captions, helper text, and secondary UI labels |
| **Charcoal** | `#4d4d4d` | `--color-charcoal` | Body paragraph text, card descriptions, secondary labels |
| **Obsidian** | `#171717` | `--color-obsidian` | Primary headings, dark button fills, list markers |
| **Carbon** | `#000000` | `--color-carbon` | Pure black reserved for graphic logo marks |
| **Terminal Green**| `#297a3a` | `--color-terminal-green` | Success accent for links, tags, and confirmations |

### Semantic Status Mappings
* **Active / Paid / Verified**: `#297a3a` (Terminal Green) with `bg-[#297a3a]/10 border-[#297a3a]/25`
* **Pending / In Review**: Amber (`bg-amber-50 text-amber-800 border-amber-200`)
* **Ongoing / Dispatched**: Obsidian neutral (`bg-[#171717]/5 text-[#171717] border-[#ebebeb]`)
* **Cancelled / Declined**: Red (`bg-red-50 text-red-700 border-red-200`)

---

## 4. Typography Scale & Discipline

### Strict Two-Font Binary
1. **Sans-Serif (`Plus Jakarta Sans` / `Geist Sans`)**: For reading and headings.
   * Headlines: Weight 400–450, tracking tight (`-0.05em` to `-0.06em`), leading 1.0–1.1.
   * Body: 14–16px weight 400 at 1.43–1.5 line-height in `#4d4d4d`.
2. **Monospace (`font-mono` / `Geist Mono`)**: For stamping and metadata.
   * Eyebrow labels: `11px`, weight 400–500, uppercase, `tracking-[0.071em]` letter-spacing in `#171717`.
   * Currency & numbers: `tabular-nums` for currency, booking IDs, timestamps.

---

## 5. Components Specification

### Filled Obsidian Button (Primary)
* Background: `#171717` (Obsidian)
* Text: `#ffffff`
* Border: 1px `#171717`
* Radius: `6px` (`rounded-[6px]`)
* Sizing: `h-9 px-4 text-xs sm:text-[13px] font-medium`
* Interaction: `hover:bg-[#262626] active:scale-[0.99] transition-all`

### Ghost Outline Button (Secondary)
* Background: `transparent`
* Text: `#4d4d4d` (Charcoal)
* Border: 1px `#ebebeb` (Hairline)
* Radius: `6px` (`rounded-[6px]`)
* Sizing: `h-9 px-4 text-xs sm:text-[13px] font-medium`
* Interaction: `hover:border-[#171717] hover:text-[#171717] active:scale-[0.99] transition-all`

### Pill Button (Compact Action)
* Background: `#171717` or `#ffffff` with border `#ebebeb`
* Text: `#ffffff` or `#4d4d4d`
* Radius: `9999px` (`rounded-full`)
* Sizing: `px-3 py-1 text-xs font-medium`

### Bordered Card
* Background: `#ffffff` (Pure White)
* Border: 1px `#ebebeb` (Hairline)
* Radius: `6px` (`rounded-[6px]`)
* Padding: `16px` to `20px`
* Shadow: `shadow-[0_0_0_1px_rgba(0,0,0,0.04)]` or flat border-only.

### Eyebrow Label
* Font: `font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717]`
* Spacing: `mb-2 block`

---

## 6. Business Logic Preservation Guarantees
* **Booking Formulas**: `pricePerPerson * duration.multiplier * guestCount + tableFee - promoDiscount` strictly preserved.
* **Authentication**: Partner auth cookies, Supabase sessions, and admin protections remain untouched.
* **WhatsApp API**: Message payload formatting and URL redirection preserved.
* **Referral Attribution**: `?ref=CODE` URL parameter tracking, cookie capture, and commission logging intact.
