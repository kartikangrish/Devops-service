"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";

const navigation = [
  { name: "Repositories", href: "/dashboard/repos" },
  { name: "Workflows", href: "/dashboard/workflows" },
  { name: "Cron Jobs", href: "/dashboard/cron" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                DevOps Service
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
} 