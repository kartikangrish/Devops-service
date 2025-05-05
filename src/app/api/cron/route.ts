import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { saveWorkflowConfig, logAuditEvent } from "@/lib/supabase";
import { authOptions } from "@/lib/auth";

interface CronJobConfig {
  name: string;
  schedule: string;
  command: string;
  owner: string;
  repo: string;
}

export async function POST(request: Request) {
  console.log("Starting cron job creation...");
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error("No session found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.accessToken) {
    console.error("No access token in session");
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { name, schedule, command, owner, repo } = body as CronJobConfig;

    if (!name || !schedule || !command || !owner || !repo) {
      console.error("Missing required fields:", { name, schedule, command, owner, repo });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: session.accessToken });

    // Verify token permissions
    let authenticatedUser;
    try {
      const { data: user } = await octokit.users.getAuthenticated();
      authenticatedUser = user;
      console.log("Authenticated as:", user.login);
    } catch (error) {
      console.error("Token validation error:", error);
      return NextResponse.json(
        { error: "Invalid GitHub token", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 401 }
      );
    }

    // Check repository permissions
    try {
      const { data: repoPermissions } = await octokit.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username: authenticatedUser.login,
      });
      console.log("Repository permissions:", repoPermissions);
      
      if (repoPermissions.permission !== 'admin') {
        return NextResponse.json(
          { error: "Insufficient repository permissions. Admin access required." },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Error checking repository permissions:", error);
      return NextResponse.json(
        { error: "Failed to check repository permissions", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Create workflow file content
    const workflowContent = `name: ${name}

on:
  schedule:
    - cron: '${schedule}'
  workflow_dispatch:

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run cron job
        run: ${command}
`;

    // Ensure .github/workflows directory exists
    try {
      console.log("Checking .github/workflows directory...");
      await octokit.repos.getContent({
        owner,
        repo,
        path: ".github/workflows",
      });
      console.log(".github/workflows directory exists");
    } catch (error) {
      console.log("Creating .github/workflows directory");
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: ".github/workflows/.gitkeep",
          message: "Create workflows directory",
          content: Buffer.from("").toString("base64"),
          branch: "main",
        });
        console.log("Created .github/workflows directory");
      } catch (error) {
        console.error("Error creating workflows directory:", error);
        return NextResponse.json(
          { error: "Failed to create workflows directory", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }

    // Create the workflow file
    const workflowPath = `.github/workflows/${name.toLowerCase().replace(/\s+/g, "-")}.yml`;
    try {
      console.log("Creating workflow file:", workflowPath);
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: workflowPath,
        message: `Add ${name} cron job`,
        content: Buffer.from(workflowContent).toString("base64"),
        branch: "main",
      });
      console.log("Workflow creation response:", response);

      // Wait for GitHub to process the workflow file
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the workflow file exists
      const verifyResponse = await octokit.repos.getContent({
        owner,
        repo,
        path: workflowPath,
      });

      if (!verifyResponse.data) {
        throw new Error('Failed to verify workflow file creation');
      }

      // Try to save configuration to database, but don't fail if it doesn't work
      try {
        await saveWorkflowConfig({
          user_id: session.user?.email!,
          repo_name: `${owner}/${repo}`,
          template_id: "cron",
          variables: {
            name,
            schedule,
            command,
          },
        });
      } catch (error) {
        console.warn("Failed to save workflow config to database:", error);
      }

      // Try to log the event, but don't fail if it doesn't work
      try {
        await logAuditEvent({
          user_id: session.user?.email!,
          action: "create",
          resource_type: "cron",
          resource_id: workflowPath,
          details: {
            name,
            schedule,
            command,
            repo: `${owner}/${repo}`,
          },
        });
      } catch (error) {
        console.warn("Failed to log audit event:", error);
      }

      return NextResponse.json({
        success: true,
        message: `Cron job created successfully in ${owner}/${repo}`,
        details: {
          repository: `${owner}/${repo}`,
          workflowPath,
          workflowUrl: `https://github.com/${owner}/${repo}/blob/main/${workflowPath}`
        }
      });
    } catch (error) {
      console.error("Error creating workflow file:", error);
      return NextResponse.json(
        { error: "Failed to create workflow file", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating cron job:", error);
    return NextResponse.json(
      { error: "Failed to create cron job", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  console.log("GET /api/cron - Starting request handling");
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error("No session found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.accessToken) {
    console.error("No access token in session");
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    console.log("Request parameters:", { owner, repo });

    if (!owner || !repo) {
      console.error("Missing required parameters");
      return NextResponse.json(
        { error: "Owner and repo parameters are required" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: session.accessToken });

    try {
      // Get all workflow files
      const { data: files } = await octokit.repos.getContent({
        owner,
        repo,
        path: ".github/workflows",
      });

      console.log("Workflow files found:", files);

      // Filter for cron jobs and exclude .gitkeep
      const cronJobs = Array.isArray(files) ? files
        .filter((file: any) => file.name.endsWith(".yml") && file.name !== ".gitkeep")
        .map((file: any) => ({
          name: file.name.replace(".yml", ""),
          path: file.path,
          url: file.html_url,
          sha: file.sha,
          size: file.size,
          download_url: file.download_url
        })) : [];

      console.log("Filtered cron jobs:", cronJobs);

      return NextResponse.json({ 
        cronJobs,
        count: cronJobs.length,
        message: "Successfully retrieved cron jobs"
      });

    } catch (error: any) {
      console.error("Error fetching workflow files:", error);
      
      // Handle case where .github/workflows directory doesn't exist
      if (error.status === 404) {
        return NextResponse.json({ 
          cronJobs: [],
          count: 0,
          message: "No workflows directory found"
        });
      }

      return NextResponse.json(
        { 
          error: "Failed to fetch cron jobs", 
          details: error.message || "Unknown error" 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in GET /api/cron:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: "Owner, repo, and path parameters are required" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: session.accessToken });

    // Get the file's SHA
    const { data: file } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    }) as { data: { sha: string } };

    // Delete the file
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `Remove ${path.split("/").pop()}`,
      sha: file.sha,
    });

    // Log the event
    try {
      await logAuditEvent({
        user_id: session.user?.email!,
        action: "delete",
        resource_type: "cron",
        resource_id: path,
        details: {
          repo: `${owner}/${repo}`,
        },
      });
    } catch (error) {
      console.warn("Failed to log audit event:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Cron job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cron job:", error);
    return NextResponse.json(
      { error: "Failed to delete cron job", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 