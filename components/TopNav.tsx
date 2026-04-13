"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Activities", href: "/activities" },
  { label: "Payments", href: "/payments" },
  { label: "Transactions", href: "/bills" },
  { label: "Lists", href: "/vendors" },
  { label: "Reports", href: "/reports" },
  { label: "Analytics", href: "/analytics" },
  { label: "Documents", href: "/documents" },
  { label: "Setup", href: "/setup" },
  { label: "Fixed Assets", href: "/fixed-assets" },
  { label: "Administration", href: "/admin" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [searchVal, setSearchVal] = useState("");

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-50">
      {/* Top bar */}
      <div style={{ background: "#1c2f5e" }} className="flex items-center justify-between px-3 py-1.5 gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#e8a020" }}>
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">Company</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search"
              className="w-full text-sm px-3 py-1 pr-8 rounded border-0"
              style={{ background: "white", fontSize: "12px" }}
            />
            <svg className="absolute right-2 top-1.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 text-xs text-blue-200 shrink-0">
          <button className="hover:text-white flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="hover:text-white">Help</button>
          <button className="hover:text-white">Feedback</button>
          <div className="flex items-center gap-1.5 text-white">
            <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-xs font-bold">A</div>
            <div className="text-right leading-tight">
              <div className="font-semibold text-xs">Company</div>
              <div className="text-blue-300" style={{ fontSize: "10px" }}>Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{ background: "#243860" }} className="flex items-center overflow-x-auto">
        {/* Quick icons */}
        <div className="flex items-center px-2 gap-1 shrink-0 border-r border-blue-700 pr-3 mr-1">
          <button className="text-blue-300 hover:text-white p-1 rounded hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button className="text-blue-300 hover:text-white p-1 rounded hover:bg-blue-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          <Link href="/" className="text-blue-300 hover:text-white p-1 rounded hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>

        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="text-blue-200 hover:text-white text-xs font-medium px-3 py-2.5 whitespace-nowrap transition-colors"
            style={{
              background: isActive(item.href) ? "#1c2f5e" : "transparent",
              color: isActive(item.href) ? "white" : undefined,
              borderBottom: isActive(item.href) ? "2px solid #4a90d9" : "2px solid transparent",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
