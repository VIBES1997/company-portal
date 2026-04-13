// In-memory mock data — mirrors the NetSuite screenshots

export interface Vendor {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  category?: string;
  printAs?: string;
  phone?: string;
  altPhone?: string;
  fax?: string;
  email?: string;
  billingAddress?: string;
  shippingAddress?: string;
  webAddress?: string;
  comments?: string;
  vendorId?: string;
  type: "COMPANY" | "INDIVIDUAL";
  subsidiary?: string;
  loginAccess?: boolean;
  account?: string;
}

export interface Bill {
  id: string;
  date: string;
  documentNumber?: string;
  transactionNumber?: string;
  vendorName: string;
  account: string;
  status: "Pending Approval" | "Open" | "Paid In Full";
  currency: string;
  amount: number;
  memo?: string;
  dueDate?: string;
  postingPeriod?: string;
  referenceNo?: string;
  subsidiary?: string;
  exchangeRate?: number;
  lineItems?: { description: string; amount: number; account?: string }[];
}

export interface Subsidiary {
  id: string;
  name: string;
  elimination: boolean;
  representingVendor?: string;
  representingCustomer?: string;
  parentSubsidiary?: string;
  currency?: string;
  country?: string;
  language?: string;
}

export interface PaymentTerm {
  id: string;
  terms: string;
  type: "STANDARD" | "DATE_DRIVEN";
  daysTillNetDue?: number;
  discountPct?: number;
  daysTillDiscountExpires?: number;
  installment?: boolean;
  preferred?: boolean;
  inactive?: boolean;
}

export interface Integration {
  id: string;
  name: string;
  applicationId?: string;
  state: "Enabled" | "Disabled";
  createdOn?: string;
  description?: string;
  note?: string;
}

export interface Credential {
  id: string;
  certificateId: string;
  algorithm: string;
  application: string;
  entity: string;
  role: string;
  createdDate: string;
  validFrom: string;
  validUntil: string;
  revoked?: boolean;
}

// ── Vendors ──────────────────────────────────────────────────────────────────
export const vendors: Vendor[] = [
  { id: "v1", name: "Accountant", type: "COMPANY", account: "" },
  { id: "v2", name: "ACME Industries", type: "COMPANY", phone: "(800) 776-1176", email: "purchasing@adirondack.com", billingAddress: "123 Commerce Street, Chicago, IL 60601", webAddress: "http://www.acmeindustries.com" },
  { id: "v3", name: "Adirondack Networking", type: "COMPANY", phone: "(888) 632-1288", email: "purchasing@adirondack.com", billingAddress: "Adirondack Networking 854 West Cherry Hill NJ 08002 United States", webAddress: "http://www.adirondack.com" },
  { id: "v4", name: "Berge Inc", type: "COMPANY", phone: "+44 20 52521 6456" },
  { id: "v5", name: "Brightway Solutions Pvt. Ltd.", type: "COMPANY" },
  { id: "v6", name: "Brocade Communications Systems", type: "COMPANY", phone: "(800) 670-3724", email: "francis.freeze@brocade.com", webAddress: "http://www.brocadecommunicationssystems.com" },
  { id: "v7", name: "Bruen Co", type: "COMPANY", phone: "+46 30 131162" },
  { id: "v8", name: "Cable Plus Distributors", type: "COMPANY", phone: "(650) 797-4555", email: "Kato.Crawford@cableplus.com", billingAddress: "Cable Plus 14th St #26 Oakland CA 94612 United States", webAddress: "http://www.cableplusdistributors.com" },
  { id: "v9", name: "Cables R Us", type: "COMPANY", phone: "(650) 458-4900", email: "griller@cablesrus.com" },
  { id: "v10", name: "CDW", type: "COMPANY", phone: "(358) 238-2023", email: "jeremy.finch@cdwg.com", webAddress: "http://www.cdw.com" },
  { id: "v11", name: "Cloud Consulting", type: "COMPANY", phone: "(475) 713-8712", email: "Tyler.Lamb@MACCZN.com" },
  { id: "v12", name: "CoreSolutions", type: "COMPANY", phone: "947-784-4415", email: "Demetrius.Garcia@netsuite.com" },
];

// ── Bills ─────────────────────────────────────────────────────────────────────
export const bills: Bill[] = [
  { id: "b1", date: "6/10/2025", documentNumber: "815", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 65147, memo: "" },
  { id: "b2", date: "8/10/2025", documentNumber: "811", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 20000, memo: "" },
  { id: "b3", date: "9/10/2025", documentNumber: "812", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 20000, memo: "" },
  { id: "b4", date: "10/10/2025", documentNumber: "813", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 20000, memo: "" },
  { id: "b5", date: "10/10/2025", documentNumber: "814", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 65147, memo: "" },
  { id: "b6", date: "11/10/2025", documentNumber: "817", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 20000, memo: "" },
  { id: "b7", date: "12/10/2025", documentNumber: "818", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 20000, memo: "" },
  { id: "b8", date: "1/10/2026", documentNumber: "INV-2024-1848", transactionNumber: "816", vendorName: "ACME Industries", account: "2000 Accounts Payable", status: "Pending Approval", currency: "US Dollar", amount: 130294, referenceNo: "INV-2024-1848", subsidiary: "US West", dueDate: "2/10/2026", postingPeriod: "Jan 2026", lineItems: [{ description: "Security Deposit", amount: 65147 }, { description: "Rent", amount: 65147 }] },
  { id: "b9", date: "3/13/2026", documentNumber: "820", vendorName: "Adirondack Networking", account: "2000 Accounts Payable", status: "Open", currency: "US Dollar", amount: 500 },
  { id: "b10", date: "2/1/2024", documentNumber: "511", vendorName: "Berge Inc", account: "2000 Accounts Payable", status: "Paid In Full", currency: "British pound", amount: 30265.97 },
  { id: "b11", date: "3/1/2024", documentNumber: "516", vendorName: "Berge Inc", account: "2000 Accounts Payable", status: "Paid In Full", currency: "British pound", amount: 30032.45 },
  { id: "b12", date: "4/1/2024", documentNumber: "521", vendorName: "Berge Inc", account: "2000 Accounts Payable", status: "Paid In Full", currency: "British pound", amount: 31330.22 },
  { id: "b13", date: "5/1/2024", documentNumber: "526", vendorName: "Berge Inc", account: "2000 Accounts Payable", status: "Paid In Full", currency: "British pound", amount: 31362.34 },
];

// ── Subsidiaries ──────────────────────────────────────────────────────────────
export const subsidiaries: Subsidiary[] = [
  { id: "s1", name: "Parent Company", elimination: false, representingVendor: "IC - Parent Company", representingCustomer: "IC - Parent Company" },
  { id: "s2", name: "Germany", elimination: false, representingVendor: "IC - Germany", representingCustomer: "IC - Germany", parentSubsidiary: "Parent Company", currency: "Euro", country: "Germany" },
  { id: "s3", name: "India", elimination: false, representingVendor: "IC - India", representingCustomer: "IC - India", parentSubsidiary: "Parent Company", currency: "Indian Rupee", country: "India" },
  { id: "s4", name: "United Kingdom", elimination: false, representingVendor: "IC - United Kingdom", representingCustomer: "IC - United Kingdom", parentSubsidiary: "Parent Company", currency: "British Pound", country: "United Kingdom" },
  { id: "s5", name: "US East", elimination: false, representingVendor: "IC - US East", representingCustomer: "IC - US East", parentSubsidiary: "Parent Company", currency: "US Dollar", country: "United States" },
  { id: "s6", name: "US West", elimination: false, representingVendor: "IC - US West", representingCustomer: "IC - US West", parentSubsidiary: "Parent Company", currency: "US Dollar", country: "United States" },
  { id: "s7", name: "xElim", elimination: true, parentSubsidiary: "Parent Company" },
];

// ── Payment Terms ─────────────────────────────────────────────────────────────
export const paymentTerms: PaymentTerm[] = [
  { id: "pt1", terms: "Net 30", type: "STANDARD", daysTillNetDue: 30 },
  { id: "pt2", terms: "Net 60", type: "STANDARD", daysTillNetDue: 60 },
  { id: "pt3", terms: "2/10 Net 30", type: "STANDARD", daysTillNetDue: 30, discountPct: 2, daysTillDiscountExpires: 10 },
  { id: "pt4", terms: "Due on Receipt", type: "STANDARD", daysTillNetDue: 0 },
];

// ── Integrations ──────────────────────────────────────────────────────────────
export const integrations: Integration[] = [
  { id: "i1", name: "Default Web Services Integrations", state: "Enabled" },
  { id: "i2", name: "SuiteTalk UI", state: "Enabled", createdOn: "2026-02-02 08:04:04" },
  { id: "i3", name: "SDF Account Warmer", applicationId: "FA0BC0CC-8A2A-4E5E-A12A-EAF18BC81CA8", state: "Enabled", createdOn: "2026-03-20 07:05:31" },
  { id: "i4", name: "SuiteCloud Development Integration", state: "Enabled", createdOn: "2026-03-20 07:06:59" },
  { id: "i5", name: "Claude AI", state: "Enabled", createdOn: "2026-02-15 10:41:00" },
  { id: "i6", name: "AP Automation", applicationId: "EC2003D0-6CB8-4F09-830C-3244C4BDC185", state: "Enabled", createdOn: "2026-03-25 05:04:07", description: "Used to integrate with AP automation app" },
];

// ── M2M Credentials ───────────────────────────────────────────────────────────
export const credentials: Credential[] = [
  { id: "c1", certificateId: "i236CxLpEBrco3o76PJjBr2_g6WZ3LOoiKZjxBbAfj4", algorithm: "RSA", application: "AP Automation", entity: "Company", role: "Developer", createdDate: "2026-03-25", validFrom: "2026-03-25", validUntil: "2028-03-24", revoked: false },
  { id: "c2", certificateId: "H-LRSrdcv8p1TWHVIQOeb4dGNuIo_iF-VQE3zZO4wTI", algorithm: "RSA", application: "AP Automation", entity: "Company", role: "AP Developer", createdDate: "2026-03-30", validFrom: "2026-03-30", validUntil: "2028-03-29", revoked: true },
];
