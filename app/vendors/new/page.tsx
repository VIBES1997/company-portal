"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewVendor() {
  const router = useRouter();
  const [form, setForm] = useState({
    customForm: "Standard Vendor Form",
    companyName: "",
    vendorId: "",
    autoVendorId: true,
    type: "COMPANY" as "COMPANY" | "INDIVIDUAL",
    webAddress: "",
    category: "",
    comments: "",
    email: "",
    phone: "",
    altPhone: "",
    fax: "",
    address: "",
    primarySubsidiary: "Parent Company",
    healthcareProvider: "",
    emailForPayment: "",
    projectVendor: false,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        {/* Header */}
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
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">More</Link>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="toolbar">
          <button className="btn-primary" onClick={() => router.push("/vendors")}>Save</button>
          <button className="btn-secondary" onClick={() => router.push("/vendors")}>Cancel</button>
        </div>

        <div className="p-4">
          {/* Primary Information */}
          <div className="section-header">▼ Primary Information</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            {/* Col 1 */}
            <div className="space-y-3">
              <div>
                <label className="form-label">CUSTOM FORM <span className="required-star">*</span></label>
                <select className="form-select" value={form.customForm} onChange={e => set("customForm", e.target.value)}>
                  <option>Standard Vendor Form</option>
                </select>
              </div>
              <div>
                <label className="form-label">VENDOR ID <span className="required-star">*</span></label>
                <div className="flex items-center gap-2">
                  <input className="form-input" placeholder="Copied From Name" value={form.vendorId} onChange={e => set("vendorId", e.target.value)} disabled={form.autoVendorId} />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input type="checkbox" checked={form.autoVendorId} onChange={e => set("autoVendorId", e.target.checked)} />
                    AUTO
                  </label>
                </div>
              </div>
              <div>
                <label className="form-label">TYPE</label>
                <div className="flex gap-4 text-sm mt-1">
                  <label className="flex items-center gap-1"><input type="radio" name="type" value="COMPANY" checked={form.type === "COMPANY"} onChange={() => set("type", "COMPANY")} /> COMPANY</label>
                  <label className="flex items-center gap-1"><input type="radio" name="type" value="INDIVIDUAL" checked={form.type === "INDIVIDUAL"} onChange={() => set("type", "INDIVIDUAL")} /> INDIVIDUAL</label>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <div>
                <label className="form-label">COMPANY NAME <span className="required-star">*</span></label>
                <input className="form-input" value={form.companyName} onChange={e => set("companyName", e.target.value)} />
              </div>
              <div>
                <label className="form-label">WEB ADDRESS</label>
                <input className="form-input" value={form.webAddress} onChange={e => set("webAddress", e.target.value)} />
              </div>
              <div>
                <label className="form-label">CATEGORY</label>
                <select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>
                  <option value=""></option>
                  <option>Preferred</option>
                  <option>Standard</option>
                </select>
              </div>
            </div>

            {/* Col 3 */}
            <div>
              <label className="form-label">COMMENTS</label>
              <textarea className="form-input" rows={5} value={form.comments} onChange={e => set("comments", e.target.value)} />
              <button className="btn-secondary mt-1 text-xs">Clean up ▾</button>
            </div>
          </div>

          {/* Email | Phone | Address */}
          <div className="section-header mt-4">▼ Email | Phone | Address</div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div>
                <label className="form-label">EMAIL</label>
                <input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label className="form-label">PHONE</label>
                <input className="form-input" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">ALT. PHONE</label>
                <input className="form-input" value={form.altPhone} onChange={e => set("altPhone", e.target.value)} />
              </div>
              <div>
                <label className="form-label">FAX</label>
                <input className="form-input" value={form.fax} onChange={e => set("fax", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">ADDRESS</label>
              <textarea className="form-input" rows={4} value={form.address} onChange={e => set("address", e.target.value)} />
            </div>
          </div>

          {/* Classification */}
          <div className="section-header mt-4">▼ Classification</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 border border-gray-200 border-t-0">
            <div className="space-y-3">
              <div>
                <label className="form-label">PRIMARY SUBSIDIARY <span className="required-star">*</span></label>
                <select className="form-select" value={form.primarySubsidiary} onChange={e => set("primarySubsidiary", e.target.value)}>
                  <option>Parent Company</option>
                  <option>Germany</option>
                  <option>India</option>
                  <option>United Kingdom</option>
                  <option>US East</option>
                  <option>US West</option>
                </select>
              </div>
              <div>
                <label className="form-label">EMAIL ADDRESS FOR PAYMENT NOTIFICATION</label>
                <input className="form-input" value={form.emailForPayment} onChange={e => set("emailForPayment", e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">HEALTHCARE PROVIDER</label>
                <select className="form-select" value={form.healthcareProvider} onChange={e => set("healthcareProvider", e.target.value)}>
                  <option value=""></option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-2">
                  <input type="checkbox" checked={form.projectVendor} onChange={e => set("projectVendor", e.target.checked)} />
                  PROJECT VENDOR
                </label>
              </div>
            </div>
          </div>

          {/* Subsidiaries tab */}
          <div className="mt-4">
            <div className="tab-bar">
              <div className="tab-item active">Subsidiaries</div>
              <div className="tab-item">Relationships</div>
              <div className="tab-item">Communication</div>
              <div className="tab-item">Address</div>
              <div className="tab-item">Marketing</div>
              <div className="tab-item">Financial</div>
              <div className="tab-item">Preferences</div>
              <div className="tab-item">System Information</div>
              <div className="tab-item">Access</div>
              <div className="tab-item">Custom</div>
            </div>
            <div className="border border-gray-200 border-t-0 p-3">
              <table className="data-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>SUBSIDIARY</th>
                    <th>CREDIT LIMIT</th>
                    <th>DISTRIBUTION TEMPLATE</th>
                    <th>TAX CODE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select className="form-select" style={{ width: "180px" }}>
                        <option>Parent Company</option>
                        <option>Germany</option>
                        <option>India</option>
                        <option>United Kingdom</option>
                        <option>US East</option>
                        <option>US West</option>
                      </select>
                    </td>
                    <td><input className="form-input" style={{ width: "120px" }} /></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div className="flex gap-2 mt-2">
                <button className="btn-primary text-xs">✓ Add</button>
                <button className="btn-secondary text-xs">✗ Cancel</button>
                <button className="btn-secondary text-xs">🗑 Remove</button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom save */}
        <div className="toolbar border-t border-gray-200 mt-2">
          <button className="btn-primary" onClick={() => router.push("/vendors")}>Save</button>
          <button className="btn-secondary" onClick={() => router.push("/vendors")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
