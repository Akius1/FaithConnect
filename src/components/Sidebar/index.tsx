"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Add Contact", href: "/add-contact", icon: UserPlusIcon },
  { name: "Send SMS", href: "/send-sms", icon: ChatBubbleLeftRightIcon },
  { name: "Statistic", href: "/statistics", icon: ChartBarIcon },
];

export default function ResponsiveSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <button
            onClick={toggleSidebar}
            className="text-indigo-700 hover:text-indigo-900 focus:outline-none transition-colors"
          >
            <Bars3Icon className="h-7 w-7" />
          </button>
          <div className="text-xl font-bold text-indigo-700">Faith Connect</div>
          <div className="w-7"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-br from-indigo-700 to-blue-600 shadow-xl fixed left-0 top-0 h-full z-20">
        <div className="p-6 text-2xl font-bold text-white border-b border-indigo-500/30">
          Faith Connect
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-white text-indigo-700 font-semibold shadow-md"
                        : "text-white hover:bg-indigo-500/50 hover:translate-x-1"
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
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={toggleSidebar}
          />

          {/* Sidebar Panel */}
          <aside className="relative w-80 max-w-[85vw] bg-gradient-to-br from-indigo-700 to-blue-600 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-indigo-500/30">
              <span className="text-2xl font-bold text-white">
                Faith Connect
              </span>
              <button
                onClick={toggleSidebar}
                className="text-white hover:text-gray-200 focus:outline-none p-1 transition-colors"
              >
                <XMarkIcon className="h-7 w-7" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 pt-6">
              <ul className="space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-white text-indigo-700 font-semibold shadow-md"
                            : "text-white hover:bg-indigo-500/50"
                        }`}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0" />
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
