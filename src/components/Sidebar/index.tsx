"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Bars3Icon, // Hamburger menu icon
  XMarkIcon,  // Close (X) icon
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
  { name: "Statistic", href: "/statistic", icon: ChartBarIcon },
];

export default function ResponsiveSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Sidebar for large screens */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-br from-indigo-700 to-blue-600 shadow-lg">
        {/* Branding / Logo */}
        <div className="p-4 text-2xl font-bold text-white border-b border-indigo-500">
          Faith Connect
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-white text-indigo-700 font-semibold"
                        : "text-white hover:bg-indigo-500"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile hamburger button (shown on small screens) */}
      <div className="md:hidden flex items-center p-2">
        <button
          onClick={toggleSidebar}
          className="text-indigo-700 hover:text-indigo-900 focus:outline-none"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar (overlay) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Dark overlay behind sidebar */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleSidebar}
          />
          {/* Sidebar panel */}
          <aside className="relative w-64 bg-gradient-to-br from-indigo-700 to-blue-600 shadow-lg flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-indigo-500">
              <span className="text-2xl font-bold text-white">
                Faith Connect
              </span>
              <button
                onClick={toggleSidebar}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)} // close on navigate
                        className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                          isActive
                            ? "bg-white text-indigo-700 font-semibold"
                            : "text-white hover:bg-indigo-500"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}

     
    </div>
  );
}
