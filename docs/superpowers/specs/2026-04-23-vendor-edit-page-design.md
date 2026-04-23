# Vendor Edit Page — Design Spec

**Date:** 2026-04-23
**Status:** Approved

---

## Problem

The vendors list has Edit (`/vendors/[id]/edit`) and View (`/vendors/[id]`) links per row. Neither route has a page — both 404. Users cannot edit vendors after creation.

---

## Solution

Add two files:

1. `app/vendors/[id]/page.tsx` — vendor edit form (the canonical page)
2. `app/vendors/[id]/edit/page.tsx` — server-side redirect to `/vendors/[id]`

Both list links resolve to the same editable form.

---

## Page Behaviour (`app/vendors/[id]/page.tsx`)

**Load:** On mount, fetch the vendor from Supabase by `id`. Show "Loading…" spinner until data arrives. Show "Vendor not found" with a back link if the record doesn't exist.

**Form:** Identical layout to `app/vendors/new/page.tsx` — three collapsible sections:
- **Primary Information** — Custom Form (static), Vendor ID (with AUTO checkbox), Type (COMPANY / INDIVIDUAL), Company Name, Web Address, Category, Comments
- **Email / Phone / Address** — Email, Phone, Alt. Phone, Fax, Address (textarea)
- **Classification** — Primary Subsidiary dropdown, Project Vendor checkbox

All fields pre-populated from the loaded vendor record.

**Save:** Calls `supabase.from("vendors").update({...}).eq("id", id)`. On success, redirects to `/vendors`. On error, shows an alert with the error message. Button shows "Saving…" while in flight.

**Cancel:** Navigates to `/vendors` without saving.

**Toolbar:** Save + Cancel at top and bottom (same as new page).

---

## Redirect (`app/vendors/[id]/edit/page.tsx`)

Server component. Uses Next.js `redirect("/vendors/" + id)` to forward the Edit list link to the canonical page. No UI rendered.

---

## Field Mapping

| Form field | DB column |
|---|---|
| company_name | `name` |
| vendor_id | `vendor_id` |
| type | `type` |
| web_address | `web_address` |
| category | `category` |
| comments | `comments` |
| email | `email` |
| phone | `phone` |
| alt_phone | `alt_phone` |
| fax | `fax` |
| address | `billing_address` |
| subsidiary | `subsidiary` |

---

## Out of Scope

- Delete button
- Read-only view mode (both routes open in edit mode)
- Shared `VendorForm` component (YAGNI — new page is unchanged)
- Shipping address, login access, or other advanced vendor fields
