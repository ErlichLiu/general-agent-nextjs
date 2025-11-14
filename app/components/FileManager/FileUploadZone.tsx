interface FileUploadZoneProps {
  isDragging: boolean;
  isUploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList) => void;
}

export function FileUploadZone({
  isDragging,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: FileUploadZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-black bg-zinc-100 dark:border-white dark:bg-zinc-800'
          : 'border-zinc-300 dark:border-zinc-600'
      }`}
    >
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        拖拽文件或文件夹到此处
      </p>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
        或点击下方按钮选择文件/文件夹
      </p>
      <div className="flex gap-2">
        <label className="inline-block">
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && onFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <span className="cursor-pointer rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            {isUploading ? '上传中...' : '选择文件'}
          </span>
        </label>
        <label className="inline-block">
          <input
            type="file"
            /* @ts-ignore - webkitdirectory is not in the type definitions */
            webkitdirectory=""
            directory=""
            onChange={(e) => e.target.files && onFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <span className="cursor-pointer rounded-lg border border-black bg-white px-4 py-2 text-sm text-black transition-colors hover:bg-zinc-100 dark:border-white dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800">
            {isUploading ? '上传中...' : '选择文件夹'}
          </span>
        </label>
      </div>
    </div>
  );
}
