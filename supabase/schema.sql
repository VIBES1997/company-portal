-- ── Vendors ──────────────────────────────────────────────────
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  first_name text,
  last_name text,
  category text,
  print_as text,
  phone text,
  alt_phone text,
  fax text,
  email text,
  billing_address text,
  shipping_address text,
  web_address text,
  comments text,
  vendor_id text,
  type text default 'COMPANY',
  subsidiary text,
  login_access boolean default false,
  account text,
  created_at timestamptz default now()
);

-- ── Bills ─────────────────────────────────────────────────────
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  document_number text,
  transaction_number text,
  vendor_name text not null,
  account text,
  status text default 'Pending Approval',
  currency text default 'US Dollar',
  amount numeric(12,2) default 0,
  memo text,
  due_date text,
  posting_period text,
  reference_no text,
  subsidiary text,
  exchange_rate numeric(10,4) default 1,
  line_items jsonb default '[]',
  erp_reference text,
  created_at timestamptz default now()
);

-- ── Subsidiaries ──────────────────────────────────────────────
create table if not exists subsidiaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  elimination boolean default false,
  representing_vendor text,
  representing_customer text,
  parent_subsidiary text,
  currency text,
  country text,
  language text,
  created_at timestamptz default now()
);

-- ── Payment Terms ─────────────────────────────────────────────
create table if not exists payment_terms (
  id uuid primary key default gen_random_uuid(),
  terms text not null,
  type text default 'STANDARD',
  days_till_net_due integer,
  discount_pct numeric(5,2),
  days_till_discount_expires integer,
  installment boolean default false,
  preferred boolean default false,
  inactive boolean default false,
  created_at timestamptz default now()
);

-- ── Integrations ──────────────────────────────────────────────
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  application_id text,
  state text default 'Enabled',
  description text,
  note text,
  created_on timestamptz default now()
);

-- ── M2M Credentials ───────────────────────────────────────────
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null,
  algorithm text default 'RSA',
  application text,
  entity text,
  role text,
  created_date date default current_date,
  valid_from date,
  valid_until date,
  revoked boolean default false,
  created_at timestamptz default now()
);

-- ── Accounts ──────────────────────────────────────────────────
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  number text,
  name text not null,
  subaccount_of text,
  type text,
  currency text,
  general_rate_type text,
  cash_flow_rate_type text,
  description text,
  bank_name text,
  bank_routing_number text,
  bank_account_number text,
  subsidiaries text[],
  inactive boolean default false,
  created_at timestamptz default now()
);

-- ── Enable Row Level Security (allow all for now — lock down later) ──
alter table vendors enable row level security;
alter table bills enable row level security;
alter table subsidiaries enable row level security;
alter table payment_terms enable row level security;
alter table integrations enable row level security;
alter table credentials enable row level security;
alter table accounts enable row level security;

create policy "Allow all" on vendors for all using (true) with check (true);
create policy "Allow all" on bills for all using (true) with check (true);
create policy "Allow all" on subsidiaries for all using (true) with check (true);
create policy "Allow all" on payment_terms for all using (true) with check (true);
create policy "Allow all" on integrations for all using (true) with check (true);
create policy "Allow all" on credentials for all using (true) with check (true);
create policy "Allow all" on accounts for all using (true) with check (true);

-- ── Seed data ─────────────────────────────────────────────────
insert into vendors (name, type, phone, email, billing_address, web_address) values
  ('ACME Industries', 'COMPANY', '(800) 776-1176', 'purchasing@acmeindustries.com', '123 Commerce Street, Chicago, IL 60601', 'http://www.acmeindustries.com'),
  ('Adirondack Networking', 'COMPANY', '(888) 632-1288', 'purchasing@adirondack.com', 'Adirondack Networking 854 West Cherry Hill NJ 08002', 'http://www.adirondack.com'),
  ('Berge Inc', 'COMPANY', '+44 20 52521 6456', null, null, null),
  ('Brightway Solutions Pvt. Ltd.', 'COMPANY', null, null, null, null),
  ('Brocade Communications Systems', 'COMPANY', '(800) 670-3724', 'francis.freeze@brocade.com', null, 'http://www.brocadecommunicationssystems.com'),
  ('Cable Plus Distributors', 'COMPANY', '(650) 797-4555', 'Kato.Crawford@cableplus.com', 'Cable Plus 14th St #26 Oakland CA 94612', 'http://www.cableplusdistributors.com'),
  ('CDW', 'COMPANY', '(358) 238-2023', 'jeremy.finch@cdwg.com', null, 'http://www.cdw.com'),
  ('Cloud Consulting', 'COMPANY', '(475) 713-8712', 'Tyler.Lamb@cloud.com', null, null),
  ('CoreSolutions', 'COMPANY', '947-784-4415', 'Demetrius.Garcia@coresolutions.com', null, null)
on conflict do nothing;

insert into subsidiaries (name, elimination, representing_vendor, representing_customer, parent_subsidiary, currency, country) values
  ('Parent Company', false, 'IC - Parent Company', 'IC - Parent Company', null, 'US Dollar', 'United States'),
  ('Germany', false, 'IC - Germany', 'IC - Germany', 'Parent Company', 'Euro', 'Germany'),
  ('India', false, 'IC - India', 'IC - India', 'Parent Company', 'Indian Rupee', 'India'),
  ('United Kingdom', false, 'IC - United Kingdom', 'IC - United Kingdom', 'Parent Company', 'British Pound', 'United Kingdom'),
  ('US East', false, 'IC - US East', 'IC - US East', 'Parent Company', 'US Dollar', 'United States'),
  ('US West', false, 'IC - US West', 'IC - US West', 'Parent Company', 'US Dollar', 'United States'),
  ('xElim', true, null, null, 'Parent Company', null, null)
on conflict do nothing;

insert into bills (date, document_number, vendor_name, account, status, currency, amount, due_date, posting_period, reference_no, subsidiary, line_items) values
  ('6/10/2025', '815', 'ACME Industries', '2000 Accounts Payable', 'Pending Approval', 'US Dollar', 65147.00, null, null, null, null, '[]'),
  ('8/10/2025', '811', 'ACME Industries', '2000 Accounts Payable', 'Pending Approval', 'US Dollar', 20000.00, null, null, null, null, '[]'),
  ('1/10/2026', '816', 'ACME Industries', '2000 Accounts Payable', 'Pending Approval', 'US Dollar', 130294.00, '2/10/2026', 'Jan 2026', 'INV-2024-1848', 'US West', '[{"description":"Security Deposit","amount":65147},{"description":"Rent","amount":65147}]'),
  ('3/13/2026', '820', 'Adirondack Networking', '2000 Accounts Payable', 'Open', 'US Dollar', 500.00, null, null, null, null, '[]'),
  ('2/1/2024', '511', 'Berge Inc', '2000 Accounts Payable', 'Paid In Full', 'British pound', 30265.97, null, null, null, null, '[]'),
  ('4/1/2024', '521', 'Berge Inc', '2000 Accounts Payable', 'Paid In Full', 'British pound', 31330.22, null, null, null, null, '[]')
on conflict do nothing;

insert into integrations (name, application_id, state, description) values
  ('Default Web Services Integrations', null, 'Enabled', null),
  ('SuiteTalk UI', null, 'Enabled', null),
  ('Claude AI', null, 'Enabled', null),
  ('AP Automation', 'EC2003D0-6CB8-4F09-830C-3244C4BDC185', 'Enabled', 'Used to integrate with AP automation app')
on conflict do nothing;

insert into payment_terms (terms, type, days_till_net_due, discount_pct, days_till_discount_expires) values
  ('Net 30', 'STANDARD', 30, null, null),
  ('Net 60', 'STANDARD', 60, null, null),
  ('2/10 Net 30', 'STANDARD', 30, 2.00, 10),
  ('Due on Receipt', 'STANDARD', 0, null, null)
on conflict do nothing;
