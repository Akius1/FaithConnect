// app/dashboard/page.tsx
"use client";

import { RedirectToSignIn, SignedIn, useUser } from "@clerk/nextjs";
import DashboardContent from "@/src/components/DashboardContent"; // Your dashboard component

export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  // Optionally, while loading, show a loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
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
