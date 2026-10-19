"use client";

import { createContext, useContext, useState } from "react";
import Sidebar from "@/src/components/Sidebar";

export interface Viewer {
  isAdmin: boolean;
  // True until the counsellors migration has been run on Supabase.
  legacy: boolean;
  counsellorId: string | null;
}

interface ShellContext {
  openSidebar: () => void;
  viewer: Viewer;
}

const Context = createContext<ShellContext | null>(null);

export function useAppShell() {
  return useContext(Context);
}

const NO_VIEWER: Viewer = { isAdmin: false, legacy: false, counsellorId: null };

export function useViewer(): Viewer {
  return useContext(Context)?.viewer ?? NO_VIEWER;
}

export default function AppShell({
  children,
  viewer = NO_VIEWER,
}: {
  children: React.ReactNode;
  viewer?: Viewer;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Context.Provider value={{ openSidebar: () => setSidebarOpen(true), viewer }}>
      <div className="min-h-dvh bg-gray-100">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} viewer={viewer} />
        <main className="md:pl-64 lg:pl-72 min-h-dvh min-w-0">
          {viewer.legacy && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6 lg:px-8">
              <span className="font-semibold">Setup needed:</span> run the Supabase migration to turn on
              counsellor accounts, assignments and message history.
            </div>
          )}
          {children}
        </main>
      </div>
    </Context.Provider>
  );
}
