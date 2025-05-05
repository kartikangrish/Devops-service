"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Octokit } from "@octokit/rest";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { toast, Toaster } from "react-hot-toast";
import WorkflowRuns from "@/components/WorkflowRuns";
import RepoConfigModal from "@/components/RepoConfigModal";

async function getRepositories(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return repos;
}

export default function RepositoriesPage() {
  const { data: session } = useSession();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        if (!session) {
          redirect("/auth/signin");
        }
        const fetchedRepos = await getRepositories(session.accessToken as string);
        setRepos(fetchedRepos);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast.error("Failed to fetch repositories");
        setLoading(false);
      }
    };

    fetchRepos();
  }, [session]);

  const handleConfigure = (repoName: string) => {
    setSelectedRepo(repoName);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (templateId: string, variables: Record<string, string | boolean | number>) => {
    try {
      if (!session) {
        redirect("/auth/signin");
      }

      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          repoName: selectedRepo,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      toast.success("Workflow created successfully");
      setIsConfigModalOpen(false);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    }
  };

  if (loading) {
    return <div>Loading repositories...</div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Repositories</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of your GitHub repositories that can be configured with CI/CD workflows.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Repository
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Last Updated
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {repos.map((repo) => (
                    <tr key={repo.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={repo.owner.avatar_url}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {repo.full_name}
                            </div>
                            <div className="text-gray-500">{repo.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleConfigure(repo.full_name)}
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Runs Section */}
      {repos.map((repo) => (
        <div key={repo.id} className="mt-8">
          <WorkflowRuns
            owner={repo.owner.login}
            repo={repo.name}
            accessToken={session?.accessToken as string}
          />
        </div>
      ))}

      {/* Configuration Modal */}
      {selectedRepo && (
        <RepoConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          repoName={selectedRepo}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
} 