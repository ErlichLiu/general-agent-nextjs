import type { FileInfo } from '@/app/types/file';
import { formatFileSize, formatDate } from '@/app/utils/formatters';

interface FileListProps {
  files: FileInfo[];
  onDelete: (filename: string) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        已上传文件 ({files.length})
      </h3>
      <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.name}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-black"
          >
            <div className="mb-1 flex items-start justify-between">
              <p className="flex-1 break-all text-sm font-medium text-black dark:text-white">
                {file.name}
              </p>
              <button
                onClick={() => onDelete(file.name)}
                className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="删除文件"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
            暂无上传文件
          </p>
        )}
      </div>
    </div>
  );
}
