"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowPathIcon,
  CakeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";

interface Counsellor {
  id: string;
  full_name: string | null;
  email: string | null;
  image_url: string | null;
  role: "super_admin" | "counsellor";
  is_active: boolean;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  last_seen_at: string | null;
  created_at: string;
  assignedCount: number;
  followedUpCount: number;
  feedbackCount: number;
  lastFeedbackAt: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initials(c: Counsellor) {
  const n = c.full_name ?? c.email ?? "?";
  return n
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ago(value: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "Never" : formatDistanceToNowStrict(d, { addSuffix: true });
}

export default function CounsellorsList({ meId }: { meId: string | null }) {
  const [list, setList] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/counsellors", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load counsellors");
      setList(body);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const month = new Date().getMonth() + 1;
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return list.filter(
      (c) => !t || `${c.full_name ?? ""} ${c.email ?? ""}`.toLowerCase().includes(t)
    );
  }, [list, search]);

  const totals = useMemo(
    () => ({
      people: list.length,
      active: list.filter((c) => c.is_active).length,
      assigned: list.reduce((n, c) => n + c.assignedCount, 0),
      birthdays: list.filter((c) => c.birth_month === month),
    }),
    [list, month]
  );

  async function update(c: Counsellor, change: Partial<Pick<Counsellor, "role" | "is_active">>) {
    setBusy(c.id);
    try {
      const res = await fetch(`/api/counsellors/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save");
      setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...change } : x)));
      toast.success("Saved");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <Header appName="Counsellors" />
      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { label: "Counsellors", value: totals.people },
            { label: "Active", value: totals.active },
            { label: "Contacts assigned", value: totals.assigned },
            { label: "Birthdays this month", value: totals.birthdays.length },
          ].map((s, i) => (
            <div
              key={s.label}
              className="fc-rise rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <p className="text-xs font-semibold text-gray-500 sm:text-sm">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-gray-900 sm:text-3xl">
                {loading ? "..." : s.value.toLocaleString()}
              </p>
            </div>
          ))}
        </section>

        {totals.birthdays.length > 0 && (
          <section className="fc-rise flex flex-wrap items-center gap-2 rounded-3xl bg-gradient-to-r from-amber-50 to-pink-50 p-4 ring-1 ring-amber-100">
            <CakeIcon className="h-5 w-5 text-pink-500" />
            <span className="text-sm font-semibold text-gray-800">Birthdays this month:</span>
            {totals.birthdays.map((c) => (
              <span key={c.id} className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                {c.full_name ?? c.email} · {c.birth_day} {MONTHS[(c.birth_month ?? 1) - 1]}
              </span>
            ))}
          </section>
        )}

        <section className="rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Everyone on Faith Connect</h2>
              <p className="text-sm text-gray-500">
                People appear here after they sign in for the first time.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-72">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <button
                onClick={load}
                className="rounded-2xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
                aria-label="Refresh"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-gray-500">No counsellors found.</p>
          ) : (
            <ul className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {filtered.map((c, i) => (
                <li
                  key={c.id}
                  className={`fc-rise flex flex-col rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    c.is_active ? "border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50 opacity-75"
                  }`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex items-start gap-3">
                    {c.image_url ? (
                      <Image
                        src={c.image_url}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white">
                        {initials(c)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {c.full_name ?? "Unnamed"}
                        {c.id === meId && <span className="ml-1 text-xs font-medium text-gray-400">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-gray-500">{c.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.role === "super_admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <ShieldCheckIcon className="h-3.5 w-3.5" /> Super admin
                          </span>
                        )}
                        {!c.is_active && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                            Paused
                          </span>
                        )}
                        {c.birth_month && c.birth_day && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">
                            <CakeIcon className="h-3.5 w-3.5" />
                            {c.birth_day} {MONTHS[c.birth_month - 1]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 text-center">
                    <div>
                      <dt className="text-[11px] font-medium text-gray-500">Assigned</dt>
                      <dd className="text-lg font-bold tabular-nums text-gray-900">{c.assignedCount}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-gray-500">Followed up</dt>
                      <dd className="text-lg font-bold tabular-nums text-gray-900">{c.followedUpCount}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-gray-500">Feedback</dt>
                      <dd className="text-lg font-bold tabular-nums text-gray-900">{c.feedbackCount}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-gray-500">
                    Last active {ago(c.last_seen_at)} · last feedback {ago(c.lastFeedbackAt)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <Link
                      href={`/follow-up?counsellor=${c.id}`}
                      className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      View contacts
                    </Link>
                    {c.id !== meId && (
                      <>
                        <button
                          disabled={busy === c.id}
                          onClick={() =>
                            update(c, { role: c.role === "super_admin" ? "counsellor" : "super_admin" })
                          }
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {c.role === "super_admin" ? "Remove admin" : "Make admin"}
                        </button>
                        <button
                          disabled={busy === c.id}
                          onClick={() => update(c, { is_active: !c.is_active })}
                          className={`rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                            c.is_active
                              ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {c.is_active ? "Pause" : "Activate"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
