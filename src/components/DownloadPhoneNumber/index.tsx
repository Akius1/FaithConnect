"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaWhatsapp,
  FaDownload,
  FaPhone,
  FaFileExcel,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaShare,
} from "react-icons/fa";
import {
  ChevronDownIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function DownloadPhones() {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [isDownloading, setIsDownloading] = useState<"phone" | "all" | null>(
    null
  );
  const [isSharing, setIsSharing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  // Enhanced period change handler
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

  // Enhanced download function with better error handling and loading states
  const downloadPhoneNumbers = async (start?: Date, end?: Date) => {
    setIsDownloading("phone");
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

      toast.success("📱 Phone numbers downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download phone numbers. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  // Enhanced download all details function
  const downloadAllDetails = async (start?: Date, end?: Date) => {
    setIsDownloading("all");
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

      toast.success("📄 All details downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download all details. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  // Enhanced trigger download function
  const triggerDownload = (downloadType: "phone" | "all") => {
    if (period !== "custom") {
      if (downloadType === "phone") {
        downloadPhoneNumbers();
      } else {
        downloadAllDetails();
      }
    } else {
      setShowModal(true);
    }
    setDropdownOpen(false);
  };

  // Enhanced WhatsApp share function
  const shareOnWhatsApp = async () => {
    setIsSharing(true);
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
      const message = data.message;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast.success("💬 Opened WhatsApp for sharing!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to share on WhatsApp. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // Get period label for display
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

  // Enhanced Modal Component
  const Modal = () => (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        showModal ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          showModal
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FaCalendarAlt className="text-indigo-600" />
              <span>Custom Date Range</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select your preferred date range for export
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <div className="relative">
              <DatePicker
                selectsRange
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={(update: [Date | null, Date | null]) =>
                  setDateRange(update)
                }
                isClearable={true}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
                placeholderText="Select start and end dates"
                dateFormat="MMM dd, yyyy"
              />
            </div>
            {dateRange[0] && dateRange[1] && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <p className="text-sm text-indigo-700">
                  <span className="font-medium">Selected Range:</span>{" "}
                  {dateRange[0].toLocaleDateString()} -{" "}
                  {dateRange[1].toLocaleDateString()}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  {Math.ceil(
                    (dateRange[1].getTime() - dateRange[0].getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (dateRange[0] && dateRange[1]) {
                downloadPhoneNumbers(dateRange[0], dateRange[1]);
                setShowModal(false);
              } else {
                toast.error("Please select a valid date range.");
              }
            }}
            disabled={
              !dateRange[0] || !dateRange[1] || isDownloading === "phone"
            }
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isDownloading === "phone" ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <FaPhone className="text-sm" />
                <span>Download Phones</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (dateRange[0] && dateRange[1]) {
                downloadAllDetails(dateRange[0], dateRange[1]);
                setShowModal(false);
              } else {
                toast.error("Please select a valid date range.");
              }
            }}
            disabled={!dateRange[0] || !dateRange[1] || isDownloading === "all"}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isDownloading === "all" ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <FaFileExcel className="text-sm" />
                <span>Download All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`space-y-6 transform transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FaDownload className="text-indigo-600" />
              <span>Export & Share</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Download contact data or share via WhatsApp
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm">
            {period !== "all" && (
              <span className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                <FaFilter className="text-xs" />
                <span>{getPeriodLabel(period)}</span>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                <FaSearch className="text-xs" />
                <span>
                  &quot;
                  {search.length > 15
                    ? search.substring(0, 15) + "..."
                    : search}
                  &quot;
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
              <FaCalendarAlt className="text-xs" />
              <span>Time Period</span>
            </label>
            <div className="relative">
              <select
                value={period}
                onChange={handlePeriodChange}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
              >
                <option value="all">All Time</option>
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search Filter</span>
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* WhatsApp Share */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
              <FaShare className="text-xs" />
              <span>Quick Share</span>
            </label>
            <button
              onClick={shareOnWhatsApp}
              disabled={isSharing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSharing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <FaWhatsapp className="text-lg" />
                  <span>Share on WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-5 w-5 text-indigo-600" />
              <span>Download Options</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Export your filtered contact data
            </p>
          </div>

          {/* Download Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isDownloading !== null}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaDownload className="text-sm" />
              <span>Download Excel</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden animate-fadeIn">
                <div className="p-2">
                  <button
                    onClick={() => triggerDownload("phone")}
                    disabled={isDownloading === "phone"}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        {isDownloading === "phone" ? (
                          <svg
                            className="animate-spin h-4 w-4 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        ) : (
                          <PhoneIcon className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Phone Numbers Only
                      </p>
                      <p className="text-xs text-gray-500">
                        Export just the phone numbers
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => triggerDownload("all")}
                    disabled={isDownloading === "all"}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        {isDownloading === "all" ? (
                          <svg
                            className="animate-spin h-4 w-4 text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        ) : (
                          <DocumentArrowDownIcon className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        All Contact Details
                      </p>
                      <p className="text-xs text-gray-500">
                        Complete contact information
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render Modal */}
      {showModal && <Modal />}
    </div>
  );
}
