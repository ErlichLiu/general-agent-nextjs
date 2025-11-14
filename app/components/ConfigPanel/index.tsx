'use client';

import { useState } from 'react';
import { useAgentConfig } from '@/app/hooks/useAgentConfig';
import { ConfigForm } from './ConfigForm';

export function ConfigPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { config, updateConfig, resetConfig } = useAgentConfig();

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 折叠按钮（始终显示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 z-50 flex h-32 w-10 -translate-y-1/2 items-center justify-center rounded-l-lg border-y border-l border-zinc-300 bg-white text-zinc-600 shadow-lg transition-all hover:w-12 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <div className="flex -rotate-90 items-center gap-1 whitespace-nowrap text-xs font-medium">
            <span>⚙️</span>
            <span>Config</span>
          </div>
        </button>
      )}

      {/* 配置面板 */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[400px] transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Agent Configuration
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <ConfigForm config={config} onUpdate={updateConfig} onReset={resetConfig} />
      </div>
    </>
  );
}
