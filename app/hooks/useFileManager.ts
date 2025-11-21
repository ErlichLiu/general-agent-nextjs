import { useState, useEffect, useCallback } from 'react';
import { fileService } from '@/app/services/fileService';
import type { FileInfo } from '@/app/types/file';

/**
 * 文件管理的自定义 Hook
 */
export function useFileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取文件列表
  const fetchFiles = useCallback(async () => {
    try {
      const fetchedFiles = await fileService.getFiles();
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('获取文件列表失败:', error);
    }
  }, []);

  // 初始化时获取文件列表
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 从拖兔平台获取并下载文件
  const fetchFromTuotu = async (queryId: string, requirementId: string) => {
    setIsLoading(true);

    // 开始轮询文件列表
    const pollInterval = setInterval(() => {
      fetchFiles();
    }, 2000); // 每2秒刷新一次

    try {
      const response = await fetch('/api/tuotu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, requirementId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取失败');
      }

      const result = await response.json();
      console.log('获取完成:', result);

      // 最终刷新文件列表
      await fetchFiles();

      alert(`成功下载 ${result.filesCount}/${result.totalFiles} 个文件`);
    } catch (error) {
      console.error('获取错误:', error);
      alert(error instanceof Error ? error.message : '获取失败');
    } finally {
      clearInterval(pollInterval);
      setIsLoading(false);
    }
  };

  // 删除文件
  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
      return;
    }

    try {
      await fileService.deleteFile(filename);
      await fetchFiles();
    } catch (error) {
      console.error('删除错误:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  };

  return {
    files,
    isLoading,
    fetchFromTuotu,
    handleDeleteFile,
    fetchFiles,
  };
}
