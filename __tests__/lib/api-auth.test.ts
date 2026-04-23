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
