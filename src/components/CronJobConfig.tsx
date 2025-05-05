"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import cronstrue from "cronstrue";

interface CronJobConfigProps {
  onSave: (config: {
    name: string;
    schedule: string;
    command: string;
  }) => void;
  onCancel: () => void;
}

export default function CronJobConfig({ onSave, onCancel }: CronJobConfigProps) {
  const [config, setConfig] = useState({
    name: "",
    schedule: "0 0 * * *", // Default: daily at midnight
    command: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCronExpression = (expression: string) => {
    // Basic cron expression validation
    const cronRegex = /^(\*|[0-9]{1,2}|\*\/[0-9]{1,2})(\s+(\*|[0-9]{1,2}|\*\/[0-9]{1,2})){4}$/;
    return cronRegex.test(expression);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = "Job name is required";
    }

    if (!config.schedule.trim()) {
      newErrors.schedule = "Schedule is required";
    } else if (!validateCronExpression(config.schedule)) {
      newErrors.schedule = "Invalid cron expression";
    }

    if (!config.command.trim()) {
      newErrors.command = "Command is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    onSave(config);
  };

  const handleChange = (field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getHumanReadableSchedule = () => {
    try {
      return cronstrue.toString(config.schedule);
    } catch (error) {
      return "Invalid schedule";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Configure Cron Job</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Job Name
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={config.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.name ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="e.g., Daily Backup"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="schedule"
            className="block text-sm font-medium text-gray-700"
          >
            Schedule (Cron Expression)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="schedule"
            value={config.schedule}
            onChange={(e) => handleChange("schedule", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.schedule ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="0 0 * * *"
          />
          {errors.schedule && (
            <p className="mt-1 text-sm text-red-600">{errors.schedule}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {getHumanReadableSchedule()}
          </p>
        </div>

        <div>
          <label
            htmlFor="command"
            className="block text-sm font-medium text-gray-700"
          >
            Command to Run
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="command"
            value={config.command}
            onChange={(e) => handleChange("command", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.command ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="e.g., npm run backup"
          />
          {errors.command && (
            <p className="mt-1 text-sm text-red-600">{errors.command}</p>
          )}
        </div>
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
          Create Cron Job
        </button>
      </div>
    </form>
  );
} 