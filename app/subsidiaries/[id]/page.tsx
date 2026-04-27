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
