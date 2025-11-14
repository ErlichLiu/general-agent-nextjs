import { useFileManager } from '@/app/hooks/useFileManager';
import { useDragAndDrop } from '@/app/hooks/useDragAndDrop';
import { FileUploadZone } from './FileUploadZone';
import { FileList } from './FileList';

export function FileManager() {
  const { files, isUploading, handleFileUpload, handleDeleteFile } = useFileManager();
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop(handleFileUpload);

  return (
    <aside className="w-1/3 flex-shrink-0 border-r border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
        文件管理
      </h2>

      <FileUploadZone
        isDragging={isDragging}
        isUploading={isUploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileSelect={handleFileUpload}
      />

      <FileList files={files} onDelete={handleDeleteFile} />
    </aside>
  );
}
