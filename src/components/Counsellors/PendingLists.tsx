"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClockIcon } from "@heroicons/react/24/outline";

interface PendingGroup {
  name: string;
  email: string | null;
  count: number;
  people: string[];
}

interface Option {
  id: string;
  full_name: string | null;
  email: string | null;
}

// Contact lists set aside for counsellors who have not signed in yet. A list
// with an email is claimed automatically on that person's first sign-in;
// otherwise the admin links it to them once they appear.
export default function PendingLists({
  counsellors,
  onChanged,
}: {
  counsellors: Option[];
  onChanged: () => void;
}) {
  const [groups, setGroups] = useState<PendingGroup[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/pending-assignments", { cache: "no-store" });
    setGroups(res.ok ? await res.json() : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function post(name: string, body: Record<string, string>) {
    setBusy(name);
    try {
      const res = await fetch("/api/pending-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      if (body.counsellorId || json.assigned) {
        toast.success(`${json.assigned} contacts assigned`);
        onChanged();
      } else {
        toast.success("Saved. They will get this list when they first sign in.");
      }
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!groups.length) return null;

  return (
    <section className="fc-rise rounded-3xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-bold text-gray-900">Waiting to join</h2>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        These lists go to each counsellor when they sign in. Add their Google email so it happens
        automatically, or link the list once they appear above.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <li key={g.name} className="flex flex-col rounded-2xl border border-amber-100 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900">{g.name}</p>
              <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {g.count} people
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-gray-500">
              {g.people.slice(0, 6).join(", ")}
              {g.count > 6 ? ` and ${g.count - 6} more` : ""}
            </p>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {g.email ? (
                <p className="truncate text-sm text-gray-700">
                  Claims on sign-in: <span className="font-semibold">{g.email}</span>
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emails[g.name] ?? ""}
                    onChange={(e) => setEmails((m) => ({ ...m, [g.name]: e.target.value }))}
                    placeholder="Their Google email"
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    disabled={busy === g.name || !emails[g.name]}
                    onClick={() => post(g.name, { email: emails[g.name] })}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              )}
              {counsellors.length > 0 && (
                <select
                  value=""
                  disabled={busy === g.name}
                  onChange={(e) => e.target.value && post(g.name, { counsellorId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Already joined? Give this list to...</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name ?? c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
