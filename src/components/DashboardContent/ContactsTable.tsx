"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import moment from "moment";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  FEEDBACK_ROUNDS,
  contactTypeLabel,
  feedbackRound,
  serviceTypeLabel,
} from "@/src/lib/constants";
import { ROUND_COLORS } from "./Overview";
import type { Entry } from ".";

const PAGE_SIZE = 10;
const AVATAR_TONES = [
  "from-indigo-500 to-violet-500",
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-red-500",
];

function nameOf(c: Entry) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}

function initials(c: Entry) {
  const parts = [c.firstName, c.lastName].filter(Boolean) as string[];
  return (parts.map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();
}

function toneFor(id: string) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

interface ContactsTableProps {
  data: Entry[];
  setSelectedContactForDeletion: (contact: Entry | null) => void;
}

export default function ContactsTable({ data, setSelectedContactForDeletion }: ContactsTableProps) {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [data]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  // Back to the first page whenever the filtered list changes.
  useEffect(() => setPage(0), [data]);

  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (sorted.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
          🔍
        </div>
        <h3 className="mt-4 font-semibold text-gray-900">No contacts found</h3>
        <p className="mt-1 text-sm text-gray-500">Try a different search or clear the filters.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Phones */}
      <ul className="divide-y divide-gray-100 md:hidden">
        {rows.map((c, i) => (
          <li key={c.id} className="fc-rise p-4" style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="flex items-start gap-3">
              <Avatar contact={c} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/detail/${c.id}`}
                    className="font-semibold text-gray-900 break-words"
                  >
                    {nameOf(c)}
                  </Link>
                  <RowMenu contact={c} onDelete={setSelectedContactForDeletion} />
                </div>
                <p className="text-sm text-gray-500">{c.phone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <TypeBadge value={c.contactType} />
                  <RoundBadge count={c.feedbackCount} />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {serviceTypeLabel(c.serviceType)}
                  {c.district ? ` · ${c.district}` : ""} · {moment(c.contactDate).format("D MMM YYYY")}
                </p>
                {c.prayerPoint && (
                  <p className="mt-2 line-clamp-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {c.prayerPoint}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablets and desktops */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-5 py-3 font-semibold">Contact</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Service</th>
              <th className="hidden px-3 py-3 font-semibold xl:table-cell">Prayer point</th>
              <th className="hidden px-3 py-3 font-semibold lg:table-cell">District</th>
              <th className="px-3 py-3 font-semibold">Follow-up</th>
              <th className="px-3 py-3 font-semibold">Added</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((c, i) => (
              <ClickableRow key={c.id} contact={c} delay={i * 0.03}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar contact={c} />
                    <div className="min-w-0">
                      <p className="max-w-[14rem] truncate font-semibold text-gray-900">{nameOf(c)}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <TypeBadge value={c.contactType} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                  {serviceTypeLabel(c.serviceType)}
                </td>
                <td className="hidden max-w-[16rem] px-3 py-3 xl:table-cell">
                  <p className="truncate text-gray-600" title={c.prayerPoint}>
                    {c.prayerPoint || <span className="text-gray-300">None</span>}
                  </p>
                </td>
                <td className="hidden px-3 py-3 whitespace-nowrap text-gray-700 lg:table-cell">
                  {c.district || <span className="text-gray-300">Not set</span>}
                </td>
                <td className="px-3 py-3">
                  <RoundBadge count={c.feedbackCount} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <p className="text-gray-700">{moment(c.contactDate).format("D MMM YYYY")}</p>
                  <p className="text-xs text-gray-400">{moment(c.contactDate).fromNow()}</p>
                </td>
                <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowMenu contact={c} onDelete={setSelectedContactForDeletion} />
                </td>
              </ClickableRow>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-5">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)}
          </span>{" "}
          of <span className="font-semibold text-gray-900">{sorted.length.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <PageButton disabled={page === 0} onClick={() => setPage(page - 1)} label="Previous page">
            <ChevronLeftIcon className="h-4 w-4" />
          </PageButton>
          {pageWindow(page, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`hidden h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition-colors sm:inline-block ${
                  p === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p + 1}
              </button>
            )
          )}
          <span className="px-2 text-sm text-gray-600 sm:hidden">
            {page + 1} / {pageCount}
          </span>
          <PageButton
            disabled={page >= pageCount - 1}
            onClick={() => setPage(page + 1)}
            label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

// Page numbers to show around the current one, with gaps as null.
function pageWindow(page: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const set = new Set([0, count - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < count));
  const sortedPages = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sortedPages.forEach((p, i) => {
    if (i && p - sortedPages[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

function ClickableRow({
  contact,
  delay,
  children,
}: {
  contact: Entry;
  delay: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/dashboard/detail/${contact.id}`)}
      className="fc-rise cursor-pointer transition-colors hover:bg-indigo-50/40"
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </tr>
  );
}

function Avatar({ contact }: { contact: Entry }) {
  return (
    <span
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white ${toneFor(
        contact.id
      )}`}
    >
      {initials(contact)}
    </span>
  );
}

function TypeBadge({ value }: { value: string }) {
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

function RoundBadge({ count }: { count: number }) {
  const round = feedbackRound(count);
  const meta = FEEDBACK_ROUNDS.find((r) => r.value === round)!;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-100">
      <span className="h-2 w-2 rounded-full" style={{ background: ROUND_COLORS[round] }} />
      {meta.short}
    </span>
  );
}

function PageButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RowMenu({ contact, onDelete }: { contact: Entry; onDelete: (c: Entry) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors";

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Contact actions"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-2xl border border-gray-100 bg-white p-1.5 text-left shadow-xl animate-scale-in">
          <button
            onClick={() => router.push(`/dashboard/detail/${contact.id}`)}
            className={`${item} text-gray-700 hover:bg-gray-50`}
          >
            <EyeIcon className="h-4 w-4" /> View details
          </button>
          <button
            onClick={() => router.push(`/edit-contact/${contact.id}`)}
            className={`${item} text-gray-700 hover:bg-gray-50`}
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete(contact);
            }}
            className={`${item} text-rose-600 hover:bg-rose-50`}
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
