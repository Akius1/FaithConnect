import { NextResponse } from "next/server";
import { canSeeContact, requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";
import { isFoundationStage } from "@/src/lib/constants";

// Change a contact's foundation class stage directly (from the Foundation
// Class page). Anyone who can see the contact may update it.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireCounsellor();
  if (guard.error) return guard.error;
  const { id } = await params;
  const { stage } = (await request.json()) as { stage?: unknown };

  if (!isFoundationStage(stage)) {
    return NextResponse.json({ error: "Unknown foundation class stage" }, { status: 400 });
  }
  if (!(await canSeeContact(guard.access, id))) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { data, error } = await getSupabase()
    .from("contacts")
    .update({
      foundation_stage: stage,
      foundation_stage_updated_at: new Date().toISOString(),
      foundation_stage_updated_by: guard.access.counsellor?.id ?? null,
    })
    .eq("id", id)
    .select("id, foundation_stage, foundation_stage_updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(data);
}
