import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// 确保上传目录存在
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// 生成唯一文件名，处理命名冲突
function getUniqueFilename(filename: string): string {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  let uniqueName = filename;
  let counter = 1;

  while (existsSync(path.join(UPLOAD_DIR, uniqueName))) {
    uniqueName = `${nameWithoutExt}-${counter}${ext}`;
    counter++;
  }

  return uniqueName;
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      );
    }

    const uploadedFiles: { name: string; size: number; path: string }[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 扁平化处理：将文件夹路径转换为文件名前缀
      // 例如: folder/subfolder/file.txt -> folder-subfolder-file.txt
      let flattenedName = file.name;
      if (flattenedName.includes('/') || flattenedName.includes('\\')) {
        // 标准化路径分隔符，将 / 或 \ 替换为 -
        flattenedName = flattenedName.replace(/[\/\\]/g, '-');
      }

      // 获取唯一文件名
      const uniqueFilename = getUniqueFilename(flattenedName);
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      await writeFile(filePath, buffer);

      uploadedFiles.push({
        name: uniqueFilename,
        size: file.size,
        path: `/uploads/${uniqueFilename}`,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
