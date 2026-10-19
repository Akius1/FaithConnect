import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AppShell from "@/src/components/AppShell";
import { syncCounsellor } from "@/src/lib/counsellor";
import { getAccess } from "@/src/lib/access";

// Second line of defence behind the middleware: nothing under this group
// renders without a Clerk session.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await syncCounsellor();
  const access = await getAccess().catch(() => null);

  if (access && !access.legacy && access.counsellor && !access.counsellor.is_active) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Your access is paused</h1>
          <p className="mt-2 text-gray-600">
            A super admin has paused your counsellor account. Ask them to switch it back on.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      viewer={{
        isAdmin: !!access?.isAdmin,
        legacy: !!access?.legacy,
        counsellorId: access?.counsellor?.id ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
