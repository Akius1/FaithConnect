import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";

// Super admin only: assign contacts to a counsellor, or unassign them when
// counsellorId is null.
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  if (guard.access.legacy) {
    return NextResponse.json(
      { error: "Run the Supabase migration before assigning contacts." },
      { status: 409 }
    );
  }

  const { contactIds, counsellorId } = (await request.json()) as {
    contactIds?: (string | number)[];
    counsellorId?: string | null;
  };
  const ids = [...new Set((contactIds ?? []).map(Number).filter(Number.isFinite))];
  if (!ids.length) {
    return NextResponse.json({ error: "Choose at least one contact" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (counsellorId) {
    const { data: target } = await supabase
      .from("counsellors")
      .select("id, is_active")
      .eq("id", counsellorId)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "Counsellor not found" }, { status: 404 });
    }
    if (!target.is_active) {
      return NextResponse.json({ error: "That counsellor is not active" }, { status: 400 });
    }
  }

  const update = counsellorId
    ? {
        assigned_counsellor_id: counsellorId,
        assigned_at: new Date().toISOString(),
        assigned_by: guard.access.counsellor?.id ?? null,
      }
    : { assigned_counsellor_id: null, assigned_at: null, assigned_by: null };

  let updated = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await supabase
      .from("contacts")
      .update(update)
      .in("id", ids.slice(i, i + 500))
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message, updated }, { status: 500 });
    }
    updated += data?.length ?? 0;
  }

  return NextResponse.json({ updated });
}
