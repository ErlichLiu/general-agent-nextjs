import { useState, useEffect, useCallback } from 'react';
import { fileService } from '@/app/services/fileService';
import type { FileInfo } from '@/app/types/file';

/**
 * 文件管理的自定义 Hook
 */
export function useFileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  // 上传文件
  const handleFileUpload = async (fileList: FileList) => {
    if (fileList.length === 0) return;

    setIsUploading(true);
    try {
      await fileService.uploadFiles(fileList);
      await fetchFiles(); // 刷新文件列表
    } catch (error) {
      console.error('上传错误:', error);
      alert(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 删除文件
  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
      return;
    }

    try {
      await fileService.deleteFile(filename);
      await fetchFiles(); // 刷新文件列表
    } catch (error) {
      console.error('删除错误:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  };

  return {
    files,
    isUploading,
    handleFileUpload,
    handleDeleteFile,
  };
}
