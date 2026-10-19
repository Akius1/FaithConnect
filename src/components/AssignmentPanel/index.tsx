"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useViewer } from "@/src/components/AppShell";

interface Option {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
}

// Shows who a contact is assigned to. Super admins can change it.
export default function AssignmentPanel({
  contactId,
  assignedId,
}: {
  contactId: string;
  assignedId: string | null;
}) {
  const viewer = useViewer();
  const canAssign = viewer.isAdmin && !viewer.legacy;
  const [options, setOptions] = useState<Option[]>([]);
  const [current, setCurrent] = useState(assignedId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setCurrent(assignedId ?? ""), [assignedId]);

  useEffect(() => {
    if (viewer.legacy) return;
    fetch("/api/counsellors?basic=1")
      .then((r) => (r.ok ? r.json() : []))
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [viewer.legacy]);

  if (viewer.legacy) return null;

  const name = (id: string) => {
    const o = options.find((c) => c.id === id);
    return o?.full_name ?? o?.email ?? "A counsellor";
  };

  async function save(next: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/contacts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [contactId], counsellorId: next || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save");
      setCurrent(next);
      toast.success(next ? `Assigned to ${name(next)}` : "Unassigned");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
        <UserCircleIcon className="h-5 w-5" />
        Assigned counsellor
      </div>
      {canAssign ? (
        <select
          value={current}
          disabled={saving}
          onChange={(e) => save(e.target.value)}
          className="mt-2 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
        >
          <option value="">Not assigned</option>
          {options
            .filter((o) => o.is_active || o.id === current)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name ?? o.email}
              </option>
            ))}
        </select>
      ) : (
        <p className="mt-1 text-sm text-indigo-800">
          {current
            ? current === viewer.counsellorId
              ? "You"
              : name(current)
            : "Not assigned yet"}
        </p>
      )}
    </div>
  );
}
