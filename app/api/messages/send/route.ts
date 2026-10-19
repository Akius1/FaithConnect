import { NextResponse } from "next/server";
import { requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";
import {
  sendSms,
  sendWhatsappTemplate,
  termiiConfigured,
  toInternational,
  whatsappConfigured,
  type Recipient,
  type SendResult,
} from "@/src/lib/messaging";

// Each call handles one chunk so it fits in a serverless request; the page
// sends large lists in several chunks under the same batch id.
const MAX_PER_CALL = 100;

interface Body {
  channel: "sms" | "whatsapp";
  mode: "termii" | "cloud_api" | "manual";
  contactIds: (string | number)[];
  body?: string;
  template?: { name: string; language: string; firstNameParam: boolean };
  batchId?: string;
  totalRecipients?: number;
  filters?: unknown;
}

export async function POST(request: Request) {
  const guard = await requireCounsellor();
  if (guard.error) return guard.error;
  const { access } = guard;
  const input = (await request.json()) as Body;

  const ids = [...new Set((input.contactIds ?? []).map(Number).filter(Number.isFinite))];
  if (!ids.length) return NextResponse.json({ error: "No recipients" }, { status: 400 });
  if (ids.length > MAX_PER_CALL) {
    return NextResponse.json({ error: `Send at most ${MAX_PER_CALL} per request` }, { status: 400 });
  }

  const validMode =
    (input.channel === "sms" && input.mode === "termii") ||
    (input.channel === "whatsapp" && (input.mode === "cloud_api" || input.mode === "manual"));
  if (!validMode) return NextResponse.json({ error: "Unknown channel or mode" }, { status: 400 });
  if (input.mode === "termii" && !termiiConfigured()) {
    return NextResponse.json({ error: "SMS is not set up yet. Add the Termii keys." }, { status: 501 });
  }
  if (input.mode === "cloud_api" && !whatsappConfigured()) {
    return NextResponse.json({ error: "WhatsApp Cloud API is not set up yet." }, { status: 501 });
  }
  if (input.mode !== "cloud_api" && !input.body?.trim()) {
    return NextResponse.json({ error: "Write a message first" }, { status: 400 });
  }
  if (input.mode === "cloud_api" && !input.template?.name) {
    return NextResponse.json({ error: "Choose an approved WhatsApp template" }, { status: 400 });
  }

  const supabase = getSupabase();
  let query = supabase.from("contacts").select("id, firstName, lastName, phone").in("id", ids);
  // Any counsellor may message one person, whoever they are. Bulk sends (more
  // than one recipient) are limited to a counsellor's assigned contacts;
  // super admins can bulk send to anyone.
  const single = ids.length === 1 && !input.batchId && (input.totalRecipients ?? 1) <= 1;
  if (!access.isAdmin && !single) {
    if (!access.counsellor) {
      return NextResponse.json({ error: "Only assigned counsellors can send bulk messages" }, { status: 403 });
    }
    query = query.eq("assigned_counsellor_id", access.counsellor.id);
  }
  const { data: contacts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const recipients = (contacts ?? []) as Recipient[];

  // Log the batch (skipped until the migration has been run).
  let batchId = input.batchId ?? null;
  if (!access.legacy && !batchId) {
    const { data: batch, error: batchError } = await supabase
      .from("message_batches")
      .insert({
        channel: input.channel,
        mode: input.mode,
        body: input.body ?? null,
        template_name: input.template?.name ?? null,
        counsellor_id: access.counsellor?.id ?? null,
        recipient_count: input.totalRecipients ?? recipients.length,
        filters: input.filters ?? null,
      })
      .select("id")
      .single();
    if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 });
    batchId = batch.id;
  }

  // Manual WhatsApp: nothing is sent from the server. The page opens each
  // chat and reports back through PATCH /api/messages/[batchId].
  if (input.mode === "manual") {
    if (batchId) {
      await supabase.from("message_deliveries").insert(
        recipients.map((r) => ({
          batch_id: batchId,
          contact_id: r.id,
          phone: toInternational(r.phone) ?? r.phone ?? "",
          status: "queued",
        }))
      );
    }
    return NextResponse.json({ batchId, queued: recipients.length });
  }

  const results: SendResult[] =
    input.mode === "termii"
      ? await sendSms(recipients, input.body!.trim())
      : await sendWhatsappTemplate(recipients, input.template!);

  if (batchId) {
    await supabase.from("message_deliveries").insert(
      results.map((r) => ({
        batch_id: batchId,
        contact_id: r.contactId,
        phone: r.phone,
        status: r.ok ? "sent" : "failed",
        error: r.error ?? null,
        provider_message_id: r.providerMessageId ?? null,
      }))
    );
    const sent = results.filter((r) => r.ok).length;
    const { data: current } = await supabase
      .from("message_batches")
      .select("sent_count, failed_count")
      .eq("id", batchId)
      .single();
    await supabase
      .from("message_batches")
      .update({
        sent_count: (current?.sent_count ?? 0) + sent,
        failed_count: (current?.failed_count ?? 0) + (results.length - sent),
      })
      .eq("id", batchId);
  }

  return NextResponse.json({
    batchId,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).map((r) => ({ contactId: r.contactId, error: r.error })),
    skipped: ids.length - recipients.length,
  });
}
