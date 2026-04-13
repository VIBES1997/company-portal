"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewAccount() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: "", name: "", subaccountOf: "", type: "Bank", currency: "",
    generalRateType: "Current", cashFlowRateType: "Average", inventory: false,
    description: "", date: "4/8/2026", summary: false, inactive: false,
    bankName: "", bankRoutingNumber: "", bankAccountNumber: "",
    restrictToDepartment: "", restrictToClass: "", restrictToLocation: "",
    subsidiaries: ["Parent Company"] as string[],
    includeChildren: false, excludeFromCash360: false,
    revalueOpenBalance: true, eliminateIntercompany: false,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const subsidiaryOptions = ["Parent Company", "Germany", "India", "United Kingdom", "US East", "US West"];

  const handleSave = async () => {
    if (!form.name) { alert("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("accounts").insert({
      number: form.number || null,
      name: form.name,
      type: form.type,
      currency: form.currency || null,
      description: form.description || null,
      inactive: form.inactive,
      summary: form.summary,
      inventory: form.inventory,
      general_rate_type: form.generalRateType,
      cash_flow_rate_type: form.cashFlowRateType,
      bank_name: form.bankName || null,
      bank_routing_number: form.bankRoutingNumber || null,
      bank_account_number: form.bankAccountNumber || null,
      subsidiaries: form.subsidiaries,
    });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    router.back();
  };

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">Account</h1>
          <div className="flex items-center gap-2 text-xs">
            <Link href="#" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Customize</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">More</Link>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>

        <div className="grid grid-cols-3 gap-x-6 p-4">
          {/* Col 1: Left fields */}
          <div className="space-y-3">
            <div>
              <label className="form-label">NUMBER</label>
              <input className="form-input" value={form.number} onChange={e => set("number", e.target.value)} />
            </div>
            <div>
              <label className="form-label">NAME <span className="required-star">*</span></label>
              <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className="form-label">SUBACCOUNT OF</label>
              <select className="form-select" value={form.subaccountOf} onChange={e => set("subaccountOf", e.target.value)}>
                <option value="">Type then tab</option>
                <option>1000 Cash and Cash Equivalents</option>
                <option>2000 Accounts Payable</option>
                <option>4000 Revenue</option>
                <option>6000 Expenses</option>
              </select>
            </div>
            <div>
              <label className="form-label">TYPE <span className="required-star">*</span></label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option>Bank</option>
                <option>Accounts Receivable</option>
                <option>Accounts Payable</option>
                <option>Income</option>
                <option>Expense</option>
                <option>Other Asset</option>
                <option>Other Liability</option>
              </select>
            </div>
            <div>
              <label className="form-label">CURRENCY <span className="required-star">*</span></label>
              <select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option value=""></option>
                <option>US Dollar</option>
                <option>British Pound</option>
                <option>Euro</option>
                <option>Indian Rupee</option>
              </select>
            </div>
            <div>
              <label className="form-label">GENERAL RATE TYPE</label>
              <select className="form-select" value={form.generalRateType} onChange={e => set("generalRateType", e.target.value)}>
                <option>Current</option>
                <option>Average</option>
                <option>Historical</option>
              </select>
            </div>
            <div>
              <label className="form-label">CASH FLOW RATE TYPE</label>
              <select className="form-select" value={form.cashFlowRateType} onChange={e => set("cashFlowRateType", e.target.value)}>
                <option>Average</option>
                <option>Current</option>
                <option>Historical</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.inventory} onChange={e => set("inventory", e.target.checked)} />
                INVENTORY
              </label>
            </div>
          </div>

          {/* Col 2: Middle fields */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.revalueOpenBalance} onChange={e => set("revalueOpenBalance", e.target.checked)} />
                REVALUE OPEN BALANCE FOR FOREIGN CURRENCY TRANSACTIONS
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.eliminateIntercompany} onChange={e => set("eliminateIntercompany", e.target.checked)} />
                ELIMINATE INTERCOMPANY TRANSACTIONS
              </label>
            </div>
            <div>
              <label className="form-label">DESCRIPTION</label>
              <textarea className="form-input" rows={4} value={form.description} onChange={e => set("description", e.target.value)} />
              <button className="btn-secondary mt-1 text-xs">Clean up ▾</button>
            </div>
            <div>
              <label className="form-label">DATE</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.summary} onChange={e => set("summary", e.target.checked)} />
                SUMMARY
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.inactive} onChange={e => set("inactive", e.target.checked)} />
                INACTIVE
              </label>
            </div>
            <div>
              <label className="form-label">BANK NAME</label>
              <input className="form-input" value={form.bankName} onChange={e => set("bankName", e.target.value)} />
            </div>
            <div>
              <label className="form-label">BANK ROUTING NUMBER</label>
              <input className="form-input" value={form.bankRoutingNumber} onChange={e => set("bankRoutingNumber", e.target.value)} />
            </div>
            <div>
              <label className="form-label">BANK ACCOUNT NUMBER</label>
              <input className="form-input" value={form.bankAccountNumber} onChange={e => set("bankAccountNumber", e.target.value)} />
            </div>
            <div>
              <label className="form-label">RESTRICT TO DEPARTMENT</label>
              <select className="form-select"><option value=""></option></select>
            </div>
          </div>

          {/* Col 3: Right — Subsidiaries */}
          <div className="space-y-3">
            <div>
              <label className="form-label">RESTRICT TO CLASS</label>
              <select className="form-select"><option value=""></option></select>
            </div>
            <div>
              <label className="form-label">RESTRICT TO LOCATION</label>
              <select className="form-select"><option value=""></option></select>
            </div>
            <div>
              <label className="form-label">SUBSIDIARIES <span className="required-star">*</span></label>
              <div className="border border-gray-300 rounded" style={{ minHeight: "120px" }}>
                {subsidiaryOptions.map(s => (
                  <div
                    key={s}
                    className={`px-2 py-1 text-xs cursor-pointer ${form.subsidiaries.includes(s) ? "bg-blue-700 text-white" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      const curr = form.subsidiaries;
                      set("subsidiaries", curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s]);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.includeChildren} onChange={e => set("includeChildren", e.target.checked)} />
                INCLUDE CHILDREN
              </label>
            </div>
            <div>
              <label className="form-label">SHOW IN FIXED ASSETS MANAGEMENT</label>
              <div className="border border-gray-300 rounded p-2 space-y-1 text-xs text-blue-600">
                <div className="cursor-pointer hover:underline">Asset Account</div>
                <div className="cursor-pointer hover:underline">Depreciation Account</div>
                <div className="cursor-pointer hover:underline">Depreciation Expense</div>
                <div className="cursor-pointer hover:underline">Write Off Account</div>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input type="checkbox" checked={form.excludeFromCash360} onChange={e => set("excludeFromCash360", e.target.checked)} />
                EXCLUDE FROM CASH 360
              </label>
            </div>
          </div>
        </div>

        <div className="toolbar border-t border-gray-200">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
