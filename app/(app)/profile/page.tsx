import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Header from "@/src/components/Header";
import BirthdayForm from "@/src/components/Profile/BirthdayForm";
import { getCounsellorByClerkId, type Counsellor } from "@/src/lib/counsellor";

export const metadata = { title: "My Profile - Faith Connect" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatBirthday(c: Counsellor) {
  if (!c.birth_day || !c.birth_month) return null;
  const base = `${MONTHS[c.birth_month - 1]} ${c.birth_day}`;
  return c.birth_year ? `${base}, ${c.birth_year}` : base;
}

export default async function ProfilePage() {
  const { userId } = await auth();
  const counsellor = userId
    ? await getCounsellorByClerkId(userId).catch(() => null)
    : null;

  return (
    <>
      <Header appName="My Profile" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl">
        {!counsellor ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-semibold">Your counsellor record is not available yet.</p>
            <p className="mt-1 text-sm">
              Check that the counsellors migration has been run on Supabase, then reload
              this page.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              {counsellor.image_url && (
                <Image
                  src={counsellor.image_url}
                  alt=""
                  width={72}
                  height={72}
                  className="rounded-full border-2 border-indigo-100"
                />
              )}
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {counsellor.full_name ?? "Counsellor"}
                </h2>
                <p className="text-gray-600 truncate">{counsellor.email}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Counsellor since{" "}
                  {new Date(counsellor.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900">Birthday</h3>
              <p className="mt-1 text-sm text-gray-600">
                {formatBirthday(counsellor) ? (
                  <>
                    <span className="font-medium text-gray-900">
                      {formatBirthday(counsellor)}
                    </span>
                    {counsellor.birthday_source === "google" && " (from your Google account)"}
                  </>
                ) : (
                  "Google did not share a birthday for your account. Add it below."
                )}
              </p>
              <BirthdayForm
                initial={{
                  day: counsellor.birth_day,
                  month: counsellor.birth_month,
                  year: counsellor.birth_year,
                }}
                months={MONTHS}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
