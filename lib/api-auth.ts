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
