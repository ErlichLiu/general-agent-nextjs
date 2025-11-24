#!/usr/bin/env node

/**
 * MinerU MCP Server
 *
 * 提供 PDF 文档解析功能，通过 MinerU API 提取 Markdown 内容和图片
 *
 * Tools:
 * - process_pdf: 处理 PDF 文件，提取 Markdown 和图片
 * - save_images: 保存 MinerU 返回的图片到本地
 * - get_pdf_content: 获取已处理 PDF 的 Markdown 内容
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// ==================== 配置 ====================

const MINERU_BASE_URL = 'http://36.151.194.11:8100';
const MINERU_TIMEOUT = 5400000; // 90 分钟

// ==================== 类型定义 ====================

interface MinerUResponse {
  results: {
    [filename: string]: {
      md_content?: string;
      images?: {
        [imageFilename: string]: string;
      };
      middle_json?: any;
      model_output?: any;
      content_list?: any[];
    };
  };
}

interface SavedImageInfo {
  source: string;
  type: string;
  path: string;
  originalName: string;
  fileName: string;
  size: number;
  extractedFrom: string;
}

// ==================== 辅助函数 ====================

/**
 * 处理 base64 图片数据
 */
function parseBase64Image(base64Data: string): { mimeType: string; data: Buffer } {
  // 检查是否包含 data URL 前缀
  const dataUrlMatch = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];
    const data = Buffer.from(dataUrlMatch[2], 'base64');
    return { mimeType, data };
  }

  // 纯 base64 字符串，默认为 JPEG
  const data = Buffer.from(base64Data, 'base64');
  return { mimeType: 'image/jpeg', data };
}

/**
 * 从 MIME 类型获取文件扩展名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return mimeToExt[mimeType] || '.jpg';
}

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ==================== MCP Server ====================

const server = new Server(
  {
    name: 'mineru-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ==================== Tools ====================

const tools: Tool[] = [
  {
    name: 'process_pdf',
    description: '使用 MinerU API 处理 PDF 文件，提取 Markdown 内容和图片。支持配置公式识别、表格识别等选项。',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'PDF 文件的绝对路径',
        },
        outputDir: {
          type: 'string',
          description: '输出目录的绝对路径（可选，默认为 PDF 文件所在目录）',
        },
        options: {
          type: 'object',
          description: 'MinerU 处理选项（可选）',
          properties: {
            lang_list: {
              type: 'string',
              description: '语言列表，默认 "auto"',
            },
            backend: {
              type: 'string',
              description: '后端引擎，默认 "transformers"',
            },
            parse_method: {
              type: 'string',
              description: '解析方法，默认 "auto"',
            },
            formula_enable: {
              type: 'string',
              description: '公式识别 ("true" | "false")，默认 "false"',
            },
            table_enable: {
              type: 'string',
              description: '表格识别 ("true" | "false")，默认 "false"',
            },
            return_md: {
              type: 'string',
              description: '返回 Markdown ("true" | "false")，默认 "true"',
            },
            return_images: {
              type: 'string',
              description: '返回图片 ("true" | "false")，默认 "true"',
            },
            start_page_id: {
              type: 'number',
              description: '起始页码（可选）',
            },
            end_page_id: {
              type: 'number',
              description: '结束页码（可选）',
            },
          },
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'save_images',
    description: '从 MinerU 响应中保存图片到本地目录',
    inputSchema: {
      type: 'object',
      properties: {
        mineruResult: {
          type: 'object',
          description: 'MinerU API 返回的完整响应对象',
        },
        originalFilename: {
          type: 'string',
          description: '原始 PDF 文件名',
        },
        imageOutputDir: {
          type: 'string',
          description: '图片保存目录的绝对路径',
        },
      },
      required: ['mineruResult', 'originalFilename', 'imageOutputDir'],
    },
  },
  {
    name: 'get_pdf_content',
    description: '从 MinerU 响应中获取 PDF 的 Markdown 内容',
    inputSchema: {
      type: 'object',
      properties: {
        mineruResult: {
          type: 'object',
          description: 'MinerU API 返回的完整响应对象',
        },
        filename: {
          type: 'string',
          description: 'PDF 文件名（可选，不提供则返回第一个结果）',
        },
      },
      required: ['mineruResult'],
    },
  },
];

// ==================== Tool Handlers ====================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'process_pdf': {
        const { filePath, outputDir, options = {} } = args as {
          filePath: string;
          outputDir?: string;
          options?: Record<string, any>;
        };

        // 验证文件存在
        if (!fs.existsSync(filePath)) {
          throw new Error(`文件不存在: ${filePath}`);
        }

        // 验证是 PDF 文件
        if (!filePath.toLowerCase().endsWith('.pdf')) {
          throw new Error('只支持 PDF 文件');
        }

        // 确定输出目录
        const finalOutputDir = outputDir || path.dirname(filePath);
        ensureDirectoryExists(finalOutputDir);

        // 创建 FormData
        const formData = new FormData();
        formData.append('files', fs.createReadStream(filePath));
        formData.append('output_dir', finalOutputDir);

        // 添加可选参数
        const defaultOptions = {
          lang_list: 'auto',
          backend: 'transformers',
          parse_method: 'auto',
          formula_enable: 'false',
          table_enable: 'false',
          return_md: 'true',
          return_middle_json: 'false',
          return_model_output: 'false',
          return_content_list: 'false',
          return_images: 'true',
        };

        const mergedOptions = { ...defaultOptions, ...options };
        Object.entries(mergedOptions).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        // 调用 MinerU API
        const response = await axios.post<MinerUResponse>(
          `${MINERU_BASE_URL}/parse`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: MINERU_TIMEOUT,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  filePath,
                  outputDir: finalOutputDir,
                  options: mergedOptions,
                  result: response.data,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'save_images': {
        const { mineruResult, originalFilename, imageOutputDir } = args as {
          mineruResult: MinerUResponse;
          originalFilename: string;
          imageOutputDir: string;
        };

        ensureDirectoryExists(imageOutputDir);

        const savedImages: SavedImageInfo[] = [];
        const baseFilename = path.basename(originalFilename, '.pdf');

        // 遍历所有文档结果
        for (const [docName, docResult] of Object.entries(mineruResult.results)) {
          if (!docResult.images) continue;

          // 遍历所有图片
          for (const [imageName, base64Data] of Object.entries(docResult.images)) {
            try {
              const { mimeType, data } = parseBase64Image(base64Data);
              const extension = getExtensionFromMimeType(mimeType);

              // 生成新文件名
              const newFileName = `pdf_${baseFilename}_${imageName}`;
              const finalFileName = newFileName.endsWith(extension)
                ? newFileName
                : newFileName + extension;

              const outputPath = path.join(imageOutputDir, finalFileName);

              // 保存文件
              fs.writeFileSync(outputPath, data);

              savedImages.push({
                source: docName,
                type: 'PDF内嵌图片',
                path: outputPath,
                originalName: imageName,
                fileName: finalFileName,
                size: data.length,
                extractedFrom: 'MinerU',
              });
            } catch (error) {
              console.error(`保存图片失败 ${imageName}:`, error);
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  totalImages: savedImages.length,
                  outputDir: imageOutputDir,
                  images: savedImages,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_pdf_content': {
        const { mineruResult, filename } = args as {
          mineruResult: MinerUResponse;
          filename?: string;
        };

        if (!mineruResult.results) {
          throw new Error('无效的 MinerU 响应格式');
        }

        let content: string | undefined;

        if (filename) {
          // 查找特定文件
          const docResult = mineruResult.results[filename];
          if (!docResult) {
            throw new Error(`未找到文件: ${filename}`);
          }
          content = docResult.md_content;
        } else {
          // 返回第一个结果
          const firstDoc = Object.values(mineruResult.results)[0];
          content = firstDoc?.md_content;
        }

        if (!content) {
          throw new Error('未找到 Markdown 内容');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  filename: filename || Object.keys(mineruResult.results)[0],
                  contentLength: content.length,
                  content,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              stack: error.stack,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// ==================== 启动服务器 ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MinerU MCP Server 已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
