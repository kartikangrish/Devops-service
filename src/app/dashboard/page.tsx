"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your GitHub repositories and workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/repos"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-900">Repositories</h3>
          <p className="mt-2 text-sm text-gray-500">
            View and manage your GitHub repositories
          </p>
        </Link>

        <Link
          href="/dashboard/workflows"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
          <p className="mt-2 text-sm text-gray-500">
            Configure and monitor your GitHub Actions workflows
          </p>
        </Link>

        <Link
          href="/dashboard/cron"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-900">Cron Jobs</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create and manage scheduled tasks
          </p>
        </Link>
      </div>
    </div>
  );
} 