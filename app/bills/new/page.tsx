"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewBill() {
  const router = useRouter();
  const [form, setForm] = useState({
    customForm: "Standard Vendor Bill",
    currency: "US Dollar",
    exchangeRate: "1.00",
    dueDate: "4/8/2026",
    date: "4/8/2026",
    postingPeriod: "",
    vendor: "",
    account: "",
    amount: "",
    referenceNo: "",
    memo: "",
    approvalStatus: "Pending Approval",
    subsidiary: "",
    distDefaultTemplate: "",
    distType: "",
    distRateType: "",
  });
  const [activeTab, setActiveTab] = useState("Expenses and Items");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const tabs = ["Expenses and Items", "Billing", "Relationships", "Communication", "Custom", "EET"];

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
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">More</Link>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn-primary" onClick={() => router.push("/bills")}>Save</button>
          <button className="btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
          <button className="btn-secondary">Auto Fill</button>
          <button className="btn-secondary">Recalc</button>
          <button className="btn-secondary">Actions ▾</button>
        </div>

        <div className="p-4">
          {/* Primary Information */}
          <div className="section-header" style={{ marginTop: 0 }}>▼ Primary Information</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div>
                <label className="form-label">CUSTOM FORM <span className="required-star">*</span></label>
                <select className="form-select" value={form.customForm} onChange={e => set("customForm", e.target.value)}>
                  <option>Standard Vendor Bill</option>
                </select>
              </div>
              <div>
                <label className="form-label">TRANSACTION NUMBER</label>
                <input className="form-input" placeholder="To Be Generated" disabled />
              </div>
              <div>
                <label className="form-label">REFERENCE NO.</label>
                <input className="form-input" value={form.referenceNo} onChange={e => set("referenceNo", e.target.value)} />
              </div>
              <div>
                <label className="form-label">VENDOR <span className="required-star">*</span></label>
                <select className="form-select" value={form.vendor} onChange={e => set("vendor", e.target.value)}>
                  <option value="">Type then tab...</option>
                  <option>ACME Industries</option>
                  <option>Adirondack Networking</option>
                  <option>Berge Inc</option>
                  <option>CDW</option>
                </select>
              </div>
              <div>
                <label className="form-label">ACCOUNT <span className="required-star">*</span></label>
                <select className="form-select" value={form.account} onChange={e => set("account", e.target.value)}>
                  <option value=""></option>
                  <option>2000 Accounts Payable</option>
                  <option>6610 Expenses</option>
                </select>
              </div>
              <div>
                <label className="form-label">AMOUNT</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => set("amount", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label">AVAILABLE VENDOR CREDIT</label>
                <input className="form-input" disabled />
              </div>
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
                <label className="form-label">DISC. AMT.</label>
                <input className="form-input" disabled />
              </div>
              <div>
                <label className="form-label">DISC. DATE</label>
                <input className="form-input" disabled />
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
                <label className="form-label">POSTING PERIOD <span className="required-star">*</span></label>
                <select className="form-select" value={form.postingPeriod} onChange={e => set("postingPeriod", e.target.value)}>
                  <option value=""></option>
                  <option>Jan 2026</option>
                  <option>Feb 2026</option>
                  <option>Mar 2026</option>
                  <option>Apr 2026</option>
                </select>
              </div>
              <div>
                <label className="form-label">MEMO</label>
                <input className="form-input" value={form.memo} onChange={e => set("memo", e.target.value)} />
              </div>
              <div>
                <label className="form-label">APPROVAL STATUS</label>
                <input className="form-input" value={form.approvalStatus} disabled />
              </div>
              <div>
                <label className="form-label">NEXT APPROVER</label>
                <input className="form-input" disabled />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="section-header">▼ Classification</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div>
              <label className="form-label">SUBSIDIARY <span className="required-star">*</span></label>
              <select className="form-select" value={form.subsidiary} onChange={e => set("subsidiary", e.target.value)}>
                <option value=""></option>
                <option>Parent Company</option>
                <option>Germany</option>
                <option>India</option>
                <option>United Kingdom</option>
                <option>US East</option>
                <option>US West</option>
              </select>
            </div>
            <div>
              <label className="form-label">DIST. TYPE</label>
              <select className="form-select" value={form.distType} onChange={e => set("distType", e.target.value)}>
                <option value=""></option>
              </select>
            </div>
            <div>
              <label className="form-label">DIST. RATE TYPE</label>
              <select className="form-select" value={form.distRateType} onChange={e => set("distRateType", e.target.value)}>
                <option value=""></option>
              </select>
            </div>
            <div>
              <label className="form-label">DIST. DEFAULT TEMPLATE</label>
              <select className="form-select" value={form.distDefaultTemplate} onChange={e => set("distDefaultTemplate", e.target.value)}>
                <option value="">Type then tab...</option>
              </select>
            </div>
            <div>
              <label className="form-label">DIST. LINE DIST. RULE</label>
              <input className="form-input" disabled />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-4">
                <input type="checkbox" /> DISABLE LINE DIST. RULE
              </label>
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
                  <div className="flex gap-2 mb-3">
                    <button className="btn-secondary text-xs">Clear All Lines</button>
                    <button className="btn-secondary text-xs">Enter Quick Distribution</button>
                  </div>
                  <div className="mb-2 text-xs font-semibold text-gray-600">
                    Expenses 0.00 &nbsp; Items 0.00
                  </div>
                  <table className="data-table text-xs">
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>ACCOUNT</th>
                        <th>AMOUNT <span className="required-star">*</span></th>
                        <th>MEMO</th>
                        <th>DEPARTMENT</th>
                        <th>CLASS</th>
                        <th>LOCATION</th>
                        <th>CUSTOMER</th>
                        <th>PROJECT TASK</th>
                        <th>BILLABLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><input className="form-input text-xs" style={{ width: "80px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "160px" }} /></td>
                        <td><input className="form-input text-xs" type="number" style={{ width: "90px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "120px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "100px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "80px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "80px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "100px" }} /></td>
                        <td><input className="form-input text-xs" style={{ width: "100px" }} /></td>
                        <td><input type="checkbox" /></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex gap-2 mt-2">
                    <button className="btn-primary text-xs">+ Add</button>
                    <button className="btn-secondary text-xs">✗ Cancel</button>
                    <button className="btn-secondary text-xs">Copy Previous</button>
                    <button className="btn-secondary text-xs">+ Insert</button>
                    <button className="btn-secondary text-xs">Remove</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="toolbar border-t border-gray-200 mt-2">
          <button className="btn-primary" onClick={() => router.push("/bills")}>Save</button>
          <button className="btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
          <button className="btn-secondary">Auto Fill</button>
          <button className="btn-secondary">Recalc</button>
          <button className="btn-secondary">Actions ▾</button>
        </div>
      </div>
    </div>
  );
}
