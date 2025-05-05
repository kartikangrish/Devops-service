"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import WorkflowConfig from "@/components/WorkflowConfig";
import { WorkflowTemplate } from "@/types/workflow";

interface WorkflowTemplatesProps {
  templates: WorkflowTemplate[];
}

export default function WorkflowTemplates({ templates }: WorkflowTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSaveConfig = async (variables: Record<string, string | boolean | number>) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      toast.success("Workflow created successfully");
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    }
  };

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
          >
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {template.type}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Configuration Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <WorkflowConfig
              template={templates.find((t) => t.id === selectedTemplate)!}
              onSave={handleSaveConfig}
              onCancel={() => setSelectedTemplate(null)}
            />
          </div>
        </div>
      )}
    </>
  );
} 