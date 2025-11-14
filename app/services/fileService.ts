import type { FileInfo } from '@/app/types/file';

/**
 * 文件服务 API 封装
 */
export const fileService = {
  /**
   * 获取文件列表
   */
  async getFiles(): Promise<FileInfo[]> {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  },

  /**
   * 上传文件
   * @param files - 要上传的文件列表
   */
  async uploadFiles(files: FileList): Promise<void> {
    if (files.length === 0) {
      throw new Error('没有选择文件');
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('文件上传失败');
    }
  },

  /**
   * 删除文件
   * @param filename - 要删除的文件名
   */
  async deleteFile(filename: string): Promise<void> {
    const response = await fetch(`/api/files?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }
  },
};
