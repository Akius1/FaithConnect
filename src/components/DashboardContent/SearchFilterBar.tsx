"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Props {
  searchTerm: string;
  periodFilter: string;
  contactTypeFilter: string;
  setSearchTerm: (value: string) => void;
  setPeriodFilter: (value: string) => void;
  setContactTypeFilter: (value: string) => void;
  onOpenCustomModal: () => void;
}

export default function SearchFilterBar({
  searchTerm,
  periodFilter,
  contactTypeFilter,
  setSearchTerm,
  setPeriodFilter,
  setContactTypeFilter,
  onOpenCustomModal,
}: Props) {
    const router = useRouter();
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      onOpenCustomModal();
    } else {
      setPeriodFilter(value);
    }
  };

  return (
    <section className="flex flex-col md:flex-row items-center gap-4 mb-6">
      {/* Search Input */}
      <div className="relative w-full md:w-1/5">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          width={20}
          height={20}
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />
      </div>
      {/* Period Filter */}
      <div className="flex flex-col w-full md:w-1/5">
        <select
          value={periodFilter}
          onChange={handlePeriodChange}
          className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="filterByPeriod">Filter by Period</option>
          <option value="all">All</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {/* Contact Type Filter */}
      <div className="flex flex-col w-full md:w-1/5">
        <select
          value={contactTypeFilter}
          onChange={(e) => setContactTypeFilter(e.target.value)}
          className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="filterByContactType">Filter by Contact Type</option>
          <option value="first timer">First Timer</option>
          <option value="new convert">New Convert</option>
        </select>
      </div>
      {/* Add Contact Button */}
      <div className="w-full md:w-1/5 ml-auto">
        <button
          onClick={() => router.push(`/add-contact`)}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 transition transform hover:scale-105"
        >
          Add Contact
        </button>
      </div>
    </section>
  );
}
