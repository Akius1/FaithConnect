import { NextResponse } from "next/server";
import { contactScopeFilter, requireCounsellor } from "@/src/lib/access";
import { getSupabase, selectAll } from "@/src/lib/supabase";

interface Row {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  contactType: string | null;
  serviceType: string | null;
  district: string | null;
  gender: string | null;
  contactDate: string | null;
  assigned_counsellor_id?: string | null;
  whatsapp_status?: string | null;
  foundation_stage?: string | null;
  foundation_stage_updated_at?: string | null;
  feedback:
    | {
        id: string;
        date_created: string | null;
        initiator: string | null;
        counsellor_id?: string | null;
      }[]
    | null;
}

const BASE_COLUMNS =
  "id, firstName, lastName, phone, contactType, serviceType, district, gender, contactDate";

// Every contact the caller may see, with a summary of its follow-up feedback.
// Filtering by type, service, round and counsellor happens on the client so
// tab counts stay live.
export async function GET() {
  try {
    const guard = await requireCounsellor();
    if (guard.error) return guard.error;
    const { access } = guard;

    // Before the migration the assignment columns do not exist yet.
    const assignment = `${BASE_COLUMNS}, assigned_counsellor_id, whatsapp_status`;
    const feedbackCols = "feedback(id, date_created, initiator, counsellor_id)";
    const scope = await contactScopeFilter(access);

    const load = (columns: string) => selectAll<Row>((from, to) => {
      let query = getSupabase()
        .from("contacts")
        .select(columns)
        .order("contactDate", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to);
      if (scope) query = query.or(scope);
      return query as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
    });

    let rows: Row[];
    if (access.legacy) {
      rows = await load(`${BASE_COLUMNS}, feedback(id, date_created, initiator)`);
    } else {
      try {
        rows = await load(`${assignment}, foundation_stage, foundation_stage_updated_at, ${feedbackCols}`);
      } catch (err) {
        // The foundation class migration has not been run yet.
        if (!/foundation_stage/.test(String((err as Error).message))) throw err;
        rows = await load(`${assignment}, ${feedbackCols}`);
      }
    }

    const names = new Map<string, string>();
    if (!access.legacy) {
      const { data } = await getSupabase().from("counsellors").select("id, full_name, email");
      for (const c of data ?? []) names.set(c.id, c.full_name ?? c.email ?? "Counsellor");
    }

    const me = access.counsellor?.id ?? null;
    const contacts = rows.map(({ feedback, assigned_counsellor_id, whatsapp_status, foundation_stage, foundation_stage_updated_at, ...contact }) => {
      const entries = [...(feedback ?? [])].sort((a, b) =>
        (b.date_created ?? "").localeCompare(a.date_created ?? "")
      );
      return {
        ...contact,
        assignedCounsellorId: assigned_counsellor_id ?? null,
        assignedCounsellorName: assigned_counsellor_id ? names.get(assigned_counsellor_id) ?? null : null,
        whatsappStatus: whatsapp_status ?? "unknown",
        foundationStage: foundation_stage ?? null,
        foundationStageUpdatedAt: foundation_stage_updated_at ?? null,
        followedUpByMe: !!me && entries.some((e) => e.counsellor_id === me),
        feedbackCount: entries.length,
        lastFeedbackAt: entries[0]?.date_created ?? null,
        lastFeedbackBy: entries[0]?.initiator ?? null,
      };
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Follow-up fetch error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
