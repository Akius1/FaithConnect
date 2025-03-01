// app/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { RedirectToSignIn, SignedIn, useUser } from "@clerk/nextjs";
import StatisticsChart, { StatisticsData } from "@/src/components/StatisticsContent";

export default function Statistic() {
  const { isLoaded, user } = useUser();

  // Optionally, while loading, show a loading state
  if (!isLoaded) {
    return   <header className="w-full bg-white border-b">
    <div className="flex items-center justify-center h-16">
      <div className="flex items-center space-x-2">
        <svg
          className="animate-spin h-6 w-6 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
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
        <span className="text-gray-600">Loading user...</span>
      </div>
    </div>
  </header>;
  }

  // If the user is not signed in, redirect to sign in
  if (!user) {
    return <RedirectToSignIn />;
  }

  const [stats, setStats] = useState<StatisticsData[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Replace with your API endpoint that returns aggregated statistics
        const res = await fetch("/api/statistics");
        if (!res.ok) {
          throw new Error("Failed to fetch statistics");
        }
        const data = await res.json();
        // Expect data to be an array of objects with keys: month, newConvert, firstTimer
        setStats(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <SignedIn>
      <StatisticsChart  data={stats} />
    </SignedIn>
  );
}
