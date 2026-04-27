# Edit Pages: Bills & Subsidiaries — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable form pages for bills (`/bills/[id]/edit`) and subsidiaries (`/subsidiaries/[id]`) — both routes currently 404.

**Architecture:** Two independent client component pages that mirror their respective `new/page.tsx` form layouts, load the existing record from Supabase on mount, and save via `.update()`. No shared components extracted (YAGNI). Same pattern as the vendor edit page already in the codebase at `app/vendors/[id]/page.tsx`.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, React 19, Tailwind CSS

---

## File Structure

**Create:**
- `app/bills/[id]/edit/page.tsx` — bill edit form: load bill, pre-populate all fields including line items, save via update
- `app/subsidiaries/[id]/page.tsx` — subsidiary edit form: load subsidiary, pre-populate the 6 DB-backed fields, save via update

**DB field mappings:**

Bills (`bills` table): `date`, `reference_no`, `vendor_name`, `account`, `status` (read-only), `currency`, `exchange_rate`, `amount` (auto-calc from line items), `memo`, `due_date`, `posting_period`, `subsidiary`, `line_items` (jsonb array of `{account, amount, memo}`)

Subsidiaries (`subsidiaries` table): `name`, `elimination`, `parent_subsidiary`, `currency`, `country`, `language` — other form fields (website, address, ein, etc.) are not in the DB schema and will be empty on the edit page.

---

### Task 1: Bills Edit Page

**Files:**
- Create: `app/bills/[id]/edit/page.tsx`

- [ ] **Step 1: Verify the route 404s**

Run `npm run dev` then open `http://localhost:3000/bills/<any-uuid>/edit`.
Expected: Next.js 404 page.

- [ ] **Step 2: Create `app/bills/[id]/edit/page.tsx`**

```typescript
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LineItem {
  account: string;
  amount: string;
  memo: string;
}

interface BillRow {
  id: string;
  date: string | null;
  reference_no: string | null;
  vendor_name: string | null;
  account: string | null;
  status: string | null;
  currency: string | null;
  exchange_rate: number | null;
  memo: string | null;
  due_date: string | null;
  posting_period: string | null;
  subsidiary: string | null;
  line_items: LineItem[] | null;
}

const postingPeriods = (() => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const periods: string[] = [];
  for (let i = -2; i <= 9; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    periods.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return periods;
})();

export default function EditBill() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Expenses and Items");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ account: "", amount: "", memo: "" }]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    date: "", referenceNo: "", vendor: "", account: "", currency: "US Dollar",
    exchangeRate: "1.00", memo: "", dueDate: "", postingPeriod: "",
    subsidiary: "", status: "Pending Approval",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const tabs = ["Expenses and Items", "Billing", "Relationships", "Communication", "Custom", "EET"];

  useEffect(() => {
    supabase.from("vendors").select("id, name").order("name").then(({ data }) => setVendors(data || []));
    supabase.from("subsidiaries").select("id, name").order("name").then(({ data }) => setSubsidiaries(data || []));
    supabase.from("bills").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        const b = data as BillRow;
        setForm({
          date: b.date ?? "",
          referenceNo: b.reference_no ?? "",
          vendor: b.vendor_name ?? "",
          account: b.account ?? "",
          currency: b.currency ?? "US Dollar",
          exchangeRate: String(b.exchange_rate ?? "1.00"),
          memo: b.memo ?? "",
          dueDate: b.due_date ?? "",
          postingPeriod: b.posting_period ?? "",
          subsidiary: b.subsidiary ?? "",
          status: b.status ?? "Pending Approval",
        });
        const items = b.line_items;
        if (items && items.length > 0) {
          setLineItems(items.map(li => ({
            account: li.account ?? "",
            amount: String(li.amount ?? ""),
            memo: li.memo ?? "",
          })));
        }
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!form.vendor) { alert("Vendor is required"); return; }
    setSaving(true);
    const total = lineItems.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
    const { error } = await supabase.from("bills").update({
      date: form.date,
      reference_no: form.referenceNo,
      vendor_name: form.vendor,
      account: form.account || "2000 Accounts Payable",
      currency: form.currency,
      exchange_rate: parseFloat(form.exchangeRate) || 1,
      amount: total || 0,
      memo: form.memo,
      due_date: form.dueDate,
      posting_period: form.postingPeriod,
      subsidiary: form.subsidiary,
      line_items: lineItems.filter(li => li.account || li.amount),
    }).eq("id", id);
    setSaving(false);
    if (error) { alert("Error saving: " + error.message); return; }
    router.push("/bills");
  };

  if (loading) return <div className="m-4 text-gray-400 text-sm">Loading...</div>;
  if (notFound) return (
    <div className="m-4 text-sm text-gray-500">
      Bill not found. <Link href="/bills" className="text-blue-600 hover:underline">Back to list</Link>
    </div>
  );

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🔍</span>
            <h1 className="text-2xl font-normal text-gray-800">Bill</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/bills" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Customize</Link>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
          <button className="btn-secondary">Auto Fill</button>
          <button className="btn-secondary">Recalc</button>
        </div>

        <div className="p-4">
          <div className="section-header" style={{ marginTop: 0 }}>▼ Primary Information</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div>
                <label className="form-label">CUSTOM FORM <span className="required-star">*</span></label>
                <select className="form-select"><option>Standard Vendor Bill</option></select>
              </div>
              <div>
                <label className="form-label">REFERENCE NO.</label>
                <input className="form-input" value={form.referenceNo} onChange={e => set("referenceNo", e.target.value)} />
              </div>
              <div>
                <label className="form-label">VENDOR <span className="required-star">*</span></label>
                <select className="form-select" value={form.vendor} onChange={e => set("vendor", e.target.value)}>
                  <option value="">— Select vendor —</option>
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">ACCOUNT</label>
                <select className="form-select" value={form.account} onChange={e => set("account", e.target.value)}>
                  <option value="">— Select account —</option>
                  <option>2000 Accounts Payable</option>
                  <option>6610 Expenses</option>
                  <option>6610 Expenses : G&A</option>
                  <option>6610 Expenses : Facilities Related</option>
                  <option>6610 Expenses : Rent Expense</option>
                </select>
              </div>
              <div>
                <label className="form-label">AMOUNT</label>
                <input className="form-input bg-gray-50" type="number" value={
                  lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0) || ""
                } readOnly placeholder="Auto-calculated from line items" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label">CURRENCY <span className="required-star">*</span></label>
                <select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                  <option>US Dollar</option>
                  <option>British Pound</option>
                  <option>Euro</option>
                  <option>Indian Rupee</option>
                </select>
              </div>
              <div>
                <label className="form-label">EXCHANGE RATE <span className="required-star">*</span></label>
                <input className="form-input" value={form.exchangeRate} onChange={e => set("exchangeRate", e.target.value)} />
              </div>
              <div>
                <label className="form-label">MEMO</label>
                <input className="form-input" value={form.memo} onChange={e => set("memo", e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-1">
                  <input type="checkbox" /> PAYMENT HOLD
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label">DUE DATE</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
              </div>
              <div>
                <label className="form-label">DATE <span className="required-star">*</span></label>
                <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
              </div>
              <div>
                <label className="form-label">POSTING PERIOD</label>
                <select className="form-select" value={form.postingPeriod} onChange={e => set("postingPeriod", e.target.value)}>
                  <option value=""></option>
                  {postingPeriods.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">APPROVAL STATUS</label>
                <input className="form-input bg-gray-50" value={form.status} disabled />
              </div>
            </div>
          </div>

          <div className="section-header">▼ Classification</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div>
              <label className="form-label">SUBSIDIARY <span className="required-star">*</span></label>
              <select className="form-select" value={form.subsidiary} onChange={e => set("subsidiary", e.target.value)}>
                <option value=""></option>
                {subsidiaries.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">DIST. TYPE</label>
              <select className="form-select"><option value=""></option></select>
            </div>
            <div>
              <label className="form-label">DIST. RATE TYPE</label>
              <select className="form-select"><option value=""></option></select>
            </div>
          </div>

          <div className="mt-4">
            <div className="tab-bar">
              {tabs.map(t => (
                <div key={t} className={`tab-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</div>
              ))}
            </div>
            <div className="border border-gray-200 border-t-0 p-3">
              {activeTab === "Expenses and Items" && (
                <>
                  <div className="text-xs font-semibold text-gray-600 mb-3">
                    Expenses {lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} &nbsp; Items 0.00
                  </div>
                  <table className="data-table text-xs">
                    <thead>
                      <tr>
                        <th style={{ width: "30px" }}>#</th>
                        <th>ACCOUNT</th>
                        <th>AMOUNT</th>
                        <th>MEMO</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li, idx) => (
                        <tr key={idx}>
                          <td className="text-gray-400">{idx + 1}</td>
                          <td>
                            <select className="form-select text-xs" value={li.account} onChange={e => {
                              const updated = [...lineItems];
                              updated[idx] = { ...updated[idx], account: e.target.value };
                              setLineItems(updated);
                            }}>
                              <option value=""></option>
                              <option>2000 Accounts Payable</option>
                              <option>6610 Expenses : G&A</option>
                              <option>6610 Expenses : Facilities Related</option>
                              <option>6610 Expenses : Rent Expense</option>
                            </select>
                          </td>
                          <td>
                            <input className="form-input text-xs" type="number" style={{ width: "110px" }} value={li.amount} onChange={e => {
                              const updated = [...lineItems];
                              updated[idx] = { ...updated[idx], amount: e.target.value };
                              setLineItems(updated);
                            }} />
                          </td>
                          <td>
                            <input className="form-input text-xs" value={li.memo} onChange={e => {
                              const updated = [...lineItems];
                              updated[idx] = { ...updated[idx], memo: e.target.value };
                              setLineItems(updated);
                            }} />
                          </td>
                          <td>
                            <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn-primary text-xs mt-2" onClick={() => setLineItems([...lineItems, { account: "", amount: "", memo: "" }])}>+ Add Line</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="toolbar border-t border-gray-200 mt-2">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/aksharahegde/Documents/work/df-projects/company-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

1. Go to `/bills` — click Edit on a "Pending Approval" row.
2. Expected: form opens at `/bills/<id>/edit` with all fields pre-populated (vendor, date, memo, line items, etc.).
3. Change the Memo field, click Save.
4. Expected: redirected to `/bills`, updated memo visible in the detail view.

- [ ] **Step 5: Commit**

```bash
git add "app/bills/[id]/edit/page.tsx"
git commit -m "feat: add bill edit page (load, pre-populate including line items, update)"
```

---

### Task 2: Subsidiaries Edit Page

**Files:**
- Create: `app/subsidiaries/[id]/page.tsx`

**DB note:** The `subsidiaries` table only stores: `name`, `elimination`, `parent_subsidiary`, `currency`, `country`, `language`. Other fields in the new-subsidiary form (website, address, EIN, etc.) are not in the schema and will be empty on this edit page.

- [ ] **Step 1: Verify the route 404s**

Open `http://localhost:3000/subsidiaries/<any-uuid>`.
Expected: 404.

- [ ] **Step 2: Create `app/subsidiaries/[id]/page.tsx`**

```typescript
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SubsidiaryRow {
  id: string;
  name: string | null;
  elimination: boolean | null;
  parent_subsidiary: string | null;
  currency: string | null;
  country: string | null;
  language: string | null;
}

export default function EditSubsidiary() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parentOptions, setParentOptions] = useState<string[]>([]);
  const [form, setForm] = useState({
    inactive: false, name: "", parentSubsidiary: "Parent Company",
    website: "", documentNumberPrefix: "", stateProvince: "",
    country: "United States", legalName: "", returnEmailAddress: "", address: "",
    fax: "", elimination: false, language: "English (U.S.)", currency: "US Dollar",
    ein: "", ssn: "", industryDescription: "", orgNumber: "", phone: "", taxNumber: "",
    bankDetails: "", documentFooterMessage: "",
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from("subsidiaries").select("name").order("name").then(({ data }) => {
      setParentOptions((data || []).map((s: { name: string }) => s.name));
    });
    supabase.from("subsidiaries").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        const s = data as SubsidiaryRow;
        setForm(f => ({
          ...f,
          name: s.name ?? "",
          elimination: s.elimination ?? false,
          parentSubsidiary: s.parent_subsidiary ?? "Parent Company",
          currency: s.currency ?? "US Dollar",
          country: s.country ?? "United States",
          language: s.language ?? "English (U.S.)",
        }));
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!form.name) { alert("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("subsidiaries").update({
      name: form.name,
      elimination: form.elimination,
      parent_subsidiary: form.parentSubsidiary,
      currency: form.currency,
      country: form.country,
      language: form.language,
    }).eq("id", id);
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    router.push("/subsidiaries");
  };

  if (loading) return <div className="m-4 text-gray-400 text-sm">Loading...</div>;
  if (notFound) return (
    <div className="m-4 text-sm text-gray-500">
      Subsidiary not found. <Link href="/subsidiaries" className="text-blue-600 hover:underline">Back to list</Link>
    </div>
  );

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">Subsidiary</h1>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/subsidiaries" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/subsidiaries")}>Cancel</button>
        </div>

        <div className="p-4 grid grid-cols-3 gap-x-8 gap-y-3">
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.inactive} onChange={e => set("inactive", e.target.checked)} /> SUBSIDIARY IS INACTIVE
              </label>
            </div>
            <div><label className="form-label">NAME <span className="required-star">*</span></label><input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div>
              <label className="form-label">PARENT SUBSIDIARY <span className="required-star">*</span></label>
              <select className="form-select" value={form.parentSubsidiary} onChange={e => set("parentSubsidiary", e.target.value)}>
                <option value=""></option>
                {parentOptions.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="form-label">WEB SITE</label><input className="form-input" value={form.website} onChange={e => set("website", e.target.value)} /></div>
            <div><label className="form-label">DOCUMENT NUMBER PREFIX</label><input className="form-input" value={form.documentNumberPrefix} onChange={e => set("documentNumberPrefix", e.target.value)} /></div>
            <div>
              <label className="form-label">STATE/PROVINCE <span className="required-star">*</span></label>
              <select className="form-select" value={form.stateProvince} onChange={e => set("stateProvince", e.target.value)}>
                <option value=""></option><option>California</option><option>New York</option><option>Texas</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">COUNTRY <span className="required-star">*</span></label>
              <select className="form-select" value={form.country} onChange={e => set("country", e.target.value)}>
                <option>United States</option><option>United Kingdom</option><option>Germany</option><option>India</option>
              </select>
            </div>
            <div><label className="form-label">LEGAL NAME</label><input className="form-input" value={form.legalName} onChange={e => set("legalName", e.target.value)} /></div>
            <div><label className="form-label">RETURN EMAIL ADDRESS</label><input className="form-input" type="email" value={form.returnEmailAddress} onChange={e => set("returnEmailAddress", e.target.value)} /></div>
            <div><label className="form-label">ADDRESS</label><textarea className="form-input" rows={4} value={form.address} onChange={e => set("address", e.target.value)} /></div>
          </div>

          <div className="space-y-3">
            <div><label className="form-label">FAX</label><input className="form-input" value={form.fax} onChange={e => set("fax", e.target.value)} /></div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.elimination} onChange={e => set("elimination", e.target.checked)} /> ELIMINATION
              </label>
            </div>
            <div>
              <label className="form-label">LANGUAGE <span className="required-star">*</span></label>
              <select className="form-select" value={form.language} onChange={e => set("language", e.target.value)}>
                <option>English (U.S.)</option><option>English (U.K.)</option><option>German</option><option>Hindi</option>
              </select>
            </div>
            <div>
              <label className="form-label">CURRENCY <span className="required-star">*</span></label>
              <select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option>US Dollar</option><option>British Pound</option><option>Euro</option><option>Indian Rupee</option>
              </select>
            </div>
            <div><label className="form-label">EMPLOYER IDENTIFICATION NUMBER (EIN)</label><input className="form-input" value={form.ein} onChange={e => set("ein", e.target.value)} /></div>
            <div><label className="form-label">SSN OR TIN</label><input className="form-input" value={form.ssn} onChange={e => set("ssn", e.target.value)} /></div>
            <div><label className="form-label">INDUSTRY DESCRIPTION</label><input className="form-input" value={form.industryDescription} onChange={e => set("industryDescription", e.target.value)} /></div>
          </div>

          <div className="space-y-3">
            <div><label className="form-label">BANK DETAILS</label><textarea className="form-input" rows={4} value={form.bankDetails} onChange={e => set("bankDetails", e.target.value)} /></div>
            <div><label className="form-label">DOCUMENT FOOTER MESSAGE</label><textarea className="form-input" rows={4} value={form.documentFooterMessage} onChange={e => set("documentFooterMessage", e.target.value)} /></div>
            <div><label className="form-label">ORG NUMBER</label><input className="form-input" value={form.orgNumber} onChange={e => set("orgNumber", e.target.value)} /></div>
            <div><label className="form-label">PHONE</label><input className="form-input" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div><label className="form-label">TAX NUMBER</label><input className="form-input" value={form.taxNumber} onChange={e => set("taxNumber", e.target.value)} /></div>
          </div>
        </div>

        <div className="toolbar border-t border-gray-200">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.push("/subsidiaries")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/aksharahegde/Documents/work/df-projects/company-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

1. Go to `/subsidiaries` — click Edit on any row.
2. Expected: form opens at `/subsidiaries/<id>` with Name, Parent Subsidiary, Country, Currency, Language pre-populated.
3. Change the Country field, click Save.
4. Expected: redirected to `/subsidiaries`, change reflected in the list.
5. Click View on any row — same form opens (both links go to the same page).

- [ ] **Step 5: Commit**

```bash
git add "app/subsidiaries/[id]/page.tsx"
git commit -m "feat: add subsidiary edit page (load, pre-populate, update)"
```
