"use client";

import Link from "next/link";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeftIcon,
  Bars3Icon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAppShell } from "@/src/components/AppShell";

interface HeaderProps {
  appName: string;
}

export default function Header({ appName }: HeaderProps) {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const shell = useAppShell();

  const handleLogout = () => clerk.signOut({ redirectUrl: "/login" });

  return (
    <header className="w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/70 sticky top-0 z-20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Left side - Back button and App name */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            {shell && (
              <button
                onClick={shell.openSidebar}
                className="md:hidden flex-shrink-0 p-2 -m-2 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            {pathname !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="hidden md:block flex-shrink-0 p-2 -m-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                {appName}
              </h1>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex-shrink-0">
            {!isLoaded ? (
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            ) : (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center space-x-2 sm:space-x-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                  {/* User Info - Hidden on very small screens */}
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-gray-800 truncate max-w-32 lg:max-w-none">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="flex items-center space-x-1">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-white shadow-md transition-all hover:ring-indigo-200"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                        {(user?.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
                  sideOffset={5}
                  align="end"
                >
                  {/* User info for mobile */}
                  <div className="sm:hidden px-3 py-2 border-b border-gray-100 mb-2">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <DropdownMenu.Item
                    onSelect={() => router.push("/profile")}
                    className="cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-2 border-t border-gray-200" />

                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
