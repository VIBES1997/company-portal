"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Integration {
  id: string; name: string; application_id?: string; state: string; created_on?: string; description?: string;
}

export default function IntegrationsList() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("integrations").select("*").order("name").then(({ data }) => {
      setIntegrations(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">Integrations</h1>
          <div className="text-xs">
            <span className="text-blue-600 cursor-pointer hover:underline">Set Preferences</span>
          </div>
        </div>

        <div className="toolbar">
          <Link href="/setup/integrations/new" className="btn-primary text-xs">New</Link>
          <button className="btn-secondary text-xs ml-1">Refresh</button>
        </div>

        <div className="filter-bar">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" /> SHOW INACTIVES
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}></th>
                <th>NAME</th>
                <th>APPLICATION ID</th>
                <th>STATE</th>
                <th>CREATED ON</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-4">Loading...</td></tr>
              ) : integrations.map(i => (
                <tr key={i.id}>
                  <td><input type="checkbox" /></td>
                  <td><Link href={`/setup/integrations/${i.id}`} className="link">{i.name}</Link></td>
                  <td className="text-gray-600 font-mono text-xs">{i.application_id || ""}</td>
                  <td><span className="status-badge status-enabled">{i.state}</span></td>
                  <td className="text-gray-600">{i.created_on || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
