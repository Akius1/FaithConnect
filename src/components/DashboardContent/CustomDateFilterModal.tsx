"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Validate date range
  const validateDates = () => {
    const newErrors: { start?: string; end?: string } = {};

    if (!startDate) {
      newErrors.start = "Start date is required";
    }
    if (!endDate) {
      newErrors.end = "End date is required";
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.end = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (validateDates()) {
      setIsVisible(false);
      setTimeout(() => onApply(startDate, endDate), 150);
    }
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 150);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const formatDateLabel = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Custom Date Range
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select your preferred date range
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <div className="relative group">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.start)
                    setErrors((prev) => ({ ...prev, start: undefined }));
                }}
                className={`pl-10 pr-4 py-3 w-full border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.start
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500 hover:border-gray-300"
                }`}
              />
              {startDate && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDateLabel(startDate).split(",")[0]}
                  </span>
                </div>
              )}
            </div>
            {errors.start && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {errors.start}
              </p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <div className="relative group">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-indigo-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.end)
                    setErrors((prev) => ({ ...prev, end: undefined }));
                }}
                min={startDate}
                className={`pl-10 pr-4 py-3 w-full border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.end
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500 hover:border-gray-300"
                }`}
              />
              {endDate && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDateLabel(endDate).split(",")[0]}
                  </span>
                </div>
              )}
            </div>
            {errors.end && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {errors.end}
              </p>
            )}
          </div>

          {/* Date Range Preview */}
          {startDate && endDate && !errors.start && !errors.end && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Date Range Preview
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    days
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!startDate || !endDate}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
