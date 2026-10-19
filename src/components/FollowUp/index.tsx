"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";
import { useViewer } from "@/src/components/AppShell";
import toast, { Toaster } from "react-hot-toast";
import {
  CONTACT_TYPES,
  FEEDBACK_ROUNDS,
  SERVICE_TYPES,
  contactTypeLabel,
  feedbackRound,
  serviceTypeLabel,
  type FeedbackRound,
} from "@/src/lib/constants";

export interface FollowUpContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  contactType: string | null;
  serviceType: string | null;
  district: string | null;
  gender: string | null;
  contactDate: string | null;
  feedbackCount: number;
  lastFeedbackAt: string | null;
  lastFeedbackBy: string | null;
  assignedCounsellorId?: string | null;
  assignedCounsellorName?: string | null;
  whatsappStatus?: string;
  followedUpByMe?: boolean;
  foundationStage?: string | null;
  foundationStageUpdatedAt?: string | null;
}

interface CounsellorOption {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
}

const UNASSIGNED = "__unassigned";

const PAGE_SIZE = 25;
const OTHER_SERVICE = "__other";
const KNOWN_SERVICES = new Set(SERVICE_TYPES.map((s) => s.value));

const ROUND_STYLES: Record<FeedbackRound, { active: string; idle: string; dot: string }> = {
  none: {
    active: "bg-rose-600 text-white border-rose-600 shadow-rose-200",
    idle: "bg-white text-rose-700 border-rose-200 hover:border-rose-300",
    dot: "bg-rose-500",
  },
  first: {
    active: "bg-amber-500 text-white border-amber-500 shadow-amber-200",
    idle: "bg-white text-amber-700 border-amber-200 hover:border-amber-300",
    dot: "bg-amber-500",
  },
  second: {
    active: "bg-sky-600 text-white border-sky-600 shadow-sky-200",
    idle: "bg-white text-sky-700 border-sky-200 hover:border-sky-300",
    dot: "bg-sky-500",
  },
  third: {
    active: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200",
    idle: "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300",
    dot: "bg-emerald-500",
  },
};

function fullName(c: FollowUpContact) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "Unknown" : format(d, "d MMM yyyy");
}

function sinceAdded(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : formatDistanceToNowStrict(d, { addSuffix: true });
}

// 08012345678 -> 2348012345678 for wa.me links.
function whatsappNumber(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits || null;
}

export default function FollowUp() {
  const [contacts, setContacts] = useState<FollowUpContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [contactType, setContactType] = useState("all");
  const [service, setService] = useState("all");
  const [round, setRound] = useState<FeedbackRound>("none");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const viewer = useViewer();
  const canAssign = viewer.isAdmin && !viewer.legacy;
  const isCounsellorView = !viewer.isAdmin && !viewer.legacy;
  // Super admin: "all", UNASSIGNED or a counsellor id. Counsellor: "all", "assigned", "followed".
  const [owner, setOwner] = useState("all");
  const [counsellors, setCounsellors] = useState<CounsellorOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!canAssign) return;
    // Opened from the Counsellors page with ?counsellor=<id>.
    const fromLink = new URLSearchParams(window.location.search).get("counsellor");
    if (fromLink) setOwner(fromLink);
    fetch("/api/counsellors?basic=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: CounsellorOption[]) => setCounsellors(list))
      .catch(() => setCounsellors([]));
  }, [canAssign]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/follow-up", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load contacts");
      setContacts(body);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, contactType, service, round, owner]);

  // Contacts matching everything except the round, so each tab can show a count.
  const matching = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (contactType !== "all" && c.contactType?.toLowerCase() !== contactType) {
        return false;
      }
      if (service !== "all") {
        const value = c.serviceType?.toLowerCase() ?? "";
        if (service === OTHER_SERVICE ? KNOWN_SERVICES.has(value) : value !== service) {
          return false;
        }
      }
      if (owner !== "all") {
        if (canAssign) {
          if (owner === UNASSIGNED ? c.assignedCounsellorId : c.assignedCounsellorId !== owner) {
            return false;
          }
        } else if (owner === "assigned" && c.assignedCounsellorId !== viewer.counsellorId) {
          return false;
        } else if (owner === "followed" && !c.followedUpByMe) {
          return false;
        }
      }
      if (term) {
        const haystack = [c.firstName, c.lastName, c.phone, c.district]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [contacts, search, contactType, service, owner, canAssign, viewer.counsellorId]);

  const counts = useMemo(() => {
    const result: Record<FeedbackRound, number> = { none: 0, first: 0, second: 0, third: 0 };
    for (const c of matching) result[feedbackRound(c.feedbackCount)]++;
    return result;
  }, [matching]);

  const rows = useMemo(
    () => matching.filter((c) => feedbackRound(c.feedbackCount) === round),
    [matching, round]
  );

  const filtersActive =
    search !== "" || contactType !== "all" || service !== "all" || owner !== "all";

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allRowsSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAllRows = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allRowsSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  async function assign(counsellorId: string | null) {
    if (!selected.size) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/contacts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [...selected], counsellorId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not update assignment");
      const name = counsellorId
        ? counsellors.find((c) => c.id === counsellorId)?.full_name ?? "counsellor"
        : null;
      setContacts((prev) =>
        prev.map((c) =>
          selected.has(c.id)
            ? { ...c, assignedCounsellorId: counsellorId, assignedCounsellorName: name }
            : c
        )
      );
      toast.success(counsellorId ? `${body.updated} assigned to ${name}` : `${body.updated} unassigned`);
      setSelected(new Set());
      setAssignTo("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAssigning(false);
    }
  }
  const activeRound = FEEDBACK_ROUNDS.find((r) => r.value === round)!;

  return (
    <>
      <Toaster position="top-right" />
      <Header appName="Follow-up" />

      <div className={`px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 ${selected.size ? "pb-44 sm:pb-32" : ""}`}>
        {/* Filters */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or district"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            />
          </div>

          <FilterRow label="Who">
            <Chip active={contactType === "all"} onClick={() => setContactType("all")}>
              All contacts
            </Chip>
            {CONTACT_TYPES.map((t) => (
              <Chip
                key={t.value}
                active={contactType === t.value}
                onClick={() => setContactType(t.value)}
              >
                {t.label}s
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Service">
            <Chip active={service === "all"} onClick={() => setService("all")}>
              All services
            </Chip>
            {SERVICE_TYPES.map((s) => (
              <Chip key={s.value} active={service === s.value} onClick={() => setService(s.value)}>
                {s.label}
              </Chip>
            ))}
            <Chip active={service === OTHER_SERVICE} onClick={() => setService(OTHER_SERVICE)}>
              Other
            </Chip>
          </FilterRow>

          {canAssign && (
            <FilterRow label="Counsellor">
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full md:w-auto rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">Everyone</option>
                <option value={UNASSIGNED}>Not assigned yet</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? c.email}
                  </option>
                ))}
              </select>
            </FilterRow>
          )}
          {isCounsellorView && (
            <FilterRow label="Mine">
              <Chip active={owner === "all"} onClick={() => setOwner("all")}>
                All my contacts
              </Chip>
              <Chip active={owner === "assigned"} onClick={() => setOwner("assigned")}>
                Assigned to me
              </Chip>
              <Chip active={owner === "followed"} onClick={() => setOwner("followed")}>
                I followed up
              </Chip>
            </FilterRow>
          )}

          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setContactType("all");
                setService("all");
                setOwner("all");
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </section>

        {/* Round tabs */}
        <div role="tablist" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {FEEDBACK_ROUNDS.map((r) => {
            const selected = r.value === round;
            const style = ROUND_STYLES[r.value];
            return (
              <button
                key={r.value}
                role="tab"
                aria-selected={selected}
                onClick={() => setRound(r.value)}
                className={`rounded-2xl border-2 px-4 py-3 sm:py-4 text-left transition-all ${
                  selected ? `${style.active} shadow-lg` : style.idle
                }`}
              >
                <span className="block text-2xl sm:text-3xl font-bold tabular-nums">
                  {loading ? "..." : counts[r.value]}
                </span>
                <span className="block text-sm sm:text-base font-medium">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{activeRound.label}</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {loading ? "Loading contacts" : `${rows.length} of ${contacts.length} contacts`}
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Refresh"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <p className="text-rose-700 font-medium">{error}</p>
              <button
                onClick={load}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <ListSkeleton />
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-900">Nobody here</p>
              <p className="mt-1 text-sm text-gray-500">
                No contacts in &ldquo;{activeRound.label.toLowerCase()}&rdquo; match these filters.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {canAssign && (
                  <li className="flex items-center gap-3 bg-gray-50 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allRowsSelected}
                      onChange={toggleAllRows}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      Select all {rows.length} in this tab
                    </span>
                  </li>
                )}
                {rows.slice(0, visible).map((c) => (
                  <li key={c.id} className={`p-4 ${selected.has(c.id) ? "bg-indigo-50/60" : ""}`}>
                    <div className="flex gap-3">
                      {canAssign && (
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="mt-1 h-5 w-5 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Select ${fullName(c)}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <ContactCard contact={c} showOwner={!isCounsellorView} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <tr>
                      {canAssign && (
                        <th className="w-10 pl-5 py-3">
                          <input
                            type="checkbox"
                            checked={allRowsSelected}
                            onChange={toggleAllRows}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label="Select all in this tab"
                          />
                        </th>
                      )}
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3 hidden lg:table-cell">District</th>
                      <th className="px-5 py-3">Added</th>
                      {!isCounsellorView && <th className="px-5 py-3">Counsellor</th>}
                      <th className="px-5 py-3">Last feedback</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.slice(0, visible).map((c) => (
                      <ContactRow
                        key={c.id}
                        contact={c}
                        showOwner={!isCounsellorView}
                        selectable={canAssign}
                        selected={selected.has(c.id)}
                        onToggle={() => toggle(c.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {visible < rows.length && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="w-full sm:w-auto rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Show more ({rows.length - visible} left)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {canAssign && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 md:left-64 md:p-5 lg:left-72">
          <div className="fc-rise mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl bg-gray-900 p-4 text-white shadow-2xl sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <span className="text-sm font-semibold">
                {selected.size} selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-gray-300 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="rounded-2xl border-0 bg-white/10 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-400 [&>option]:text-gray-900"
              >
                <option value="">Choose a counsellor</option>
                {counsellors
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name ?? c.email}
                    </option>
                  ))}
              </select>
              <button
                disabled={!assignTo || assigning}
                onClick={() => assign(assignTo)}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {assigning ? "Saving..." : "Assign"}
              </button>
              <button
                disabled={assigning}
                onClick={() => assign(null)}
                className="rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-40"
              >
                Unassign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 md:w-28 md:pt-2 flex-shrink-0">
        {label}
      </span>
      {/* One scrolling line on phones, wrapping on wider screens. */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-1 md:pb-0 [scrollbar-width:none]">
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300 hover:text-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}

function TypeBadge({ value }: { value: string | null }) {
  const isConvert = value?.toLowerCase() === "new convert";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isConvert ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
      }`}
    >
      {contactTypeLabel(value)}
    </span>
  );
}

function LastFeedback({ contact }: { contact: FollowUpContact }) {
  if (!contact.feedbackCount) {
    return <span className="text-gray-400">None yet</span>;
  }
  return (
    <span className="text-gray-700">
      {formatDate(contact.lastFeedbackAt)}
      {contact.lastFeedbackBy && (
        <span className="text-gray-500"> by {contact.lastFeedbackBy}</span>
      )}
    </span>
  );
}

function QuickActions({ contact, compact }: { contact: FollowUpContact; compact?: boolean }) {
  const wa = whatsappNumber(contact.phone);
  const iconBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50";
  return (
    <div className={`flex items-center gap-2 ${compact ? "justify-end" : ""}`}>
      {contact.phone && (
        <a
          href={`tel:${contact.phone}`}
          className={`${iconBtn} ${compact ? "p-2" : "flex-1 py-2.5 text-sm font-medium"}`}
          aria-label={`Call ${fullName(contact)}`}
        >
          <PhoneIcon className="h-4 w-4" />
          {!compact && "Call"}
        </a>
      )}
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${iconBtn} ${compact ? "p-2" : "flex-1 py-2.5 text-sm font-medium"}`}
          aria-label={`WhatsApp ${fullName(contact)}`}
        >
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-green-600" />
          {!compact && "WhatsApp"}
        </a>
      )}
      <Link
        href={`/dashboard/detail/${contact.id}`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 ${
          compact ? "px-3 py-2 text-xs" : "flex-1 py-2.5 text-sm"
        }`}
      >
        <PlusIcon className="h-4 w-4" />
        Feedback
      </Link>
    </div>
  );
}

function OwnerPill({ contact }: { contact: FollowUpContact }) {
  return contact.assignedCounsellorId ? (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      {contact.assignedCounsellorName ?? "Assigned"}
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      Unassigned
    </span>
  );
}

function ContactCard({ contact, showOwner }: { contact: FollowUpContact; showOwner?: boolean }) {
  const style = ROUND_STYLES[feedbackRound(contact.feedbackCount)];
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/detail/${contact.id}`}
            className="font-semibold text-gray-900 hover:text-indigo-700 break-words"
          >
            {fullName(contact)}
          </Link>
          <p className="text-sm text-gray-500">{contact.phone ?? "No phone"}</p>
        </div>
        <TypeBadge value={contact.contactType} />
      </div>
      {showOwner && <OwnerPill contact={contact} />}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">Service</dt>
          <dd className="text-gray-800 truncate">{serviceTypeLabel(contact.serviceType)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">District</dt>
          <dd className="text-gray-800 truncate">{contact.district ?? "Not set"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-400">Added</dt>
          <dd className="text-gray-800">
            {formatDate(contact.contactDate)}
            <span className="block text-xs text-gray-400">{sinceAdded(contact.contactDate)}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            Feedback ({contact.feedbackCount})
          </dt>
          <dd className="text-sm break-words">
            <LastFeedback contact={contact} />
          </dd>
        </div>
      </dl>

      <QuickActions contact={contact} />
    </div>
  );
}

function ContactRow({
  contact,
  showOwner,
  selectable,
  selected,
  onToggle,
}: {
  contact: FollowUpContact;
  showOwner?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  return (
    <tr className={selected ? "bg-indigo-50/60" : "hover:bg-gray-50"}>
      {selectable && (
        <td className="pl-5 py-3">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggle}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            aria-label={`Select ${fullName(contact)}`}
          />
        </td>
      )}
      <td className="px-5 py-3">
        <Link
          href={`/dashboard/detail/${contact.id}`}
          className="font-medium text-gray-900 hover:text-indigo-700"
        >
          {fullName(contact)}
        </Link>
        <div className="text-xs text-gray-500">{contact.phone}</div>
      </td>
      <td className="px-5 py-3 whitespace-nowrap">
        <TypeBadge value={contact.contactType} />
      </td>
      <td className="px-5 py-3 text-gray-700">{serviceTypeLabel(contact.serviceType)}</td>
      <td className="px-5 py-3 text-gray-700 hidden lg:table-cell whitespace-nowrap">
        {contact.district ?? "Not set"}
      </td>
      <td className="px-5 py-3 whitespace-nowrap">
        <div className="text-gray-700">{formatDate(contact.contactDate)}</div>
        <div className="text-xs text-gray-400">{sinceAdded(contact.contactDate)}</div>
      </td>
      {showOwner && (
        <td className="px-5 py-3">
          <OwnerPill contact={contact} />
        </td>
      )}
      <td className="px-5 py-3">
        <LastFeedback contact={contact} />
      </td>
      <td className="px-5 py-3">
        <QuickActions contact={contact} compact />
      </td>
    </tr>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="p-4 sm:px-5 space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
