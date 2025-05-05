"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Octokit } from "@octokit/rest";
import { toast } from "react-hot-toast";
import { StarIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  updated_at: string | null;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  isFavorite?: boolean;
}

export default function RepositoryList() {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!session?.accessToken) return;

      try {
        const octokit = new Octokit({ auth: session.accessToken });
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
          sort: "updated",
          per_page: 100,
        });

        // Get favorites from localStorage
        const favorites = JSON.parse(localStorage.getItem("favoriteRepos") || "[]");

        // Add isFavorite property to repositories
        const reposWithFavorites = repos.map((repo) => ({
          ...repo,
          isFavorite: favorites.includes(repo.full_name),
        }));

        // Extract unique languages
        const uniqueLanguages = Array.from(
          new Set(
            reposWithFavorites
              .map((repo) => repo.language)
              .filter((lang): lang is string => lang !== null)
          )
        ).sort();

        setRepositories(reposWithFavorites);
        setFilteredRepositories(reposWithFavorites);
        setLanguages(uniqueLanguages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast.error("Failed to fetch repositories");
        setLoading(false);
      }
    };

    fetchRepos();
  }, [session]);

  useEffect(() => {
    let filtered = [...repositories];

    if (searchQuery) {
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLanguage) {
      filtered = filtered.filter((repo) => repo.language === selectedLanguage);
    }

    if (showFavorites) {
      filtered = filtered.filter((repo) => repo.isFavorite);
    }

    setFilteredRepositories(filtered);
  }, [repositories, searchQuery, selectedLanguage, showFavorites]);

  const toggleFavorite = (repo: Repository) => {
    const favorites = JSON.parse(localStorage.getItem("favoriteRepos") || "[]");
    const updatedFavorites = repo.isFavorite
      ? favorites.filter((name: string) => name !== repo.full_name)
      : [...favorites, repo.full_name];

    localStorage.setItem("favoriteRepos", JSON.stringify(updatedFavorites));

    const updatedRepos = repositories.map((r) =>
      r.id === repo.id ? { ...r, isFavorite: !r.isFavorite } : r
    );

    setRepositories(updatedRepos);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search repositories..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            showFavorites
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          Favorites
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredRepositories.map((repo) => (
            <li key={repo.id}>
              <div className="px-4 py-4 flex items-center sm:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={repo.owner.avatar_url}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-indigo-600 truncate">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {repo.full_name}
                        </a>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {repo.description || "No description"}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        {repo.language && (
                          <span className="mr-4">{repo.language}</span>
                        )}
                        <span>
                          Updated{" "}
                          {formatDate(repo.updated_at || "")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-5 flex-shrink-0">
                  <button
                    onClick={() => toggleFavorite(repo)}
                    className={`text-2xl focus:outline-none ${
                      repo.isFavorite ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 