"use client";

import Link from "next/link";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  appName: string;
}

export default function Header({ appName }: HeaderProps) {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await clerk.signOut();
    router.push("/login");
  };

  if (!isLoaded) {
    return (
      <header className="w-full bg-white border-b">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-6 w-6 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <span className="text-gray-600">Loading user...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b">
      <div className="w-full flex justify-between px-4 py-4">
        <div className="flex items-center space-x-2">
          {pathname !== "/dashboard" && (
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
            </Link>
          )}
          <div  className="text-2xl font-bold text-gray-800">
            {appName}
          </div>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <span className="text-gray-800 font-medium">
                {user?.firstName} {user?.lastName}
              </span>
              <Image
                src={user?.imageUrl ?? ""}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border border-gray-300"
              />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[8rem] bg-white rounded-md shadow-md p-2"
              sideOffset={5}
            >
              <DropdownMenu.Item
                onSelect={handleLogout}
                className="cursor-pointer p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
