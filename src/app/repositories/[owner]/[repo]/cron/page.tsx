"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import CronJobConfig from "@/components/CronJobConfig";

export default function CronPage() {
  const { owner, repo } = useParams() as { owner: string; repo: string };
  const { data: session } = useSession();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cron Jobs</h1>
        <button
          onClick={() => setShowConfig(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Cron Job
        </button>
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900">
              Create Cron Job
            </h3>
            <div className="mt-4">
              <CronJobConfig
                onSave={async (config) => {
                  try {
                    const response = await fetch("/api/cron", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.accessToken}`,
                      },
                      body: JSON.stringify({
                        ...config,
                        owner,
                        repo,
                      }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                      throw new Error(data.error || "Failed to create cron job");
                    }

                    toast.success("Cron job created successfully");
                    setShowConfig(false);
                  } catch (error) {
                    console.error("Error creating cron job:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to create cron job");
                  }
                }}
                onCancel={() => setShowConfig(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 