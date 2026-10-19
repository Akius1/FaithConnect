import "server-only";
import { cache } from "react";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "./supabase";
import { getCounsellorByClerkId, syncCounsellor, type Counsellor } from "./counsellor";

export interface Access {
  counsellor: Counsellor | null;
  isAdmin: boolean;
  // True only while the counsellors migration has not been run: the app then
  // behaves as before (everyone sees everything) instead of locking people out.
  legacy: boolean;
}

function isMissingTable(err: unknown) {
  return /relation .*counsellors.* does not exist|42P01/i.test(String((err as Error)?.message ?? err));
}

// Resolved once per request.
export const getAccess = cache(async (): Promise<Access | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const counsellor = (await getCounsellorByClerkId(userId)) ?? (await syncCounsellor());
    return {
      counsellor,
      isAdmin: counsellor?.role === "super_admin",
      legacy: false,
    };
  } catch (err) {
    if (isMissingTable(err)) return { counsellor: null, isAdmin: true, legacy: true };
    throw err;
  }
});

type Guard = { access: Access; error?: undefined } | { access?: undefined; error: NextResponse };

// For route handlers: a signed-in, active counsellor (or legacy mode).
export async function requireCounsellor(): Promise<Guard> {
  const access = await getAccess();
  if (!access) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!access.legacy && (!access.counsellor || !access.counsellor.is_active)) {
    return {
      error: NextResponse.json({ error: "Your counsellor access is not active." }, { status: 403 }),
    };
  }
  return { access };
}

export async function requireAdmin(): Promise<Guard> {
  const guard = await requireCounsellor();
  if (guard.error) return guard;
  if (!guard.access.isAdmin) {
    return { error: NextResponse.json({ error: "Only a super admin can do this." }, { status: 403 }) };
  }
  return guard;
}

// Ids of contacts a counsellor has written feedback for.
async function followedUpContactIds(counsellorId: string): Promise<number[]> {
  const { data, error } = await getSupabase()
    .from("feedback")
    .select("contact_id")
    .eq("counsellor_id", counsellorId);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((r) => Number(r.contact_id)))];
}

// PostgREST "or" filter limiting contacts to what this counsellor may see:
// assigned to them, or followed up by them. Null means no limit.
export async function contactScopeFilter(access: Access): Promise<string | null> {
  if (access.isAdmin || !access.counsellor) return null;
  const ids = await followedUpContactIds(access.counsellor.id);
  const parts = [`assigned_counsellor_id.eq.${access.counsellor.id}`];
  if (ids.length) parts.push(`id.in.(${ids.join(",")})`);
  return parts.join(",");
}

export async function canSeeContact(access: Access, contactId: string | number): Promise<boolean> {
  if (access.isAdmin || !access.counsellor) return true;
  const { data } = await getSupabase()
    .from("contacts")
    .select("assigned_counsellor_id")
    .eq("id", contactId)
    .maybeSingle();
  if (data?.assigned_counsellor_id === access.counsellor.id) return true;
  const { count } = await getSupabase()
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId)
    .eq("counsellor_id", access.counsellor.id);
  return (count ?? 0) > 0;
}
