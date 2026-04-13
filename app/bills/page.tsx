"use client";
import { useState } from "react";
import Link from "next/link";
import { bills } from "@/lib/data";

export default function BillList() {
  const [search, setSearch] = useState("");

  const filtered = bills.filter(b =>
    b.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    (b.documentNumber || "").includes(search)
  );

  const statusClass = (s: string) => {
    if (s === "Pending Approval") return "status-pending";
    if (s === "Open") return "status-open";
    if (s === "Paid In Full") return "status-paid";
    return "";
  };

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📄</span>
            <h1 className="text-2xl font-normal text-gray-800">Bills</h1>
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
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">VIEW</label>
            <select className="form-select" style={{ width: "130px" }}>
              <option>Vendor Bills</option>
            </select>
          </div>
          <button className="btn-secondary text-xs">Edit View</button>
          <Link href="/bills/new" className="btn-primary text-xs ml-2">New Transaction</Link>
        </div>

        <div className="filter-bar">
          <span className="text-gray-500">⊕</span>
          <span className="font-semibold text-gray-600 text-xs">FILTERS</span>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Search bills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input text-xs"
              style={{ width: "200px" }}
            />
          </div>
          <span className="text-xs text-gray-600 font-semibold ml-2">TOTAL: {filtered.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>EDIT | VIEW</th>
                <th>DATE</th>
                <th>PRINT</th>
                <th>DOCUMENT NUMBER</th>
                <th>TRANSACTION NUMBER</th>
                <th>NAME ▲</th>
                <th>ACCOUNT</th>
                <th>STATUS</th>
                <th>MEMO</th>
                <th>CURRENCY</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td>
                    {b.status === "Pending Approval" && <><span className="action-link">Edit</span><span className="text-gray-400 mx-1">|</span></>}
                    <Link href={`/bills/${b.id}`} className="action-link">View</Link>
                  </td>
                  <td className="text-gray-700">{b.date}</td>
                  <td><span className="link">Print</span></td>
                  <td className="text-gray-700">{b.documentNumber || ""}</td>
                  <td className="text-gray-700">{b.transactionNumber || ""}</td>
                  <td><Link href="#" className="link">{b.vendorName}</Link></td>
                  <td><span className="link text-xs">{b.account}</span></td>
                  <td><span className={`status-badge ${statusClass(b.status)}`}>{b.status}</span></td>
                  <td className="text-gray-600">{b.memo || ""}</td>
                  <td className="text-gray-700">{b.currency}</td>
                  <td className="text-right font-medium">{b.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
