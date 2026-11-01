import { redirect } from "next/navigation";
import Reports from "@/src/components/Reports";
import { getAccess } from "@/src/lib/access";

export const metadata = { title: "Reports - Faith Connect" };

export default async function ReportsPage() {
  const access = await getAccess().catch(() => null);
  if (!access?.isAdmin) redirect("/dashboard");
  return <Reports />;
}
