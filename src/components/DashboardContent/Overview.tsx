"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addWeeks, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import {
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { FEEDBACK_ROUNDS, feedbackRound, serviceTypeLabel } from "@/src/lib/constants";
import type { Entry } from ".";
import { useViewer } from "@/src/components/AppShell";

export const ROUND_COLORS = {
  none: "#f43f5e",
  first: "#f59e0b",
  second: "#0ea5e9",
  third: "#10b981",
} as const;

// Counts up from 0 when the value first arrives.
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface OverviewProps {
  contacts: Entry[];
  loading: boolean;
}

export default function Overview({ contacts, loading }: OverviewProps) {
  const { user } = useUser();
  const viewer = useViewer();
  const mine = !viewer.isAdmin && !viewer.legacy;
  const [now] = useState(() => new Date());

  const stats = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const lastWeekStart = addWeeks(weekStart, -1);
    const monthStart = startOfMonth(now);

    let thisWeek = 0;
    let lastWeek = 0;
    let thisMonth = 0;
    let firstTimers = 0;
    let converts = 0;
    let today = 0;
    const rounds = { none: 0, first: 0, second: 0, third: 0 };
    const services = new Map<string, number>();

    for (const c of contacts) {
      const added = c.createdAt;
      if (added >= weekStart) thisWeek++;
      else if (added >= lastWeekStart) lastWeek++;
      if (added >= monthStart) thisMonth++;
      if (isSameDay(added, now)) today++;
      const type = c.contactType?.toLowerCase();
      if (type === "first timer") firstTimers++;
      else if (type === "new convert") converts++;
      rounds[feedbackRound(c.feedbackCount)]++;
      const label = serviceTypeLabel(c.serviceType);
      services.set(label, (services.get(label) ?? 0) + 1);
    }

    // Contacts added per week over the last 12 weeks, by contact date.
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const startW = addWeeks(weekStart, i - 11);
      return { start: startW, label: format(startW, "d MMM"), count: 0 };
    });
    const firstWeek = weeks[0].start.getTime();
    for (const c of contacts) {
      const t = c.contactDate.getTime();
      if (isNaN(t) || t < firstWeek) continue;
      const idx = Math.floor((t - firstWeek) / (7 * 24 * 3600 * 1000));
      if (idx >= 0 && idx < weeks.length) weeks[idx].count++;
    }

    const topServices = [...services.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const change = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

    return {
      total: contacts.length,
      thisWeek,
      lastWeek,
      thisMonth,
      today,
      firstTimers,
      converts,
      rounds,
      weeks,
      topServices,
      change,
    };
  }, [contacts, now]);

  const rawName = user?.firstName ?? user?.fullName?.split(" ")[0];
  // Google names sometimes arrive in capitals ("ANDREW"); show "Andrew".
  const firstName = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
    : undefined;
  const awaiting = stats.rounds.none;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting banner */}
      <section className="fc-rise relative overflow-hidden rounded-3xl bg-[#1e1b4b] px-5 py-6 text-white shadow-xl shadow-indigo-900/20 sm:px-8 sm:py-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="fc-drift absolute -left-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/50 blur-3xl" />
          <div
            className="fc-drift absolute -right-16 top-0 h-64 w-64 rounded-full bg-fuchsia-500/35 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />
          <div
            className="fc-drift absolute bottom-[-8rem] left-1/2 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl"
            style={{ animationDelay: "-12s" }}
          />
        </div>
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">{format(now, "EEEE, d MMMM yyyy")}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {greeting(now)}
              {firstName ? `, ${firstName}` : ""}
              <span className="ml-2 inline-block origin-bottom-right animate-[wave_2.4s_ease-in-out_1]">👋</span>
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-indigo-100/90 sm:text-base">
              {loading ? (
                "Gathering your contacts..."
              ) : awaiting ? (
                <>
                  <span className="font-bold text-white">{awaiting.toLocaleString()}</span>{" "}
                  {mine
                    ? `of your contacts ${awaiting === 1 ? "is" : "are"} still waiting for a first`
                    : awaiting === 1
                    ? "person is still waiting for their first"
                    : "people are still waiting for their first"}{" "}
                  follow-up call
                  {stats.today ? (
                    <>
                      , and <span className="font-bold text-white">{stats.today}</span> joined today
                    </>
                  ) : null}
                  .
                </>
              ) : mine && stats.total === 0 ? (
                "No one has been assigned to you yet. New people will show up here once the admin assigns them."
              ) : (
                "Everyone has had at least one follow-up. Well done."
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2.5 sm:flex-row">
            <Link
              href="/follow-up"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
              Start follow-ups
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/add-contact"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              <UserPlusIcon className="h-5 w-5" />
              Add contact
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          delay={0.05}
          label={mine ? "My contacts" : "Total contacts"}
          value={stats.total}
          loading={loading}
          icon={UserGroupIcon}
          tone="indigo"
          foot={`+${stats.thisMonth.toLocaleString()} this month`}
        />
        <StatCard
          delay={0.1}
          label="New this week"
          value={stats.thisWeek}
          loading={loading}
          icon={SparklesIcon}
          tone="fuchsia"
          foot={
            stats.change === null ? (
              `${stats.lastWeek} last week`
            ) : (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  stats.change >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {stats.change >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {Math.abs(stats.change)}% vs last week
              </span>
            )
          }
        />
        <StatCard
          delay={0.15}
          label="First timers"
          value={stats.firstTimers}
          loading={loading}
          icon={UserPlusIcon}
          tone="sky"
          foot={
            <SplitBar
              a={stats.firstTimers}
              b={stats.converts}
              aLabel="First timers"
              bLabel={`${stats.converts.toLocaleString()} converts`}
            />
          }
        />
        <StatCard
          delay={0.2}
          label="Awaiting follow-up"
          value={awaiting}
          loading={loading}
          icon={ClipboardDocumentCheckIcon}
          tone="rose"
          href="/follow-up"
          foot={
            stats.total
              ? `${Math.round((awaiting / stats.total) * 100)}% have no feedback`
              : "No contacts yet"
          }
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div
          className="fc-rise rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 sm:text-lg">Weekly intake</h3>
              <p className="text-sm text-gray-500">Contacts added per week, last 12 weeks</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {stats.weeks.reduce((n, w) => n + w.count, 0).toLocaleString()} total
            </span>
          </div>
          <div className="mt-4 h-56 sm:h-64">
            {loading ? (
              <div className="flex h-full items-end gap-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 animate-pulse rounded-t-lg bg-gray-100"
                    style={{ height: `${30 + ((i * 37) % 60)}%` }}
                  />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeks} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fcBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
                      fontSize: 13,
                    }}
                    labelFormatter={(l) => `Week of ${l}`}
                    formatter={(v) => [v, "Contacts"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#fcBar)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={36}
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="fc-rise flex flex-col rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 sm:text-lg">Follow-up progress</h3>
              <p className="text-sm text-gray-500">Where every contact stands</p>
            </div>
            <Link
              href="/follow-up"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open
            </Link>
          </div>

          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-gray-100">
            {FEEDBACK_ROUNDS.map((r) => (
              <div
                key={r.value}
                className="h-full transition-[width] duration-1000 ease-out"
                style={{
                  width: loading || !stats.total ? 0 : `${(stats.rounds[r.value] / stats.total) * 100}%`,
                  background: ROUND_COLORS[r.value],
                }}
              />
            ))}
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {FEEDBACK_ROUNDS.map((r) => (
              <li key={r.value} className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: ROUND_COLORS[r.value] }} />
                  <span className="truncate">{r.label}</span>
                </div>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? "..." : stats.rounds[r.value].toLocaleString()}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Top services</p>
            <ul className="mt-3 space-y-2.5">
              {stats.topServices.map(([label, count]) => (
                <li key={label}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-gray-700">{label}</span>
                    <span className="font-semibold tabular-nums text-gray-900">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-1000 ease-out"
                      style={{ width: `${(count / (stats.topServices[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
              {!loading && stats.topServices.length === 0 && (
                <li className="text-sm text-gray-400">No contacts yet</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const TONES = {
  indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/30",
  fuchsia: "from-fuchsia-500 to-pink-500 shadow-fuchsia-500/30",
  sky: "from-sky-500 to-cyan-500 shadow-sky-500/30",
  rose: "from-rose-500 to-orange-500 shadow-rose-500/30",
};

interface StatCardProps {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: keyof typeof TONES;
  foot: React.ReactNode;
  delay: number;
  href?: string;
}

function StatCard({ label, value, loading, icon: Icon, tone, foot, delay, href }: StatCardProps) {
  const shown = useCountUp(loading ? 0 : value);
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 sm:text-sm">{label}</p>
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg sm:h-10 sm:w-10 ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-gray-900 sm:text-3xl">
        {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-gray-100" /> : shown.toLocaleString()}
      </p>
      <div className="mt-2 text-xs text-gray-500 sm:text-sm">{loading ? " " : foot}</div>
    </>
  );
  const className =
    "fc-rise block rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5";
  return href ? (
    <Link href={href} className={className} style={{ animationDelay: `${delay}s` }}>
      {body}
    </Link>
  ) : (
    <div className={className} style={{ animationDelay: `${delay}s` }}>
      {body}
    </div>
  );
}

function SplitBar({ a, b, bLabel }: { a: number; b: number; aLabel: string; bLabel: string }) {
  const pct = a + b ? (a / (a + b)) * 100 : 0;
  return (
    <div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-emerald-200">
        <div className="h-full bg-sky-500 transition-[width] duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 truncate">{bLabel}</p>
    </div>
  );
}
