/**
 * OSS 上传服务独立测试脚本
 *
 * 用法:
 *   pnpm tsx scripts/test-oss-upload.ts <测试模式>
 *
 * 测试模式:
 *   1 - 测试登录
 *   2 - 测试获取 OSS 配置
 *   3 - 测试单个文件上传
 *   4 - 测试完整流程（上传 + 创建资源 + 关联表单）
 */

// ⚠️ 重要：必须在导入其他模块之前先加载环境变量
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 先加载环境变量
dotenv.config({ path: '.env.local' });

// 然后再导入依赖环境变量的模块
import { ossService } from '@/app/services/oss-service';
import type { FrontendConfig } from '@/app/types/oss';

const TEST_FILE_PATH = path.join(process.cwd(), 'test-files', 'sample.txt');
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-files');

// 测试数据
const TEST_FRONTEND_CONFIG: FrontendConfig = {
  queryId: 'test-query-id',
  requirementId: 'test-requirement-id',
};

const TEST_TASK_ID = `test-task-${Date.now()}`;

// 确保测试文件存在
function ensureTestFile() {
  const dir = path.dirname(TEST_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(TEST_FILE_PATH)) {
    const content = `这是一个测试文件
创建时间: ${new Date().toISOString()}
用于测试 OSS 上传功能
`;
    fs.writeFileSync(TEST_FILE_PATH, content, 'utf-8');
    console.log(`✅ 创建测试文件: ${TEST_FILE_PATH}`);
  }
}

// 测试 1: 登录
async function testLogin() {
  console.log('\n🧪 测试 1: 登录认证\n');

  try {
    const authInfo = await ossService.login();
    console.log('✅ 登录成功!');
    console.log('Token:', authInfo.token.substring(0, 20) + '...');
    console.log('Cookie:', authInfo.cookie ? '已设置' : '未设置');
    return authInfo;
  } catch (error) {
    console.error('❌ 登录失败:', error);
    throw error;
  }
}

// 测试 2: 获取 OSS 配置
async function testGetOSSConfig() {
  console.log('\n🧪 测试 2: 获取 OSS 配置\n');

  try {
    // 先登录
    const authInfo = await ossService.login();
    console.log('✅ 登录成功');

    // 获取配置
    const ossConfig = await ossService.getOSSConfig(authInfo);
    console.log('✅ 获取 OSS 配置成功!');
    console.log('Host:', ossConfig.host);
    console.log('Dir:', ossConfig.dir);
    console.log('AccessID:', ossConfig.accessid.substring(0, 10) + '...');
    console.log('Expire:', new Date(ossConfig.expire * 1000).toLocaleString());

    return { authInfo, ossConfig };
  } catch (error) {
    console.error('❌ 获取 OSS 配置失败:', error);
    throw error;
  }
}

// 测试 3: 上传单个文件到 OSS
async function testUploadFile() {
  console.log('\n🧪 测试 3: 上传单个文件到 OSS\n');

  ensureTestFile();

  try {
    // 先获取配置
    const authInfo = await ossService.login();
    const ossConfig = await ossService.getOSSConfig(authInfo);
    console.log('✅ 准备工作完成');

    // 上传文件
    console.log(`\n📤 开始上传: ${TEST_FILE_PATH}`);
    const result = await ossService.uploadFileToOSS(TEST_FILE_PATH, ossConfig);

    console.log('✅ 文件上传成功!');
    console.log('Key:', result.keyValue);
    console.log('URL:', result.fileUrl);

    return { authInfo, result };
  } catch (error) {
    console.error('❌ 文件上传失败:', error);
    throw error;
  }
}

// 测试 4: 完整流程（上传 + 创建资源 + 关联表单）
async function testCompleteFlow() {
  console.log('\n🧪 测试 4: 完整上传流程\n');

  ensureTestFile();

  try {
    const result = await ossService.uploadReportComplete(
      TEST_TASK_ID,
      TEST_OUTPUT_DIR,
      TEST_FRONTEND_CONFIG
    );

    console.log('\n✅ 完整流程测试成功!');
    console.log('上传结果:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('❌ 完整流程测试失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  const mode = process.argv[2] || '1';

  console.log('========================================');
  console.log('    OSS 上传服务测试工具');
  console.log('========================================');

  // 验证环境变量
  console.log('\n📋 环境变量检查:');
  console.log('TUOTU_USERNAME:', process.env.TUOTU_USERNAME || '❌ 未设置');
  console.log('TUOTU_PASSWORD:', process.env.TUOTU_PASSWORD ? '✅ 已设置' : '❌ 未设置');
  console.log('TUOTU_API_HOST:', process.env.TUOTU_API_HOST || '❌ 未设置');
  console.log('');

  try {
    switch (mode) {
      case '1':
        await testLogin();
        break;

      case '2':
        await testGetOSSConfig();
        break;

      case '3':
        await testUploadFile();
        break;

      case '4':
        await testCompleteFlow();
        break;

      default:
        console.log('❌ 无效的测试模式:', mode);
        console.log('\n可用模式:');
        console.log('  1 - 测试登录');
        console.log('  2 - 测试获取 OSS 配置');
        console.log('  3 - 测试单个文件上传');
        console.log('  4 - 测试完整流程');
        process.exit(1);
    }

    console.log('\n✅ 测试完成!');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
