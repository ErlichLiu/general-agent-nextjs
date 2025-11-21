/**
 * 拖兔平台 API 客户端 - 完整版
 *
 * 功能：
 * 1. 登录获取 Token
 * 2. 并发调用 API 获取企业数据
 * 3. 收集文件信息
 * 4. 下载文件到本地
 *
 * 环境变量：
 * - TUOTU_USERNAME
 * - TUOTU_PASSWORD
 * - TUOTU_COMPANY_ID
 * - TUOTU_SESSION
 * - QUERY_ID
 * - REQUIREMENT_ID
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// ==================== 类型定义 ====================

interface TuotuConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyId: string;
  session: string;
}

interface ApiConfig {
  name: string;
  formHeadUuid: string;
  params: Record<string, string | number>;
}

interface FileInfo {
  field: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  extension: string;
  category: string;
}

interface OutputDirs {
  root: string;
  downloads: string;
  images: string;
  texts: string;
}

// ==================== 配置 ====================

function getConfig(): TuotuConfig {
  return {
    baseUrl: process.env.TUOTU_API_BASE_URL || 'api.ontuotu.com',
    username: process.env.TUOTU_USERNAME || '',
    password: process.env.TUOTU_PASSWORD || '',
    companyId: process.env.TUOTU_COMPANY_ID || '',
    session: process.env.TUOTU_SESSION || '',
  };
}

function getQueryId(): string {
  return process.env.QUERY_ID || '';
}

function getRequirementId(): string {
  return process.env.REQUIREMENT_ID || '';
}

// API 配置
function getApiConfigs(): Record<string, ApiConfig> {
  return {
    requirementForm: {
      name: '需求填写单',
      formHeadUuid: '000e2589e57046b8a60a7490e4bb8972',
      params: {
        page: 1,
        limit: 50,
        lsccgxajrqsfnhbp: getQueryId(),
        jagzssffplsjmxxo: getRequirementId(),
      },
    },
    companyInfo: {
      name: '企业基本信息',
      formHeadUuid: 'e1d617c9225f4dd4a2a175ef3b602723',
      params: {
        page: 1,
        limit: 50,
        xgibbuhktvvnrxyv: getQueryId(),
      },
    },
  };
}

// 子表字段
const CHILD_TABLE_FIELDS = [
  'ncyikfjkhzawtzml', // 治理绩效
  'qkipecupqyvbthod', // 近三年能源情况
  'rqzeieqknlsorojn', // 社会绩效
  'tlrtvxwmhaoojebz', // 基础财务数据
];

// 文件类型分类
const FILE_CATEGORIES: Record<string, string[]> = {
  pdf: ['.pdf'],
  word: ['.docx', '.doc'],
  excel: ['.xlsx', '.xls'],
  powerpoint: ['.pptx', '.ppt'],
  image: ['.png', '.jpg', '.jpeg', '.gif'],
  zip: ['.zip', '.rar', '.7z'],
};

// ==================== HTTP 请求工具 ====================

function makeRequest(options: https.RequestOptions, postData?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // 处理 gzip 压缩
        if (res.headers['content-encoding'] === 'gzip') {
          zlib.gunzip(buffer, (err, decompressed) => {
            if (err) {
              reject(new Error(`Gzip解压失败: ${err.message}`));
              return;
            }
            try {
              resolve({
                statusCode: res.statusCode,
                data: JSON.parse(decompressed.toString())
              });
            } catch {
              reject(new Error('JSON 解析失败'));
            }
          });
        } else {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(buffer.toString())
            });
          } catch {
            reject(new Error(`JSON 解析失败: ${buffer.toString().substring(0, 100)}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

// ==================== 文件下载工具 ====================

function downloadFile(url: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const urlObj = new URL(url);

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    });

    req.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(new Error(`下载失败: ${err.message}`));
    });

    req.setTimeout(600000, () => {
      req.destroy();
      reject(new Error('下载超时'));
    });

    req.end();
  });
}

// ==================== 工具函数 ====================

function getFileCategory(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) return category;
  }
  return 'unknown';
}

function createOutputDirs(queryId: string, requirementId: string): OutputDirs {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
  const dirName = `document_processing_${queryId}_${requirementId}_${timestamp}`;
  const root = path.join(process.cwd(), dirName);

  const dirs: OutputDirs = {
    root,
    downloads: path.join(root, 'downloads'),
    images: path.join(root, 'images'),
    texts: path.join(root, 'extracted_texts'),
  };

  // 创建所有目录
  Object.values(dirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return dirs;
}

// ==================== 主客户端类 ====================

class TuotuApiClient {
  private token: string | null = null;

  /**
   * 登录获取 Token
   */
  async login(): Promise<string> {
    console.log('🔐 登录拖兔平台...');

    const cfg = getConfig();
    const postData = JSON.stringify({
      username: cfg.username,
      password: cfg.password,
    });

    const response = await makeRequest({
      hostname: cfg.baseUrl,
      port: 443,
      path: '/api/platform/auth/login',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, postData);

    if (response.data.status === 'success') {
      this.token = response.data.result.token;
      console.log('✅ 登录成功');
      return this.token!;
    }

    throw new Error(`登录失败: ${JSON.stringify(response.data)}`);
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const cfg = getConfig();
    return {
      'Host': cfg.baseUrl,
      'Authorization': `Bearer ${this.token}`,
      'companyid': cfg.companyId,
      'tuotwo-session': cfg.session,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };
  }

  /**
   * 执行 API 请求
   */
  async executeApiRequest(apiConfig: ApiConfig): Promise<any> {
    if (!this.token) throw new Error('未登录');

    const cfg = getConfig();
    const queryString = new URLSearchParams({
      ...apiConfig.params,
      form_head_uuid: apiConfig.formHeadUuid,
    } as any).toString();

    const response = await makeRequest({
      hostname: cfg.baseUrl,
      port: 443,
      path: `/api/platform/forms/online?${queryString}`,
      method: 'GET',
      headers: this.getHeaders(),
    });

    // 获取子表数据
    if (Array.isArray(response.data.result)) {
      for (const record of response.data.result) {
        await this.fetchChildData(record, apiConfig.formHeadUuid);
      }
    }

    return response;
  }

  /**
   * 获取子表数据
   */
  private async fetchChildData(record: any, formHeadUuid: string): Promise<void> {
    const cfg = getConfig();
    const promises = CHILD_TABLE_FIELDS
      .filter(field => record[field] != null)
      .map(async (fieldUuid) => {
        const queryString = new URLSearchParams({
          field_uuid: fieldUuid,
          form_head_uuid: formHeadUuid,
          record_id: record.id,
        }).toString();

        try {
          const response = await makeRequest({
            hostname: cfg.baseUrl,
            port: 443,
            path: `/api/platform/forms/children?${queryString}`,
            method: 'GET',
            headers: this.getHeaders(),
          });
          record[`${fieldUuid}_detail`] = response.data.result || [];
        } catch {
          record[`${fieldUuid}_detail`] = [];
        }
      });

    await Promise.allSettled(promises);
  }

  /**
   * 并发获取所有 API 数据
   */
  async getAllApiData(): Promise<any[]> {
    if (!this.token) await this.login();

    console.log('\n📊 获取企业数据...');

    const apiConfigs = getApiConfigs();
    const promises = Object.values(apiConfigs).map(api =>
      this.executeApiRequest(api)
        .then(res => ({ success: true, name: api.name, data: res }))
        .catch(err => ({ success: false, name: api.name, error: err.message }))
    );

    const results = await Promise.allSettled(promises);
    const apiResponses: any[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const value = result.value as any;
        if (value.success) {
          console.log(`✅ ${value.name}`);
          apiResponses.push(value.data);
        } else {
          console.error(`❌ ${value.name}: ${value.error}`);
        }
      }
    });

    return apiResponses;
  }

  /**
   * 从 API 响应中收集所有文件信息
   */
  collectFiles(apiResponses: any[]): FileInfo[] {
    console.log('\n📁 收集文件信息...');

    const files: FileInfo[] = [];
    const fileSet = new Set<string>();

    apiResponses.forEach((response) => {
      if (response.data?.result && Array.isArray(response.data.result)) {
        response.data.result.forEach((record: any) => {
          Object.entries(record).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((item: any) => {
                if (item?.name && item?.url) {
                  // 去重
                  const uniqueKey = item.id ? `id_${item.id}` : `url_${item.url}`;
                  if (fileSet.has(uniqueKey)) return;
                  fileSet.add(uniqueKey);

                  files.push({
                    field: key,
                    fileId: item.id || '',
                    fileName: item.name,
                    fileUrl: item.url,
                    extension: path.extname(item.name).toLowerCase(),
                    category: getFileCategory(item.name),
                  });
                }
              });
            }
          });
        });
      }
    });

    console.log(`共发现 ${files.length} 个文件`);

    // 按类型统计
    const stats: Record<string, number> = {};
    files.forEach(f => {
      stats[f.category] = (stats[f.category] || 0) + 1;
    });
    Object.entries(stats).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} 个`);
    });

    return files;
  }

  /**
   * 下载所有文件
   */
  async downloadFiles(files: FileInfo[], outputDirs: OutputDirs): Promise<string[]> {
    console.log('\n📥 下载文件...');

    const downloadedPaths: string[] = [];

    for (const file of files) {
      const filePath = path.join(outputDirs.downloads, file.fileName);

      try {
        await downloadFile(file.fileUrl, filePath);
        downloadedPaths.push(filePath);
        console.log(`✅ ${file.fileName}`);
      } catch (err: any) {
        console.error(`❌ ${file.fileName}: ${err.message}`);
      }
    }

    console.log(`\n下载完成: ${downloadedPaths.length}/${files.length}`);
    return downloadedPaths;
  }
}

// ==================== 主函数 ====================

async function main() {
  const client = new TuotuApiClient();

  try {
    // 1. 登录
    await client.login();

    // 2. 获取 API 数据
    const apiData = await client.getAllApiData();

    // 3. 收集文件信息
    const files = client.collectFiles(apiData);

    // 4. 创建输出目录
    const outputDirs = createOutputDirs(getQueryId(), getRequirementId());
    console.log(`\n📂 输出目录: ${outputDirs.root}`);

    // 5. 下载文件
    const downloadedFiles = await client.downloadFiles(files, outputDirs);

    // 6. 保存 API 数据
    const dataPath = path.join(outputDirs.root, 'api-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(apiData, null, 2));
    console.log(`\n💾 API 数据已保存: ${dataPath}`);

    return {
      success: true,
      outputDir: outputDirs.root,
      filesCount: downloadedFiles.length,
      apiData,
    };

  } catch (error: any) {
    console.error('\n❌ 执行失败:', error.message);
    throw error;
  }
}

export { TuotuApiClient, main, createOutputDirs };

// 直接运行
if (require.main === module) {
  main()
    .then(result => console.log('\n✅ 完成:', result.outputDir))
    .catch(err => console.error('\n❌ 失败:', err.message));
}
