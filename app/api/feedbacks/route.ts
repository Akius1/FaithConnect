import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { canSeeContact, requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";
import { isFoundationStage } from "@/src/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;

    const { contact_id, feedback, date_created, foundation_stage } = await request.json();

    if (!contact_id || !feedback?.trim() || !date_created) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (foundation_stage != null && !isFoundationStage(foundation_stage)) {
      return NextResponse.json({ error: "Unknown foundation class stage" }, { status: 400 });
    }
    if (!(await canSeeContact(guard.access, contact_id))) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // The counsellor is whoever is signed in, not a name typed into the form.
    const { counsellor } = guard.access;
    let initiator = counsellor?.full_name ?? counsellor?.email ?? null;
    if (!initiator) {
      const user = await currentUser();
      initiator =
        user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Counsellor";
    }

    const row: Record<string, unknown> = {
      contact_id,
      feedback: feedback.trim(),
      initiator,
      date_created,
    };
    if (counsellor) row.counsellor_id = counsellor.id;
    if (foundation_stage) row.foundation_stage = foundation_stage;

    const { data, error } = await getSupabase()
      .from("feedback")
      .insert([row])
      .select("*")
      .single();

    if (error) {
      console.error("Error inserting feedback:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The stage picked with the feedback becomes the contact's current stage.
    if (foundation_stage) {
      const { error: stageError } = await getSupabase()
        .from("contacts")
        .update({
          foundation_stage,
          foundation_stage_updated_at: new Date().toISOString(),
          foundation_stage_updated_by: counsellor?.id ?? null,
        })
        .eq("id", contact_id);
      if (stageError) console.error("Error updating foundation stage:", stageError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST feedback endpoint:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
