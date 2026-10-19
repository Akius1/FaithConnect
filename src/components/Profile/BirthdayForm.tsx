"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface Props {
  initial: { day: number | null; month: number | null; year: number | null };
  months: string[];
}

const inputClass =
  "mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

export default function BirthdayForm({ initial, months }: Props) {
  const router = useRouter();
  const [day, setDay] = useState(initial.day?.toString() ?? "");
  const [month, setMonth] = useState(initial.month?.toString() ?? "");
  const [year, setYear] = useState(initial.year?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_day: day, birth_month: month, birth_year: year || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save birthday");
      toast.success("Birthday saved");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
      <Toaster position="top-right" />
      <label className="text-sm font-medium text-gray-700">
        Day
        <input
          type="number"
          min={1}
          max={31}
          required
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-medium text-gray-700">
        Month
        <select
          required
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={inputClass}
        >
          <option value="">Select</option>
          {months.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-gray-700">
        Year <span className="font-normal text-gray-400">(optional)</span>
        <input
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="col-span-2 sm:col-span-1 h-[42px] rounded-lg bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
