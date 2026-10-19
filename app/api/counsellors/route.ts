import { NextResponse } from "next/server";
import { requireAdmin, requireCounsellor } from "@/src/lib/access";
import { getSupabase, selectAll } from "@/src/lib/supabase";

// GET /api/counsellors          super admin: every counsellor with workload stats
// GET /api/counsellors?basic=1  any counsellor: id and name only (for pickers)
export async function GET(request: Request) {
  const basic = new URL(request.url).searchParams.get("basic") === "1";
  const guard = basic ? await requireCounsellor() : await requireAdmin();
  if (guard.error) return guard.error;
  if (guard.access.legacy) return NextResponse.json([]);

  const supabase = getSupabase();
  const { data: counsellors, error } = await supabase
    .from("counsellors")
    .select(
      basic
        ? "id, full_name, email, is_active"
        : "id, full_name, email, image_url, role, is_active, birth_day, birth_month, birth_year, last_seen_at, created_at"
    )
    .order("full_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (basic) return NextResponse.json(counsellors);

  try {
    const [assigned, feedback] = await Promise.all([
      selectAll<{ assigned_counsellor_id: string; id: number }>((from, to) =>
        supabase
          .from("contacts")
          .select("id, assigned_counsellor_id")
          .not("assigned_counsellor_id", "is", null)
          .order("id")
          .range(from, to)
      ),
      selectAll<{ counsellor_id: string; contact_id: number; date_created: string | null }>(
        (from, to) =>
          supabase
            .from("feedback")
            .select("counsellor_id, contact_id, date_created")
            .not("counsellor_id", "is", null)
            .order("id")
            .range(from, to)
      ),
    ]);

    const assignedCount = new Map<string, number>();
    for (const r of assigned) {
      assignedCount.set(r.assigned_counsellor_id, (assignedCount.get(r.assigned_counsellor_id) ?? 0) + 1);
    }
    const feedbackCount = new Map<string, number>();
    const followedUp = new Map<string, Set<number>>();
    const lastFeedback = new Map<string, string>();
    for (const f of feedback) {
      feedbackCount.set(f.counsellor_id, (feedbackCount.get(f.counsellor_id) ?? 0) + 1);
      if (!followedUp.has(f.counsellor_id)) followedUp.set(f.counsellor_id, new Set());
      followedUp.get(f.counsellor_id)!.add(f.contact_id);
      if (f.date_created && (lastFeedback.get(f.counsellor_id) ?? "") < f.date_created) {
        lastFeedback.set(f.counsellor_id, f.date_created);
      }
    }

    return NextResponse.json(
      (counsellors as unknown as { id: string }[]).map((c) => ({
        ...c,
        assignedCount: assignedCount.get(c.id) ?? 0,
        followedUpCount: followedUp.get(c.id)?.size ?? 0,
        feedbackCount: feedbackCount.get(c.id) ?? 0,
        lastFeedbackAt: lastFeedback.get(c.id) ?? null,
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
