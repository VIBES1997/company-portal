import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-auth")>();
  return { ...actual, verifyApiKey: vi.fn() };
});
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
