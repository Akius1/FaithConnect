import { useId } from "react";

// The Faith Connect mark: a heart with a cross cut through it, and a gold dot
// for a new member being connected. Same artwork as public/logo.svg.
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Faith Connect">
      <defs>
        <linearGradient id={`${id}-bg`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="32" y1="0" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="16" fill={`url(#${id}-shine)`} />
      <path
        fill="#ffffff"
        fillRule="evenodd"
        d="M32 51.5C19.6 43.4 11.5 36.1 11.5 25.7c0-6.3 4.8-11.2 10.9-11.2 4.1 0 7.6 2.2 9.6 5.6 2-3.4 5.5-5.6 9.6-5.6 6.1 0 10.9 4.9 10.9 11.2 0 10.4-8.1 17.7-20.5 25.8ZM29.6 21.5h4.8a1 1 0 0 1 1 1v4.6h4.6a1 1 0 0 1 1 1v4.6a1 1 0 0 1-1 1h-4.6v9.6a1 1 0 0 1-1 1h-4.8a1 1 0 0 1-1-1v-9.6H24a1 1 0 0 1-1-1v-4.6a1 1 0 0 1 1-1h4.6v-4.6a1 1 0 0 1 1-1Z"
      />
      <circle cx="50" cy="13.5" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  );
}

// Mark plus wordmark. `tone` picks text colours for dark or light backgrounds.
export default function Logo({
  tone = "light",
  className = "",
  markClassName = "h-9 w-9",
}: {
  tone?: "light" | "dark";
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={`${markClassName} flex-shrink-0 drop-shadow-sm`} />
      <span className="leading-none">
        <span
          className={`block text-lg font-extrabold tracking-tight ${
            tone === "light" ? "text-white" : "text-gray-900"
          }`}
        >
          Faith<span className={tone === "light" ? "text-amber-300" : "text-indigo-600"}>Connect</span>
        </span>
        <span
          className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] ${
            tone === "light" ? "text-indigo-200" : "text-gray-400"
          }`}
        >
          Every soul, followed up
        </span>
      </span>
    </span>
  );
}
