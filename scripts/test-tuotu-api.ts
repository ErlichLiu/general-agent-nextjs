/**
 * 测试脚本 - 测试拖兔 API 连接并下载文件
 *
 * 运行: pnpm tsx scripts/test-tuotu-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { TuotuApiClient } from '../app/services/tuotuApiService';

async function test() {
  console.log('=== 拖兔 API 测试 ===\n');

  // 检查环境变量
  const envVars = [
    'TUOTU_API_BASE_URL',
    'TUOTU_USERNAME',
    'TUOTU_PASSWORD',
    'TUOTU_COMPANY_ID',
    'TUOTU_SESSION',
    'QUERY_ID',
    'REQUIREMENT_ID',
  ];

  console.log('环境变量检查:');
  const missing: string[] = [];
  envVars.forEach(v => {
    const value = process.env[v];
    const status = value ? '✓' : '✗';
    console.log(`  ${status} ${v}: ${value ? '已设置' : '未设置'}`);
    if (!value) missing.push(v);
  });

  if (missing.length > 0) {
    console.log(`\n⚠️  缺少环境变量: ${missing.join(', ')}`);
    console.log('请在 .env.local 中配置这些变量\n');
    return;
  }

  console.log('\n开始测试 API 连接...\n');

  try {
    const client = new TuotuApiClient();

    // 1. 测试登录
    console.log('1. 测试登录...');
    const token = await client.login();
    console.log(`   ✓ 登录成功，Token: ${token.substring(0, 20)}...`);

    // 2. 获取 API 数据
    console.log('\n2. 获取 API 数据...');
    const data = await client.getAllApiData();
    console.log(`   ✓ 获取到 ${data.length} 个 API 响应`);

    // 显示结果摘要
    data.forEach((result, index) => {
      const records = result?.data?.result;
      const count = Array.isArray(records) ? records.length : 0;
      console.log(`   - API ${index + 1}: ${count} 条记录`);
    });

    // 3. 收集文件
    console.log('\n3. 收集文件信息...');
    const files = client.collectFiles(data);

    // 4. 准备下载目录 - 使用 /public/upload
    const uploadDir = resolve(process.cwd(), 'public/upload');

    // 清空目录
    if (fs.existsSync(uploadDir)) {
      const existingFiles = fs.readdirSync(uploadDir);
      if (existingFiles.length > 0) {
        console.log(`\n4. 清空下载目录 (${existingFiles.length} 个文件)...`);
        for (const file of existingFiles) {
          const filePath = resolve(uploadDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
        console.log('   ✓ 目录已清空');
      }
    } else {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 创建输出目录结构
    const outputDirs = {
      root: uploadDir,
      downloads: uploadDir,
      images: resolve(uploadDir, 'images'),
      texts: resolve(uploadDir, 'extracted_texts'),
    };

    // 确保子目录存在
    if (!fs.existsSync(outputDirs.images)) {
      fs.mkdirSync(outputDirs.images, { recursive: true });
    }
    if (!fs.existsSync(outputDirs.texts)) {
      fs.mkdirSync(outputDirs.texts, { recursive: true });
    }

    // 5. 下载文件
    console.log('\n5. 下载文件...');
    const downloadedFiles = await client.downloadFiles(files, outputDirs);

    // 6. 保存 API 数据
    const dataPath = resolve(uploadDir, 'api-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 API 数据已保存: ${dataPath}`);

    console.log(`\n=== 测试完成 ===`);
    console.log(`下载目录: ${uploadDir}`);
    console.log(`下载文件数: ${downloadedFiles.length}`);

  } catch (error) {
    console.error('\n❌ 测试失败:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.cause) {
      console.error('   原因:', error.cause);
    }
  }
}

test();
