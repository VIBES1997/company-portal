"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Bill {
  id: string; date: string; document_number?: string; transaction_number?: string;
  vendor_name: string; account: string; status: string; currency: string;
  amount: number; memo?: string; due_date?: string; posting_period?: string;
  reference_no?: string; subsidiary?: string; exchange_rate?: number;
  line_items?: { description?: string; account?: string; amount: number; memo?: string }[];
}

export default function BillDetail() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [activeTab, setActiveTab] = useState("Items and Expenses");
  const tabs = ["Items and Expenses", "Billing", "Relationships", "Communication", "Related Records", "System Information", "GL Impact"];

  useEffect(() => {
    supabase.from("bills").select("*").eq("id", params.id).single().then(({ data }) => {
      setBill(data);
    });
  }, [params.id]);

  if (!bill) return <div className="m-4 text-gray-400">Loading...</div>;

  const lineItems = bill.line_items || [];

  return (
    <div className="m-2 flex gap-2">
      {/* Left: invoice preview */}
      <div className="w-80 shrink-0 bg-white border border-gray-300 rounded-sm p-4">
        <div className="mb-4">
          <div className="text-xl font-bold text-gray-800 mb-1">{bill.vendor_name}</div>
        </div>
        <div className="border-t pt-3 mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1">BILL TO</div>
          <div className="text-xs text-gray-600 leading-relaxed">
            AceSuite Corp<br />
            2955 Campus Drive, Suite 100<br />
            Austin, TX 78758
          </div>
        </div>
        <div className="text-sm font-semibold mb-1">Invoice: {bill.reference_no || bill.document_number || "—"}</div>
        <div className="text-xs text-gray-500 mb-1">Invoice Date: <span className="text-gray-800">{bill.date}</span></div>
        <div className="text-xs text-gray-500 mb-3">Due Date: <span className="text-gray-800">{bill.due_date || "—"}</span></div>

        {lineItems.length > 0 && (
          <table className="w-full text-sm border border-gray-200 mb-3">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-2 text-left text-xs">Description</th>
                <th className="p-2 text-right text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="p-2 text-xs">{li.description || li.account || li.memo || `Item ${i+1}`}</td>
                  <td className="p-2 text-right text-xs">${Number(li.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-2 pt-2 border-t font-bold text-sm">
          TOTAL DUE: ${Number(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-gray-500 mt-1">Payment Terms: Net 30 days</div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 bg-white border border-gray-300 rounded-sm">
        <div className="section-header" style={{ marginTop: 0 }}>▼ Primary Information</div>
        <div className="grid grid-cols-4 gap-4 p-4">
          <div><div className="detail-label">VENDOR BILL #</div><div className="detail-value">{bill.document_number || "—"}</div></div>
          <div><div className="detail-label">VENDOR</div><div className="detail-link">{bill.vendor_name}</div></div>
          <div><div className="detail-label">CURRENCY</div><div className="detail-value">{bill.currency}</div></div>
          <div><div className="detail-label">MEMO</div><div className="detail-value">{bill.memo || "—"}</div></div>
          <div><div className="detail-label">DATE</div><div className="detail-value">{bill.date}</div></div>
          <div><div className="detail-label">SUBSIDIARY</div><div className="detail-value">{bill.subsidiary || "—"}</div></div>
          <div><div className="detail-label">EXCHANGE RATE</div><div className="detail-value">{bill.exchange_rate || "1.00"}</div></div>
          <div><div className="detail-label">APPROVAL STATUS</div><div className="detail-value"><span className={`status-badge ${bill.status === "Pending Approval" ? "status-pending" : bill.status === "Open" ? "status-open" : "status-paid"}`}>{bill.status}</span></div></div>
          <div><div className="detail-label">POSTING PERIOD</div><div className="detail-value">{bill.posting_period || "—"}</div></div>
          <div><div className="detail-label">REFERENCE NO.</div><div className="detail-value">{bill.reference_no || "—"}</div></div>
          <div><div className="detail-label">ACCOUNT</div><div className="detail-link">{bill.account}</div></div>
          <div><div className="detail-label">DUE DATE</div><div className="detail-value">{bill.due_date || "—"}</div></div>
          <div><div className="detail-label">AMOUNT</div><div className="detail-value font-semibold">{Number(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>
        </div>

        <div className="section-header">▼ Approval Information</div>
        <div className="p-4"><div className="detail-label">REJECT REASON</div><div className="detail-value">—</div></div>

        <div className="tab-bar mt-2">
          {tabs.map(t => <div key={t} className={`tab-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</div>)}
        </div>

        {activeTab === "Items and Expenses" && (
          <div className="p-3">
            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="font-semibold text-blue-700">Items 0.00</span>
              <span className="font-semibold text-blue-700">Expense {Number(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ▼</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>CATEGORY</th><th>ACCOUNT</th><th>AMOUNT</th><th>MEMO</th><th>DEPARTMENT</th><th>CLASS</th></tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((li, i) => (
                  <tr key={i}>
                    <td></td>
                    <td><span className="link text-xs">{li.account || "—"}</span></td>
                    <td className="text-right">{Number(li.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="text-gray-600">{li.memo || ""}</td>
                    <td></td><td></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-4">No line items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="toolbar border-t border-gray-200 mt-4">
          <Link href={`/bills/${bill.id}/edit`} className="btn-primary text-xs">Edit</Link>
          <button className="btn-secondary text-xs" onClick={() => router.back()}>Back</button>
          <button className="btn-secondary text-xs">Cancel Bill</button>
          <button className="btn-secondary text-xs">Download File</button>
          <button className="btn-secondary text-xs">Actions ▾</button>
        </div>
      </div>
    </div>
  );
}
