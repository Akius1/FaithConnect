"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters
  useEffect(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (periodFilter !== "filterByPeriod") count++;
    if (contactTypeFilter !== "filterByContactType") count++;
    setActiveFiltersCount(count);
  }, [searchTerm, periodFilter, contactTypeFilter]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      onOpenCustomModal();
    } else {
      setPeriodFilter(value);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setPeriodFilter("filterByPeriod");
    setContactTypeFilter("filterByContactType");
  };

  const getPeriodLabel = (value: string) => {
    switch (value) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "custom":
        return "Custom Range";
      default:
        return "All Time";
    }
  };

  const getContactTypeLabel = (value: string) => {
    switch (value) {
      case "first timer":
        return "First Timer";
      case "new convert":
        return "New Convert";
      default:
        return "All Types";
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder="Search contacts by name, phone, or prayer point..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle & Add Contact Button */}
        <div className="flex gap-3">
          {/* Filter Toggle */}
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={`relative px-4 py-3.5 border rounded-2xl font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeFiltersCount > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Add Contact Button */}
          <button
            onClick={() => router.push("/add-contact")}
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-medium shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isFiltersExpanded && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5" />
              <span>Filter Options</span>
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Date Period</span>
              </label>
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={handlePeriodChange}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                >
                  <option value="filterByPeriod">All Time</option>
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {periodFilter !== "filterByPeriod" && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    {getPeriodLabel(periodFilter)}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Type Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
                <UserGroupIcon className="h-4 w-4" />
                <span>Contact Type</span>
              </label>
              <div className="relative">
                <select
                  value={contactTypeFilter}
                  onChange={(e) => setContactTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                >
                  <option value="filterByContactType">All Contact Types</option>
                  <option value="first timer">First Timer</option>
                  <option value="new convert">New Convert</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {contactTypeFilter !== "filterByContactType" && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {getContactTypeLabel(contactTypeFilter)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{activeFiltersCount}</span>{" "}
                  filter{activeFiltersCount !== 1 ? "s" : ""} applied
                </p>
                <button
                  onClick={() => setIsFiltersExpanded(false)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Hide Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Filter Tags (when filters are collapsed but active) */}
      {!isFiltersExpanded && activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <MagnifyingGlassIcon className="h-3 w-3" />
              <span>
               &quot;  {searchTerm.length > 20
                  ? searchTerm.substring(0, 20) + "..."
                  : searchTerm}
                &quot;
              </span>
              <button
                onClick={() => setSearchTerm("")}
                className="hover:text-blue-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {periodFilter !== "filterByPeriod" && (
            <span className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              <CalendarIcon className="h-3 w-3" />
              <span>{getPeriodLabel(periodFilter)}</span>
              <button
                onClick={() => setPeriodFilter("filterByPeriod")}
                className="hover:text-indigo-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {contactTypeFilter !== "filterByContactType" && (
            <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <UserGroupIcon className="h-3 w-3" />
              <span>{getContactTypeLabel(contactTypeFilter)}</span>
              <button
                onClick={() => setContactTypeFilter("filterByContactType")}
                className="hover:text-green-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
