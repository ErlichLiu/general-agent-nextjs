import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface FileInfo {
  name: string;
  size: number;
  uploadedAt: string;
}

// GET - List files
export async function GET() {
  try {
    const entries = await readdir(UPLOADS_DIR, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.')) {
        const filePath = join(UPLOADS_DIR, entry.name);
        const fileStat = await stat(filePath);
        files.push({
          name: entry.name,
          size: fileStat.size,
          uploadedAt: fileStat.mtime.toISOString(),
        });
      }
    }

    // Sort by upload time, newest first
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to list files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(UPLOADS_DIR, file.name);

    await writeFile(filePath, buffer);

    const fileStat = await stat(filePath);
    const fileInfo: FileInfo = {
      name: file.name,
      size: fileStat.size,
      uploadedAt: fileStat.mtime.toISOString(),
    };

    return NextResponse.json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    // Prevent path traversal
    const safeName = filename.replace(/[/\\]/g, '');
    const filePath = join(UPLOADS_DIR, safeName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
