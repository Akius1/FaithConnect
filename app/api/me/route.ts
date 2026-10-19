import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/src/lib/supabase";
import { getCounsellorByClerkId, syncCounsellor } from "@/src/lib/counsellor";

// The signed-in counsellor's own record.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const counsellor =
      (await getCounsellorByClerkId(userId)) ?? (await syncCounsellor());
    if (!counsellor) {
      return NextResponse.json(
        { error: "Counsellor record not found. Has the counsellors migration been run?" },
        { status: 404 }
      );
    }
    return NextResponse.json(counsellor);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Lets a counsellor set their birthday when Google did not provide one.
export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { birth_day, birth_month, birth_year } = await request.json();
  const day = Number(birth_day);
  const month = Number(birth_month);
  const year = birth_year ? Number(birth_year) : null;

  const valid =
    Number.isInteger(day) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(year ?? 2000, month, 0).getDate() &&
    (year === null || (Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear()));
  if (!valid) {
    return NextResponse.json({ error: "Enter a valid birthday" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("counsellors")
    .update({
      birth_day: day,
      birth_month: month,
      birth_year: year,
      birthday_source: "manual",
    })
    .eq("clerk_user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Counsellor record not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
