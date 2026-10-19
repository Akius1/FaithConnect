import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

// Meta calls this URL with delivery updates for WhatsApp Cloud API messages.
// This is how we learn whether a number is on WhatsApp: a "delivered" or
// "read" status means yes; error 131026 means the number cannot receive
// WhatsApp messages (usually because it is not on WhatsApp).

// Webhook verification when the URL is saved in the Meta dashboard.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    params.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const given = Buffer.from(header.slice(7));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

interface StatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  recipient_id: string;
  errors?: { code: number; title?: string; message?: string }[];
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(raw) as {
    entry?: { changes?: { value?: { statuses?: StatusUpdate[] } }[] }[];
  };
  const statuses = (payload.entry ?? []).flatMap((e) =>
    (e.changes ?? []).flatMap((c) => c.value?.statuses ?? [])
  );

  const supabase = getSupabase();
  for (const s of statuses) {
    const notOnWhatsapp = s.status === "failed" && s.errors?.some((e) => e.code === 131026);
    const reached = s.status === "delivered" || s.status === "read";
    if (!notOnWhatsapp && !reached && s.status !== "failed") continue;

    const { data: delivery } = await supabase
      .from("message_deliveries")
      .update({
        status: notOnWhatsapp ? "not_on_whatsapp" : s.status === "failed" ? "failed" : "sent",
        error: s.errors?.map((e) => e.title ?? e.message).join("; ") || null,
      })
      .eq("provider_message_id", s.id)
      .select("contact_id")
      .maybeSingle();

    if (delivery?.contact_id && (notOnWhatsapp || reached)) {
      await supabase
        .from("contacts")
        .update({
          whatsapp_status: notOnWhatsapp ? "not_on_whatsapp" : "on_whatsapp",
          whatsapp_checked_at: new Date().toISOString(),
        })
        .eq("id", delivery.contact_id);
    }
  }

  return NextResponse.json({ ok: true });
}
