import Link from "next/link";

const SETUP_SECTIONS = [
  {
    title: "Company",
    items: [
      { label: "Subsidiaries", href: "/subsidiaries" },
      { label: "Payment Terms", href: "/payment-terms/new" },
      { label: "Accounts", href: "/accounts/new" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Integrations", href: "/setup/integrations" },
      { label: "M2M Credentials (OAuth 2.0)", href: "/setup/integrations/credentials" },
    ],
  },
  {
    title: "Vendors",
    items: [
      { label: "Vendors", href: "/vendors" },
      { label: "New Vendor", href: "/vendors/new" },
    ],
  },
  {
    title: "Transactions",
    items: [
      { label: "Vendor Bills", href: "/bills" },
      { label: "New Bill", href: "/bills/new" },
    ],
  },
];

export default function SetupPage() {
  return (
    <div className="m-2">
      <div className="bg-white border border-gray-300 rounded-sm p-4">
        <h1 className="text-2xl font-normal text-gray-800 mb-4">Setup</h1>
        <div className="grid grid-cols-2 gap-6">
          {SETUP_SECTIONS.map(section => (
            <div key={section.title} className="border border-gray-200 rounded">
              <div className="section-header" style={{ marginTop: 0 }}>{section.title}</div>
              <div className="p-3 space-y-2">
                {section.items.map(item => (
                  <div key={item.href}>
                    <Link href={item.href} className="text-blue-600 hover:underline text-sm">{item.label}</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
