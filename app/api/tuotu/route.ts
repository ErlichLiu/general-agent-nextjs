import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 动态设置环境变量并导入服务
async function fetchAndDownload(queryId: string, requirementId: string) {
  // 设置环境变量
  process.env.QUERY_ID = queryId;
  process.env.REQUIREMENT_ID = requirementId;

  // 动态导入以获取最新环境变量
  const { TuotuApiClient } = await import('@/app/services/tuotuApiService');

  const client = new TuotuApiClient();
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  // 清空目录
  if (fs.existsSync(uploadDir)) {
    const existingFiles = fs.readdirSync(uploadDir);
    for (const file of existingFiles) {
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  } else {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 登录
  await client.login();

  // 获取数据
  const apiData = await client.getAllApiData();

  // 收集文件
  const files = client.collectFiles(apiData);

  // 创建输出目录结构
  const outputDirs = {
    root: uploadDir,
    downloads: uploadDir,
    images: path.join(uploadDir, 'images'),
    texts: path.join(uploadDir, 'extracted_texts'),
  };

  // 确保子目录存在
  if (!fs.existsSync(outputDirs.images)) {
    fs.mkdirSync(outputDirs.images, { recursive: true });
  }
  if (!fs.existsSync(outputDirs.texts)) {
    fs.mkdirSync(outputDirs.texts, { recursive: true });
  }

  // 下载文件
  const downloadedFiles = await client.downloadFiles(files, outputDirs);

  // 保存 API 数据
  const dataPath = path.join(uploadDir, 'api-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(apiData, null, 2));

  return {
    success: true,
    filesCount: downloadedFiles.length,
    totalFiles: files.length,
    outputDir: uploadDir,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId, requirementId } = body;

    if (!queryId || !requirementId) {
      return NextResponse.json(
        { error: '请提供 queryId 和 requirementId' },
        { status: 400 }
      );
    }

    const result = await fetchAndDownload(queryId, requirementId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('拖兔 API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
