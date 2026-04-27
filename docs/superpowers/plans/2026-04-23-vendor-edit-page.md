# Vendor Edit Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editable vendor form at `/vendors/[id]` and a redirect from `/vendors/[id]/edit` so both list links open the same pre-populated form.

**Architecture:** Two new files — a client component edit page at `app/vendors/[id]/page.tsx` that fetches the vendor by ID and pre-populates the existing new-vendor form structure, and a server component at `app/vendors/[id]/edit/page.tsx` that redirects to the canonical URL. No shared component extracted (YAGNI).

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, React 19, Tailwind CSS

---

## File Structure

**Create:**
- `app/vendors/[id]/page.tsx` — client component: load vendor, pre-populate form, save via update
- `app/vendors/[id]/edit/page.tsx` — server component: redirect to `/vendors/[id]`

---

### Task 1: Vendor Edit Page

**Files:**
- Create: `app/vendors/[id]/page.tsx`

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/aksharahegde/Documents/work/df-projects/company-portal && npm run dev
```

Verify: `http://localhost:3000/vendors` loads without errors.

- [ ] **Step 2: Verify the route 404s before implementation**

Open `http://localhost:3000/vendors/<any-uuid>` in a browser.
Expected: Next.js 404 page.

- [ ] **Step 3: Create `app/vendors/[id]/page.tsx`**

```typescript
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VendorRow {
  id: string;
  name: string | null;
  vendor_id: string | null;
  type: string | null;
  web_address: string | null;
  category: string | null;
  comments: string | null;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  fax: string | null;
  billing_address: string | null;
  subsidiary: string | null;
}

export default function EditVendor() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "", vendor_id: "", autoVendorId: false,
    type: "COMPANY", web_address: "", category: "", comments: "",
    email: "", phone: "", alt_phone: "", fax: "", address: "",
    subsidiary: "Parent Company", project_vendor: false,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from("vendors").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        const v = data as VendorRow;
        setForm({
          company_name: v.name ?? "",
          vendor_id: v.vendor_id ?? "",
          autoVendorId: false,
          type: v.type ?? "COMPANY",
          web_address: v.web_address ?? "",
          category: v.category ?? "",
          comments: v.comments ?? "",
          email: v.email ?? "",
          phone: v.phone ?? "",
          alt_phone: v.alt_phone ?? "",
          fax: v.fax ?? "",
          address: v.billing_address ?? "",
          subsidiary: v.subsidiary ?? "Parent Company",
          project_vendor: false,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("vendors").update({
      name: form.company_name,
      vendor_id: form.autoVendorId ? form.company_name : form.vendor_id,
      type: form.type,
      web_address: form.web_address,
      category: form.category,
      comments: form.comments,
      email: form.email,
      phone: form.phone,
      alt_phone: form.alt_phone,
      fax: form.fax,
      billing_address: form.address,
      subsidiary: form.subsidiary,
    }).eq("id", id);
    setSaving(false);
    if (error) {
      alert("Failed to save: " + error.message);
      return;
    }
    router.push("/vendors");
  };

  if (loading) return <div className="m-4 text-gray-400 text-sm">Loading...</div>;
  if (notFound) return (
    <div className="m-4 text-sm text-gray-500">
      Vendor not found. <Link href="/vendors" className="text-blue-600 hover:underline">Back to list</Link>
    </div>
  );

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🔍</span>
            <h1 className="text-2xl font-normal text-gray-800">Vendor</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/vendors" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Customize</Link>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/vendors")}>Cancel</button>
        </div>
        <div className="p-4">
          <div className="section-header" style={{ marginTop: 0 }}>▼ Primary Information</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div>
                <label className="form-label">CUSTOM FORM <span className="required-star">*</span></label>
                <select className="form-select"><option>Standard Vendor Form</option></select>
              </div>
              <div>
                <label className="form-label">VENDOR ID <span className="required-star">*</span></label>
                <div className="flex items-center gap-2">
                  <input className="form-input" placeholder="Copied From Name" value={form.vendor_id} onChange={e => set("vendor_id", e.target.value)} disabled={form.autoVendorId} />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input type="checkbox" checked={form.autoVendorId} onChange={e => set("autoVendorId", e.target.checked)} /> AUTO
                  </label>
                </div>
              </div>
              <div>
                <label className="form-label">TYPE</label>
                <div className="flex gap-4 text-sm mt-1">
                  <label className="flex items-center gap-1"><input type="radio" name="type" checked={form.type === "COMPANY"} onChange={() => set("type", "COMPANY")} /> COMPANY</label>
                  <label className="flex items-center gap-1"><input type="radio" name="type" checked={form.type === "INDIVIDUAL"} onChange={() => set("type", "INDIVIDUAL")} /> INDIVIDUAL</label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">COMPANY NAME <span className="required-star">*</span></label>
                <input className="form-input" value={form.company_name} onChange={e => set("company_name", e.target.value)} />
              </div>
              <div>
                <label className="form-label">WEB ADDRESS</label>
                <input className="form-input" value={form.web_address} onChange={e => set("web_address", e.target.value)} />
              </div>
              <div>
                <label className="form-label">CATEGORY</label>
                <select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>
                  <option value=""></option><option>Preferred</option><option>Standard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">COMMENTS</label>
              <textarea className="form-input" rows={5} value={form.comments} onChange={e => set("comments", e.target.value)} />
            </div>
          </div>

          <div className="section-header mt-4">▼ Email | Phone | Address</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div><label className="form-label">PHONE</label><input className="form-input" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div className="space-y-3">
              <div><label className="form-label">ALT. PHONE</label><input className="form-input" value={form.alt_phone} onChange={e => set("alt_phone", e.target.value)} /></div>
              <div><label className="form-label">FAX</label><input className="form-input" value={form.fax} onChange={e => set("fax", e.target.value)} /></div>
            </div>
            <div><label className="form-label">ADDRESS</label><textarea className="form-input" rows={4} value={form.address} onChange={e => set("address", e.target.value)} /></div>
          </div>

          <div className="section-header mt-4">▼ Classification</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div>
              <label className="form-label">PRIMARY SUBSIDIARY <span className="required-star">*</span></label>
              <select className="form-select" value={form.subsidiary} onChange={e => set("subsidiary", e.target.value)}>
                <option>Parent Company</option><option>Germany</option><option>India</option>
                <option>United Kingdom</option><option>US East</option><option>US West</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-4">
                <input type="checkbox" checked={form.project_vendor} onChange={e => set("project_vendor", e.target.checked)} /> PROJECT VENDOR
              </label>
            </div>
          </div>
        </div>
        <div className="toolbar border-t border-gray-200 mt-2">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/vendors")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the page loads**

1. Go to `/vendors` in the browser
2. Click **Edit** on any vendor row
3. Expected: form opens at `/vendors/<id>/edit` — this still 404s (redirect not added yet). Go directly to `http://localhost:3000/vendors/<id>` instead.
4. Expected: form loads with the vendor's existing data pre-filled in all fields.
5. Change the Company Name field, click Save.
6. Expected: redirected to `/vendors`, the changed name appears in the list.

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/vendors/\[id\]/page.tsx
git commit -m "feat: add vendor edit page (load, pre-populate, update)"
```

---

### Task 2: Edit Redirect

**Files:**
- Create: `app/vendors/[id]/edit/page.tsx`

- [ ] **Step 1: Verify `/vendors/<id>/edit` is still 404**

Open `http://localhost:3000/vendors/<any-id>/edit` in a browser.
Expected: 404.

- [ ] **Step 2: Create `app/vendors/[id]/edit/page.tsx`**

```typescript
import { redirect } from "next/navigation";

export default async function VendorEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/vendors/${id}`);
}
```

- [ ] **Step 3: Verify the redirect works**

1. Go to `http://localhost:3000/vendors/<any-id>/edit`
2. Expected: browser redirects to `/vendors/<id>` and the edit form loads with the vendor's data.
3. Go to `/vendors`, click the **Edit** link on a row.
4. Expected: navigates to `/vendors/<id>` with the form pre-filled.
5. Go to `/vendors`, click the **View** link on a row.
6. Expected: navigates to `/vendors/<id>` with the form pre-filled (same page).

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/vendors/[id]/edit/page.tsx"
git commit -m "feat: redirect /vendors/[id]/edit to /vendors/[id]"
```
