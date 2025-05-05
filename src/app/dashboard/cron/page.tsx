"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import CronJobConfig from "@/components/CronJobConfig";
import RepoSelector from "@/components/RepoSelector";

interface CronJob {
  name: string;
  path: string;
  url: string;
  sha: string;
  size: number;
  download_url: string;
}

export default function CronJobsPage() {
  const { data: session, status } = useSession();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | null>(null);

  useEffect(() => {
    if (selectedRepo) {
      fetchCronJobs();
    } else {
      setCronJobs([]);
      setIsLoading(false);
    }
  }, [selectedRepo]);

  const fetchCronJobs = async () => {
    if (!selectedRepo || !session?.accessToken) return;

    try {
      console.log("Fetching cron jobs for:", selectedRepo);
      const response = await fetch(
        `/api/cron?owner=${selectedRepo.owner}&repo=${selectedRepo.repo}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to fetch cron jobs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Cron jobs data:", data);

      if (!data.cronJobs) {
        throw new Error("Invalid response format from API");
      }

      setCronJobs(data.cronJobs);
    } catch (error) {
      console.error("Error fetching cron jobs:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch cron jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCronJob = async (config: {
    name: string;
    schedule: string;
    command: string;
  }) => {
    if (!selectedRepo) {
      toast.error("Please select a repository first");
      return;
    }

    if (!session?.accessToken) {
      toast.error("Please sign in to create cron jobs");
      return;
    }

    try {
      console.log("Creating cron job with config:", {
        ...config,
        owner: selectedRepo.owner,
        repo: selectedRepo.repo,
      });

      const response = await fetch("/api/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ...config,
          owner: selectedRepo.owner,
          repo: selectedRepo.repo,
        }),
      });

      const data = await response.json();
      console.log("Cron job creation response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create cron job");
      }

      toast.success(
        <div>
          <p>{data.message}</p>
          <p className="mt-2">
            <a
              href={data.details.workflowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500"
            >
              View workflow file →
            </a>
          </p>
        </div>
      );
      setShowConfig(false);
      fetchCronJobs();
    } catch (error) {
      console.error("Error creating cron job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create cron job");
    }
  };

  const handleDeleteCronJob = async (path: string) => {
    if (!selectedRepo || !session?.accessToken) return;

    try {
      const response = await fetch(
        `/api/cron?owner=${selectedRepo.owner}&repo=${selectedRepo.repo}&path=${path}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete cron job");
      }

      toast.success("Cron job deleted successfully");
      fetchCronJobs();
    } catch (error) {
      console.error("Error deleting cron job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete cron job");
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to view cron jobs</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cron Jobs</h1>
        <button
          onClick={() => setShowConfig(true)}
          disabled={!selectedRepo}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            selectedRepo
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          Create Cron Job
        </button>
      </div>

      <div className="mb-8">
        <RepoSelector
          onSelect={(owner, repo) => setSelectedRepo({ owner, repo })}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cron jobs...</p>
        </div>
      ) : !selectedRepo ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Select a repository to view cron jobs</p>
        </div>
      ) : cronJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No cron jobs found in this repository</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {cronJobs.map((job) => (
              <li key={job.path} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {job.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">View workflow file</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span>{job.path}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-4">
                    <button
                      onClick={() => handleDeleteCronJob(job.path)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showConfig && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <CronJobConfig
              onSave={handleCreateCronJob}
              onCancel={() => setShowConfig(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 