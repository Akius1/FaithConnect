import { NextResponse } from "next/server";
import { requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";

// Search every contact by name or phone so any counsellor can message one
// person. Returns only what is needed to pick and message them.
export async function GET(request: Request) {
  const guard = await requireCounsellor();
  if (guard.error) return guard.error;

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  // Strip characters that have meaning in PostgREST filters.
  const term = q.replace(/[,()*%\\]/g, " ").trim();
  const digits = term.replace(/\D/g, "");
  const filters = [`firstName.ilike.%${term}%`, `lastName.ilike.%${term}%`];
  if (digits.length >= 3) filters.push(`phone.ilike.%${digits}%`);

  const { data, error } = await getSupabase()
    .from("contacts")
    .select("id, firstName, lastName, phone, contactType, serviceType")
    .or(filters.join(","))
    .order("contactDate", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
