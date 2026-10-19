import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";

// Super admin: change a counsellor's role or pause their access.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;
  const body = (await request.json()) as { role?: string; is_active?: boolean };

  const update: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!["super_admin", "counsellor"].includes(body.role)) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    update.role = body.role;
  }
  if (body.is_active !== undefined) update.is_active = !!body.is_active;
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  // Stop a super admin from locking themselves out.
  if (id === guard.access.counsellor?.id && (update.role === "counsellor" || update.is_active === false)) {
    return NextResponse.json(
      { error: "You cannot remove your own super admin access." },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("counsellors")
    .update(update)
    .eq("id", id)
    .select("id, role, is_active")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Counsellor not found" }, { status: 404 });
  return NextResponse.json(data);
}
