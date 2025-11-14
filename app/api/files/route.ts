import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// 确保上传目录存在
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// GET - 获取文件列表
export async function GET() {
  try {
    await ensureUploadDir();

    const files = await readdir(UPLOAD_DIR);
    const fileInfos = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(UPLOAD_DIR, filename);
        const stats = await stat(filePath);

        return {
          name: filename,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          path: `/uploads/${filename}`,
        };
      })
    );

    // 按上传时间倒序排列（最新的在前面）
    fileInfos.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ files: fileInfos });
  } catch (error) {
    console.error('获取文件列表错误:', error);
    return NextResponse.json(
      { error: '获取文件列表失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除文件
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: '缺少文件名参数' },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 安全检查：确保文件在上传目录内
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: '非法的文件路径' },
        { status: 403 }
      );
    }

    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error) {
    console.error('删除文件错误:', error);
    return NextResponse.json(
      { error: '删除文件失败' },
      { status: 500 }
    );
  }
}
