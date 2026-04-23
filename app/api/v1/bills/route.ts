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
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const vendor = searchParams.get("vendor");
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  if (isNaN(rawLimit) || rawLimit < 1)
    return NextResponse.json({ error: "limit must be a positive integer" }, { status: 422 });
  if (isNaN(rawOffset) || rawOffset < 0)
    return NextResponse.json({ error: "offset must be a non-negative integer" }, { status: 422 });
  const limit = Math.min(rawLimit, 200);
  const offset = rawOffset;
  const supabase = createServerClient();
  let query = supabase
    .from("bills")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  if (vendor) query = query.ilike("vendor_name", `%${vendor}%`);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(request: NextRequest) {
  try {
    await verifyApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.vendor_name || !body.date) {
    return NextResponse.json({ error: "vendor_name and date are required" }, { status: 422 });
  }
  delete body.id;
  delete body.created_at;
  delete body.status;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bills")
    .insert({
      ...body,
      status: "Pending Approval",
      currency: body.currency ?? "US Dollar",
      amount: body.amount ?? 0,
      line_items: body.line_items ?? [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
