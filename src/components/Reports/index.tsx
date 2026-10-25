"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";
import type { Submission, WeekReport } from "@/src/lib/reports/parse";

interface Payload {
  weeks?: WeekReport[];
  sheetUrl?: string;
  fetchedAt?: string;
  setup?: boolean;
  error?: string;
}

interface Row {
  district: string;
  dhc: number | null;
  submissions: number;
  attendance: number;
  newComers: number;
  soulsWon: number;
  offering: number;
  late: number;
}

const CHURCH = "DIGC Lagos Central, Gbagada";

function longDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

// Totals per district for a week, optionally leaving out reports sent after 8pm.
function rowsFor(week: WeekReport | undefined, meeting: boolean, districts: string[], dhc: Record<string, number | null>) {
  const subs = week ? (meeting ? week.submissions.filter((s) => !s.late) : week.submissions) : [];
  const rows: Row[] = districts.map((district) => {
    const mine = subs.filter((s) => s.district === district);
    const sum = (f: keyof Submission) => mine.reduce((n, s) => n + ((s[f] as number | null) ?? 0), 0);
    return {
      district,
      dhc: dhc[district] ?? null,
      submissions: mine.length,
      attendance: sum("attendance"),
      newComers: sum("newComers"),
      soulsWon: sum("soulsWon"),
      offering: sum("offering"),
      late: mine.filter((s) => s.late).length,
    };
  });
  const total = rows.reduce(
    (t, r) => ({
      ...t,
      dhc: (t.dhc ?? 0) + (r.dhc ?? 0),
      submissions: t.submissions + r.submissions,
      attendance: t.attendance + r.attendance,
      newComers: t.newComers + r.newComers,
      soulsWon: t.soulsWon + r.soulsWon,
      offering: t.offering + r.offering,
      late: t.late + r.late,
    }),
    { district: "Total", dhc: 0, submissions: 0, attendance: 0, newComers: 0, soulsWon: 0, offering: 0, late: 0 } as Row
  );
  return { rows, total, subs };
}

export default function Reports() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekIndex, setWeekIndex] = useState(0);
  const [meeting, setMeeting] = useState(false);
  const [showOffering, setShowOffering] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?weeks=12${refresh ? "&refresh=1" : ""}`, { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData({ error: "Could not reach the server" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const weeks = data?.weeks ?? [];
  const week = weeks[weekIndex];
  const previous = weeks[weekIndex + 1];

  const view = useMemo(() => {
    if (!week) return null;
    const districts = week.districts.map((d) => d.district);
    const dhc = Object.fromEntries(week.districts.map((d) => [d.district, d.dhcCount]));
    return {
      current: rowsFor(week, meeting, districts, dhc),
      before: previous ? rowsFor(previous, meeting, districts, dhc) : null,
    };
  }, [week, previous, meeting]);

  const summaryText = useMemo(() => {
    if (!week || !view) return "";
    const { rows, total } = view.current;
    const lines = [
      `*${CHURCH}*`,
      `*Weekly Home Church Report*`,
      `${longDate(week.date)}${meeting ? " (as at 8pm)" : ""}`,
      "",
      ...rows.map(
        (r) =>
          `${r.district}: ${r.submissions}/${r.dhc ?? "?"} DHC | Att ${r.attendance} | NC ${r.newComers}${
            showOffering ? ` | ${naira(r.offering)}` : ""
          }`
      ),
      "",
      `*Total: ${total.submissions}/${total.dhc} DHC | Att ${total.attendance} | NC ${total.newComers}*`,
      `Souls won: ${total.soulsWon}`,
    ];
    if (showOffering) lines.push(`Offering: ${naira(total.offering)}`);
    if (view.before) {
      const b = view.before.total;
      lines.push(
        "",
        `Last week (${shortDate(previous!.date)}): ${b.submissions} DHC | Att ${b.attendance} | NC ${b.newComers}`
      );
    }
    return lines.join("\n");
  }, [week, previous, view, meeting, showOffering]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy. Select the text and copy it instead.");
    }
  }

  const toggleDistrict = (d: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <>
      <Toaster position="top-right" />
      <div className="print:hidden">
        <Header appName="Reports" />
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 print:p-0">
        {loading && !data ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-3xl bg-white" />
            <div className="h-96 animate-pulse rounded-3xl bg-white" />
          </div>
        ) : data?.setup ? (
          <SetupCard sheetUrl={data.sheetUrl} />
        ) : data?.error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <p className="font-semibold">The report sheet could not be read.</p>
            <p className="mt-1 text-sm">{data.error}</p>
            <button
              onClick={() => load(true)}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : !week || !view ? (
          <p className="rounded-3xl bg-white p-10 text-center text-gray-500">No reports in the sheet yet.</p>
        ) : (
          <>
            {/* Controls */}
            <section className="fc-rise flex flex-col gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={weekIndex}
                  onChange={(e) => setWeekIndex(Number(e.target.value))}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  {weeks.map((w, i) => (
                    <option key={w.date} value={i}>
                      {longDate(w.date)}
                      {i === 0 ? " (latest)" : ""}
                    </option>
                  ))}
                </select>
                <Toggle on={meeting} onChange={setMeeting} label="As at 8pm meeting" />
                <Toggle on={showOffering} onChange={setShowOffering} label="Show offering" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <ActionButton onClick={copySummary} icon={ClipboardDocumentIcon}>
                  Copy summary
                </ActionButton>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-green-700"
                >
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={`/api/reports/export?date=${week.date}${meeting ? "&meeting=1" : ""}${showOffering ? "&offering=1" : ""}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Excel
                </a>
                <ActionButton onClick={() => window.print()} icon={PrinterIcon}>
                  Print / PDF
                </ActionButton>
              </div>
            </section>

            {/* Title for print and screen */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{CHURCH}</p>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  Weekly Home Church Report
                </h2>
                <p className="text-sm text-gray-500">
                  {longDate(week.date)}
                  {meeting ? " · as at 8pm" : ""}
                  {week.duplicatesRemoved > 0 &&
                    ` · ${week.duplicatesRemoved} repeated submission${week.duplicatesRemoved === 1 ? "" : "s"} counted once`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 print:hidden">
                {data?.fetchedAt && (
                  <span>Updated {new Date(data.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                )}
                <button
                  onClick={() => load(true)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
                {data?.sheetUrl && (
                  <a
                    href={data.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    Open sheet <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Headline numbers */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <Kpi
                label="DHC submissions"
                value={`${view.current.total.submissions}/${view.current.total.dhc}`}
                sub={`${Math.round((view.current.total.submissions / Math.max(1, view.current.total.dhc ?? 1)) * 100)}% of home churches`}
                delta={view.before ? view.current.total.submissions - view.before.total.submissions : null}
              />
              <Kpi
                label="Attendance"
                value={view.current.total.attendance.toLocaleString()}
                delta={view.before ? view.current.total.attendance - view.before.total.attendance : null}
              />
              <Kpi
                label="New comers"
                value={view.current.total.newComers.toLocaleString()}
                delta={view.before ? view.current.total.newComers - view.before.total.newComers : null}
              />
              <Kpi
                label={showOffering ? "Offering" : "Souls won"}
                value={showOffering ? naira(view.current.total.offering) : view.current.total.soulsWon.toLocaleString()}
                delta={
                  view.before
                    ? showOffering
                      ? null
                      : view.current.total.soulsWon - view.before.total.soulsWon
                    : null
                }
              />
            </section>

            {/* Summary table, same shape as the meeting report */}
            <section className="fc-rise overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
                <h3 className="font-bold text-gray-900">District summary</h3>
                <span className="text-xs text-gray-500">This week is shaded</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th rowSpan={2} className="sticky left-0 bg-white px-4 py-2 text-left sm:px-5">District</th>
                      <th rowSpan={2} className="bg-gray-100 px-3 py-2 text-right">No of DHC</th>
                      {view.before && (
                        <th colSpan={showOffering ? 4 : 3} className="border-l border-gray-100 px-3 py-2 text-center normal-case tracking-normal text-gray-700">
                          {shortDate(previous!.date)}
                        </th>
                      )}
                      <th colSpan={showOffering ? 4 : 3} className="border-l border-amber-200 bg-amber-100 px-3 py-2 text-center normal-case tracking-normal text-amber-900">
                        {shortDate(week.date)}
                      </th>
                    </tr>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {view.before && <MetricHeads offering={showOffering} />}
                      <MetricHeads offering={showOffering} highlight />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {view.current.rows.map((r, i) => {
                      const b = view.before?.rows[i];
                      const missing = r.dhc !== null && r.submissions < r.dhc;
                      return (
                        <tr key={r.district} className="hover:bg-indigo-50/30">
                          <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2.5 font-semibold text-gray-900 sm:px-5">
                            {r.district}
                          </td>
                          <td className="bg-gray-50 px-3 py-2.5 text-right tabular-nums text-gray-700">{r.dhc ?? ""}</td>
                          {b && <MetricCells row={b} offering={showOffering} />}
                          <MetricCells row={r} offering={showOffering} highlight warn={missing} />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                      <td className="sticky left-0 bg-white px-4 py-3 sm:px-5">Total</td>
                      <td className="bg-gray-100 px-3 py-3 text-right tabular-nums">{view.current.total.dhc}</td>
                      {view.before && <MetricCells row={view.before.total} offering={showOffering} />}
                      <MetricCells row={view.current.total} offering={showOffering} highlight />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Detailed report */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Home church details</h3>
                <button
                  onClick={() =>
                    setOpen(open.size ? new Set() : new Set(view.current.rows.map((r) => r.district)))
                  }
                  className="text-sm font-semibold text-indigo-600 print:hidden"
                >
                  {open.size ? "Collapse all" : "Expand all"}
                </button>
              </div>
              {view.current.rows.map((r) => {
                const subs = view.current.subs.filter((s) => s.district === r.district);
                const missing = week.notSubmitted[r.district] ?? [];
                const isOpen = open.has(r.district);
                return (
                  <div key={r.district} className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm print:break-inside-avoid">
                    <button
                      onClick={() => toggleDistrict(r.district)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left sm:px-5"
                    >
                      <span className="font-bold text-gray-900">{r.district}</span>
                      <span className="text-sm text-gray-500">
                        {r.submissions}/{r.dhc ?? "?"} submitted · {r.attendance} attendance · {r.newComers} new comers
                        {r.late ? ` · ${r.late} after 8pm` : ""}
                      </span>
                      <ChevronDownIcon
                        className={`ml-auto h-5 w-5 text-gray-400 transition-transform print:hidden ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div className={`${isOpen ? "block" : "hidden"} border-t border-gray-100 print:block`}>
                      {subs.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                <th className="px-4 py-2 sm:px-5">Home church</th>
                                <th className="px-3 py-2">Leader</th>
                                <th className="px-3 py-2 text-right">Att.</th>
                                <th className="px-3 py-2 text-right">New</th>
                                <th className="px-3 py-2 text-right">Souls</th>
                                <th className="px-3 py-2 text-right">Slips</th>
                                {showOffering && <th className="px-3 py-2 text-right">Offering</th>}
                                <th className="px-3 py-2">Sent</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {subs.map((s) => (
                                <tr key={s.homeChurch}>
                                  <td className="px-4 py-2 font-medium text-gray-900 sm:px-5">{s.homeChurch}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                                    {s.leader}
                                    {s.leaderPhone && (
                                      <a href={`tel:${s.leaderPhone}`} className="block text-xs text-indigo-600">
                                        {s.leaderPhone}
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {s.attendance ?? <span className="text-gray-300">n/a</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">{s.newComers ?? 0}</td>
                                  <td className="px-3 py-2 text-right tabular-nums">{s.soulsWon ?? 0}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-600">
                                    {s.slipsCollected ?? 0}/{s.slipsFollowedUp ?? 0}
                                  </td>
                                  {showOffering && (
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {s.offering !== null ? naira(s.offering) : <span className="text-gray-300">n/a</span>}
                                    </td>
                                  )}
                                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                    {new Date(s.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                    {s.late && (
                                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                                        after 8pm
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {missing.length > 0 && (
                        <div className="border-t border-gray-100 bg-rose-50/40 px-4 py-3 sm:px-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                            Not submitted this week
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {missing.map((m) => (
                              <span key={m} className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-700 ring-1 ring-rose-100">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {subs.length === 0 && missing.length === 0 && (
                        <p className="px-5 py-4 text-sm text-gray-500">No reports this week.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </>
  );
}

function MetricHeads({ offering, highlight }: { offering: boolean; highlight?: boolean }) {
  const cls = `px-3 py-2 text-right ${highlight ? "bg-amber-50 text-amber-900" : ""}`;
  return (
    <>
      <th className={`${cls} border-l ${highlight ? "border-amber-200" : "border-gray-100"}`}>Submissions</th>
      <th className={cls}>Attendance</th>
      <th className={cls}>New comers</th>
      {offering && <th className={cls}>Offering</th>}
    </>
  );
}

function MetricCells({
  row,
  offering,
  highlight,
  warn,
}: {
  row: Row;
  offering: boolean;
  highlight?: boolean;
  warn?: boolean;
}) {
  const cls = `px-3 py-2.5 text-right tabular-nums ${highlight ? "bg-amber-50/70" : "text-gray-600"}`;
  return (
    <>
      <td className={`${cls} border-l ${highlight ? "border-amber-200" : "border-gray-100"}`}>
        <span className={warn ? "font-semibold text-rose-600" : ""}>{row.submissions}</span>
      </td>
      <td className={cls}>{row.attendance}</td>
      <td className={cls}>{row.newComers || ""}</td>
      {offering && <td className={cls}>{row.offering ? naira(row.offering) : ""}</td>}
    </>
  );
}

function Kpi({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) {
  return (
    <div className="fc-rise rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold text-gray-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-gray-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
        {delta !== null && delta !== undefined && (
          <span className={`font-semibold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-gray-500"}`}>
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString()} vs last week
          </span>
        )}
        {sub && <span className="block">{sub}</span>}
      </p>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
        on ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${on ? "bg-white" : "bg-gray-400"}`} />
      {label}
    </button>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SetupCard({ sheetUrl }: { sheetUrl?: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-gray-900">Connect the weekly report sheet</h2>
      <p className="mt-2 text-sm text-gray-600">
        Reports are read straight from the Google Form responses. The sheet stays private: the app reads it
        with its own read-only Google account.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-700">
        <li>In Google Cloud Console, create a project and enable the Google Sheets API.</li>
        <li>Create a service account and download its JSON key.</li>
        <li>
          Share the{" "}
          {sheetUrl ? (
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600">
              report sheet
            </a>
          ) : (
            "report sheet"
          )}{" "}
          with the service account email as <b>Viewer</b>.
        </li>
        <li>
          Add <code className="rounded bg-gray-100 px-1">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and{" "}
          <code className="rounded bg-gray-100 px-1">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> to the environment,
          then reload.
        </li>
      </ol>
    </div>
  );
}
