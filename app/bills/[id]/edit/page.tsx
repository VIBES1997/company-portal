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
