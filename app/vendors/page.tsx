"use client";
import { useState } from "react";
import Link from "next/link";
import { vendors } from "@/lib/data";

export default function VendorList() {
  const [search, setSearch] = useState("");
  const [showInactives, setShowInactives] = useState(false);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="m-2">
      {/* Page header */}
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📋</span>
            <h1 className="text-2xl font-normal text-gray-800">Vendors</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="#" className="text-blue-600 hover:underline">List</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Search</Link>
            <span className="text-gray-400">|</span>
            <Link href="#" className="text-blue-600 hover:underline">Audit Trail</Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">VIEW</label>
            <select className="form-select" style={{ width: "120px" }}>
              <option>Vendor All</option>
            </select>
          </div>
          <button className="btn-secondary text-xs">Customize View</button>
          <Link href="/vendors/new" className="btn-primary text-xs ml-2">New Vendor</Link>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <span className="text-gray-500">⊕</span>
          <span className="font-semibold text-gray-600 text-xs">FILTERS</span>
          <label className="flex items-center gap-1 text-xs ml-4">
            <input type="checkbox" checked={showInactives} onChange={e => setShowInactives(e.target.checked)} />
            SHOW INACTIVES
          </label>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input text-xs"
              style={{ width: "200px" }}
            />
          </div>
          <span className="text-xs text-gray-600 font-semibold ml-2">TOTAL: {filtered.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>EDIT | VIEW</th>
                <th>NAME ▲</th>
                <th>FIRST NAME</th>
                <th>LAST NAME</th>
                <th>CATEGORY</th>
                <th>PRINT AS</th>
                <th>PRIMARY CONTACT</th>
                <th>PHONE</th>
                <th>EMAIL</th>
                <th>BILLING ADDRESS</th>
                <th>WEB ADDRESS</th>
                <th>COMMENTS</th>
                <th>LOGIN ACCESS</th>
                <th>ACCOUNT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>
                    <span className="action-link">Edit</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <Link href={`/vendors/${v.id}`} className="action-link">View</Link>
                  </td>
                  <td><Link href={`/vendors/${v.id}`} className="link">{v.name}</Link></td>
                  <td className="text-gray-600">{v.firstName || ""}</td>
                  <td className="text-gray-600">{v.lastName || ""}</td>
                  <td className="text-gray-600">{v.category || ""}</td>
                  <td className="text-gray-600">{v.printAs || ""}</td>
                  <td className="text-gray-600"></td>
                  <td className="text-gray-600 whitespace-pre-wrap">{v.phone || ""}</td>
                  <td><span className="link">{v.email || ""}</span></td>
                  <td className="text-gray-600 text-xs">{v.billingAddress || ""}</td>
                  <td><span className="link text-xs">{v.webAddress || ""}</span></td>
                  <td className="text-gray-600">{v.comments || ""}</td>
                  <td className="text-gray-600">{v.loginAccess ? "Yes" : "No"}</td>
                  <td className="link">{v.account || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
