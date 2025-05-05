import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { workflowTemplates } from "@/types/workflow";
import { authOptions } from "@/lib/auth";

interface WorkflowVariables {
  [key: string]: string | number | boolean;
}

interface GitHubError extends Error {
  status?: number;
  message: string;
}

export async function POST(request: Request) {
  console.log("Starting workflow creation...");
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
    const { templateId, variables, repoName } = body as { 
      templateId: string; 
      variables: WorkflowVariables;
      repoName: string;
    };
    
    if (!repoName) {
      console.error("No repository name provided");
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    console.log("Creating workflow with template:", templateId);
    console.log("Variables:", variables);
    console.log("Repository:", repoName);

    const template = workflowTemplates.find((t) => t.id === templateId);
    if (!template) {
      console.error("Template not found:", templateId);
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
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

    // Parse repository name
    const [owner, repo] = repoName.split('/');
    if (!owner || !repo) {
      console.error("Invalid repository name format:", repoName);
      return NextResponse.json(
        { error: "Invalid repository name format. Expected format: owner/repo" },
        { status: 400 }
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

    // Create workflow file
    let workflowContent = template.content;
    console.log("Original workflow content:", workflowContent);
    
    // Replace variables in the workflow content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = "${{ variables." + key + " }}";
      workflowContent = workflowContent.split(placeholder).join(value.toString());
    });
    console.log("Processed workflow content:", workflowContent);

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

    // Create or update the workflow file
    try {
      console.log("Creating workflow file:", `${template.id}.yml`);
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `.github/workflows/${template.id}.yml`,
        message: `Add ${template.name} workflow`,
        content: Buffer.from(workflowContent).toString("base64"),
        branch: "main",
      });
      console.log("Workflow creation response:", response);

      return NextResponse.json({ 
        success: true,
        message: `Workflow created successfully in ${repoName}`,
        details: {
          repository: repoName,
          workflowPath: `.github/workflows/${template.id}.yml`,
          workflowUrl: `https://github.com/${repoName}/blob/main/.github/workflows/${template.id}.yml`
        }
      });
    } catch (error) {
      const githubError = error as GitHubError;
      console.error("Error creating workflow file:", githubError);
      return NextResponse.json(
        { error: "Failed to create workflow file", details: githubError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    const githubError = error as GitHubError;
    console.error("Error creating workflow:", githubError);
    return NextResponse.json(
      { error: "Failed to create workflow", details: githubError.message },
      { status: 500 }
    );
  }
} 