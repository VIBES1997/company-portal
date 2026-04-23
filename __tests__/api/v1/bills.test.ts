import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-auth")>();
  return { ...actual, verifyApiKey: vi.fn() };
});
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
