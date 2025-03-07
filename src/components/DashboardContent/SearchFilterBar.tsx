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
    <section className="p-4 bg-white shadow rounded-lg mb-6">
      {/* Container: Stacked on mobile, row on medium+ screens */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
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
        {/* Grid container for selects and button */}
        <div className="grid grid-cols-1 gap-4 md:flex md:items-center md:space-x-4">
          {/* Period Filter */}
          <div className="flex-1">
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
          <div className="flex-1">
            <select
              value={contactTypeFilter}
              onChange={(e) => setContactTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="filterByContactType">
                Filter by Contact Type
              </option>
              <option value="first timer">First Timer</option>
              <option value="new convert">New Convert</option>
            </select>
          </div>
          {/* Add Contact Button */}
          <div className="flex-1">
            <button
              onClick={() => router.push(`/add-contact`)}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 transition transform hover:scale-105"
            >
              Add Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
