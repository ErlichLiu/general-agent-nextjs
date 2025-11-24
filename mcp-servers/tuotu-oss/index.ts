#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// 类型定义
interface OSSConfig {
  username: string;
  password: string;
  uid: string;
  fieldName: string;
  formHeadUuid: string;
  apiHost: string;
  apiOrigin: string;
}

interface AuthInfo {
  token: string;
  cookie: string;
}

interface OSSUploadConfig {
  accessid: string;
  policy: string;
  signature: string;
  dir: string;
  host: string;
  expire: number;
}

interface ResourceInfo {
  id: string;
  name: string;
  url: string;
  size: number;
}

// OSS 服务实现
class OSSService {
  private _config?: OSSConfig;

  private get config(): OSSConfig {
    if (!this._config) {
      this._config = {
        username: process.env.TUOTU_USERNAME || '',
        password: process.env.TUOTU_PASSWORD || '',
        uid: process.env.TUOTU_UID || '',
        fieldName: process.env.TUOTU_FIELD_NAME || '',
        formHeadUuid: process.env.TUOTU_FORM_HEAD_UUID || '',
        apiHost: process.env.TUOTU_API_HOST || 'api.ontuotu.com',
        apiOrigin: process.env.TUOTU_API_ORIGIN || 'https://paas.ontuotu.com',
      };
    }
    return this._config;
  }

  async login(): Promise<AuthInfo> {
    const response = await fetch(`https://${this.config.apiHost}/api/platform/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      return {
        token: result.result.token,
        cookie: response.headers.get('set-cookie') || '',
      };
    } else if (result.code === 200 && result.data) {
      return {
        token: result.data.token,
        cookie: response.headers.get('set-cookie') || '',
      };
    } else {
      throw new Error(`登录失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  async getOSSConfig(authInfo: AuthInfo): Promise<OSSUploadConfig> {
    const response = await fetch(`https://${this.config.apiHost}/api/general/oss/config`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
      },
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      return result.result;
    } else if (result.code === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(`获取OSS配置失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  async uploadFileToOSS(
    filePath: string,
    ossConfig: OSSUploadConfig
  ): Promise<{ keyValue: string; fileUrl: string }> {
    const fileName = path.basename(filePath);
    const keyValue = `${ossConfig.dir}${Date.now()}_${fileName}`;

    const formData = new FormData();
    formData.append('key', keyValue);
    formData.append('policy', ossConfig.policy);
    formData.append('OSSAccessKeyId', ossConfig.accessid);
    formData.append('signature', ossConfig.signature);
    formData.append('success_action_status', '200');
    formData.append('file', fs.createReadStream(filePath), fileName);

    try {
      await axios.post(ossConfig.host, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return {
        keyValue,
        fileUrl: `${ossConfig.host}${keyValue}`,
      };
    } catch (error: any) {
      throw new Error(`OSS上传失败: ${error.message}`);
    }
  }

  async createResource(
    fileName: string,
    keyValue: string,
    authInfo: AuthInfo
  ): Promise<string> {
    const response = await fetch(`https://${this.config.apiHost}/api/general/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
      },
      body: JSON.stringify({
        name: fileName,
        path: keyValue,
        type: 'file',
      }),
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      return result.result.id;
    } else if (result.code === 200 && result.data) {
      return result.data.id;
    } else {
      throw new Error(`创建资源失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  async createFormData(
    resourceIds: string[],
    fieldName: string,
    formHeadUuid: string,
    formData: Record<string, string>,
    authInfo: AuthInfo
  ): Promise<void> {
    const payload = {
      formHeadUuid,
      data: {
        ...formData,
        [fieldName]: resourceIds,
      },
    };

    const response = await fetch(`https://${this.config.apiHost}/api/platform/forms/online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
        Origin: this.config.apiOrigin,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success') {
      return;
    } else if (result.code === 200) {
      return;
    } else {
      throw new Error(`创建表单失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  async uploadReportComplete(
    taskId: string,
    outputDirectory: string,
    queryId: string,
    requirementId: string
  ): Promise<any> {
    const authInfo = await this.login();
    const ossConfig = await this.getOSSConfig(authInfo);

    const files = this.findReportFiles(outputDirectory);
    if (files.length === 0) {
      throw new Error(`目录 ${outputDirectory} 中未找到 .docx 或 .md 文件`);
    }

    const resourceList: ResourceInfo[] = [];
    let totalSize = 0;

    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      totalSize += fileSize;

      const { keyValue, fileUrl } = await this.uploadFileToOSS(filePath, ossConfig);
      const resourceId = await this.createResource(fileName, keyValue, authInfo);

      resourceList.push({
        id: resourceId,
        name: fileName,
        url: fileUrl,
        size: fileSize,
      });
    }

    const formData = {
      xxiutkzluajtoljp: queryId,
      uxxcnibliesxqhkl: requirementId,
      kstiuvzjeojljshp: taskId,
    };

    await this.createFormData(
      resourceList.map(r => r.id),
      this.config.fieldName,
      this.config.formHeadUuid,
      formData,
      authInfo
    );

    const primaryReport = resourceList[0];
    return {
      success: true,
      taskId,
      uploadedFiles: resourceList.length,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      primaryReport: {
        name: primaryReport.name,
        size: primaryReport.size,
        sizeFormatted: this.formatFileSize(primaryReport.size),
      },
      resources: resourceList,
    };
  }

  private findReportFiles(directory: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(directory)) {
      return files;
    }

    const items = fs.readdirSync(directory);
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && (item.endsWith('.docx') || item.endsWith('.md'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'tuotu-oss',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ossService = new OSSService();

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'upload_report',
        description: '上传报告文件到拖兔 OSS 并关联到指定项目。会自动查找目录中的 .docx 和 .md 文件进行上传。',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: '任务ID',
            },
            outputDirectory: {
              type: 'string',
              description: '包含报告文件（.docx 或 .md）的目录路径',
            },
            queryId: {
              type: 'string',
              description: '企业ID',
            },
            requirementId: {
              type: 'string',
              description: '需求单ID',
            },
          },
          required: ['taskId', 'outputDirectory', 'queryId', 'requirementId'],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'upload_report') {
    const { taskId, outputDirectory, queryId, requirementId } = request.params.arguments as {
      taskId: string;
      outputDirectory: string;
      queryId: string;
      requirementId: string;
    };

    try {
      const result = await ossService.uploadReportComplete(
        taskId,
        outputDirectory,
        queryId,
        requirementId
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `上传失败: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tuotu OSS MCP Server running on stdio');
}

main().catch(console.error);
