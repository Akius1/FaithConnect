import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { getSupabase } from "./supabase";

export interface Counsellor {
  id: string;
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  image_url: string | null;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  birthday_source: "google" | "manual" | null;
  role: "super_admin" | "counsellor";
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

// How often the Clerk profile is copied into Supabase again.
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;

// Emails listed in SUPER_ADMIN_EMAILS (comma separated) are made super admins
// when they sign in. Roles can also be changed later on the Counsellors page.
function isConfiguredSuperAdmin(email: string | null) {
  if (!email) return false;
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function getCounsellorByClerkId(
  clerkUserId: string
): Promise<Counsellor | null> {
  const { data, error } = await getSupabase()
    .from("counsellors")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Counsellor | null;
}

// Makes sure the signed-in Clerk user has a counsellors row. Runs from the app
// layout, so it is cheap when the row is fresh and never blocks the page.
export async function syncCounsellor(): Promise<Counsellor | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const existing = await getCounsellorByClerkId(userId);
    const fresh =
      existing?.last_seen_at &&
      Date.now() - new Date(existing.last_seen_at).getTime() < REFRESH_AFTER_MS;
    const needsPromotion =
      existing?.role !== "super_admin" && isConfiguredSuperAdmin(existing?.email ?? null);
    if (existing && fresh && !needsPromotion) return existing;

    const user = await currentUser();
    if (!user) return existing;

    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      email;

    const row: Partial<Counsellor> = {
      clerk_user_id: userId,
      email,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: fullName,
      image_url: user.imageUrl,
      last_seen_at: new Date().toISOString(),
    };
    if (isConfiguredSuperAdmin(email)) row.role = "super_admin";

    // A birthday the counsellor typed in is never overwritten by Google.
    if (existing?.birthday_source !== "manual") {
      const birthday = await fetchGoogleBirthday(userId);
      if (birthday) Object.assign(row, birthday, { birthday_source: "google" });
    }

    const { data, error } = await getSupabase()
      .from("counsellors")
      .upsert(row, { onConflict: "clerk_user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Counsellor;
  } catch (err) {
    console.error("Counsellor sync failed:", err);
    return null;
  }
}

// Google only shares a birthday when the Clerk Google connection requests the
// user.birthday.read scope and the person has one on their Google account.
async function fetchGoogleBirthday(
  userId: string
): Promise<Pick<Counsellor, "birth_day" | "birth_month" | "birth_year"> | null> {
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "google");
    const token = tokens.data[0]?.token;
    if (!token) return null;

    const res = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=birthdays",
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return null;

    const body = (await res.json()) as {
      birthdays?: {
        metadata?: { primary?: boolean };
        date?: { year?: number; month?: number; day?: number };
      }[];
    };
    const dated = (body.birthdays ?? []).filter((b) => b.date?.month && b.date?.day);
    const pick = dated.find((b) => b.metadata?.primary) ?? dated[0];
    if (!pick?.date) return null;

    return {
      birth_day: pick.date.day ?? null,
      birth_month: pick.date.month ?? null,
      birth_year: pick.date.year ?? null,
    };
  } catch {
    return null;
  }
}
