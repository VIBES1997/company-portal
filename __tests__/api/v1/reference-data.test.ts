import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-auth")>();
  return { ...actual, verifyApiKey: vi.fn() };
});
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
    supabase.order.mockResolvedValue({ data: subs, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getSubsidiaries(authRequest("http://localhost/api/v1/subsidiaries"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: subs });
  });

  it("returns 500 on DB error", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB down" } });
    supabase.order.mockResolvedValue({ data: null, error: { message: "DB down" } });
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

  it("returns { data } and filters inactive=false", async () => {
    const accounts = [{ id: "a1", name: "AP Account", number: "2000", inactive: false }];
    const supabase = createMockSupabase({ data: accounts, error: null });
    supabase.order.mockResolvedValue({ data: accounts, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getAccounts(authRequest("http://localhost/api/v1/accounts"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: accounts });
    expect(supabase.eq).toHaveBeenCalledWith("inactive", false);
  });

  it("applies type filter when type param provided", async () => {
    // Chain: from → select → eq("inactive") → order → eq("type") → await
    // eq("inactive") and order must return `this`; eq("type") must resolve.
    const supabase = createMockSupabase({ data: [], error: null });
    // order keeps mockReturnThis() from createMockSupabase (eq chains through it)
    supabase.eq
      .mockReturnValueOnce(supabase)                            // eq("inactive", false) → this
      .mockResolvedValueOnce({ data: [], error: null });        // eq("type", ...) → awaitable
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
    supabase.order.mockResolvedValue({ data: terms, error: null });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getPaymentTerms(authRequest("http://localhost/api/v1/payment-terms"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: terms });
    expect(supabase.eq).toHaveBeenCalledWith("inactive", false);
  });

  it("returns 500 on DB error", async () => {
    const supabase = createMockSupabase({ data: null, error: { message: "DB down" } });
    supabase.order.mockResolvedValue({ data: null, error: { message: "DB down" } });
    vi.mocked(createServerClient).mockReturnValue(supabase as never);
    const res = await getPaymentTerms(authRequest("http://localhost/api/v1/payment-terms"));
    expect(res.status).toBe(500);
  });
});
