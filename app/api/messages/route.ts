import { NextResponse } from "next/server";
import { requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";
import { termiiConfigured, whatsappConfigured } from "@/src/lib/messaging";

// Which channels are set up, and recent message batches (a counsellor sees
// their own; a super admin sees everyone's).
export async function GET() {
  const guard = await requireCounsellor();
  if (guard.error) return guard.error;
  const { access } = guard;

  const config = {
    sms: termiiConfigured(),
    whatsappApi: whatsappConfigured(),
    whatsappTemplate: process.env.WHATSAPP_TEMPLATE_NAME ?? "",
    whatsappLanguage: process.env.WHATSAPP_TEMPLATE_LANG ?? "en",
    inviteLink: process.env.NEXT_PUBLIC_CHURCH_WHATSAPP_LINK ?? "",
    historyEnabled: !access.legacy,
  };
  if (access.legacy) return NextResponse.json({ config, batches: [] });

  let query = getSupabase()
    .from("message_batches")
    .select("id, channel, mode, body, template_name, recipient_count, sent_count, failed_count, created_at, counsellors(full_name)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!access.isAdmin && access.counsellor) query = query.eq("counsellor_id", access.counsellor.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ config, batches: [], error: error.message });

  return NextResponse.json({ config, batches: data });
}
