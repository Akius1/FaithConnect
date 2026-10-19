import {
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";
import Logo from "@/src/components/Logo";

const ROUNDS = [
  { label: "No feedback yet", color: "#f43f5e" },
  { label: "First round", color: "#f59e0b" },
  { label: "Second round", color: "#0ea5e9" },
  { label: "Third round", color: "#10b981" },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-[#1e1b4b] text-white"
    >
      {/* Moving aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="fc-drift absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-500/50 blur-3xl" />
        <div
          className="fc-drift absolute right-[-10rem] top-1/4 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/30 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="fc-drift absolute bottom-[-12rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-sky-500/30 blur-3xl"
          style={{ animationDelay: "-12s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-dvh max-w-7xl items-center gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-12 lg:py-12">
        {/* Story side */}
        <section className="max-w-xl">
          <Logo tone="light" className="fc-rise mb-6 hidden lg:inline-flex" markClassName="h-11 w-11" />
          <br className="hidden lg:block" />
          <div className="fc-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="fc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Counsellors portal
          </div>

          <h1
            className="fc-rise mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            Every soul,
            <br />
            <span className="fc-shine bg-gradient-to-r from-amber-200 via-pink-200 to-sky-200 bg-clip-text text-transparent">
              followed up.
            </span>
          </h1>

          <p
            className="fc-rise mt-4 max-w-md text-base text-indigo-100/90 sm:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            Faith Connect keeps every first timer and new convert in view, so no one
            slips through after their first service.
          </p>

          {/* Follow-up journey demo (desktop and tablet) */}
          <div
            className="fc-rise relative mt-10 hidden sm:block"
            style={{ animationDelay: "0.35s" }}
            aria-hidden
          >
            <div className="relative max-w-md rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-pink-400 text-sm font-bold text-indigo-950">
                  GO
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Grace Okafor</p>
                  <p className="text-xs text-indigo-100/80">First timer · Sunday service</p>
                </div>
                <div className="relative h-6 w-32 text-right text-sm font-semibold">
                  {ROUNDS.map((r, i) => (
                    <span
                      key={r.label}
                      className="fc-label absolute inset-0"
                      style={{ color: r.color, animationDelay: `${i * 2}s` }}
                    >
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative mt-6 px-2">
                <div className="h-1.5 rounded-full bg-white/15" />
                <div className="fc-bar absolute left-2 top-0 h-1.5 max-w-[calc(100%-1rem)] rounded-full bg-gradient-to-r from-rose-400 via-amber-400 via-sky-400 to-emerald-400" />
                <div className="absolute inset-x-0 -top-[5px] flex justify-between">
                  {ROUNDS.map((r, i) => (
                    <span
                      key={r.label}
                      className={`h-4 w-4 rounded-full border-2 border-white/90 ${
                        i === 0 ? "" : `fc-dot-${i + 1}`
                      }`}
                      style={
                        {
                          "--c": r.color,
                          background: i === 0 ? r.color : "#e5e7eb",
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-medium text-indigo-100/70">
                <span>Added</span>
                <span>1st</span>
                <span>2nd</span>
                <span>3rd</span>
              </div>
            </div>

            <div className="fc-float absolute -right-4 -top-6 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 shadow-xl md:flex lg:-right-10">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-green-500" />
              WhatsApp sent
            </div>
            <div
              className="fc-float absolute -bottom-7 right-10 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 shadow-xl md:flex"
              style={{ animationDelay: "-3s" }}
            >
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              Feedback recorded
            </div>
            <div
              className="fc-float absolute -left-6 bottom-[-3.25rem] hidden items-center gap-2 rounded-2xl bg-indigo-950/70 px-3.5 py-2.5 text-sm font-semibold text-indigo-50 shadow-xl ring-1 ring-white/15 backdrop-blur lg:flex"
              style={{ animationDelay: "-1.5s" }}
            >
              <PhoneIcon className="h-4 w-4 text-sky-300" />
              Call back on Tuesday
            </div>
          </div>
        </section>

        {/* Form side */}
        <section
          className="fc-rise flex w-full justify-center lg:justify-end"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="w-full max-w-[460px]">
            <div className="rounded-[2rem] bg-white p-1.5 text-gray-900 shadow-[0_30px_80px_-20px_rgba(15,10,60,0.6)] ring-1 ring-white/20">
              <div className="rounded-[1.6rem] border border-gray-100 px-5 pb-3 pt-7 sm:px-8 sm:pt-9">
                <Logo tone="dark" className="mb-6" markClassName="h-10 w-10" />
                {children}
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-indigo-100/70">
              Only signed-in counsellors can see contact details.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
