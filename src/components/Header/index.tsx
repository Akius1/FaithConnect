"use client";

import Link from "next/link";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface HeaderProps {
  appName: string;
  username: string;
  profileImageUrl?: string;
  onLogout: () => void;
}

export default function Header({ appName, username, profileImageUrl, onLogout }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b">
      <div className="w-full flex justify-between  px-4 py-4">
        {/* Logo on the left */}
        <Link href="/" className="text-2xl font-bold text-gray-800">
          {appName}
        </Link>

        {/* User Profile Dropdown on the right */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <Image
                src={profileImageUrl || "/default-profile.png"}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border border-gray-300"
              />
              <span className="text-gray-800 font-medium">{username}</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[8rem] bg-white rounded-md shadow-md p-2"
              sideOffset={5}
            >
              <DropdownMenu.Item
                onSelect={onLogout}
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
