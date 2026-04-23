# API Route Test Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest test suite covering all 12 API route files, with highest priority on auth logic and bill state machine transitions.

**Architecture:** Vitest runs in Node environment. `server-only` is aliased to an empty module so imports don't throw. `@/lib/supabase-server` is mocked in every route test so no real DB calls are made. `@/lib/api-auth` is mocked in route tests (isolating route logic from auth logic), and tested directly in its own unit test file. Each test group is one file per resource.

**Tech Stack:** Vitest, Next.js 16 App Router (`NextRequest`/`NextResponse`), TypeScript, `vi.mock`

---

## File Structure

**Create:**
- `vitest.config.ts` — Vitest config: `@` alias, `server-only` alias, node environment
- `__tests__/mocks/server-only.ts` — empty module (replaces `server-only` package in tests)
- `__tests__/helpers/supabase.ts` — `createMockSupabase()` builder used in all route tests
- `__tests__/lib/api-auth.test.ts` — unit tests for `verifyApiKey` (P0)
- `__tests__/api/v1/vendors.test.ts` — GET list, GET detail, POST create, PATCH update (P1)
- `__tests__/api/v1/bills.test.ts` — GET list, GET detail, POST create, PATCH update (P1)
- `__tests__/api/v1/bills-transitions.test.ts` — approve, cancel, post state machine (P0)
- `__tests__/api/v1/reference-data.test.ts` — subsidiaries, accounts, payment-terms (P2)

**Modify:**
- `package.json` — add `"test": "vitest run"` and `"test:watch": "vitest"` scripts

---

### Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `__tests__/mocks/server-only.ts`
- Create: `__tests__/helpers/supabase.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

Expected: vitest and coverage tool added to devDependencies in `package.json`.

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "__tests__/mocks/server-only.ts"),
    },
  },
});
```

- [ ] **Step 3: Create `__tests__/mocks/server-only.ts`**

```typescript
export default {};
```

- [ ] **Step 4: Create `__tests__/helpers/supabase.ts`**

```typescript
import { vi } from "vitest";

export type MockResult = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
};

export function createMockSupabase(defaults?: MockResult) {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn(),
    single: vi.fn(),
  };
  if (defaults) {
    const { data = null, error = null, count = null } = defaults;
    mock.range.mockResolvedValue({ data, error, count });
    mock.single.mockResolvedValue({ data, error });
  }
  return mock;
}
```

- [ ] **Step 5: Add test scripts to `package.json`**

In `package.json`, add to the `scripts` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run tests to verify setup**

```bash
npm test
```

Expected: `No test files found, exiting with code 1` or `0 tests` (not an error about missing config).

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts __tests__/mocks/server-only.ts __tests__/helpers/supabase.ts package.json package-lock.json
git commit -m "feat: add Vitest test infrastructure (config, server-only mock, supabase helper)"
```

---

### Task 2: api-auth.ts Unit Tests (P0)

**Files:**
- Create: `__tests__/lib/api-auth.test.ts`
- Tests: `lib/api-auth.ts`

- [ ] **Step 1: Write the test file**

```typescript
// __tests__/lib/api-auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-server");

import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { createMockSupabase } from "../helpers/supabase";

const VALID_CREDENTIAL = {
  id: "cred-1",
  certificate_id: "valid-token",
  application: "AP Automation",
  entity: null,
  role: null,
};

function makeRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/v1/test", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyApiKey", () => {
  it("throws ApiAuthError(401) when Authorization header is missing", async () => {
    const req = makeRequest();
    await expect(verifyApiKey(req)).rejects.toMatchObject({
      name: "ApiAuthError",
      status: 401,
      message: "Missing or invalid Authorization header",
    });
  });

  it("throws ApiAuthError(401) when Authorization header is not Bearer", async () => {
    const req = makeRequest("Basic abc123");
    await expect(verifyApiKey(req)).rejects.toMatchObject({
      name: "ApiAuthError",
      status: 401,
      message: "Missing or invalid Authorization header",
    });
  });

  it("returns Credential when token matches a valid non-revoked credential", async () => {
    const supabase = createMockSupabase({ data: VALID_CREDENTIAL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);

    const req = makeRequest("Bearer valid-token");
    const result = await verifyApiKey(req);

    expect(result).toEqual(VALID_CREDENTIAL);
    expect(supabase.eq).toHaveBeenCalledWith("certificate_id", "valid-token");
    expect(supabase.eq).toHaveBeenCalledWith("revoked", false);
  });

  it("throws ApiAuthError(401) when Supabase returns an error (token not found)", async () => {
    const supabase = createMockSupabase({
      data: null,
      error: { message: "No rows returned", code: "PGRST116" },
    });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);

    const req = makeRequest("Bearer bad-token");
    await expect(verifyApiKey(req)).rejects.toMatchObject({
      name: "ApiAuthError",
      status: 401,
      message: "Invalid or expired API key",
    });
  });

  it("throws ApiAuthError(401) when Supabase returns null data with no error (revoked/expired)", async () => {
    const supabase = createMockSupabase({ data: null, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);

    const req = makeRequest("Bearer expired-token");
    await expect(verifyApiKey(req)).rejects.toMatchObject({
      name: "ApiAuthError",
      status: 401,
      message: "Invalid or expired API key",
    });
  });

  it("passes today's date as both lte(valid_from) and gte(valid_until) bounds", async () => {
    const supabase = createMockSupabase({ data: VALID_CREDENTIAL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);

    const req = makeRequest("Bearer valid-token");
    await verifyApiKey(req);

    const today = new Date().toISOString().slice(0, 10);
    expect(supabase.lte).toHaveBeenCalledWith("valid_from", today);
    expect(supabase.gte).toHaveBeenCalledWith("valid_until", today);
  });

  it("ApiAuthError has correct name property", () => {
    const err = new ApiAuthError("test", 403);
    expect(err.name).toBe("ApiAuthError");
    expect(err.status).toBe(403);
    expect(err.message).toBe("test");
    expect(err instanceof Error).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail (no implementation yet... actually tests should pass since api-auth.ts exists)**

```bash
npm test __tests__/lib/api-auth.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/api-auth.test.ts
git commit -m "test: add api-auth unit tests (P0 — auth logic coverage)"
```

---

### Task 3: Vendors Route Tests (P1)

**Files:**
- Create: `__tests__/api/v1/vendors.test.ts`
- Tests: `app/api/v1/vendors/route.ts` and `app/api/v1/vendors/[id]/route.ts`

- [ ] **Step 1: Write the test file**

```typescript
// __tests__/api/v1/vendors.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth");
vi.mock("@/lib/supabase-server");

import { GET as listVendors, POST as createVendor } from "@/app/api/v1/vendors/route";
import { GET as getVendor, PATCH as updateVendor } from "@/app/api/v1/vendors/[id]/route";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { createMockSupabase } from "../../helpers/supabase";

const VENDOR = { id: "v-1", name: "ACME", type: "COMPANY", email: null, created_at: "2026-01-01" };

function authRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: options?.method ?? "GET",
    headers: { authorization: "Bearer test-key", "content-type": "application/json" },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyApiKey).mockResolvedValue({
    id: "cred-1",
    certificate_id: "test-key",
    application: "AP",
    entity: null,
    role: null,
  });
});

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("GET /api/v1/vendors — auth", () => {
  it("returns 401 when verifyApiKey throws ApiAuthError", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const req = new NextRequest("http://localhost/api/v1/vendors");
    const res = await listVendors(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Missing or invalid Authorization header" });
  });
});

// ── Pagination validation ─────────────────────────────────────────────────────

describe("GET /api/v1/vendors — pagination", () => {
  it("returns 422 when limit is not a number", async () => {
    const req = authRequest("http://localhost/api/v1/vendors?limit=abc");
    const res = await listVendors(req);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "limit must be a positive integer" });
  });

  it("returns 422 when limit is zero", async () => {
    const req = authRequest("http://localhost/api/v1/vendors?limit=0");
    const res = await listVendors(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 when offset is negative", async () => {
    const req = authRequest("http://localhost/api/v1/vendors?offset=-1");
    const res = await listVendors(req);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "offset must be a non-negative integer" });
  });

  it("caps limit at 200", async () => {
    const supabase = createMockSupabase({ data: [], error: null, count: 0 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors?limit=9999");
    const res = await listVendors(req);
    const json = await res.json();
    expect(json.limit).toBe(200);
  });
});

// ── List ──────────────────────────────────────────────────────────────────────

describe("GET /api/v1/vendors — list", () => {
  it("returns { data, total, limit, offset } on success", async () => {
    const supabase = createMockSupabase({ data: [VENDOR], error: null, count: 1 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors");
    const res = await listVendors(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ data: [VENDOR], total: 1, limit: 50, offset: 0 });
  });

  it("applies ilike search filter when search param is provided", async () => {
    const supabase = createMockSupabase({ data: [VENDOR], error: null, count: 1 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors?search=acme");
    await listVendors(req);
    expect(supabase.ilike).toHaveBeenCalledWith("name", "%acme%");
  });

  it("does not apply ilike filter when search param is absent", async () => {
    const supabase = createMockSupabase({ data: [], error: null, count: 0 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors");
    await listVendors(req);
    expect(supabase.ilike).not.toHaveBeenCalled();
  });

  it("returns 500 when Supabase returns an error", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB down" }, count: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors");
    const res = await listVendors(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "DB down" });
  });
});

// ── Create ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/vendors — create", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const req = new NextRequest("http://localhost/api/v1/vendors", { method: "POST" });
    const res = await createVendor(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/v1/vendors", {
      method: "POST",
      headers: { authorization: "Bearer test-key", "content-type": "application/json" },
      body: "{ bad json",
    });
    const res = await createVendor(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 422 when name is missing", async () => {
    const req = authRequest("http://localhost/api/v1/vendors", { method: "POST", body: { email: "x@x.com" } });
    const res = await createVendor(req);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "name is required" });
  });

  it("returns 201 with data on success", async () => {
    const supabase = createMockSupabase({ data: VENDOR, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors", { method: "POST", body: { name: "ACME" } });
    const res = await createVendor(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: VENDOR });
  });

  it("defaults type to COMPANY when not provided", async () => {
    const supabase = createMockSupabase({ data: VENDOR, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors", { method: "POST", body: { name: "ACME" } });
    await createVendor(req);
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "COMPANY" })
    );
  });

  it("strips id and created_at from the insert payload", async () => {
    const supabase = createMockSupabase({ data: VENDOR, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors", {
      method: "POST",
      body: { name: "ACME", id: "injected", created_at: "injected" },
    });
    await createVendor(req);
    const insertArg = vi.mocked(supabase.insert).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.id).toBeUndefined();
    expect(insertArg.created_at).toBeUndefined();
  });
});

// ── Get one ───────────────────────────────────────────────────────────────────

describe("GET /api/v1/vendors/[id]", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const req = new NextRequest("http://localhost/api/v1/vendors/v-1");
    const res = await getVendor(req, params("v-1"));
    expect(res.status).toBe(401);
  });

  it("returns { data } on success", async () => {
    const supabase = createMockSupabase({ data: VENDOR, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/v-1");
    const res = await getVendor(req, params("v-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: VENDOR });
  });

  it("returns 404 on PGRST116", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/missing");
    const res = await getVendor(req, params("missing"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Vendor not found" });
  });

  it("returns 500 on non-PGRST116 errors", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB error", code: "XXXXX" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/v-1");
    const res = await getVendor(req, params("v-1"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "DB error" });
  });
});

// ── Update ────────────────────────────────────────────────────────────────────

describe("PATCH /api/v1/vendors/[id]", () => {
  it("returns 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/v1/vendors/v-1", {
      method: "PATCH",
      headers: { authorization: "Bearer test-key" },
      body: "{ bad json",
    });
    const res = await updateVendor(req, params("v-1"));
    expect(res.status).toBe(400);
  });

  it("returns { data } on success", async () => {
    const updated = { ...VENDOR, name: "Updated" };
    const supabase = createMockSupabase({ data: updated, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/v-1", { method: "PATCH", body: { name: "Updated" } });
    const res = await updateVendor(req, params("v-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: updated });
  });

  it("returns 404 on PGRST116 (no matching row)", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/missing", { method: "PATCH", body: { name: "x" } });
    const res = await updateVendor(req, params("missing"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Vendor not found" });
  });

  it("strips id and created_at from the update payload", async () => {
    const supabase = createMockSupabase({ data: VENDOR, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/vendors/v-1", {
      method: "PATCH",
      body: { name: "x", id: "injected", created_at: "injected" },
    });
    await updateVendor(req, params("v-1"));
    const updateArg = vi.mocked(supabase.update).mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg.id).toBeUndefined();
    expect(updateArg.created_at).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test __tests__/api/v1/vendors.test.ts
```

Expected: All tests PASS (green). If any fail, fix the test or implementation before proceeding.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/v1/vendors.test.ts
git commit -m "test: add vendor route tests (list, create, detail, update)"
```

---

### Task 4: Bills CRUD Route Tests (P1)

**Files:**
- Create: `__tests__/api/v1/bills.test.ts`
- Tests: `app/api/v1/bills/route.ts` and `app/api/v1/bills/[id]/route.ts`

- [ ] **Step 1: Write the test file**

```typescript
// __tests__/api/v1/bills.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth");
vi.mock("@/lib/supabase-server");

import { GET as listBills, POST as createBill } from "@/app/api/v1/bills/route";
import { GET as getBill, PATCH as updateBill } from "@/app/api/v1/bills/[id]/route";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { createMockSupabase } from "../../helpers/supabase";

const BILL = {
  id: "b-1",
  vendor_name: "ACME",
  date: "4/23/2026",
  amount: 5000,
  status: "Pending Approval",
  currency: "US Dollar",
  line_items: [],
  erp_reference: null,
  created_at: "2026-04-23",
};

function authRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: options?.method ?? "GET",
    headers: { authorization: "Bearer test-key", "content-type": "application/json" },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyApiKey).mockResolvedValue({
    id: "cred-1",
    certificate_id: "test-key",
    application: "AP",
    entity: null,
    role: null,
  });
});

// ── List ──────────────────────────────────────────────────────────────────────

describe("GET /api/v1/bills — list", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const res = await listBills(new NextRequest("http://localhost/api/v1/bills"));
    expect(res.status).toBe(401);
  });

  it("returns { data, total, limit, offset } on success", async () => {
    const supabase = createMockSupabase({ data: [BILL], error: null, count: 1 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills");
    const res = await listBills(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: [BILL], total: 1, limit: 50, offset: 0 });
  });

  it("applies status filter when status param provided", async () => {
    const supabase = createMockSupabase({ data: [BILL], error: null, count: 1 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills?status=Pending+Approval");
    await listBills(req);
    expect(supabase.eq).toHaveBeenCalledWith("status", "Pending Approval");
  });

  it("applies vendor filter when vendor param provided", async () => {
    const supabase = createMockSupabase({ data: [BILL], error: null, count: 1 });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills?vendor=acme");
    await listBills(req);
    expect(supabase.ilike).toHaveBeenCalledWith("vendor_name", "%acme%");
  });

  it("returns 422 when limit is NaN", async () => {
    const req = authRequest("http://localhost/api/v1/bills?limit=bad");
    const res = await listBills(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 when offset is negative", async () => {
    const req = authRequest("http://localhost/api/v1/bills?offset=-5");
    const res = await listBills(req);
    expect(res.status).toBe(422);
  });
});

// ── Create ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/bills — create", () => {
  it("returns 422 when vendor_name is missing", async () => {
    const req = authRequest("http://localhost/api/v1/bills", { method: "POST", body: { date: "4/23/2026" } });
    const res = await createBill(req);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "vendor_name and date are required" });
  });

  it("returns 422 when date is missing", async () => {
    const req = authRequest("http://localhost/api/v1/bills", { method: "POST", body: { vendor_name: "ACME" } });
    const res = await createBill(req);
    expect(res.status).toBe(422);
  });

  it("returns 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/v1/bills", {
      method: "POST",
      headers: { authorization: "Bearer test-key" },
      body: "{ bad json",
    });
    const res = await createBill(req);
    expect(res.status).toBe(400);
  });

  it("always creates bill with status 'Pending Approval', ignoring caller-supplied status", async () => {
    const supabase = createMockSupabase({ data: BILL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills", {
      method: "POST",
      body: { vendor_name: "ACME", date: "4/23/2026", status: "Paid In Full" },
    });
    await createBill(req);
    const insertArg = vi.mocked(supabase.insert).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.status).toBe("Pending Approval");
  });

  it("defaults currency to 'US Dollar' when not provided", async () => {
    const supabase = createMockSupabase({ data: BILL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills", {
      method: "POST",
      body: { vendor_name: "ACME", date: "4/23/2026" },
    });
    await createBill(req);
    const insertArg = vi.mocked(supabase.insert).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.currency).toBe("US Dollar");
    expect(insertArg.amount).toBe(0);
    expect(insertArg.line_items).toEqual([]);
  });

  it("strips id and created_at from the insert payload", async () => {
    const supabase = createMockSupabase({ data: BILL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills", {
      method: "POST",
      body: { vendor_name: "ACME", date: "4/23/2026", id: "injected", created_at: "injected" },
    });
    await createBill(req);
    const insertArg = vi.mocked(supabase.insert).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.id).toBeUndefined();
    expect(insertArg.created_at).toBeUndefined();
  });

  it("returns 201 with { data } on success", async () => {
    const supabase = createMockSupabase({ data: BILL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills", {
      method: "POST",
      body: { vendor_name: "ACME", date: "4/23/2026", amount: 5000 },
    });
    const res = await createBill(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: BILL });
  });
});

// ── Get one ───────────────────────────────────────────────────────────────────

describe("GET /api/v1/bills/[id]", () => {
  it("returns { data } on success", async () => {
    const supabase = createMockSupabase({ data: BILL, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills/b-1");
    const res = await getBill(req, params("b-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: BILL });
  });

  it("returns 404 on PGRST116", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getBill(authRequest("http://localhost/api/v1/bills/x"), params("x"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Bill not found" });
  });

  it("returns 500 on other DB errors", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "conn failed", code: "XXXXX" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getBill(authRequest("http://localhost/api/v1/bills/b-1"), params("b-1"));
    expect(res.status).toBe(500);
  });
});

// ── Update ────────────────────────────────────────────────────────────────────

describe("PATCH /api/v1/bills/[id]", () => {
  it("returns { data } on success", async () => {
    const updated = { ...BILL, memo: "updated" };
    const supabase = createMockSupabase({ data: updated, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills/b-1", { method: "PATCH", body: { memo: "updated" } });
    const res = await updateBill(req, params("b-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: updated });
  });

  it("returns 404 on PGRST116", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const req = authRequest("http://localhost/api/v1/bills/missing", { method: "PATCH", body: { memo: "x" } });
    const res = await updateBill(req, params("missing"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Bill not found" });
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test __tests__/api/v1/bills.test.ts
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/v1/bills.test.ts
git commit -m "test: add bills CRUD route tests (list, create, detail, update)"
```

---

### Task 5: Bills State Machine Transition Tests (P0)

**Files:**
- Create: `__tests__/api/v1/bills-transitions.test.ts`
- Tests: `app/api/v1/bills/[id]/approve/route.ts`, `cancel/route.ts`, `post/route.ts`

- [ ] **Step 1: Write the test file**

```typescript
// __tests__/api/v1/bills-transitions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth");
vi.mock("@/lib/supabase-server");

import { POST as approve } from "@/app/api/v1/bills/[id]/approve/route";
import { POST as cancel } from "@/app/api/v1/bills/[id]/cancel/route";
import { POST as post } from "@/app/api/v1/bills/[id]/post/route";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { createMockSupabase } from "../../helpers/supabase";

function authRequest(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { authorization: "Bearer test-key", "content-type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const OPEN_BILL = { id: "b-1", status: "Open", vendor_name: "ACME", amount: 500, currency: "US Dollar" };
const PENDING_BILL = { ...OPEN_BILL, status: "Pending Approval" };
const CANCELLED_BILL = { ...OPEN_BILL, status: "Cancelled" };
const PAID_BILL = { ...OPEN_BILL, status: "Paid In Full" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyApiKey).mockResolvedValue({
    id: "cred-1",
    certificate_id: "test-key",
    application: "AP",
    entity: null,
    role: null,
  });
});

// ── APPROVE ───────────────────────────────────────────────────────────────────

describe("POST /api/v1/bills/[id]/approve", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const res = await approve(new NextRequest("http://localhost/api/v1/bills/b-1/approve", { method: "POST" }), params("b-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when bill does not exist (PGRST116)", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await approve(authRequest("http://localhost/api/v1/bills/missing/approve"), params("missing"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Bill not found" });
  });

  it("returns 422 when status is 'Open'", async () => {
    const supabase = createMockSupabase({ data: { status: "Open" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await approve(authRequest("http://localhost/api/v1/bills/b-1/approve"), params("b-1"));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'Cannot approve bill with status "Open"' });
  });

  it("returns 422 when status is 'Cancelled'", async () => {
    const supabase = createMockSupabase({ data: { status: "Cancelled" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await approve(authRequest("http://localhost/api/v1/bills/b-1/approve"), params("b-1"));
    expect(res.status).toBe(422);
  });

  it("returns 422 when status is 'Paid In Full'", async () => {
    const supabase = createMockSupabase({ data: { status: "Paid In Full" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await approve(authRequest("http://localhost/api/v1/bills/b-1/approve"), params("b-1"));
    expect(res.status).toBe(422);
  });

  it("transitions 'Pending Approval' → 'Open' and returns { data }", async () => {
    const supabase = createMockSupabase();
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Pending Approval" }, error: null })
      .mockResolvedValueOnce({ data: { ...PENDING_BILL, status: "Open" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await approve(authRequest("http://localhost/api/v1/bills/b-1/approve"), params("b-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("Open");
    expect(supabase.update).toHaveBeenCalledWith({ status: "Open" });
  });
});

// ── CANCEL ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/bills/[id]/cancel", () => {
  it("returns 404 when bill does not exist", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await cancel(authRequest("http://localhost/api/v1/bills/x/cancel"), params("x"));
    expect(res.status).toBe(404);
  });

  it("returns 422 when status is already 'Cancelled'", async () => {
    const supabase = createMockSupabase({ data: { status: "Cancelled" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await cancel(authRequest("http://localhost/api/v1/bills/b-1/cancel"), params("b-1"));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Bill is already cancelled" });
  });

  it("returns 422 when status is 'Paid In Full'", async () => {
    const supabase = createMockSupabase({ data: { status: "Paid In Full" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await cancel(authRequest("http://localhost/api/v1/bills/b-1/cancel"), params("b-1"));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Cannot cancel a paid bill" });
  });

  it("transitions 'Pending Approval' → 'Cancelled'", async () => {
    const supabase = createMockSupabase();
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Pending Approval" }, error: null })
      .mockResolvedValueOnce({ data: { ...PENDING_BILL, status: "Cancelled" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await cancel(authRequest("http://localhost/api/v1/bills/b-1/cancel"), params("b-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("Cancelled");
  });

  it("transitions 'Open' → 'Cancelled'", async () => {
    const supabase = createMockSupabase();
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Open" }, error: null })
      .mockResolvedValueOnce({ data: { ...OPEN_BILL, status: "Cancelled" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await cancel(authRequest("http://localhost/api/v1/bills/b-1/cancel"), params("b-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("Cancelled");
    expect(supabase.update).toHaveBeenCalledWith({ status: "Cancelled" });
  });
});

// ── POST (post-to-ERP) ────────────────────────────────────────────────────────

describe("POST /api/v1/bills/[id]/post", () => {
  it("returns 404 when bill does not exist", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "no rows", code: "PGRST116" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/x/post"), params("x"));
    expect(res.status).toBe(404);
  });

  it("returns 422 when status is 'Pending Approval' (must approve first)", async () => {
    const supabase = createMockSupabase({ data: { status: "Pending Approval" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/b-1/post"), params("b-1"));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'Cannot post bill with status "Pending Approval"' });
  });

  it("returns 422 when status is 'Cancelled'", async () => {
    const supabase = createMockSupabase({ data: { status: "Cancelled" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/b-1/post"), params("b-1"));
    expect(res.status).toBe(422);
  });

  it("returns 422 when status is 'Paid In Full' (already posted)", async () => {
    const supabase = createMockSupabase({ data: { status: "Paid In Full" }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/b-1/post"), params("b-1"));
    expect(res.status).toBe(422);
  });

  it("transitions 'Open' → 'Paid In Full' and returns { data }", async () => {
    const supabase = createMockSupabase();
    const posted = { ...OPEN_BILL, status: "Paid In Full", erp_reference: null };
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Open" }, error: null })
      .mockResolvedValueOnce({ data: posted, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/b-1/post"), params("b-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("Paid In Full");
  });

  it("stores erp_reference when provided in body", async () => {
    const supabase = createMockSupabase();
    const posted = { ...OPEN_BILL, status: "Paid In Full", erp_reference: "NS-12345" };
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Open" }, error: null })
      .mockResolvedValueOnce({ data: posted, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(
      authRequest("http://localhost/api/v1/bills/b-1/post", { erp_reference: "NS-12345" }),
      params("b-1")
    );
    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ status: "Paid In Full", erp_reference: "NS-12345" });
  });

  it("stores null erp_reference when body is absent", async () => {
    const supabase = createMockSupabase();
    supabase.single
      .mockResolvedValueOnce({ data: { status: "Open" }, error: null })
      .mockResolvedValueOnce({ data: { ...OPEN_BILL, status: "Paid In Full", erp_reference: null }, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await post(authRequest("http://localhost/api/v1/bills/b-1/post"), params("b-1"));
    expect(res.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledWith({ status: "Paid In Full", erp_reference: null });
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test __tests__/api/v1/bills-transitions.test.ts
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/v1/bills-transitions.test.ts
git commit -m "test: add bill state machine transition tests (approve, cancel, post — P0)"
```

---

### Task 6: Reference Data Route Tests (P2)

**Files:**
- Create: `__tests__/api/v1/reference-data.test.ts`
- Tests: `app/api/v1/subsidiaries/route.ts`, `accounts/route.ts`, `payment-terms/route.ts`

- [ ] **Step 1: Write the test file**

```typescript
// __tests__/api/v1/reference-data.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth");
vi.mock("@/lib/supabase-server");

import { GET as getSubsidiaries } from "@/app/api/v1/subsidiaries/route";
import { GET as getAccounts } from "@/app/api/v1/accounts/route";
import { GET as getPaymentTerms } from "@/app/api/v1/payment-terms/route";
import { verifyApiKey, ApiAuthError } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { createMockSupabase } from "../../helpers/supabase";

function authRequest(url: string) {
  return new NextRequest(url, { headers: { authorization: "Bearer test-key" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyApiKey).mockResolvedValue({
    id: "cred-1",
    certificate_id: "test-key",
    application: "AP",
    entity: null,
    role: null,
  });
});

// ── Subsidiaries ──────────────────────────────────────────────────────────────

describe("GET /api/v1/subsidiaries", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const res = await getSubsidiaries(new NextRequest("http://localhost/api/v1/subsidiaries"));
    expect(res.status).toBe(401);
  });

  it("returns { data } with all subsidiaries", async () => {
    const subs = [{ id: "s1", name: "US East" }, { id: "s2", name: "US West" }];
    const supabase = createMockSupabase({ data: subs, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getSubsidiaries(authRequest("http://localhost/api/v1/subsidiaries"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: subs });
  });

  it("returns 500 on DB error", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB down" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getSubsidiaries(authRequest("http://localhost/api/v1/subsidiaries"));
    expect(res.status).toBe(500);
  });
});

// ── Accounts ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/accounts", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const res = await getAccounts(new NextRequest("http://localhost/api/v1/accounts"));
    expect(res.status).toBe(401);
  });

  it("returns { data } with active accounts", async () => {
    const accounts = [{ id: "a1", name: "AP Account", number: "2000", inactive: false }];
    const supabase = createMockSupabase({ data: accounts, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getAccounts(authRequest("http://localhost/api/v1/accounts"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: accounts });
    expect(supabase.eq).toHaveBeenCalledWith("inactive", false);
  });

  it("applies type filter when type param provided", async () => {
    const supabase = createMockSupabase({ data: [], error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getAccounts(authRequest("http://localhost/api/v1/accounts?type=Accounts+Payable"));
    expect(res.status).toBe(200);
    expect(supabase.eq).toHaveBeenCalledWith("type", "Accounts Payable");
  });
});

// ── Payment Terms ─────────────────────────────────────────────────────────────

describe("GET /api/v1/payment-terms", () => {
  it("returns 401 on auth failure", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new ApiAuthError("Missing or invalid Authorization header", 401));
    const res = await getPaymentTerms(new NextRequest("http://localhost/api/v1/payment-terms"));
    expect(res.status).toBe(401);
  });

  it("returns { data } with active payment terms only", async () => {
    const terms = [{ id: "pt1", terms: "Net 30", inactive: false }];
    const supabase = createMockSupabase({ data: terms, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getPaymentTerms(authRequest("http://localhost/api/v1/payment-terms"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: terms });
    expect(supabase.eq).toHaveBeenCalledWith("inactive", false);
  });

  it("returns 500 on DB error", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB down" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getPaymentTerms(authRequest("http://localhost/api/v1/payment-terms"));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests across all files PASS. Output should show ~55 tests total.

- [ ] **Step 3: Run with coverage**

```bash
npx vitest run --coverage
```

Expected: Coverage report showing `lib/api-auth.ts` and all route files covered.

- [ ] **Step 4: Commit**

```bash
git add __tests__/api/v1/reference-data.test.ts
git commit -m "test: add reference data route tests (subsidiaries, accounts, payment-terms)"
```
