"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Credential {
  id: string; certificate_id: string; algorithm: string; application: string;
  entity: string; role: string; created_date: string; valid_from: string;
  valid_until: string; revoked: boolean;
}

export default function M2MCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCred, setNewCred] = useState({ entity: "", role: "", application: "", certificate: null as File | null });

  useEffect(() => {
    supabase.from("credentials").select("*").order("created_date", { ascending: false }).then(({ data }) => {
      setCredentials(data || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!newCred.entity || !newCred.role || !newCred.application) { alert("Entity, role and application are required"); return; }
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data, error } = await supabase.from("credentials").insert({
      certificate_id: "cert_" + Math.random().toString(36).slice(2, 10),
      algorithm: "RS256",
      application: newCred.application,
      entity: newCred.entity,
      role: newCred.role,
      created_date: today,
      valid_from: today,
      valid_until: validUntil,
      revoked: false,
    }).select().single();
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    if (data) setCredentials(prev => [data, ...prev]);
    setShowModal(false);
    setNewCred({ entity: "", role: "", application: "", certificate: null });
  };

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">OAuth 2.0 Client Credentials Setup</h1>
        </div>

        <div className="toolbar">
          <button className="btn-primary text-xs" onClick={() => setShowModal(true)}>Create New</button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>CERTIFICATE ID</th>
                <th>ALGORITHM</th>
                <th>APPLICATION</th>
                <th>ENTITY</th>
                <th>ROLE</th>
                <th>CREATED DATE</th>
                <th>VALID FROM</th>
                <th>VALID UNTIL</th>
                <th>REVOKED</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-4">Loading...</td></tr>
              ) : credentials.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-gray-700">{c.certificate_id}</td>
                  <td className="text-gray-700">{c.algorithm}</td>
                  <td><span className="link">{c.application}</span></td>
                  <td><span className="link">{c.entity}</span></td>
                  <td><span className="link">{c.role}</span></td>
                  <td className="text-gray-600">{c.created_date}</td>
                  <td className="text-gray-600">{c.valid_from}</td>
                  <td className="text-gray-600">{c.valid_until}</td>
                  <td>
                    {c.revoked
                      ? <input type="checkbox" checked readOnly />
                      : <button className="btn-secondary text-xs" style={{ color: "#cc0000" }} onClick={async () => {
                          await supabase.from("credentials").update({ revoked: true }).eq("id", c.id);
                          setCredentials(prev => prev.map(x => x.id === c.id ? { ...x, revoked: true } : x));
                        }}>Revoke</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded shadow-lg w-96">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#5b7fbd" }}>
              <span className="text-white font-semibold text-sm">Create a New Client Credentials Mapping</span>
              <button className="text-white hover:text-gray-200 text-lg leading-none" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">ENTITY</label>
                <select className="form-select" value={newCred.entity} onChange={e => setNewCred(c => ({ ...c, entity: e.target.value }))}>
                  <option value=""></option>
                  <option>Company</option>
                  <option>Administrator</option>
                </select>
              </div>
              <div>
                <label className="form-label">ROLE</label>
                <select className="form-select" value={newCred.role} onChange={e => setNewCred(c => ({ ...c, role: e.target.value }))}>
                  <option value=""></option>
                  <option>Developer</option>
                  <option>AP Developer</option>
                  <option>Administrator</option>
                </select>
              </div>
              <div>
                <label className="form-label">APPLICATION</label>
                <select className="form-select" value={newCred.application} onChange={e => setNewCred(c => ({ ...c, application: e.target.value }))}>
                  <option value=""></option>
                  <option>AP Automation</option>
                  <option>Claude AI</option>
                </select>
              </div>
              <div>
                <label className="form-label">CERTIFICATE</label>
                <div className="flex items-center gap-2">
                  <label className="btn-secondary text-xs cursor-pointer">
                    Choose a file
                    <input type="file" className="hidden" onChange={e => setNewCred(c => ({ ...c, certificate: e.target.files?.[0] || null }))} />
                  </label>
                  <span className="text-xs text-gray-500 border border-dashed border-gray-300 px-3 py-1 rounded">
                    {newCred.certificate ? newCred.certificate.name : "Not selected"}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <button className="btn-primary text-xs" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                <button className="btn-secondary text-xs ml-2" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
