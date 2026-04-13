"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { integrations } from "@/lib/data";

export default function IntegrationDetail() {
  const params = useParams();
  const router = useRouter();
  const integ = integrations.find(i => i.id === params.id) || integrations[5];
  const [activeTab, setActiveTab] = useState("Authentication");

  const tabs = ["Authentication", "Execution Log", "System Notes"];

  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-normal text-gray-800">Integration</h1>
          <div className="text-xs">
            <Link href="/setup/integrations" className="text-blue-600 hover:underline">List</Link>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn-primary text-xs">Edit</button>
          <button className="btn-secondary text-xs" onClick={() => router.back()}>Back</button>
          <button className="btn-secondary text-xs">🖨 Actions ▾</button>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-200">
          <div>
            <div className="detail-label">APPLICATION ID</div>
            <div className="detail-value font-mono text-xs">{integ.applicationId || "—"}</div>
          </div>
          <div>
            <div className="detail-label">STATE</div>
            <div><span className="status-badge status-enabled">{integ.state}</span></div>
          </div>
          <div>
            <div className="detail-label">CREATED</div>
            <div className="detail-value">{integ.createdOn || "—"}</div>
          </div>
          <div>
            <div className="detail-label">NAME</div>
            <div className="detail-value">{integ.name}</div>
          </div>
          <div>
            <div className="detail-label">NOTE</div>
            <div className="detail-value">—</div>
          </div>
          <div>
            <div className="detail-label">CREATED BY</div>
            <div className="detail-value">Company</div>
          </div>
          <div>
            <div className="detail-label">DESCRIPTION</div>
            <div className="detail-value">{integ.description || "—"}</div>
          </div>
          <div>
            <div className="detail-label">CONCURRENCY LIMIT</div>
            <div className="detail-value">—</div>
          </div>
          <div>
            <div className="detail-label">LAST STATE CHANGE</div>
            <div className="detail-value">2026-03-25 00:00:00.0</div>
          </div>
          <div>
            <div className="detail-label">MAX CONCURRENCY LIMIT</div>
            <div className="detail-value">4</div>
          </div>
          <div>
            <div className="detail-label">LAST STATE CHANGED BY</div>
            <div className="detail-value">Company</div>
          </div>
          <div>
            <div className="detail-label">SCRIPT ID</div>
            <div className="detail-value text-xs font-mono">custinteg_3eoqa4ea39f</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {tabs.map(t => (
            <div key={t} className={`tab-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>

        {activeTab === "Authentication" && (
          <div className="p-4 space-y-4">
            {/* Token-based */}
            <div>
              <div className="section-header" style={{ marginTop: 0 }}>▼ Token-Based Authentication</div>
              <div className="p-3 border border-gray-200 border-t-0 grid grid-cols-2 gap-4">
                <div>
                  <div className="detail-label">TOKEN-BASED AUTHENTICATION</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">TBA: ISSUETOKEN ENDPOINT</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">TBA: AUTHORIZATION FLOW</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">CALLBACK URL</div>
                  <div className="detail-value">—</div>
                </div>
              </div>
            </div>

            {/* OAuth 2.0 */}
            <div>
              <div className="section-header">▼ OAuth 2.0</div>
              <div className="p-3 border border-gray-200 border-t-0 grid grid-cols-3 gap-4">
                <div>
                  <div className="detail-label">AUTHORIZATION CODE GRANT</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">SCOPE</div>
                  <div className="text-xs space-y-0.5 mt-1">
                    <div className="flex items-center gap-1"><input type="checkbox" checked readOnly /><span>RESTLETS</span></div>
                    <div className="flex items-center gap-1"><input type="checkbox" checked readOnly /><span>REST WEB SERVICES</span></div>
                    <div className="flex items-center gap-1"><input type="checkbox" /><span>SUITEANALYTICS CONNECT</span></div>
                    <div className="flex items-center gap-1"><input type="checkbox" /><span>CONNECTOR SERVICE</span></div>
                  </div>
                </div>
                <div>
                  <div className="detail-label">APPLICATION LOGO</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">PUBLIC CLIENT</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">APPLICATION TERMS OF USE</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">REDIRECT URI</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">APPLICATION PRIVACY POLICY</div>
                  <div className="detail-value">—</div>
                </div>
                <div>
                  <div className="detail-label">REFRESH TOKEN VALIDITY (IN HOURS)</div>
                  <div className="detail-value">168</div>
                </div>
                <div>
                  <div className="detail-label">OAUTH 2.0 CONSENT POLICY</div>
                  <div className="detail-value">Always Ask</div>
                </div>
                <div>
                  <div className="detail-label">MAXIMUM TIME FOR TOKEN ROTATION (IN HOURS)</div>
                  <div className="detail-value">NA</div>
                </div>
                <div>
                  <div className="detail-label">DYNAMIC CLIENT REGISTRATION CLIENT NAME</div>
                  <div className="detail-value">—</div>
                </div>
                <div className="col-span-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <input type="checkbox" checked readOnly />
                    CLIENT CREDENTIALS (MACHINE TO MACHINE) GRANT
                  </label>
                </div>
              </div>
            </div>

            {/* User Credentials */}
            <div>
              <div className="section-header">▼ User Credentials</div>
              <div className="p-3 border border-gray-200 border-t-0">
                <div className="detail-label">USER CREDENTIALS</div>
                <div className="detail-value">—</div>
              </div>
            </div>

            {/* Client Credentials */}
            <div>
              <div className="section-header">▼ Client Credentials</div>
              <div className="p-3 border border-gray-200 border-t-0 text-xs text-gray-600">
                Important: For security reasons, the values for Client Credentials are only displayed on the initial setup page. They cannot be retrieved from the system. If you did not retain this information, you will need to reset credentials to obtain new values. Click Edit to reset the credentials.
              </div>
            </div>
          </div>
        )}

        <div className="toolbar border-t border-gray-200 mt-2">
          <button className="btn-primary text-xs">Edit</button>
          <button className="btn-secondary text-xs" onClick={() => router.back()}>Back</button>
          <button className="btn-secondary text-xs">🖨 Actions ▾</button>
        </div>
      </div>
    </div>
  );
}
