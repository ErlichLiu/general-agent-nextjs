'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FileInfo {
  name: string;
  size: number;
  uploadedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export function FilePanel() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/uploads');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (file: File) => {
    setUploadingFile(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchFiles();
      } else {
        alert('上传失败');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch('/api/uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        await fetchFiles();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-[380px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <span className="text-lg">📁</span>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          文件管理
        </h2>
      </div>

      {/* 上传区域 */}
      <div className="p-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadingFile ? (
            <>
              <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                上传中...
              </p>
            </>
          ) : (
            <>
              <svg className="mb-2 h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                拖拽或点击上传
              </p>
            </>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h3 className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          已上传 ({files.length})
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : files.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-400">暂无文件</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="mb-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100" title={file.name}>
                  {file.name}
                </p>
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatFileSize(file.size)}</span>
                  <span>·</span>
                  <span>{formatTime(file.uploadedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`/uploads/${encodeURIComponent(file.name)}`}
                    download
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </a>
                  {deleteConfirm === file.name ? (
                    <>
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="rounded px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(file.name)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
