'use client';

import { AgentConfig, MODEL_OPTIONS, PERMISSION_OPTIONS, AVAILABLE_TOOLS } from '@/app/types/config';

interface ConfigFormProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onReset: () => void;
}

export function ConfigForm({ config, onUpdate, onReset }: ConfigFormProps) {
  const handleToolToggle = (tool: string) => {
    const newTools = config.allowedTools.includes(tool)
      ? config.allowedTools.filter((t) => t !== tool)
      : [...config.allowedTools, tool];
    onUpdate({ allowedTools: newTools });
  };

  return (
    <div className="flex h-full flex-col">
      {/* 滚动区域 */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Model Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Model
          </label>
          <select
            value={config.model}
            onChange={(e) => onUpdate({ model: e.target.value as AgentConfig['model'] })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Working Directory */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Working Directory
          </label>
          <input
            type="text"
            value={config.cwd}
            onChange={(e) => onUpdate({ cwd: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="public/uploads"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Relative to project root
          </p>
        </div>

        {/* Allowed Tools */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Allowed Tools
          </label>
          <div className="space-y-2 rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
            {AVAILABLE_TOOLS.map((tool) => (
              <label
                key={tool}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={config.allowedTools.includes(tool)}
                  onChange={() => handleToolToggle(tool)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{tool}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Permission Mode */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permission Mode
          </label>
          <div className="space-y-2 rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
            {PERMISSION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <input
                  type="radio"
                  name="permissionMode"
                  checked={
                    option.value === 'none'
                      ? config.permissionMode === undefined
                      : config.permissionMode === option.value
                  }
                  onChange={() =>
                    onUpdate({
                      permissionMode: option.value === 'none' ? undefined : option.value,
                    })
                  }
                  className="mt-0.5 h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {option.label}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            System Prompt
          </label>
          <textarea
            value={config.systemPrompt || ''}
            onChange={(e) =>
              onUpdate({ systemPrompt: e.target.value || undefined })
            }
            rows={6}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Optional custom system prompt for the agent..."
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Leave empty to use default behavior
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          onClick={onReset}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
