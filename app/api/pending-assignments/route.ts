import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";
import { claimPendingAssignments } from "@/src/lib/counsellor";

interface PendingRow {
  contact_id: number;
  counsellor_name: string;
  counsellor_email: string | null;
  contacts: { firstName: string | null; lastName: string | null } | null;
}

// Super admin: lists of contacts waiting for counsellors who have not
// signed in yet, grouped by the counsellor's name.
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  if (guard.access.legacy) return NextResponse.json([]);

  const { data, error } = await getSupabase()
    .from("pending_assignments")
    .select("contact_id, counsellor_name, counsellor_email, contacts(firstName, lastName)")
    .order("counsellor_name");
  // The table only exists once its migration has been run.
  if (error) return NextResponse.json([]);

  const groups = new Map<string, { name: string; email: string | null; count: number; people: string[] }>();
  for (const row of (data ?? []) as unknown as PendingRow[]) {
    const g = groups.get(row.counsellor_name) ?? {
      name: row.counsellor_name,
      email: row.counsellor_email,
      count: 0,
      people: [],
    };
    g.count++;
    g.email = g.email ?? row.counsellor_email;
    const person = [row.contacts?.firstName, row.contacts?.lastName].filter(Boolean).join(" ");
    if (person && g.people.length < 50) g.people.push(person);
    groups.set(row.counsellor_name, g);
  }
  return NextResponse.json([...groups.values()]);
}

// Super admin: { name, counsellorId } hands a waiting list to a counsellor who
// has joined; { name, email } records the email so it is claimed on sign-in.
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { name, counsellorId, email } = (await request.json()) as {
    name?: string;
    counsellorId?: string;
    email?: string;
  };
  if (!name) return NextResponse.json({ error: "Missing list name" }, { status: 400 });
  const supabase = getSupabase();

  if (counsellorId) {
    const { data: rows } = await supabase
      .from("pending_assignments")
      .select("contact_id")
      .eq("counsellor_name", name);
    const ids = (rows ?? []).map((r) => r.contact_id);
    if (!ids.length) return NextResponse.json({ assigned: 0 });

    const { data: assigned, error } = await supabase
      .from("contacts")
      .update({
        assigned_counsellor_id: counsellorId,
        assigned_at: new Date().toISOString(),
        assigned_by: guard.access.counsellor?.id ?? null,
      })
      .in("id", ids)
      .is("assigned_counsellor_id", null)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("pending_assignments").delete().eq("counsellor_name", name);
    return NextResponse.json({ assigned: assigned?.length ?? 0 });
  }

  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  const { error } = await supabase
    .from("pending_assignments")
    .update({ counsellor_email: clean })
    .eq("counsellor_name", name);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If that person has already signed in, hand the list over now.
  const { data: existing } = await supabase
    .from("counsellors")
    .select("id")
    .ilike("email", clean)
    .maybeSingle();
  const assigned = existing ? await claimPendingAssignments(existing.id, clean) : 0;
  return NextResponse.json({ assigned, waiting: !existing });
}
