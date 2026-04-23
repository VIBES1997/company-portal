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
  let erp_reference: string | undefined;
  try {
    const body = await request.json();
    erp_reference = typeof body.erp_reference === "string" ? body.erp_reference : undefined;
  } catch {
    // body is optional — no erp_reference if body is absent or invalid
  }
  const supabase = createServerClient();
  const { data: bill, error: fetchError } = await supabase
    .from("bills")
    .select("status")
    .eq("id", id)
    .single();
  if (fetchError) {
    const isNotFound = fetchError.code === "PGRST116";
    return NextResponse.json(
      { error: isNotFound ? "Bill not found" : fetchError.message },
      { status: isNotFound ? 404 : 500 }
    );
  }
  if (bill.status !== "Open") {
    return NextResponse.json(
      { error: `Cannot post bill with status "${bill.status}"` },
      { status: 422 }
    );
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
