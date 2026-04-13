"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewVendor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customForm: "Standard Vendor Form", company_name: "", vendor_id: "", autoVendorId: true,
    type: "COMPANY", web_address: "", category: "", comments: "", email: "", phone: "",
    alt_phone: "", fax: "", address: "", subsidiary: "Parent Company",
    email_for_payment: "", project_vendor: false,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("vendors").insert({
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
    });
    setSaving(false);
    router.push("/vendors");
  };

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
