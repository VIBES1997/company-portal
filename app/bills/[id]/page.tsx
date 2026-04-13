"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { bills } from "@/lib/data";

export default function BillDetail() {
  const router = useRouter();
  const params = useParams();
  const bill = bills.find(b => b.id === params.id) || bills[7]; // default to INV-2024-1848
  const [activeTab, setActiveTab] = useState("Items and Expenses");

  const tabs = ["Items and Expenses", "Billing", "Relationships", "Communication", "Related Records", "System Information", "EET", "GL Impact"];

  return (
    <div className="m-2 flex gap-2">
      {/* Left: invoice preview */}
      <div className="w-80 shrink-0 bg-white border border-gray-300 rounded-sm p-4">
        <div className="mb-4">
          <div className="text-xl font-bold text-gray-800 mb-1">ACME Industries</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            123 Commerce Street, Chicago, IL 60601<br />
            Phone: (312) 555-0100 | Email: billing@acmeindustries.com
          </div>
        </div>

        <div className="border-t pt-3 mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1">BILL TO</div>
          <div className="text-xs text-gray-600 leading-relaxed">
            Oracle Company<br />
            2955 Campus Drive, Suite 100<br />
            Austin, TX 78758<br />
            Phone: (512) 555-0200 | Email: ap@company.com
          </div>
        </div>

        <div className="text-sm font-semibold mb-2">Invoice Number:<br />{bill.referenceNo || bill.documentNumber}</div>
        <div className="text-xs text-gray-600 mb-1">Invoice Date:</div>
        <div className="text-sm mb-2">{bill.date}</div>
        <div className="text-xs text-gray-600 mb-1">Due Date:</div>
        <div className="text-sm mb-3">{bill.dueDate || "—"}</div>

        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-2 text-left text-xs">Description</th>
              <th className="p-2 text-right text-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(bill.lineItems || []).map((li, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="p-2 text-xs">{li.description}</td>
                <td className="p-2 text-right text-xs">${li.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 pt-2 border-t font-bold text-sm">
          TOTAL DUE: ${bill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-gray-500 mt-1">Payment Terms: Net 30 days</div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 bg-white border border-gray-300 rounded-sm">
        {/* Section: Primary Information */}
        <div className="section-header" style={{ marginTop: 0 }}>▼ Primary Information</div>
        <div className="grid grid-cols-4 gap-4 p-4">
          <div>
            <div className="detail-label">VENDOR BILL #</div>
            <div className="detail-value">{bill.documentNumber}</div>
          </div>
          <div>
            <div className="detail-label">VENDOR</div>
            <div className="detail-link">{bill.vendorName}</div>
          </div>
          <div>
            <div className="detail-label">CURRENCY</div>
            <div className="detail-value">{bill.currency}</div>
          </div>
          <div>
            <div className="detail-label">MEMO</div>
            <div className="detail-value">{bill.memo || "—"}</div>
          </div>
          <div>
            <div className="detail-label">DATE</div>
            <div className="detail-value">{bill.date}</div>
          </div>
          <div>
            <div className="detail-label">SUBSIDIARY</div>
            <div className="detail-value">{bill.subsidiary || "US West"}</div>
          </div>
          <div>
            <div className="detail-label">EXCHANGE RATE</div>
            <div className="detail-value">{bill.exchangeRate || "1.00"}</div>
          </div>
          <div>
            <div className="detail-label">APPROVAL STATUS</div>
            <div className="detail-value">
              <span className="status-badge status-pending">{bill.status}</span>
            </div>
          </div>
          <div>
            <div className="detail-label">POSTING PERIOD</div>
            <div className="detail-value">{bill.postingPeriod || "Jan 2026"}</div>
          </div>
          <div>
            <div className="detail-label">REFERENCE NO.</div>
            <div className="detail-value">{bill.referenceNo || "—"}</div>
          </div>
          <div>
            <div className="detail-label">ACCOUNT</div>
            <div className="detail-link">{bill.account}</div>
          </div>
          <div>
            <div className="detail-label">NEXT APPROVER</div>
            <div className="detail-value">Larry Nelson</div>
          </div>
          <div>
            <div className="detail-label">DUE DATE</div>
            <div className="detail-value">{bill.dueDate || "—"}</div>
          </div>
          <div>
            <div className="detail-label">AMOUNT</div>
            <div className="detail-value font-semibold">{bill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Section: Approval Information */}
        <div className="section-header">▼ Approval Information</div>
        <div className="p-4">
          <div className="detail-label">REJECT REASON</div>
          <div className="detail-value">—</div>
        </div>

        {/* Tabs */}
        <div className="tab-bar mt-2">
          {tabs.map(t => (
            <div key={t} className={`tab-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>

        {activeTab === "Items and Expenses" && (
          <div className="p-3">
            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="font-semibold text-blue-700">Items 0.00</span>
              <span className="font-semibold text-blue-700">Expense {bill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ▼</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th>ACCOUNT</th>
                  <th>AMOUNT</th>
                  <th>CUSTOMER/PROJECT</th>
                  <th>PROJECT TASK</th>
                  <th>ACTIVITY CODE</th>
                  <th>BILLABLE</th>
                  <th>DEPARTMENT</th>
                  <th>CLASS</th>
                  <th>LOCATION</th>
                </tr>
              </thead>
              <tbody>
                {(bill.lineItems || []).map((li, i) => (
                  <tr key={i}>
                    <td></td>
                    <td><span className="link text-xs">6610 Expenses : G&A Expenses : Facilities Related Expenses : Rent Expense</span></td>
                    <td className="text-right">{li.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom actions */}
        <div className="toolbar border-t border-gray-200 mt-4">
          <button className="btn-primary text-xs" onClick={() => router.push(`/bills/${bill.id}/edit`)}>Edit</button>
          <button className="btn-secondary text-xs" onClick={() => router.back()}>Back</button>
          <button className="btn-secondary text-xs">Cancel Bill</button>
          <button className="btn-secondary text-xs">Hide Document</button>
          <button className="btn-secondary text-xs">Download File</button>
          <button className="btn-secondary text-xs">Bill Exception</button>
          <button className="btn-secondary text-xs">🖨</button>
          <button className="btn-secondary text-xs">Actions ▾</button>
        </div>
      </div>
    </div>
  );
}
