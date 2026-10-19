import "server-only";

// ---------- Shared helpers ----------

// 08012345678 / +2348012345678 / 2348012345678 -> 2348012345678
export function toInternational(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return null;
}

export interface Recipient {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

// Fills {firstName}, {lastName} and {name} in a message.
export function personalise(body: string, r: Recipient) {
  const first = r.firstName?.trim() || "friend";
  const full = [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "friend";
  return body
    .replace(/\{firstName\}/gi, first)
    .replace(/\{lastName\}/gi, r.lastName?.trim() ?? "")
    .replace(/\{name\}/gi, full);
}

export function hasPlaceholders(body: string) {
  return /\{(firstName|lastName|name)\}/i.test(body);
}

export interface SendResult {
  contactId: number;
  phone: string;
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

async function pool<T, R>(items: T[], size: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await run(items[i]);
      }
    })
  );
  return out;
}

// ---------- SMS via Termii (https://developers.termii.com) ----------

export function termiiConfigured() {
  return !!(process.env.TERMII_API_KEY && process.env.TERMII_SENDER_ID);
}

function termiiBase() {
  return (process.env.TERMII_BASE_URL || "https://api.ng.termii.com").replace(/\/$/, "");
}

export async function sendSms(recipients: Recipient[], body: string): Promise<SendResult[]> {
  const common = {
    api_key: process.env.TERMII_API_KEY,
    from: process.env.TERMII_SENDER_ID,
    type: "plain",
    // "generic" skips numbers on DND; "dnd" needs the route enabled on Termii.
    channel: process.env.TERMII_CHANNEL || "generic",
  };
  const valid = recipients
    .map((r) => ({ r, phone: toInternational(r.phone) }))
    .filter((x): x is { r: Recipient; phone: string } => !!x.phone);
  const invalid: SendResult[] = recipients
    .filter((r) => !toInternational(r.phone))
    .map((r) => ({ contactId: r.id, phone: r.phone ?? "", ok: false, error: "Invalid phone number" }));

  // Same text for everyone: one bulk call (Termii allows up to 10,000 numbers).
  if (!hasPlaceholders(body)) {
    if (!valid.length) return invalid;
    const res = await fetch(`${termiiBase()}/api/sms/send/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...common, to: valid.map((v) => v.phone), sms: body }),
    });
    const json = await res.json().catch(() => ({}));
    const ok = res.ok && !json?.code?.toString().startsWith("4");
    return [
      ...valid.map((v) => ({
        contactId: v.r.id,
        phone: v.phone,
        ok,
        providerMessageId: json?.message_id ? String(json.message_id) : undefined,
        error: ok ? undefined : json?.message ?? `Termii error ${res.status}`,
      })),
      ...invalid,
    ];
  }

  // Personalised text: one call per person.
  const sent = await pool(valid, 6, async ({ r, phone }): Promise<SendResult> => {
    try {
      const res = await fetch(`${termiiBase()}/api/sms/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...common, to: phone, sms: personalise(body, r) }),
      });
      const json = await res.json().catch(() => ({}));
      return res.ok
        ? { contactId: r.id, phone, ok: true, providerMessageId: json?.message_id ? String(json.message_id) : undefined }
        : { contactId: r.id, phone, ok: false, error: json?.message ?? `Termii error ${res.status}` };
    } catch (err) {
      return { contactId: r.id, phone, ok: false, error: (err as Error).message };
    }
  });
  return [...sent, ...invalid];
}

// ---------- WhatsApp Cloud API (Meta) ----------

export function whatsappConfigured() {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export interface TemplateChoice {
  name: string;
  language: string;
  // When true the contact's first name is sent as the template's {{1}}.
  firstNameParam: boolean;
}

// Business-started WhatsApp messages must use a template Meta has approved.
// Whether a number is on WhatsApp is reported later through the webhook
// (app/api/webhooks/whatsapp), not in this response.
export async function sendWhatsappTemplate(
  recipients: Recipient[],
  template: TemplateChoice
): Promise<SendResult[]> {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  return pool(recipients, 8, async (r): Promise<SendResult> => {
    const phone = toInternational(r.phone);
    if (!phone) return { contactId: r.id, phone: r.phone ?? "", ok: false, error: "Invalid phone number" };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: template.name,
            language: { code: template.language },
            ...(template.firstNameParam
              ? {
                  components: [
                    { type: "body", parameters: [{ type: "text", text: r.firstName?.trim() || "friend" }] },
                  ],
                }
              : {}),
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { contactId: r.id, phone, ok: false, error: json?.error?.message ?? `WhatsApp error ${res.status}` };
      }
      return { contactId: r.id, phone, ok: true, providerMessageId: json?.messages?.[0]?.id };
    } catch (err) {
      return { contactId: r.id, phone, ok: false, error: (err as Error).message };
    }
  });
}
