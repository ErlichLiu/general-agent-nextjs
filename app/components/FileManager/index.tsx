import { useState } from 'react';
import { useFileManager } from '@/app/hooks/useFileManager';
import { FileList } from './FileList';

export function FileManager() {
  const { files, isLoading, fetchFromTuotu } = useFileManager();
  const [queryId, setQueryId] = useState('');
  const [requirementId, setRequirementId] = useState('');

  const handleFetch = async () => {
    if (!queryId.trim() || !requirementId.trim()) {
      alert('请填写企业ID和需求单ID');
      return;
    }
    await fetchFromTuotu(queryId.trim(), requirementId.trim());
  };

  return (
    <aside className="w-1/5 flex-shrink-0 border-r border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
        文件管理
      </h2>

      <div className="mb-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            企业ID
          </label>
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="如: QY-35007007"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            需求单ID
          </label>
          <input
            type="text"
            value={requirementId}
            onChange={(e) => setRequirementId(e.target.value)}
            placeholder="如: XQD-63001005"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleFetch}
          disabled={isLoading || !queryId.trim() || !requirementId.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-600"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              获取中...
            </span>
          ) : (
            '获取文件'
          )}
        </button>
      </div>

      <FileList files={files} onDelete={() => {}} />
    </aside>
  );
}
