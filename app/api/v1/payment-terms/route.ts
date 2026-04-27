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
