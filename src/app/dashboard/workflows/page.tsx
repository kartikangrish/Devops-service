"use client";

import { useSession } from "next-auth/react";
import { workflowTemplates } from "@/types/workflow";

export default function WorkflowsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to view workflows</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Workflow Templates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse available workflow templates. To create a workflow, go to the Repositories page and click "Configure" on a repository.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workflowTemplates.map((template) => (
          <div
            key={template.id}
            className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
            <p className="mt-2 flex-grow text-sm text-gray-500">
              {template.description}
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {template.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 