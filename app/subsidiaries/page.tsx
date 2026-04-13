"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Subsidiary {
  id: string; name: string; elimination: boolean;
  representing_vendor?: string; representing_customer?: string;
}

export default function SubsidiariesList() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("subsidiaries").select("*").order("name").then(({ data }) => {
      setSubsidiaries(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📁</span>
            <h1 className="text-2xl font-normal text-gray-800">Subsidiaries</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="#" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Audit Trail</Link>
          </div>
        </div>
        <div className="toolbar">
          <Link href="/subsidiaries/new" className="btn-primary text-xs">New Subsidiary</Link>
        </div>
        <div className="filter-bar">
          <span className="text-gray-500">⊕</span>
          <span className="font-semibold text-gray-600 text-xs">FILTERS</span>
          <span className="text-xs text-gray-600 font-semibold ml-auto">TOTAL: {subsidiaries.length}</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>EDIT | VIEW</th>
                  <th>NAME ▲</th><th>ELIMINATION</th>
                  <th>REPRESENTING VENDOR</th><th>REPRESENTING CUSTOMER</th>
                </tr>
              </thead>
              <tbody>
                {subsidiaries.map(s => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/subsidiaries/${s.id}`} className="action-link">Edit</Link>
                      <span className="text-gray-400 mx-1">|</span>
                      <Link href={`/subsidiaries/${s.id}`} className="action-link">View</Link>
                    </td>
                    <td className="font-medium text-gray-800">{s.name}</td>
                    <td className="text-gray-600">{s.elimination ? "Yes" : "No"}</td>
                    <td><span className="link">{s.representing_vendor || ""}</span></td>
                    <td><span className="link">{s.representing_customer || ""}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
