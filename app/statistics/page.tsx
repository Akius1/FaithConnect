"use client";

import React, { useEffect, useState } from "react";
import { RedirectToSignIn, SignedIn, useUser } from "@clerk/nextjs";
import StatisticsChart, {
  StatisticsData,
} from "@/src/components/StatisticsContent";

export default function Statistic() {
  const { isLoaded, user } = useUser();
  // Always call hooks at the top
  const [stats, setStats] = useState<StatisticsData[]>([]);

  // Only fetch stats when user is loaded and exists
  useEffect(() => {
    if (isLoaded && user) {
      async function fetchStats() {
        try {
          const res = await fetch("/api/statistics");
          if (!res.ok) {
            throw new Error("Failed to fetch statistics");
          }
          const data = await res.json();
          setStats(data);
        } catch (error) {
          console.error("Error fetching statistics:", error);
        }
      }
      fetchStats();
    }
  }, [isLoaded, user]);

  // Conditional rendering based on user status:
  if (!isLoaded) {
    return (
      <header className="w-full bg-white border-b">
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
      </header>
    );
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  return (
    <SignedIn>
      <StatisticsChart data={stats} />
    </SignedIn>
  );
}
