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
