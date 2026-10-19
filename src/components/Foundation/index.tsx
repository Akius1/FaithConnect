"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";
import { useViewer } from "@/src/components/AppShell";
import type { FollowUpContact } from "@/src/components/FollowUp";
import {
  CONTACT_TYPES,
  FOUNDATION_STAGES,
  contactTypeLabel,
  serviceTypeLabel,
  type FoundationStage,
} from "@/src/lib/constants";

type Contact = FollowUpContact;
type Tab = FoundationStage | "unrecorded";

const PAGE_SIZE = 25;
const JOURNEY: FoundationStage[] = ["not_started", "class_1", "class_2", "class_3", "completed", "graduated"];
const STAGE = Object.fromEntries(FOUNDATION_STAGES.map((s) => [s.value, s])) as Record<
  FoundationStage,
  (typeof FOUNDATION_STAGES)[number]
>;

function stageOf(c: Contact): Tab {
  return (c.foundationStage as FoundationStage | null) ?? "unrecorded";
}

function nameOf(c: Contact) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}

function ago(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : formatDistanceToNowStrict(d, { addSuffix: true });
}

export default function Foundation() {
  const viewer = useViewer();
  const isAdmin = viewer.isAdmin && !viewer.legacy;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("class_1");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [owner, setOwner] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follow-up", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load contacts");
      setContacts(body);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setVisible(PAGE_SIZE), [tab, search, type, owner]);

  const counsellors = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => {
      if (c.assignedCounsellorId) map.set(c.assignedCounsellorId, c.assignedCounsellorName ?? "Counsellor");
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [contacts]);

  // Everything except the stage, so the journey counts follow the filters.
  const matching = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (type !== "all" && c.contactType?.toLowerCase() !== type) return false;
      if (owner !== "all") {
        if (isAdmin) {
          if (owner === "__none" ? c.assignedCounsellorId : c.assignedCounsellorId !== owner) return false;
        } else if (owner === "mine" && c.assignedCounsellorId !== viewer.counsellorId) {
          return false;
        }
      }
      if (term) {
        const hay = [c.firstName, c.lastName, c.phone, c.district].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [contacts, search, type, owner, isAdmin, viewer.counsellorId]);

  const counts = useMemo(() => {
    const out: Record<Tab, number> = {
      unrecorded: 0, not_started: 0, class_1: 0, class_2: 0, class_3: 0,
      completed: 0, graduated: 0, not_applicable: 0,
    };
    matching.forEach((c) => out[stageOf(c)]++);
    return out;
  }, [matching]);

  const rows = useMemo(() => matching.filter((c) => stageOf(c) === tab), [matching, tab]);

  // Share of people (excluding visitors from other churches) who are planted.
  const inJourney = JOURNEY.reduce((n, s) => n + counts[s], 0);
  const planted = counts.completed + counts.graduated;

  async function changeStage(c: Contact, stage: FoundationStage) {
    setSaving(c.id);
    try {
      const res = await fetch(`/api/contacts/${c.id}/foundation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save");
      setContacts((prev) =>
        prev.map((x) =>
          x.id === c.id ? { ...x, foundationStage: stage, foundationStageUpdatedAt: new Date().toISOString() } : x
        )
      );
      toast.success(`${nameOf(c)} moved to ${STAGE[stage].label}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  const tabLabel = tab === "unrecorded" ? "Not recorded yet" : STAGE[tab].label;
  const filtersActive = search !== "" || type !== "all" || owner !== "all";

  return (
    <>
      <Toaster position="top-right" />
      <Header appName="Foundation Class" />

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Journey */}
        <section className="fc-rise relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-5 text-white shadow-xl shadow-indigo-900/20 sm:p-7">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="fc-drift absolute -left-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/45 blur-3xl" />
            <div className="fc-drift absolute -right-10 bottom-[-6rem] h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" style={{ animationDelay: "-8s" }} />
          </div>
          <div className="relative">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-200">
                  <AcademicCapIcon className="h-5 w-5" /> From first visit to planted
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {loading ? "..." : planted.toLocaleString()} planted
                  <span className="text-indigo-200"> of {loading ? "..." : inJourney.toLocaleString()}</span>
                </h2>
              </div>
              <p className="text-sm text-indigo-100/80">
                {counts.unrecorded.toLocaleString()} not recorded yet · {counts.not_applicable.toLocaleString()} from
                other churches
              </p>
            </div>

            <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-0">
              {JOURNEY.map((s, i) => {
                const meta = STAGE[s];
                const active = tab === s;
                return (
                  <li key={s} className="relative">
                    {i > 0 && (
                      <span aria-hidden className="absolute left-0 right-1/2 top-5 hidden h-0.5 bg-white/20 sm:block" />
                    )}
                    {i < JOURNEY.length - 1 && (
                      <span aria-hidden className="absolute left-1/2 right-0 top-5 hidden h-0.5 bg-white/20 sm:block" />
                    )}
                    <button
                      onClick={() => setTab(s)}
                      className={`relative flex w-full flex-col items-center rounded-2xl px-1 py-2 transition-all ${
                        active ? "bg-white/15" : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-[#1e1b4b] transition-transform ${
                          active ? "scale-125" : ""
                        }`}
                        style={{ background: meta.color }}
                      >
                        {i + 1}
                      </span>
                      <span className="mt-2 text-xl font-extrabold tabular-nums sm:text-2xl">
                        {loading ? "..." : counts[s].toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-indigo-100/90">{meta.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["unrecorded", "not_applicable"] as Tab[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setTab(s)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    tab === s ? "bg-white text-indigo-800" : "bg-white/10 text-indigo-50 hover:bg-white/20"
                  }`}
                >
                  {s === "unrecorded" ? "Not recorded yet" : "Not applicable"} · {counts[s].toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-col gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or district"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-3 text-[15px] focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-2xl bg-gray-100 p-1">
              {[{ value: "all", label: "Everyone" }, ...CONTACT_TYPES.map((t) => ({ value: t.value, label: `${t.label}s` }))].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    type === t.value ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {isAdmin ? (
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="all">All counsellors</option>
                <option value="__none">Not assigned</option>
                {counsellors.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            ) : (
              !viewer.legacy && (
                <button
                  onClick={() => setOwner(owner === "mine" ? "all" : "mine")}
                  className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                    owner === "mine" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Assigned to me
                </button>
              )
            )}
            {filtersActive && (
              <button
                onClick={() => {
                  setSearch("");
                  setType("all");
                  setOwner("all");
                }}
                className="rounded-2xl p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Clear filters"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: tab === "unrecorded" ? "#cbd5e1" : STAGE[tab].color }}
              />
              <h2 className="font-bold text-gray-900">{tabLabel}</h2>
              <span className="text-sm text-gray-500">{rows.length.toLocaleString()}</span>
            </div>
            <button onClick={load} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100" aria-label="Refresh">
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-14 text-center text-gray-500">Nobody here right now.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-50 md:hidden">
                {rows.slice(0, visible).map((c, i) => (
                  <li key={c.id} className="fc-rise space-y-2 p-4" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/dashboard/detail/${c.id}`} className="font-semibold text-gray-900">
                          {nameOf(c)}
                        </Link>
                        <p className="text-sm text-gray-500">{c.phone}</p>
                      </div>
                      <TypeBadge value={c.contactType} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {serviceTypeLabel(c.serviceType)}
                      {c.assignedCounsellorName ? ` · ${c.assignedCounsellorName}` : ""}
                      {c.foundationStageUpdatedAt ? ` · updated ${ago(c.foundationStageUpdatedAt)}` : ""}
                    </p>
                    <StageSelect contact={c} saving={saving === c.id} onChange={changeStage} />
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Service</th>
                      <th className="px-3 py-3">Counsellor</th>
                      <th className="px-3 py-3">Last updated</th>
                      <th className="px-5 py-3">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.slice(0, visible).map((c, i) => (
                      <tr key={c.id} className="fc-rise hover:bg-indigo-50/30" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                        <td className="px-5 py-3">
                          <Link href={`/dashboard/detail/${c.id}`} className="font-semibold text-gray-900 hover:text-indigo-700">
                            {nameOf(c)}
                          </Link>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </td>
                        <td className="px-3 py-3"><TypeBadge value={c.contactType} /></td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-700">{serviceTypeLabel(c.serviceType)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                          {c.assignedCounsellorName ?? <span className="text-gray-400">Unassigned</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-500">{ago(c.foundationStageUpdatedAt) ?? "Never"}</td>
                        <td className="px-5 py-3">
                          <StageSelect contact={c} saving={saving === c.id} onChange={changeStage} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visible < rows.length && (
                <div className="border-t border-gray-100 p-4 text-center">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                  >
                    Show more ({rows.length - visible} left)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

function TypeBadge({ value }: { value: string | null }) {
  const convert = value?.toLowerCase() === "new convert";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        convert ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
      }`}
    >
      {contactTypeLabel(value)}
    </span>
  );
}

function StageSelect({
  contact,
  saving,
  onChange,
}: {
  contact: Contact;
  saving: boolean;
  onChange: (c: Contact, stage: FoundationStage) => void;
}) {
  const current = contact.foundationStage as FoundationStage | null;
  const color = current ? STAGE[current]?.color : "#cbd5e1";
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
        style={{ background: color }}
      />
      <select
        value={current ?? ""}
        disabled={saving}
        onChange={(e) => onChange(contact, e.target.value as FoundationStage)}
        className="w-full min-w-[11rem] rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-8 text-sm font-semibold text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
      >
        {!current && <option value="">Not recorded</option>}
        {FOUNDATION_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
