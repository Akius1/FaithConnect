"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Props {
  searchTerm: string;
  filterPeriod: string;
  setSearchTerm: (value: string) => void;
  setFilterPeriod: (value: string) => void;
}

export default function SearchFilterBar({
  searchTerm,
  filterPeriod,
  setSearchTerm,
  setFilterPeriod,
}: Props) {
  return (
    <section className="flex flex-col md:flex-row items-center gap-4 mb-6">
      <div className="relative w-full md:w-1/3">
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
      <div className="w-full md:w-1/5">
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="all">All</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>
      <div className="w-full md:w-1/4 ml-auto">
        <button
          onClick={() => console.log("Add Contact")}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 transition transform hover:scale-105"
        >
          Add Contact
        </button>
      </div>
    </section>
  );
}
