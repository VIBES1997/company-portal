import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-auth")>();
  return { ...actual, verifyApiKey: vi.fn() };
});
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
