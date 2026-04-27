# Client API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose a versioned REST API (`/api/v1/`) from the company portal so any client (AP automation, ERP connectors) can programmatically read and write vendors, bills, subsidiaries, accounts, and payment terms using Bearer token authentication.

**Architecture:** Next.js 16 App Router route handlers handle all endpoints. A shared `verifyApiKey` helper validates `Authorization: Bearer <certificate_id>` against the Supabase `credentials` table (non-revoked, within valid dates). A server-only Supabase client factory is used in all route handlers. Bills support status transitions (approve, cancel, post-to-ERP) as discrete action endpoints so callers never need to know valid state progressions.

**Tech Stack:** Next.js 16 App Router, `@supabase/supabase-js` v2, TypeScript

---

## File Structure

**Create:**
- `lib/supabase-server.ts` — server-only Supabase client factory
- `lib/api-auth.ts` — `verifyApiKey(request)`: returns credential row or throws `ApiAuthError`
- `app/api/v1/vendors/route.ts` — GET list, POST create
- `app/api/v1/vendors/[id]/route.ts` — GET one, PATCH update
- `app/api/v1/bills/route.ts` — GET list, POST create
- `app/api/v1/bills/[id]/route.ts` — GET one, PATCH update
- `app/api/v1/bills/[id]/approve/route.ts` — POST approve (`Pending Approval` → `Open`)
- `app/api/v1/bills/[id]/cancel/route.ts` — POST cancel (any non-terminal status → `Cancelled`)
- `app/api/v1/bills/[id]/post/route.ts` — POST post to ERP (→ `Paid In Full` + `erp_reference`)
- `app/api/v1/subsidiaries/route.ts` — GET list
- `app/api/v1/accounts/route.ts` — GET list (filterable by `type`)
- `app/api/v1/payment-terms/route.ts` — GET list (active only)

**Modify:**
- `supabase/schema.sql` — add `erp_reference text` column to bills table

---

### Task 1: Server Supabase Client + API Auth Helper

**Files:**
- Create: `lib/supabase-server.ts`
- Create: `lib/api-auth.ts`

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: `▲ Next.js 16.x.x` ready on `http://localhost:3000`

- [ ] **Step 2: Write `lib/supabase-server.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Write `lib/api-auth.ts`**

```typescript
import { NextRequest } from "next/server";
import { createServerClient } from "./supabase-server";

export interface Credential {
  id: string;
  certificate_id: string;
  application: string | null;
  entity: string | null;
  role: string | null;
}

export class ApiAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function verifyApiKey(request: NextRequest): Promise<Credential> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new ApiAuthError("Missing or invalid Authorization header", 401);
  }
  const token = auth.slice(7).trim();
  const today = new Date().toISOString().slice(0, 10);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("id, certificate_id, application, entity, role")
    .eq("certificate_id", token)
    .eq("revoked", false)
    .lte("valid_from", today)
    .gte("valid_until", today)
    .single();
  if (error || !data) {
    throw new ApiAuthError("Invalid or expired API key", 401);
  }
  return data as Credential;
}
```

- [ ] **Step 4: Verify vendor route does not exist yet**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/vendors
```

Expected: `404`

- [ ] **Step 5: Commit**

```bash
git add lib/supabase-server.ts lib/api-auth.ts
git commit -m "feat: add server Supabase client and API key auth helper"
```

---

### Task 2: Vendors API

**Files:**
- Create: `app/api/v1/vendors/route.ts`
- Create: `app/api/v1/vendors/[id]/route.ts`

- [ ] **Step 1: Create `app/api/v1/vendors/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const supabase = createServerClient();
  let query = supabase
    .from("vendors")
    .select("*", { count: "exact" })
    .order("name")
    .range(offset, offset + limit - 1);
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 422 });
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({ ...body, type: body.type ?? "COMPANY" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/v1/vendors/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from("vendors").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const body = await request.json();
  delete body.id;
  delete body.created_at;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Vendor not found or update failed" }, { status: 404 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 3: Test 401 without auth header**

```bash
curl -s -w "\n%{http_code}" http://localhost:3000/api/v1/vendors
```

Expected: `{"error":"Missing or invalid Authorization header"}` with status `401`

- [ ] **Step 4: Test list with valid API key**

Replace `<CERT_ID>` with a non-revoked `certificate_id` value from your Supabase `credentials` table.

```bash
curl -s -H "Authorization: Bearer <CERT_ID>" \
  http://localhost:3000/api/v1/vendors | jq '{total: .total, first: .data[0].name}'
```

Expected: `{"total": <integer>, "first": "<vendor name>"}`

- [ ] **Step 5: Test POST create vendor**

```bash
curl -s -X POST http://localhost:3000/api/v1/vendors \
  -H "Authorization: Bearer <CERT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test Vendor","type":"COMPANY","email":"api@test.com"}' | jq '.data.id'
```

Expected: a UUID string

- [ ] **Step 6: Commit**

```bash
git add app/api/v1/vendors/
git commit -m "feat: add vendors REST API (list, detail, create, update)"
```

---

### Task 3: Bills API — List, Detail, Create, Update

**Files:**
- Modify: `supabase/schema.sql`
- Create: `app/api/v1/bills/route.ts`
- Create: `app/api/v1/bills/[id]/route.ts`

- [ ] **Step 1: Add `erp_reference` column to Supabase**

Run in the Supabase SQL editor:
```sql
alter table bills add column if not exists erp_reference text;
```

Then update `supabase/schema.sql` — in the `bills` table definition, add this line after `line_items jsonb default '[]',`:
```sql
  erp_reference text,
```

- [ ] **Step 2: Create `app/api/v1/bills/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const vendor = searchParams.get("vendor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const supabase = createServerClient();
  let query = supabase
    .from("bills")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  if (vendor) query = query.ilike("vendor_name", `%${vendor}%`);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const body = await request.json();
  if (!body.vendor_name || !body.date) {
    return NextResponse.json({ error: "vendor_name and date are required" }, { status: 422 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bills")
    .insert({
      ...body,
      status: body.status ?? "Pending Approval",
      currency: body.currency ?? "US Dollar",
      amount: body.amount ?? 0,
      line_items: body.line_items ?? [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
```

- [ ] **Step 3: Create `app/api/v1/bills/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from("bills").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const body = await request.json();
  delete body.id;
  delete body.created_at;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bills")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Bill not found or update failed" }, { status: 404 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 4: Test bills list with status filter**

```bash
curl -s -H "Authorization: Bearer <CERT_ID>" \
  "http://localhost:3000/api/v1/bills?status=Pending+Approval" | jq '.total'
```

Expected: integer ≥ 0

- [ ] **Step 5: Test POST create bill and capture the new ID**

```bash
curl -s -X POST http://localhost:3000/api/v1/bills \
  -H "Authorization: Bearer <CERT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"API Test Vendor","date":"4/23/2026","amount":5000,"currency":"US Dollar"}' | jq -r '.data.id'
```

Expected: a UUID string — save this as `<BILL_ID>` for Task 4.

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql app/api/v1/bills/route.ts "app/api/v1/bills/[id]/route.ts"
git commit -m "feat: add bills REST API (list, detail, create, update) + erp_reference column"
```

---

### Task 4: Bills Status Transitions

**Files:**
- Create: `app/api/v1/bills/[id]/approve/route.ts`
- Create: `app/api/v1/bills/[id]/cancel/route.ts`
- Create: `app/api/v1/bills/[id]/post/route.ts`

- [ ] **Step 1: Verify approve endpoint is 404 before implementation**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer <CERT_ID>" \
  "http://localhost:3000/api/v1/bills/<BILL_ID>/approve"
```

Expected: `404`

- [ ] **Step 2: Create `app/api/v1/bills/[id]/approve/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data: bill } = await supabase
    .from("bills")
    .select("status")
    .eq("id", id)
    .single();
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (bill.status !== "Pending Approval") {
    return NextResponse.json(
      { error: `Cannot approve bill with status "${bill.status}"` },
      { status: 422 }
    );
  }
  const { data, error } = await supabase
    .from("bills")
    .update({ status: "Open" })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 3: Create `app/api/v1/bills/[id]/cancel/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data: bill } = await supabase
    .from("bills")
    .select("status")
    .eq("id", id)
    .single();
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (bill.status === "Cancelled") {
    return NextResponse.json({ error: "Bill is already cancelled" }, { status: 422 });
  }
  if (bill.status === "Paid In Full") {
    return NextResponse.json({ error: "Cannot cancel a paid bill" }, { status: 422 });
  }
  const { data, error } = await supabase
    .from("bills")
    .update({ status: "Cancelled" })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 4: Create `app/api/v1/bills/[id]/post/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const erp_reference: string | undefined = body.erp_reference;
  const supabase = createServerClient();
  const { data: bill } = await supabase
    .from("bills")
    .select("status")
    .eq("id", id)
    .single();
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (bill.status === "Cancelled") {
    return NextResponse.json({ error: "Cannot post a cancelled bill" }, { status: 422 });
  }
  if (bill.status === "Paid In Full") {
    return NextResponse.json({ error: "Bill is already posted" }, { status: 422 });
  }
  const { data, error } = await supabase
    .from("bills")
    .update({ status: "Paid In Full", erp_reference: erp_reference ?? null })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 5: Test approve transition**

```bash
curl -s -X POST \
  -H "Authorization: Bearer <CERT_ID>" \
  "http://localhost:3000/api/v1/bills/<BILL_ID>/approve" | jq '.data.status'
```

Expected: `"Open"`

- [ ] **Step 6: Test post transition with ERP reference**

```bash
curl -s -X POST \
  -H "Authorization: Bearer <CERT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"erp_reference":"NS-BILL-12345"}' \
  "http://localhost:3000/api/v1/bills/<BILL_ID>/post" | jq '{status: .data.status, ref: .data.erp_reference}'
```

Expected: `{"status": "Paid In Full", "ref": "NS-BILL-12345"}`

- [ ] **Step 7: Test cancel on a paid bill (expect 422)**

```bash
curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer <CERT_ID>" \
  "http://localhost:3000/api/v1/bills/<BILL_ID>/cancel"
```

Expected: `{"error":"Cannot cancel a paid bill"}` with status `422`

- [ ] **Step 8: Commit**

```bash
git add "app/api/v1/bills/[id]/approve/" "app/api/v1/bills/[id]/cancel/" "app/api/v1/bills/[id]/post/"
git commit -m "feat: add bill status transition endpoints (approve, cancel, post-to-ERP)"
```

---

### Task 5: Reference Data APIs

**Files:**
- Create: `app/api/v1/subsidiaries/route.ts`
- Create: `app/api/v1/accounts/route.ts`
- Create: `app/api/v1/payment-terms/route.ts`

- [ ] **Step 1: Create `app/api/v1/subsidiaries/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase.from("subsidiaries").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 2: Create `app/api/v1/accounts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const supabase = createServerClient();
  let query = supabase.from("accounts").select("*").order("number");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 3: Create `app/api/v1/payment-terms/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("payment_terms")
    .select("*")
    .eq("inactive", false)
    .order("terms");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

- [ ] **Step 4: Test subsidiaries**

```bash
curl -s -H "Authorization: Bearer <CERT_ID>" \
  http://localhost:3000/api/v1/subsidiaries | jq '[.data[].name]'
```

Expected: `["Germany","India","Parent Company","United Kingdom","US East","US West","xElim"]`

- [ ] **Step 5: Test payment-terms**

```bash
curl -s -H "Authorization: Bearer <CERT_ID>" \
  http://localhost:3000/api/v1/payment-terms | jq '[.data[].terms]'
```

Expected: `["2/10 Net 30","Due on Receipt","Net 30","Net 60"]`

- [ ] **Step 6: Test accounts (empty until seeded)**

```bash
curl -s -H "Authorization: Bearer <CERT_ID>" \
  http://localhost:3000/api/v1/accounts | jq '.data | length'
```

Expected: integer ≥ 0

- [ ] **Step 7: Commit**

```bash
git add app/api/v1/subsidiaries/ app/api/v1/accounts/ app/api/v1/payment-terms/
git commit -m "feat: add reference data APIs (subsidiaries, accounts, payment-terms)"
```

---

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendors?search=&limit=&offset=` | List vendors |
| POST | `/api/v1/vendors` | Create vendor |
| GET | `/api/v1/vendors/:id` | Get vendor |
| PATCH | `/api/v1/vendors/:id` | Update vendor |
| GET | `/api/v1/bills?status=&vendor=&limit=&offset=` | List bills |
| POST | `/api/v1/bills` | Create bill |
| GET | `/api/v1/bills/:id` | Get bill |
| PATCH | `/api/v1/bills/:id` | Update bill fields |
| POST | `/api/v1/bills/:id/approve` | `Pending Approval` → `Open` |
| POST | `/api/v1/bills/:id/cancel` | Any → `Cancelled` |
| POST | `/api/v1/bills/:id/post` | Any → `Paid In Full` + `erp_reference` |
| GET | `/api/v1/subsidiaries` | List all subsidiaries |
| GET | `/api/v1/accounts?type=` | List accounts |
| GET | `/api/v1/payment-terms` | List active payment terms |

**Auth:** All endpoints require `Authorization: Bearer <certificate_id>` where `certificate_id` is a non-revoked, date-valid entry from the `credentials` table.
