"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import type { Viewer } from "@/src/components/AppShell";
import Logo from "@/src/components/Logo";
import {
  HomeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  UserCircleIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Follow-up", href: "/follow-up", icon: ClipboardDocumentCheckIcon },
  { name: "Foundation Class", href: "/foundation", icon: AcademicCapIcon },
  { name: "Add Contact", href: "/add-contact", icon: UserPlusIcon },
  { name: "Messages", href: "/send-sms", icon: ChatBubbleLeftRightIcon },
  { name: "Counsellors", href: "/counsellors", icon: UsersIcon, adminOnly: true },
  { name: "Reports", href: "/reports", icon: DocumentChartBarIcon, adminOnly: true },
  { name: "Statistic", href: "/statistics", icon: ChartBarIcon },
  { name: "My Profile", href: "/profile", icon: UserCircleIcon },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  viewer: Viewer;
}

export default function Sidebar({ open, onClose, viewer }: SidebarProps) {
  const pathname = usePathname();

  // Close the drawer after navigating.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden print:!hidden md:flex md:flex-col md:w-64 lg:w-72 bg-gradient-to-br from-indigo-700 to-blue-600 shadow-xl fixed inset-y-0 left-0 z-20">
        <SidebarBody pathname={pathname} viewer={viewer} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-gradient-to-br from-indigo-700 to-blue-600 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-5 p-2 text-white/90 hover:text-white rounded-lg"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <SidebarBody pathname={pathname} viewer={viewer} />
        </aside>
      </div>
    </>
  );
}

function SidebarBody({ pathname, viewer }: { pathname: string; viewer: Viewer }) {
  const { signOut } = useClerk();
  const items = navItems.filter((i) => !i.adminOnly || (viewer.isAdmin && !viewer.legacy));

  return (
    <>
      <div className="px-5 h-16 sm:h-20 flex items-center border-b border-indigo-500/30">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white text-indigo-700 font-semibold shadow-md"
                      : "text-white hover:bg-indigo-500/50"
                  }`}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-indigo-500/30 space-y-2">
        {viewer.isAdmin && !viewer.legacy && (
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            <ShieldCheckIcon className="h-5 w-5 text-amber-300" />
            Super admin
          </div>
        )}
        <button
          onClick={() => signOut({ redirectUrl: "/login" })}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-indigo-500/50 transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );
}
