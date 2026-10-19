import { redirect } from "next/navigation";
import CounsellorsList from "@/src/components/Counsellors";
import { getAccess } from "@/src/lib/access";

export const metadata = { title: "Counsellors - Faith Connect" };

export default async function CounsellorsPage() {
  const access = await getAccess().catch(() => null);
  if (!access?.isAdmin || access.legacy) redirect("/dashboard");
  return <CounsellorsList meId={access.counsellor?.id ?? null} />;
}
