import React, { useState, useEffect } from "react";
import { Octokit } from "@octokit/rest";
import { toast } from "react-hot-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  duration_ms: number;
  head_commit: {
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
  actor: {
    login: string;
    avatar_url: string;
  };
}

interface WorkflowRunsProps {
  owner: string;
  repo: string;
  accessToken: string;
}

export default function WorkflowRuns({ owner, repo, accessToken }: WorkflowRunsProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuns = async () => {
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 10, // Increased from 5 to 10
      });

      const formattedRuns = data.workflow_runs.map((run) => ({
        id: run.id,
        name: run.name || "Unnamed Workflow",
        status: run.status || "unknown",
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        duration_ms: new Date(run.updated_at).getTime() - new Date(run.created_at).getTime(),
        head_commit: {
          message: run.head_commit?.message || "No commit message",
          author: {
            name: run.head_commit?.author?.name || "Unknown",
            email: run.head_commit?.author?.email || "",
          },
        },
        actor: {
          login: run.actor?.login || "Unknown",
          avatar_url: run.actor?.avatar_url || "",
        },
      }));

      setRuns(formattedRuns);
      setLoading(false);
      setRefreshing(false);

      // Show toast for latest run status
      const latestRun = formattedRuns[0];
      if (latestRun) {
        if (latestRun.status === "completed") {
          toast.success(`Workflow ${latestRun.name} ${latestRun.conclusion}`);
        } else if (latestRun.status === "in_progress") {
          toast.loading(`Workflow ${latestRun.name} in progress...`);
        }
      }
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      toast.error("Failed to fetch workflow runs");
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRuns, 30000);
    return () => clearInterval(interval);
  }, [owner, repo, accessToken]);

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === "in_progress") {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          ⏳ In Progress
        </span>
      );
    }
    if (status === "completed") {
      if (conclusion === "success") {
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            ✅ Success
          </span>
        );
      }
      if (conclusion === "failure") {
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            ❌ Failed
          </span>
        );
      }
      if (conclusion === "cancelled") {
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            🚫 Cancelled
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        {status}
      </span>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRuns();
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading workflow runs...</div>;
  }

  if (runs.length === 0) {
    return <div className="text-sm text-gray-500">No workflow runs found</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Recent Workflow Runs</h3>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={refreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Workflow
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Commit
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Triggered By
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {run.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getStatusBadge(run.status, run.conclusion)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDuration(run.duration_ms)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={run.head_commit.message}>
                        {run.head_commit.message}
                      </div>
                      <div className="text-xs text-gray-400">
                        by {run.head_commit.author.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        {run.actor.avatar_url && (
                          <img
                            src={run.actor.avatar_url}
                            alt={run.actor.login}
                            className="h-5 w-5 rounded-full mr-2"
                          />
                        )}
                        {run.actor.login}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Logs
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 