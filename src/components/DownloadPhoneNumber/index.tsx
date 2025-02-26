"use client";

import { useState } from "react";

export default function DownloadPhones() {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  // Optional: If you have custom date range
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");

  const handleDownload = async () => {
    try {
      // Build the query parameters
      const url = new URL("/api/export/phone-numbers", window.location.origin);
      url.searchParams.set("period", period);
      url.searchParams.set("search", search);

      // If "custom" is selected and you have start/end date:
      // if (period === "custom") {
      //   url.searchParams.set("start", startDate);
      //   url.searchParams.set("end", endDate);
      // }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to download file.");

      // Convert response to Blob and trigger a download
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

  return (
    <div className="p-4 space-y-4">
      {/* Period Dropdown */}
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="all">All</option>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
        <option value="custom">Custom</option>
      </select>

      {/* Search Input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search phone..."
        className="border border-gray-300 rounded px-3 py-2 ml-2"
      />

      {/* If period === "custom", optionally show date fields */}
      {/* {period === "custom" && (
        <>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </>
      )} */}

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="bg-green-500 text-white px-4 py-2 rounded ml-2"
      >
        Download Excel
      </button>
    </div>
  );
}
