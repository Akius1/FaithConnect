"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Header from "@/src/components/Header";
import DownloadPhones from "@/src/components/DownloadPhoneNumber";
import Overview from "./Overview";
import ContactsTable from "./ContactsTable";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import CustomDateFilterModal from "./CustomDateFilterModal";

export interface Entry {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  prayerPoint: string;
  contactType: string;
  serviceType: string;
  gender: string;
  district: string;
  contactDate: Date;
  createdAt: Date;
  feedbackCount: number;
  assigned_counsellor_id?: string | null;
}

type RawEntry = Omit<Entry, "contactDate" | "createdAt" | "feedbackCount"> & {
  contactDate: string;
  createdAt: string;
  feedbackCount?: number;
};

type Period = "all" | "day" | "week" | "month" | "year" | "custom";

const PERIODS: { value: Period; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom" },
];

const TYPES = [
  { value: "all", label: "Everyone" },
  { value: "first timer", label: "First timers" },
  { value: "new convert", label: "New converts" },
];

function inPeriod(entry: Entry, period: Period, start: string, end: string, now: Date) {
  const d = entry.createdAt;
  switch (period) {
    case "day":
      return d.toDateString() === now.toDateString();
    case "week": {
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay());
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
    case "month":
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    case "year":
      return d.getFullYear() === now.getFullYear();
    case "custom": {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return entry.contactDate >= new Date(start) && entry.contactDate <= e;
    }
    default:
      return true;
  }
}

export default function Dashboard() {
  const [contacts, setContacts] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [contactType, setContactType] = useState("all");

  const today = new Date().toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [selectedContactForDeletion, setSelectedContactForDeletion] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/contacts", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to fetch contacts");
      setContacts(
        (body as RawEntry[]).map((item) => ({
          ...item,
          contactDate: new Date(item.contactDate),
          createdAt: new Date(item.createdAt),
          feedbackCount: item.feedbackCount ?? 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const term = searchTerm.trim().toLowerCase();
    return contacts.filter((entry) => {
      if (contactType !== "all" && entry.contactType?.toLowerCase() !== contactType) return false;
      if (!inPeriod(entry, period, customStartDate, customEndDate, now)) return false;
      if (!term) return true;
      return [
        entry.firstName,
        entry.lastName,
        entry.phone,
        entry.prayerPoint,
        entry.address,
        entry.district,
        entry.serviceType,
      ].some((v) => typeof v === "string" && v.toLowerCase().includes(term));
    });
  }, [contacts, searchTerm, period, contactType, customStartDate, customEndDate]);

  const filtersActive = searchTerm !== "" || period !== "all" || contactType !== "all";

  // Close the export panel with Escape.
  useEffect(() => {
    if (!showExport) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowExport(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showExport]);

  const handleDeleteContact = async (contact: Entry) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      toast.success("Contact deleted");
      setSelectedContactForDeletion(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete contact.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, className: "text-sm" }} />
      <Header appName="Dashboard" />

      <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        {loadError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="font-semibold">Contacts could not be loaded.</span> {loadError}
            </p>
            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <ArrowPathIcon className="h-4 w-4" /> Try again
            </button>
          </div>
        )}

        <Overview contacts={contacts} loading={loading} />

        {/* Contacts */}
        <section
          className="fc-rise rounded-3xl border border-gray-200/80 bg-white shadow-sm"
          style={{ animationDelay: "0.35s" }}
        >
          <div className="space-y-4 border-b border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">All contacts</h2>
                <p className="text-sm text-gray-500">
                  {loading
                    ? "Loading..."
                    : filtersActive
                    ? `${filteredData.length.toLocaleString()} of ${contacts.length.toLocaleString()} match your filters`
                    : `${contacts.length.toLocaleString()} people`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={() => setShowExport(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export & share
                </button>
                <Link
                  href="/add-contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add contact
                </Link>
              </div>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, prayer point, district..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-[15px] transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => (p.value === "custom" ? setShowCustomModal(true) : setPeriod(p.value))}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      period === p.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p.value === "custom" && period === "custom"
                      ? `${customStartDate} → ${customEndDate}`
                      : p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 rounded-2xl bg-gray-100 p-1 lg:flex-none">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setContactType(t.value)}
                      className={`flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-all lg:flex-none ${
                        contactType === t.value
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {filtersActive && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setPeriod("all");
                      setContactType("all");
                    }}
                    className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Clear filters"
                    title="Clear filters"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <ul className="divide-y divide-gray-50">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/5 animate-pulse rounded bg-gray-50" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ContactsTable
              data={filteredData}
              setSelectedContactForDeletion={setSelectedContactForDeletion}
            />
          )}
        </section>
      </div>

      {/* Export & share panel */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
          <div
            className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowExport(false)}
          />
          <aside className="fc-sheet relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl md:max-h-none md:w-[560px] md:rounded-none md:rounded-l-3xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Export & share</h2>
                <p className="text-sm text-gray-500">Download Excel files or share a list on WhatsApp</p>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5">
              <DownloadPhones />
            </div>
          </aside>
        </div>
      )}

      <DeleteConfirmationModal
        contact={selectedContactForDeletion}
        onCancel={() => setSelectedContactForDeletion(null)}
        onConfirm={() =>
          selectedContactForDeletion && handleDeleteContact(selectedContactForDeletion)
        }
        isDeleting={isDeleting}
      />

      {showCustomModal && (
        <CustomDateFilterModal
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
          onApply={(start, end) => {
            setCustomStartDate(start);
            setCustomEndDate(end);
            setPeriod("custom");
            setShowCustomModal(false);
          }}
          onCancel={() => setShowCustomModal(false)}
        />
      )}
    </>
  );
}
