"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

interface RepoSelectorProps {
  onSelect: (owner: string, repo: string) => void;
}

export default function RepoSelector({ onSelect }: RepoSelectorProps) {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string>("");

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      fetchRepos();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      toast.error("Please sign in to view repositories");
    }
  }, [session, status]);

  const fetchRepos = async () => {
    try {
      const response = await fetch("/api/github/repos", {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repositories");
      }

      setRepos(data);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch repositories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fullName = event.target.value;
    setSelectedRepo(fullName);

    if (fullName) {
      const [owner, repo] = fullName.split("/");
      onSelect(owner, repo);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        <span className="text-gray-600">Loading repositories...</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-sm text-gray-500">
        Please sign in to view repositories
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <label
        htmlFor="repo-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Repository
      </label>
      <select
        id="repo-select"
        value={selectedRepo}
        onChange={handleRepoChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="">Choose a repository</option>
        {repos.map((repo) => (
          <option key={repo.full_name} value={repo.full_name}>
            {repo.full_name}
          </option>
        ))}
      </select>
    </div>
  );
} 