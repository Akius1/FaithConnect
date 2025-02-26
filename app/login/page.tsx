// app/sign-in/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* This will handle sign-in and redirect after sign-in */}
      <SignIn routing="hash" afterSignInUrl="/dashboard" />

    </div>
  );
}
