// app/dashboard/page.tsx
"use client";

import { RedirectToSignIn, SignedIn, useUser } from "@clerk/nextjs";
import DashboardContent from "@/src/components/DashboardContent"; // Your dashboard component

export default function DashboardPage() {
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

  return (
    <SignedIn>
      <DashboardContent />
    </SignedIn>
  );
}
