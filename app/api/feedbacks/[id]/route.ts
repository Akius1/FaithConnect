import {  NextResponse } from "next/server";
import { canSeeContact, requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;
    const { id } = await params;
    if (!(await canSeeContact(guard.access, id))) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    // Try using "feedbacks" instead of "feedback"
    const { data, error } = await getSupabase()
      .from("contacts")
      .select("*, feedback(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching contact:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
