// Shared look for every Clerk component (sign-in, sign-up, user popups).
// The auth pages draw their own card, so Clerk's card is flattened.
export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#4f46e5",
    colorText: "#111827",
    colorTextSecondary: "#6b7280",
    colorInputBackground: "#f9fafb",
    colorInputText: "#111827",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
    fontSize: "1rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "!w-full !max-w-none !shadow-none !border-0 !rounded-none !overflow-visible",
    card: "!w-full !shadow-none !border-0 !bg-transparent !p-0 !rounded-none gap-6",
    header: "items-start text-left gap-1",
    headerTitle: "text-2xl sm:text-[1.7rem] font-bold tracking-tight text-gray-900",
    headerSubtitle: "text-[15px] text-gray-500",
    socialButtonsBlockButton:
      "!h-12 rounded-2xl border border-gray-200 bg-white text-[15px] font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-md",
    socialButtonsBlockButtonText: "text-[15px] font-semibold",
    socialButtonsProviderIcon: "h-5 w-5",
    dividerLine: "bg-gray-200",
    dividerText: "text-xs font-medium uppercase tracking-widest text-gray-400",
    formFieldLabel: "text-sm font-semibold text-gray-700",
    formFieldInput:
      "!h-12 !max-h-12 rounded-2xl border-gray-200 bg-gray-50 px-4 text-[15px] transition-colors focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100",
    formButtonPrimary:
      "!h-12 rounded-2xl !bg-gradient-to-r from-indigo-600 to-fuchsia-600 !shadow-lg text-[15px] font-semibold normal-case shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0",
    footer: "!bg-none !bg-transparent !p-0 !mt-2 [&>*]:!bg-transparent [&>*]:!bg-none",
    footerAction: "justify-center",
    footerActionText: "text-sm text-gray-500",
    footerActionLink: "text-sm font-semibold text-indigo-600 hover:text-indigo-700",
    identityPreview: "rounded-2xl border-gray-200 bg-gray-50",
    otpCodeFieldInput: "h-12 w-11 rounded-xl border-gray-300",
    formResendCodeLink: "font-semibold text-indigo-600",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to continue to Faith Connect",
    },
  },
  signUp: {
    start: {
      title: "Join as a counsellor",
      subtitle: "Create your Faith Connect account",
    },
  },
};
