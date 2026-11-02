# Phase 1: Fitlo Reference Website Inspection & Therapick Admin Audit

**Date**: November 2, 2026  
**Reference Website**: [Fitlo Shop & Admin](https://demo.codeandchill.store/fitlo)  
**Target Application**: Therapick Multi-Brand Admin Console (`/admin/*`)

---

## 1. Executive Summary
This document records the Phase 1 inspection, DOM hierarchy analysis, design token extraction, and architectural audit for adapting the **Fitlo Admin Dashboard** design into the **Therapick Admin Console**.

All modifications strictly abide by the following constraints:
1. **Zero Database Changes**: No modifications to Supabase schemas, tables, migrations, or database functions.
2. **Zero Backend Alterations**: All API endpoints under `/api/admin/*` and `/api/affiliates/*` remain untouched.
3. **Preservation of Core Functionality**: All drawers, modals, calendar views, fee calculations, and multi-brand routing logic remain 100% operational.
4. **Authentication Integrity**: Admin session validation and domain isolation logic are preserved intact.

---

## 2. Fitlo DOM Hierarchy & Structure

### Layout Container Tree
```html
<div class="fitlo-app">
  <!-- Sticky Left Sidebar (252px) -->
  <aside class="fitlo-side">
    <div class="fitlo-brand">
      <div class="fitlo-mark">...</div>
      <b>Therapick</b>
    </div>
    <nav class="fitlo-snav">
      <a class="fitlo-snav__item is-active">Overview</a>
      <a class="fitlo-snav__item">Bookings</a>
      <a class="fitlo-snav__item">Calendar</a>
      ...
    </nav>
    <div class="fitlo-side__group">
      <button class="fitlo-side__quick">+ Add booking</button>
    </div>
  </aside>

  <!-- Workspace Area -->
  <div class="fitlo-col">
    <!-- 3-Part Sticky Top Header -->
    <header class="fitlo-top">
      <div class="fitlo-top__left">
        <div class="fitlo-figure"><b>96</b><span><span>Bookings</span><small>Oct 2026</small></span></div>
      </div>
      <div class="fitlo-sides">
        <button class="is-active">Website Portal</button>
        <button>Affiliate Network</button>
      </div>
      <div class="fitlo-top__right">
        <div class="fitlo-searchpill"><span>Search...</span><span class="fitlo-kbd">⌘K</span></div>
        <button class="fitlo-ibtn"><svg>...</svg><span class="fitlo-ibtn__badge">3</span></button>
        <button class="fitlo-btn fitlo-btn--primary">+ New Booking</button>
        <div class="fitlo-me"><div class="fitlo-av">AD</div><span>Admin</span></div>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="fitlo-main">
      <!-- 4 Pastel Tinted KPI Tiles -->
      <div class="fitlo-kpis">
        <div class="fitlo-kpi fitlo-kpi--1">...</div> <!-- Peach: Revenue -->
        <div class="fitlo-kpi fitlo-kpi--2">...</div> <!-- Cyan: Bookings -->
        <div class="fitlo-kpi fitlo-kpi--3">...</div> <!-- Lemon: Partners -->
        <div class="fitlo-kpi fitlo-kpi--4">...</div> <!-- Pebble: Margins -->
      </div>
      <!-- Revenue Chart & Recent Bookings -->
    </main>
  </div>
</div>
```

---

## 3. Extracted Design Tokens

```css
:root {
  --bg: #f7f6f2;             /* Warm linen canvas */
  --card: #fdfdfb;           /* Elevated paper surface */
  --card-2: #f0efea;         /* Subtle secondary surface */
  --card-3: #e5e4de;         /* Tertiary border surface */
  --ink: #161a19;            /* Graphite black text */
  --ink-2: #353b3a;          /* Charcoal text */
  --muted: #5f6665;          /* Stone gray captions */
  --line: rgba(22, 26, 25, 0.08);
  --line-2: rgba(22, 26, 25, 0.15);
  
  --accent: #0b7a73;         /* Fitlo Signature Deep Teal */
  --accent-ink: #ffffff;
  --accent-hi: #08665f;
  --accent-soft: rgba(11, 122, 115, 0.12);
  --now: #e2603a;            /* Terracotta highlight */
  
  --tile-1: #ffe2d1;         /* Soft Peach */
  --tile-2: #d8ecee;         /* Soft Cyan */
  --tile-3: #fbeaa8;         /* Soft Lemon */
  --tile-4: #e9e8e3;         /* Soft Pebble */

  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-xl: 26px;
  --shadow: 0 1px 2px rgba(22, 26, 25, 0.04), 0 10px 26px -18px rgba(22, 26, 25, 0.22);
}
```

---

## 4. Components Impact Analysis & Preservation Strategy

| Component | Role | Action | Safety Guarantee |
| :--- | :--- | :--- | :--- |
| `AdminCrmShell.tsx` | Master multi-brand wrapper | Modernize outer layout & header | Domain isolation and brand switching intact |
| `TherapickSidebarNav.tsx` | Navigation menu | Apply Fitlo styling & 80px rail | Preserves tab switching and system context |
| `TherapickDashboardOverview.tsx` | Admin overview screen | Fitlo 4-pastel KPI tiles + curved area chart | Preserves all metrics calculations and drawer openers |
| `TherapickMasterView.tsx` | View switcher | Retain as master tab router | Mounts all existing drawers and modals safely |
| `TherapickBookingDrawer.tsx` | Booking editor | Retain untouched | All booking status transitions preserved |
| `TherapickPartnerDrawer.tsx` | Partner profile & rates | Retain untouched | Partner commission edits preserved |
