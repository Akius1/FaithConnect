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

  // Share on WhatsApp API call. It calls an endpoint that returns filter parameters as a message.
  const shareOnWhatsApp = async () => {
    try {
      const url = new URL("/api/share/filter", window.location.origin);
      url.searchParams.set("period", period);
      url.searchParams.set("search", search);
      if (period === "custom" && dateRange[0] && dateRange[1]) {
        url.searchParams.set("start", dateRange[0].toISOString());
        url.searchParams.set("end", dateRange[1].toISOString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch share message.");
      const data = await res.json();
      // Expecting the API to return { message: "..." }
      const message = data.message;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error(error);
      alert("Failed to share on WhatsApp.");
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
        <div className="flex items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone..."
            className="border border-gray-300 rounded px-3 py-2"
          />
          {/* WhatsApp Share Button */}
          <button
            onClick={shareOnWhatsApp}
            title="Share on WhatsApp"
            className="ml-2 p-2 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
          >
            <svg
              viewBox="0 0 448 512"
              className="w-6 h-6 fill-current text-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M380.9 97.1C339 55.3 282.5 32 223.1 32 100.3 32 0 132.3 0 255.1c0 47.4 12.5 93.7 36.1 134.3L0 480l94.2-27.7c40.3 21.8 86.4 33.1 133.9 33.1 122.8 0 223.1-100.3 223.1-223.1 0-59.5-23.3-116-65.3-158zm-157.8 337.2c-38.7 0-76.5-10.4-109.3-30.1l-7.8-4.6L24.4 432l14.1-41.2-4.9-8.1c-19.8-32.6-30.3-70.5-30.3-108.6C7.3 144.3 124.4 27.2 255.1 27.2c65.7 0 127.5 25.5 174 71.9 46.5 46.5 71.9 108.3 71.9 174 0 130.7-117.1 247.8-247.8 247.8zM346 317.8c-4.9 13.7-24.2 26.3-34.4 27.8-8.1 1.3-18.6 1.9-29.4-.7-35.1-8.8-63.7-34.9-86.8-64.8-22.6-29.3-33.4-63.7-31.3-97.3 1.7-27.2 9.7-48.9 18.3-63.9 4.6-8.1 5.7-11.6 1-20.1l-5.3-9.6c-3.4-6.2-7.8-13.1-10.6-18.6-3.6-6.9-3.6-12.5.7-18.1 9.4-11.7 21.4-20.7 36.1-26.5 3.8-1.7 7.2-3.4 10.5-5.1 3.1-1.5 6.2-1.9 9.2-.7l10.6 3.6c3.1 1.3 7.8 3.4 11.6 5.7 20.4 10.2 33.3 24.2 40.1 42.8 5.7 14.3 5.7 29.3 2.4 43.1-3.4 14.3-9.7 28-17.9 40.7-4.6 6.9-9.4 13.4-14.3 19.4-3.4 4.6-3.1 8.8.7 12.5l7.8 8.8c6.2 6.9 14.3 13.4 23.2 18.3 8.8 4.6 18.1 8.1 27.4 9.7 6.9 1.5 13.7 1.5 20.4-.7 16.6-4.6 31.3-12.5 43.1-21.6 12.5-9.7 21.6-22.6 27.4-36.4 6.2-14.3 6.2-29.3 0-43.1z" />
            </svg>
          </button>
        </div>
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
