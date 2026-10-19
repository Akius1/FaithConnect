"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict, subDays } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import {
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DevicePhoneMobileIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";
import { useViewer } from "@/src/components/AppShell";
import type { FollowUpContact } from "@/src/components/FollowUp";
import {
  CONTACT_TYPES,
  FEEDBACK_ROUNDS,
  SERVICE_TYPES,
  feedbackRound,
  serviceTypeLabel,
  type FeedbackRound,
} from "@/src/lib/constants";

type Contact = FollowUpContact;
type Channel = "sms" | "whatsapp";
type WaMode = "manual" | "cloud_api";

interface Config {
  sms: boolean;
  whatsappApi: boolean;
  whatsappTemplate: string;
  whatsappLanguage: string;
  inviteLink: string;
  historyEnabled: boolean;
}

interface Batch {
  id: string;
  channel: Channel;
  mode: string;
  body: string | null;
  template_name: string | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  counsellors: { full_name: string | null } | null;
}

const CHUNK = 100;

interface SendReply {
  batchId?: string | null;
  error?: string;
  failed?: { contactId: number; error?: string }[];
}
const OTHER = "__other";
const KNOWN = new Set(SERVICE_TYPES.map((s) => s.value));

const PRESETS = (invite: string) => [
  {
    label: "Welcome",
    text: "Hello {firstName}, thank you for worshipping with us. We are glad you came and we would love to see you again this Sunday. God bless you!",
  },
  {
    label: "Check-in",
    text: "Hi {firstName}, just checking in on you this week. How are you doing? Is there anything we can pray with you about?",
  },
  {
    label: "Service reminder",
    text: "Hello {firstName}, a reminder that service starts at 8am this Sunday. We look forward to seeing you!",
  },
  {
    label: "WhatsApp invite",
    text: `Hello {firstName}, join our church family on WhatsApp to get updates and prayer support: ${
      invite || "<add your WhatsApp link>"
    }`,
  },
];

function nameOf(c: Contact) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}

function fill(body: string, c: Contact) {
  const first = c.firstName?.trim() || "friend";
  return body
    .replace(/\{firstName\}/gi, first)
    .replace(/\{lastName\}/gi, c.lastName?.trim() ?? "")
    .replace(/\{name\}/gi, [c.firstName, c.lastName].filter(Boolean).join(" ") || "friend");
}

function waNumber(phone: string | null) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return `234${d.slice(1)}`;
  return d;
}

// GSM SMS: 160 characters for one part, 153 per part after that.
function smsParts(text: string) {
  if (!text) return 0;
  return text.length <= 160 ? 1 : Math.ceil(text.length / 153);
}

export default function Messages() {
  const viewer = useViewer();
  const isAdmin = viewer.isAdmin && !viewer.legacy;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Audience filters
  const [type, setType] = useState("all");
  const [service, setService] = useState("all");
  const [round, setRound] = useState<"all" | FeedbackRound>("all");
  const [district, setDistrict] = useState("all");
  const [owner, setOwner] = useState("all");
  const [waStatus, setWaStatus] = useState("all");
  const [added, setAdded] = useState("all");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [showList, setShowList] = useState(false);

  // "group" = bulk send using the filters; "one" = a single person found by search.
  const [audienceMode, setAudienceMode] = useState<"group" | "one">("group");
  const [lookup, setLookup] = useState("");
  const [lookupResults, setLookupResults] = useState<Contact[]>([]);
  const [person, setPerson] = useState<Contact | null>(null);

  // Message
  const [channel, setChannel] = useState<Channel>("sms");
  const [waMode, setWaMode] = useState<WaMode>("manual");
  const [body, setBody] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateLang, setTemplateLang] = useState("en");
  const [firstNameParam, setFirstNameParam] = useState(true);

  // Sending
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);
  const [queue, setQueue] = useState<{ batchId: string | null; list: Contact[]; index: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        fetch("/api/follow-up", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/messages", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (Array.isArray(c)) setContacts(c);
      if (m?.config) {
        setConfig(m.config);
        setTemplateName((t) => t || m.config.whatsappTemplate);
        setTemplateLang(m.config.whatsappLanguage || "en");
      }
      setBatches(m?.batches ?? []);
    } catch {
      toast.error("Could not load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const districts = useMemo(
    () => [...new Set(contacts.map((c) => c.district).filter(Boolean) as string[])].sort(),
    [contacts]
  );
  const counsellors = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => {
      if (c.assignedCounsellorId) map.set(c.assignedCounsellorId, c.assignedCounsellorName ?? "Counsellor");
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [contacts]);

  const audience = useMemo(() => {
    const since =
      added === "all" ? null : subDays(new Date(), Number(added)).toISOString().slice(0, 10);
    return contacts.filter((c) => {
      if (type !== "all" && c.contactType?.toLowerCase() !== type) return false;
      if (service !== "all") {
        const v = c.serviceType?.toLowerCase() ?? "";
        if (service === OTHER ? KNOWN.has(v) : v !== service) return false;
      }
      if (round !== "all" && feedbackRound(c.feedbackCount) !== round) return false;
      if (district !== "all" && c.district !== district) return false;
      if (owner !== "all") {
        if (owner === "__none" ? c.assignedCounsellorId : c.assignedCounsellorId !== owner) return false;
      }
      if (waStatus !== "all" && (c.whatsappStatus ?? "unknown") !== waStatus) return false;
      if (since && (c.contactDate ?? "") < since) return false;
      // Counsellors message only the people assigned to them.
      if (!isAdmin && !viewer.legacy && c.assignedCounsellorId !== viewer.counsellorId) return false;
      return !!c.phone;
    });
  }, [contacts, type, service, round, district, owner, waStatus, added, isAdmin, viewer]);

  const groupRecipients = useMemo(
    () => audience.filter((c) => !excluded.has(c.id)),
    [audience, excluded]
  );
  const recipients = useMemo(
    () => (audienceMode === "one" ? (person ? [person] : []) : groupRecipients),
    [audienceMode, person, groupRecipients]
  );

  // Any counsellor can look up any new member to message them one-to-one.
  useEffect(() => {
    if (audienceMode !== "one" || lookup.trim().length < 2) {
      setLookupResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contacts/lookup?q=${encodeURIComponent(lookup.trim())}`);
        const list = res.ok ? await res.json() : [];
        setLookupResults(
          (list as Contact[]).map((c) => ({ ...c, id: String(c.id), feedbackCount: 0 } as Contact))
        );
      } catch {
        setLookupResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [lookup, audienceMode]);

  useEffect(() => setExcluded(new Set()), [type, service, round, district, owner, waStatus, added]);

  const usingTemplate = channel === "whatsapp" && waMode === "cloud_api";
  const channelReady =
    channel === "sms" ? !!config?.sms : waMode === "manual" ? true : !!config?.whatsappApi;
  const canSend =
    recipients.length > 0 && channelReady && (usingTemplate ? !!templateName.trim() : !!body.trim());

  const sample = recipients[0];

  async function send() {
    setConfirming(false);
    const filters = { type, service, round, district, owner, waStatus, added };

    if (channel === "whatsapp" && waMode === "manual") {
      // Log the batch, then walk through the chats one by one.
      let batchId: string | null = null;
      for (let i = 0; i < recipients.length; i += CHUNK) {
        const res: Response = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "whatsapp",
            mode: "manual",
            contactIds: recipients.slice(i, i + CHUNK).map((c) => c.id),
            body,
            batchId,
            totalRecipients: recipients.length,
            filters,
          }),
        });
        const json: SendReply = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Could not start");
          return;
        }
        batchId = json.batchId ?? batchId;
      }
      setQueue({ batchId, list: recipients, index: 0 });
      return;
    }

    setProgress({ done: 0, total: recipients.length, failed: 0 });
    let batchId: string | null = null;
    let failed = 0;
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const chunk = recipients.slice(i, i + CHUNK);
      try {
        const res: Response = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            mode: channel === "sms" ? "termii" : "cloud_api",
            contactIds: chunk.map((c) => c.id),
            body,
            template: usingTemplate
              ? { name: templateName.trim(), language: templateLang.trim() || "en", firstNameParam }
              : undefined,
            batchId,
            totalRecipients: recipients.length,
            filters,
          }),
        });
        const json: SendReply = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Send failed");
        batchId = json.batchId ?? batchId;
        failed += json.failed?.length ?? 0;
      } catch (err) {
        failed += chunk.length;
        toast.error((err as Error).message);
        if (i === 0) {
          setProgress(null);
          return;
        }
      }
      setProgress({ done: Math.min(i + CHUNK, recipients.length), total: recipients.length, failed });
    }
    toast.success(`Sent to ${recipients.length - failed} of ${recipients.length}`);
    load();
  }

  async function markQueued(status: "sent" | "skipped") {
    if (!queue) return;
    const current = queue.list[queue.index];
    if (queue.batchId) {
      fetch(`/api/messages/${queue.batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: current.id, status }),
      }).catch(() => undefined);
    }
    setQueue({ ...queue, index: queue.index + 1 });
  }

  const preview = sample && !usingTemplate ? fill(body, sample) : body;

  return (
    <>
      <Toaster position="top-right" />
      <Header appName="Messages" />

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Channel picker */}
        <section className="grid gap-3 sm:grid-cols-2">
          <ChannelCard
            active={channel === "sms"}
            onClick={() => setChannel("sms")}
            icon={DevicePhoneMobileIcon}
            title="Bulk SMS"
            subtitle="Reaches every phone, WhatsApp or not"
            status={config ? (config.sms ? "Connected" : "Needs Termii keys") : "..."}
            ok={!!config?.sms}
          />
          <ChannelCard
            active={channel === "whatsapp"}
            onClick={() => setChannel("whatsapp")}
            icon={ChatBubbleLeftEllipsisIcon}
            title="Bulk WhatsApp"
            subtitle="Free one-by-one, or automatic with the Cloud API"
            status={config ? (config.whatsappApi ? "Cloud API connected" : "Free mode ready") : "..."}
            ok
          />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
          {/* Audience */}
          <section className="fc-rise rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">1. Who should get it?</h2>
                <p className="text-sm text-gray-500">
                  {audienceMode === "one"
                    ? "Find any new member by name or phone."
                    : isAdmin
                    ? "Pick any group of contacts."
                    : "Bulk messages go to the people assigned to you."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 sm:w-64">
                {(["group", "one"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAudienceMode(m)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                      audienceMode === m ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {m === "group" ? "A group" : "One person"}
                  </button>
                ))}
              </div>
            </div>

            {audienceMode === "one" ? (
              <div className="mt-4">
                {person ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{nameOf(person)}</p>
                      <p className="text-sm text-gray-600">
                        {person.phone} · {serviceTypeLabel(person.serviceType)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPerson(null);
                        setLookup("");
                      }}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="search"
                      value={lookup}
                      onChange={(e) => setLookup(e.target.value)}
                      placeholder="Type a name or phone number"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                    {lookupResults.length > 0 && (
                      <ul className="mt-2 divide-y divide-gray-50 overflow-hidden rounded-2xl border border-gray-100">
                        {lookupResults.map((c) => (
                          <li key={c.id}>
                            <button
                              onClick={() => setPerson(c)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-indigo-50/50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-gray-900">{nameOf(c)}</span>
                                <span className="block text-xs text-gray-500">{c.phone}</span>
                              </span>
                              <span className="text-xs text-gray-400">{serviceTypeLabel(c.serviceType)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {lookup.trim().length >= 2 && lookupResults.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">No match yet. Keep typing.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
            <>
            <div className="mt-4 space-y-3">
              <Row label="Who">
                <Pill active={type === "all"} onClick={() => setType("all")}>Everyone</Pill>
                {CONTACT_TYPES.map((t) => (
                  <Pill key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                    {t.label}s
                  </Pill>
                ))}
              </Row>
              <Row label="Service">
                <Pill active={service === "all"} onClick={() => setService("all")}>All</Pill>
                {SERVICE_TYPES.map((s) => (
                  <Pill key={s.value} active={service === s.value} onClick={() => setService(s.value)}>
                    {s.label}
                  </Pill>
                ))}
                <Pill active={service === OTHER} onClick={() => setService(OTHER)}>Other</Pill>
              </Row>
              <Row label="Follow-up">
                <Pill active={round === "all"} onClick={() => setRound("all")}>Any</Pill>
                {FEEDBACK_ROUNDS.map((r) => (
                  <Pill key={r.value} active={round === r.value} onClick={() => setRound(r.value)}>
                    {r.short}
                  </Pill>
                ))}
              </Row>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Select label="District" value={district} onChange={setDistrict}>
                  <option value="all">All districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
                <Select label="Added" value={added} onChange={setAdded}>
                  <option value="all">Any time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                </Select>
                <Select label="WhatsApp" value={waStatus} onChange={setWaStatus}>
                  <option value="all">Any</option>
                  <option value="on_whatsapp">On WhatsApp</option>
                  <option value="not_on_whatsapp">Not on WhatsApp</option>
                  <option value="unknown">Not checked yet</option>
                </Select>
                {isAdmin && (
                  <Select label="Counsellor" value={owner} onChange={setOwner}>
                    <option value="all">Anyone</option>
                    <option value="__none">Not assigned</option>
                    {counsellors.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold tabular-nums text-gray-900">
                    {loading ? "..." : recipients.length.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {excluded.size ? `${excluded.size} removed by hand` : "people will get this message"}
                  </p>
                </div>
                <button
                  onClick={() => setShowList((s) => !s)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
                >
                  {showList ? "Hide list" : "Review list"}
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showList ? "rotate-180" : ""}`} />
                </button>
              </div>
              {showList && (
                <ul className="mt-3 max-h-80 divide-y divide-white overflow-y-auto rounded-xl bg-white/70">
                  {audience.slice(0, 500).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!excluded.has(c.id)}
                        onChange={() =>
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            return next;
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{nameOf(c)}</p>
                        <p className="truncate text-xs text-gray-500">
                          {c.phone} · {serviceTypeLabel(c.serviceType)}
                        </p>
                      </div>
                      {c.whatsappStatus === "not_on_whatsapp" && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                          No WhatsApp
                        </span>
                      )}
                    </li>
                  ))}
                  {audience.length > 500 && (
                    <li className="px-3 py-2 text-xs text-gray-500">
                      Showing the first 500. Narrow the filters to review the rest.
                    </li>
                  )}
                </ul>
              )}
            </div>
            </>
            )}
          </section>

          {/* Composer */}
          <section
            className="fc-rise h-fit rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24"
            style={{ animationDelay: "0.08s" }}
          >
            <h2 className="text-lg font-bold text-gray-900">2. Your message</h2>

            {channel === "whatsapp" && (
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
                <button
                  onClick={() => setWaMode("manual")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${waMode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                >
                  Free: one by one
                </button>
                <button
                  onClick={() => setWaMode("cloud_api")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${waMode === "cloud_api" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                >
                  Automatic (API)
                </button>
              </div>
            )}

            {channel === "sms" && config && !config.sms && (
              <Notice>
                SMS sending needs a Termii account. Add <code>TERMII_API_KEY</code> and{" "}
                <code>TERMII_SENDER_ID</code> to the environment, then reload.
              </Notice>
            )}
            {channel === "whatsapp" && waMode === "manual" && (
              <Notice tone="info">
                Free and works now: we open each chat in WhatsApp with your message typed in, you press
                send, and we move to the next person. Best for up to a few dozen people at a time.
              </Notice>
            )}
            {usingTemplate && config && !config.whatsappApi && (
              <Notice>
                Automatic WhatsApp needs the Meta WhatsApp Cloud API. Add{" "}
                <code>WHATSAPP_ACCESS_TOKEN</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code>, then reload.
              </Notice>
            )}

            {usingTemplate ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  WhatsApp only lets churches and businesses start a chat with a template Meta has
                  approved. Enter the template name from your WhatsApp Manager.
                </p>
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. sunday_welcome"
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                  <input
                    value={templateLang}
                    onChange={(e) => setTemplateLang(e.target.value)}
                    placeholder="en"
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={firstNameParam}
                    onChange={(e) => setFirstNameParam(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  Fill the template&apos;s {"{{1}}"} with each person&apos;s first name
                </label>
              </div>
            ) : (
              <>
                <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
                  {PRESETS(config?.inviteLink ?? "").map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setBody(p.text)}
                      className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Type your message. Use {firstName} to greet each person by name."
                  className="mt-3 w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <div className="flex gap-1.5">
                    {["{firstName}", "{name}"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setBody((b) => `${b}${b.endsWith(" ") || !b ? "" : " "}${tag}`)}
                        className="rounded-lg bg-indigo-50 px-2 py-1 font-mono text-indigo-700 hover:bg-indigo-100"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {channel === "sms" && (
                    <span>
                      {body.length} characters · {smsParts(body)} SMS each
                      {recipients.length > 0 && body ? ` · about ${(smsParts(body) * recipients.length).toLocaleString()} units` : ""}
                    </span>
                  )}
                </div>

                {sample && body && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Preview for {nameOf(sample)}
                    </p>
                    <div
                      className={`mt-2 max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm ${
                        channel === "whatsapp" ? "bg-[#dcf8c6] text-gray-900" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {preview}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              disabled={!canSend || !!progress}
              onClick={() => setConfirming(true)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {channel === "whatsapp" && waMode === "manual"
                ? `Start WhatsApp queue (${recipients.length})`
                : `Send to ${recipients.length.toLocaleString()} ${recipients.length === 1 ? "person" : "people"}`}
            </button>

            {progress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {progress.done < progress.total ? "Sending..." : "Done"} {progress.done}/{progress.total}
                  </span>
                  {progress.failed > 0 && <span className="text-rose-600">{progress.failed} failed</span>}
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-500"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                {progress.done >= progress.total && (
                  <button onClick={() => setProgress(null)} className="mt-2 text-sm font-semibold text-indigo-600">
                    Send another
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* History */}
        {config?.historyEnabled && (
          <section className="rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-900">Recent messages</h2>
            </div>
            {batches.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">Nothing sent yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {batches.map((b) => (
                  <li key={b.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <span
                      className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        b.channel === "sms" ? "bg-sky-50 text-sky-700" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {b.channel === "sms" ? "SMS" : b.mode === "manual" ? "WhatsApp (manual)" : "WhatsApp"}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm text-gray-700">
                      {b.template_name ? `Template: ${b.template_name}` : b.body}
                    </p>
                    <p className="whitespace-nowrap text-xs text-gray-500">
                      {b.sent_count}/{b.recipient_count} sent
                      {b.failed_count ? ` · ${b.failed_count} failed` : ""} ·{" "}
                      {b.counsellors?.full_name ?? "Someone"} ·{" "}
                      {formatDistanceToNowStrict(new Date(b.created_at), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* Confirm */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900">
              Send to {recipients.length.toLocaleString()} {recipients.length === 1 ? "person" : "people"}?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {channel === "sms"
                ? `This uses about ${(smsParts(body) * recipients.length).toLocaleString()} SMS units from your Termii balance.`
                : waMode === "manual"
                ? "We will open each chat in WhatsApp so you can press send."
                : `Template "${templateName}" goes out now. Meta charges per message started.`}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={send}
                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Yes, send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual WhatsApp queue */}
      {queue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <button
              onClick={() => {
                setQueue(null);
                load();
              }}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            {queue.index < queue.list.length ? (
              <>
                <p className="text-sm font-semibold text-green-700">
                  WhatsApp {queue.index + 1} of {queue.list.length}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-green-500 transition-[width] duration-300"
                    style={{ width: `${(queue.index / queue.list.length) * 100}%` }}
                  />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{nameOf(queue.list[queue.index])}</h3>
                <p className="text-sm text-gray-500">{queue.list[queue.index].phone}</p>
                <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-4 py-3 text-sm">
                  {fill(body, queue.list[queue.index])}
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  <a
                    href={`https://wa.me/${waNumber(queue.list[queue.index].phone)}?text=${encodeURIComponent(
                      fill(body, queue.list[queue.index])
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markQueued("sent")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                    Open WhatsApp & next
                  </a>
                  <button
                    onClick={() => markQueued("skipped")}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-3 text-xl font-bold text-gray-900">All done</h3>
                <p className="mt-1 text-sm text-gray-500">You went through {queue.list.length} chats.</p>
                <button
                  onClick={() => {
                    setQueue(null);
                    load();
                  }}
                  className="mt-5 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ChannelCard({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  status,
  ok,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  status: string;
  ok: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`fc-rise flex items-center gap-4 rounded-3xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 sm:p-5 ${
        active ? "border-indigo-500 bg-white shadow-lg shadow-indigo-500/10" : "border-transparent bg-white shadow-sm"
      }`}
    >
      <span
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
          active ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-gray-900">{title}</span>
        <span className="block text-sm text-gray-500">{subtitle}</span>
      </span>
      <span
        className={`hidden whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${
          ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {status}
      </span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 md:flex-row md:items-start">
      <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 md:w-24 md:pt-1.5">
        {label}
      </span>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
        {children}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium normal-case tracking-normal text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        {children}
      </select>
    </label>
  );
}

function Notice({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" | "info" }) {
  return (
    <div
      className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
        tone === "warn" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100" : "bg-green-50 text-green-900 ring-1 ring-green-100"
      } [&_code]:rounded [&_code]:bg-white/70 [&_code]:px-1 [&_code]:text-xs`}
    >
      {children}
    </div>
  );
}
