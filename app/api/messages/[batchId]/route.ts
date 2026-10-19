import { NextResponse } from "next/server";
import { requireCounsellor } from "@/src/lib/access";
import { getSupabase } from "@/src/lib/supabase";

// Manual WhatsApp queue: the page reports each chat it opened (or skipped).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const guard = await requireCounsellor();
  if (guard.error) return guard.error;
  if (guard.access.legacy) return NextResponse.json({ ok: true });
  const { batchId } = await params;
  const { contactId, status } = (await request.json()) as {
    contactId: number | string;
    status: "sent" | "skipped";
  };
  if (!["sent", "skipped"].includes(status)) {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: batch } = await supabase
    .from("message_batches")
    .select("id, counsellor_id, sent_count")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  if (!guard.access.isAdmin && batch.counsellor_id !== guard.access.counsellor?.id) {
    return NextResponse.json({ error: "Not your batch" }, { status: 403 });
  }

  const { data: updated } = await supabase
    .from("message_deliveries")
    .update({ status })
    .eq("batch_id", batchId)
    .eq("contact_id", contactId)
    .eq("status", "queued")
    .select("id");
  if (status === "sent" && updated?.length) {
    await supabase
      .from("message_batches")
      .update({ sent_count: (batch.sent_count ?? 0) + updated.length })
      .eq("id", batchId);
  }
  return NextResponse.json({ ok: true });
}
