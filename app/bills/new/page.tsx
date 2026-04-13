"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewBill() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Expenses and Items");
  const [lineItems, setLineItems] = useState([{ account: "", amount: "", memo: "" }]);
  const [form, setForm] = useState({
    customForm: "Standard Vendor Bill", currency: "US Dollar", exchangeRate: "1.00",
    dueDate: "", date: new Date().toISOString().split("T")[0], postingPeriod: "",
    vendor: "", account: "", amount: "", referenceNo: "", memo: "",
    approvalStatus: "Pending Approval", subsidiary: "", distType: "", distRateType: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const tabs = ["Expenses and Items", "Billing", "Relationships", "Communication", "Custom", "EET"];

  const handleSave = async () => {
    if (!form.vendor) { alert("Vendor is required"); return; }
    setSaving(true);
    const total = lineItems.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
    const { error } = await supabase.from("bills").insert({
      date: form.date,
      reference_no: form.referenceNo,
      vendor_name: form.vendor,
      account: form.account || "2000 Accounts Payable",
      status: "Pending Approval",
      currency: form.currency,
      exchange_rate: parseFloat(form.exchangeRate) || 1,
      amount: total || parseFloat(form.amount) || 0,
      memo: form.memo,
      due_date: form.dueDate,
      posting_period: form.postingPeriod,
      subsidiary: form.subsidiary,
      line_items: lineItems.filter(li => li.account || li.amount),
    });
    setSaving(false);
    if (error) { alert("Error saving: " + error.message); return; }
    router.push("/bills");
  };

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
                  <option>ACME Industries</option>
                  <option>Adirondack Networking</option>
                  <option>Berge Inc</option>
                  <option>Brightway Solutions Pvt. Ltd.</option>
                  <option>Brocade Communications Systems</option>
                  <option>Cable Plus Distributors</option>
                  <option>CDW</option>
                  <option>Cloud Consulting</option>
                  <option>CoreSolutions</option>
                </select>
              </div>
              <div>
                <label className="form-label">ACCOUNT</label>
                <select className="form-select" value={form.account} onChange={e => set("account", e.target.value)}>
                  <option value="">— Select account —</option>
                  <option>2000 Accounts Payable</option>
                  <option>6610 Expenses</option>
                </select>
              </div>
              <div>
                <label className="form-label">AMOUNT</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="Auto-calculated from line items" />
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
                  <option>Jan 2026</option><option>Feb 2026</option>
                  <option>Mar 2026</option><option>Apr 2026</option>
                  <option>May 2026</option><option>Jun 2026</option>
                </select>
              </div>
              <div>
                <label className="form-label">APPROVAL STATUS</label>
                <input className="form-input bg-gray-50" value="Pending Approval" disabled />
              </div>
            </div>
          </div>

          <div className="section-header">▼ Classification</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div>
              <label className="form-label">SUBSIDIARY <span className="required-star">*</span></label>
              <select className="form-select" value={form.subsidiary} onChange={e => set("subsidiary", e.target.value)}>
                <option value=""></option>
                <option>Parent Company</option><option>Germany</option><option>India</option>
                <option>United Kingdom</option><option>US East</option><option>US West</option>
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

          {/* Tabs */}
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
