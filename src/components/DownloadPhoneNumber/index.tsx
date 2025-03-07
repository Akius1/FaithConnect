"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DownloadPhones() {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Default date range is initially null; when custom is selected, it will be set to today
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When period changes, if "custom" is selected, open the modal and set a default date range
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPeriod(value);
    if (value === "custom") {
      const today = new Date();
      setDateRange([today, today]);
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  };

  // Download Phone Numbers API call
  const downloadPhoneNumbers = async (start?: Date, end?: Date) => {
    try {
      const url = new URL("/api/export/phone-numbers", window.location.origin);
      url.searchParams.set("period", period);
      url.searchParams.set("search", search);
      if (period === "custom" && start && end) {
        url.searchParams.set("start", start.toISOString());
        url.searchParams.set("end", end.toISOString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to download file.");
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "phone_numbers.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to download the file.");
    }
  };

  // Download All Details API call
  const downloadAllDetails = async (start?: Date, end?: Date) => {
    try {
      const url = new URL("/api/export/all-details", window.location.origin);
      url.searchParams.set("period", period);
      url.searchParams.set("search", search);
      if (period === "custom" && start && end) {
        url.searchParams.set("start", start.toISOString());
        url.searchParams.set("end", end.toISOString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to download file.");
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "all_details.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to download the file.");
    }
  };

  // Trigger download for non-custom periods; for custom, the modal will already be open
  const triggerDownload = (downloadType: "phone" | "all") => {
    if (period !== "custom") {
      if (downloadType === "phone") {
        downloadPhoneNumbers();
      } else {
        downloadAllDetails();
      }
    } else {
      // If period is custom, ensure the modal is open
      setShowModal(true);
    }
  };

  // Modal component for custom date range selection with two download buttons
  const Modal = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>
        <DatePicker
          selectsRange
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          onChange={(update: [Date | null, Date | null]) =>
            setDateRange(update)
          }
          isClearable={true}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholderText="Select a date range"
        />
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={() => {
              setShowModal(false);
            }}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (dateRange[0] && dateRange[1]) {
                downloadPhoneNumbers(dateRange[0], dateRange[1]);
                setShowModal(false);
              } else {
                alert("Please select a valid date range.");
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Download Phone Numbers
          </button>
          <button
            onClick={() => {
              if (dateRange[0] && dateRange[1]) {
                downloadAllDetails(dateRange[0], dateRange[1]);
                setShowModal(false);
              } else {
                alert("Please select a valid date range.");
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Download All Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <select
          value={period}
          onChange={handlePeriodChange}
          className="border border-gray-300 rounded px-3 py-2 mb-3 sm:mb-0"
        >
          <option value="all">All</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="custom">Custom</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search phone..."
          className="border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Download Button with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="bg-green-500 text-white px-4 py-2 rounded inline-flex items-center"
        >
          <span>Download Excel</span>
          <svg
            className="ml-2 w-4 h-4"
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
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-10">
            <button
              onClick={() => {
                setDropdownOpen(false);
                triggerDownload("phone");
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Download Phone Numbers
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                triggerDownload("all");
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Download All Details
            </button>
          </div>
        )}
      </div>

      {/* Render Modal for Custom Date Range if needed */}
      {showModal && <Modal />}
    </div>
  );
}
