# THERAPICK — MASTER DESIGN SYSTEM & UI ENGINEERING RULES

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

## 2. Mandatory Rules
1. **No generic AI-generated visual design**: Never produce templates that feel like generic AI mockups.
2. **No generic AI icons or filler imagery**: Strictly prohibit robot heads, AI brains, sparkles, abstract tech symbols, emoji as interface icons, and generic 3D illustrations.
3. **No arbitrary gradients, glassmorphism, or excessive shadows**: Avoid floating cards with exaggerated blur or heavy shadows.
4. **No inconsistent tokens**: Every element must strictly adhere to the defined scales for spacing, typography, radii, and colors.
5. **No unnecessary UI elements**: Every visible element must serve an identifiable functional purpose.
6. **No cosmetic redesigns**: Do not rebuild or reshuffle working features merely for visual difference.
7. **No changes to business logic**: Booking formulas, payment redirection, WhatsApp generation, partner attribution, and commission rules must remain intact.
8. **No fake loading screens or artificial delays**: Loading indicators must represent genuine asynchronous operations.
9. **No duplicated components**: Reuse established components (`btn`, `inputCls`, `StatusPill`, `CountPill`, `Modal`, `Drawer`).
10. **No broken mobile layouts**: Ensure first-class mobile usability with minimum 44px touch targets and zero horizontal overflow.

---

## 3. Design Philosophy
* **Simplicity over decoration**: Quiet confidence, clean negative space, and uncluttered views.
* **Function over visual gimmicks**: User tasks (booking a massage, tracking a commission) take priority over flashy styling.
* **Clear hierarchy over excessive typography**: Guide the eye using weight, color, and spacing rather than oversized text.
* **Whitespace over unnecessary borders**: Rely on structured grouping before adding lines.
* **Native-feeling interactions**: Subtle, instant feedback instead of complex animated intros.
* **Real photography over illustrations**: Authentic wellness treatment photography and genuine brand assets.
* **Accessibility first**: High contrast, visible focus rings, and semantic HTML elements.

---

## 4. Visual Direction & Design Tokens

### A. Color System
Therapick employs an Apple-inspired monochrome base with restrained, functional semantic accents:

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Primary Text / Black** | `#171717` / `#000000` | Main headings, primary buttons, active tabs |
| **Secondary Text** | `#737373` | Subtitles, labels, table headers, metadata |
| **Muted Text** | `#A3A3A3` | Disabled states, placeholders, secondary timestamps |
| **Main Background** | `#FFFFFF` | Primary viewport background and card surfaces |
| **Secondary Background** | `#FAFAFA` / `#F5F5F5` | Subtle container fills, search backgrounds |
| **Subtle Border** | `#E5E5E5` | Structural dividers, card borders, input borders |
| **Subtle Border Hover** | `#000000` or `#A3A3A3` | Interactive focus and hover states |
| **Success / Paid / Active** | `#059669` / `#10B981` | Completed treatments, verified payouts, active status |
| **Warning / Pending** | `#D97706` / `#F59E0B` | Pending bookings, awaiting treatment completion |
| **Error / Declined / Danger** | `#DC2626` / `#EF4444` | Cancelled appointments, form validation errors |
| **Informational / Processing** | `#2563EB` / `#3B82F6` | Processing commissions, approved statuses |

### B. Typography System
* **Primary Sans-Serif Stack**: `Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`
  * Applied to: Navigation, body text, buttons, form inputs, table data, numerical metrics.
* **Editorial Serif Stack**: `Newsreader`, `Georgia`, `serif`
  * Applied to: High-level display titles, pricing totals, and signature section headings.
* **Scale & Hierarchy**:
  * Display Title: `text-2xl` to `text-4xl` font-serif, tracking-tight.
  * Section Header: `text-base` to `text-lg` font-semibold text-black, tracking-tight.
  * Card Header: `text-sm` font-semibold text-black.
  * Body Text: `text-xs` (12px) to `text-sm` (14px) text-[#171717], relaxed leading.
  * Micro / Meta / Pills: `text-[10px]` to `text-[11px]` font-medium tracking-wide uppercase.
  * Numbers / Monospace: `font-mono tabular-nums` for currency, booking IDs, timestamps.

### C. Spacing Scale (4px Base)
Standardized padding, margins, and gaps:
* `4px` (`gap-1`, `p-1`) — Micro badges, inline tags.
* `8px` (`gap-2`, `p-2`) — Compact button gaps, list item padding.
* `12px` (`gap-3`, `p-3`) — Card headers, input internal padding.
* `16px` (`gap-4`, `p-4`) — Standard mobile card padding, form field spacing.
* `20px` (`gap-5`, `p-5`) — Standard desktop card padding.
* `24px` (`gap-6`, `p-6`) — Section grouping gaps.
* `32px` (`p-8`) — Modal padding, empty state padding.
* `48px` (`py-12`) — Section vertical breathing room.

### D. Corners, Borders & Shadows
* **Small Radius (`rounded-lg`, 8px)**: Buttons, inputs, search bars, status pills, table badges.
* **Medium Radius (`rounded-xl`, 12px)**: Cards, dropdown menus, quick link blocks.
* **Large Radius (`rounded-2xl`, 16px)**: Modals, primary hero cards.
* **Borders**: Clean `1px` border with `#E5E5E5`. No heavy dual borders.
* **Shadows**: Soft, functional, or flat border-only:
  * Control / Card: `shadow-xs` (`0 1px 2px 0 rgba(0,0,0,0.05)`)
  * Floating dialog: `shadow-md` or `shadow-lg`
  * Never use exaggerated deep shadows like `shadow-[0_20px_40px...]`.

---

## 5. Strict Icon Rules
* **Approved Icon Library**: `lucide-react` only.
* **Stroke Weight**: Uniform `strokeWidth={1.8}` to `2.2`.
* **Standard Icons**:
  * Search: `Search`
  * Close / Cancel: `X`
  * Back / Previous: `ChevronLeft` or `ArrowLeft`
  * Menu / Drawer: `Menu`
  * Calendar / Date: `Calendar`, `CalendarDays`
  * Time: `Clock`
  * Location: `MapPin`
  * User / Profile: `User`
  * Wallet / Payouts: `Wallet`
  * Booking / Ledger: `Receipt`, `ShoppingBag`
  * Check / Completed: `Check`, `CheckCircle2`
  * External Link: `ExternalLink`
* **Prohibited**:
  * No emojis as interface icons (e.g. 🗓️, 💰, 📍 in buttons/headers).
  * No AI sparkle icons, robot heads, or 3D computer graphics.
  * No unlabelled ambiguous icons.

---

## 6. Component Standard

### Buttons
* `btn.primary`: `bg-black text-white hover:bg-[#262626] rounded-lg font-medium text-xs sm:text-[13px] h-10 sm:h-9 px-4 transition-colors`
* `btn.secondary`: `bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded-lg font-medium text-xs sm:text-[13px] h-10 sm:h-9 px-4 transition-colors`
* `btn.danger`: `bg-white text-red-600 border border-[#E5E5E5] hover:border-red-300 rounded-lg font-medium text-xs h-9 px-3 transition-colors`

### Inputs & Form Fields
* `inputCls`: `w-full h-11 sm:h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 text-xs sm:text-[13px] text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors`
* Labels: `text-[11px] font-semibold text-black uppercase tracking-wider mb-1 block`

### Badges & Status Indicators
* `StatusPill`: Outlined or soft tinted pill with 6px colored dot:
  * Active / Paid: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  * Pending: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  * Ongoing: Indigo (`bg-indigo-50 text-indigo-700 border-indigo-200`)
  * Cancelled / Inactive: Neutral (`bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]`)
  * Declined / Error: Red (`bg-red-50 text-red-700 border-red-200`)

---

## 7. Customer Booking Flow
* **Step 1: Selection**: Review cart items, choose massage table setup (portable table vs complimentary villa bed setup), input promo code.
* **Step 2: Guest Details**: Guest name, appointment date, time, villa/hotel name, room number, WhatsApp number.
* **Step 3: Review & Confirmation**: Summary of guest details, treatment items, add-ons, table fee, total pricing, and instant WhatsApp booking confirmation.
* **Guarantees**:
  * Never alter calculation logic (`item.price * multiplier + addons + tableFee`).
  * Preserve WhatsApp deep link format with booking message.
  * Preserve Supabase booking insert and local cart history synchronization.

---

## 8. Partner Portal Standards
* **Layout**: Desktop permanent sidebar (`w-64 lg:w-72`), mobile top header + native bottom navigation bar.
* **Metrics**: Only display data backed by real Supabase queries (`stats.approvedCommission`, `stats.paidCommission`, `stats.pendingCommission`, `totalBookings`).
* **Attribution**: Instant QR code scan card and copyable `?ref=CODE` referral link.
* **Data Presentation**: Responsive compact tables on desktop, stacked card stream on mobile screens (< 640px).

---

## 9. Mobile-First Principles
* Touch targets: Minimum 44px height for interactive elements.
* Bottom navigation: Always clear the iOS/Android safe area with `pb-[max(0.6rem,env(safe-area-inset-bottom))]`.
* Zero horizontal overflow: All containers bounded by `w-full max-w-full overflow-x-hidden`.
* Responsive tables: Convert to card view or explicit horizontal scroll container with no layout shifts.

---

## 10. Technology & Business Logic Preservation
* **Next.js 16 (Turbopack)**: Respect App Router conventions and async headers.
* **Supabase**: Realtime subscriptions, RPC calls, and schema constraints must remain untouched.
* **Domain Isolation**: Maintain strict host checking via `src/lib/domainIsolation.ts` and `src/proxy.ts`.
* **Zero Mock Data**: Never substitute simulated data for real backend endpoints.
