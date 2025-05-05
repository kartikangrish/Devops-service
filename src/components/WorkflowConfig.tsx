"use client";

import { useState, useEffect } from "react";
import { WorkflowTemplate } from "@/types/workflow";
import { toast } from "react-hot-toast";

interface WorkflowConfigProps {
  template: WorkflowTemplate;
  onSave: (variables: Record<string, string | boolean | number>) => void;
  onCancel: () => void;
}

const NODE_VERSIONS = [
  "20.x", // LTS
  "18.x", // LTS
  "16.x", // LTS
  "14.x", // LTS
];

const DEFAULT_COMMANDS = {
  buildCommand: "npm run build",
  testCommand: "npm test",
  deployCommand: "npm run deploy"
};

export default function WorkflowConfig({ template, onSave, onCancel }: WorkflowConfigProps) {
  const [variables, setVariables] = useState<Record<string, string | boolean | number>>(
    template.variables.reduce((acc, variable) => ({
      ...acc,
      [variable.name]: variable.default || "",
    }), {})
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set default Node.js version if not specified
  useEffect(() => {
    if (template.id === "nodejs-cicd" && !variables.nodeVersion) {
      setVariables(prev => ({
        ...prev,
        nodeVersion: NODE_VERSIONS[0], // Use latest LTS version
      }));
    }
  }, [template.id, variables.nodeVersion]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    template.variables.forEach(variable => {
      if (variable.required && !variables[variable.name]) {
        newErrors[variable.name] = `${variable.description} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting workflow configuration:", {
      templateId: template.id,
      variables,
    });

    try {
      if (!validateForm()) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Ensure default commands are set if not provided
      const finalVariables = {
        ...variables,
        buildCommand: variables.buildCommand || DEFAULT_COMMANDS.buildCommand,
        testCommand: variables.testCommand || DEFAULT_COMMANDS.testCommand,
        deployCommand: variables.deployCommand || DEFAULT_COMMANDS.deployCommand
      };

      onSave(finalVariables);
    } catch (error) {
      console.error("Error saving workflow configuration:", error);
      toast.error("Failed to save workflow configuration");
    }
  };

  const handleChange = (name: string, value: string | boolean | number) => {
    console.log("Updating variable:", { name, value });
    let parsedValue: string | boolean | number = value;

    if (typeof value === "string") {
      if (value === "true" || value === "false") {
        parsedValue = value === "true";
      } else {
        parsedValue = value;
      }
    } else if (typeof value === "number") {
      parsedValue = Number(value);
    }

    setVariables((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Configure {template.name}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {template.variables.map((variable) => (
          <div key={variable.name}>
            <label
              htmlFor={variable.name}
              className="block text-sm font-medium text-gray-700"
            >
              {variable.description}
              {variable.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {variable.name === "nodeVersion" ? (
              <select
                id={variable.name}
                value={variables[variable.name] as string}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors[variable.name] ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {NODE_VERSIONS.map((version) => (
                  <option key={version} value={version}>
                    {version} {version === NODE_VERSIONS[0] ? "(Latest LTS)" : ""}
                  </option>
                ))}
              </select>
            ) : variable.type === "boolean" ? (
              <input
                type="checkbox"
                id={variable.name}
                checked={variables[variable.name] as boolean}
                onChange={(e) => handleChange(variable.name, e.target.checked)}
                className={`mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                  errors[variable.name] ? 'border-red-300' : ''
                }`}
              />
            ) : (
              <input
                type={variable.type === "number" ? "number" : "text"}
                id={variable.name}
                value={variables[variable.name] as string}
                onChange={(e) =>
                  handleChange(
                    variable.name,
                    variable.type === "number" ? Number(e.target.value) : e.target.value
                  )
                }
                placeholder={variable.default?.toString()}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors[variable.name] ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            )}
            {errors[variable.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[variable.name]}</p>
            )}
            {variable.default && !variables[variable.name] && (
              <p className="mt-1 text-sm text-gray-500">
                Default: {variable.default}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Workflow
        </button>
      </div>
    </form>
  );
} 