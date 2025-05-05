import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: session.accessToken });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 