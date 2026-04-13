"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewPaymentTerm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    terms: "", type: "STANDARD" as "STANDARD" | "DATE_DRIVEN",
    daysTillNetDue: "", discountPct: "", daysTillDiscountExpires: "",
    installment: false, preferred: false, inactive: false,
    dayOfMonthNetDue: "", dueNextMonthIfWithinDays: "",
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.terms) { alert("Terms name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("payment_terms").insert({
      terms: form.terms,
      type: form.type,
      days_till_net_due: form.daysTillNetDue ? parseInt(form.daysTillNetDue) : null,
      discount_pct: form.discountPct ? parseFloat(form.discountPct) : null,
      days_till_discount_expires: form.daysTillDiscountExpires ? parseInt(form.daysTillDiscountExpires) : null,
      installment: form.installment,
      preferred: form.preferred,
      inactive: form.inactive,
    });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    router.back();
  };

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">Term</h1>
          <div className="flex items-center gap-2 text-xs">
            <Link href="#" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
        <div className="grid grid-cols-2 gap-x-12 p-6">
          <div className="space-y-4">
            <div><label className="form-label">TERMS <span className="required-star">*</span></label><input className="form-input" value={form.terms} onChange={e => set("terms", e.target.value)} autoFocus /></div>
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="termType" checked={form.type === "STANDARD"} onChange={() => set("type", "STANDARD")} /> STANDARD</label>
            {form.type === "STANDARD" && (<>
              <div><label className="form-label">DAYS TILL NET DUE</label><input className="form-input" type="number" value={form.daysTillNetDue} onChange={e => set("daysTillNetDue", e.target.value)} /></div>
              <div><label className="form-label">% DISCOUNT</label><input className="form-input" type="number" value={form.discountPct} onChange={e => set("discountPct", e.target.value)} /></div>
              <div><label className="form-label">DAYS TILL DISCOUNT EXPIRES</label><input className="form-input" type="number" value={form.daysTillDiscountExpires} onChange={e => set("daysTillDiscountExpires", e.target.value)} /></div>
            </>)}
          </div>
          <div className="space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><input type="checkbox" checked={form.installment} onChange={e => set("installment", e.target.checked)} /> INSTALLMENT</label>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><input type="checkbox" checked={form.preferred} onChange={e => set("preferred", e.target.checked)} /> PREFERRED</label>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><input type="checkbox" checked={form.inactive} onChange={e => set("inactive", e.target.checked)} /> INACTIVE</label>
            </div>
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="termType" checked={form.type === "DATE_DRIVEN"} onChange={() => set("type", "DATE_DRIVEN")} /> DATE DRIVEN</label>
            {form.type === "DATE_DRIVEN" && (<>
              <div><label className="form-label">DAY OF MONTH NET DUE</label><input className="form-input bg-gray-50" value={form.dayOfMonthNetDue} onChange={e => set("dayOfMonthNetDue", e.target.value)} /></div>
              <div><label className="form-label">DUE NEXT MONTH IF WITHIN DAYS</label><input className="form-input bg-gray-50" value={form.dueNextMonthIfWithinDays} onChange={e => set("dueNextMonthIfWithinDays", e.target.value)} /></div>
            </>)}
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
