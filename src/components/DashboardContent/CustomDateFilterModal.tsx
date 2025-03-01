"use client";

import { useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface CustomDateFilterModalProps {
  initialStartDate: string;
  initialEndDate: string;
  onApply: (startDate: string, endDate: string) => void;
  onCancel: () => void;
}

export default function CustomDateFilterModal({
  initialStartDate,
  initialEndDate,
  onApply,
  onCancel,
}: CustomDateFilterModalProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Select Date Range</h2>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <CalendarIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
              height={20}
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="relative">
            <CalendarIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
              height={20}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(startDate, endDate)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
