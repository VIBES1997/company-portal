"use client";
import Link from "next/link";
import { subsidiaries } from "@/lib/data";

export default function SubsidiariesList() {
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
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Subsidiary Settings Manager</Link>
          </div>
        </div>

        <div className="toolbar">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">VIEW</label>
            <select className="form-select" style={{ width: "160px" }}>
              <option>Subsidiary Default</option>
            </select>
          </div>
          <button className="btn-secondary text-xs">Customize View</button>
          <Link href="/subsidiaries/new" className="btn-primary text-xs ml-2">New Subsidiary</Link>
          <button className="btn-outline text-xs">Generate Representing Entities</button>
        </div>

        <div className="filter-bar">
          <span className="text-gray-500">⊕</span>
          <span className="font-semibold text-gray-600 text-xs">FILTERS</span>
          <label className="flex items-center gap-1 text-xs ml-4">
            <input type="checkbox" /> SHOW INACTIVES
          </label>
          <span className="text-xs text-gray-600 font-semibold ml-auto">TOTAL: {subsidiaries.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>EDIT | VIEW</th>
                <th>NAME ▲</th>
                <th>ELIMINATION</th>
                <th>REPRESENTING VENDOR</th>
                <th>REPRESENTING CUSTOMER</th>
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
                  <td><span className="link">{s.representingVendor || ""}</span></td>
                  <td><span className="link">{s.representingCustomer || ""}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
