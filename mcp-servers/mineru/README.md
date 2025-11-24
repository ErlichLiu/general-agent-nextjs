# MinerU MCP Server

MCP 服务器，用于通过 MinerU API 处理 PDF 文档，提取 Markdown 内容和图片。

## 功能

### 工具列表

#### 1. `process_pdf`
处理 PDF 文件，提取 Markdown 内容和图片。

**参数**：
- `filePath` (string, required): PDF 文件的绝对路径
- `outputDir` (string, optional): 输出目录的绝对路径（默认为 PDF 文件所在目录）
- `options` (object, optional): MinerU 处理选项
  - `lang_list` (string): 语言列表，默认 "auto"
  - `backend` (string): 后端引擎，默认 "transformers"
  - `parse_method` (string): 解析方法，默认 "auto"
  - `formula_enable` (string): 公式识别 ("true" | "false")，默认 "false"
  - `table_enable` (string): 表格识别 ("true" | "false")，默认 "false"
  - `return_md` (string): 返回 Markdown ("true" | "false")，默认 "true"
  - `return_images` (string): 返回图片 ("true" | "false")，默认 "true"
  - `start_page_id` (number): 起始页码（可选）
  - `end_page_id` (number): 结束页码（可选）

**返回**：
```json
{
  "success": true,
  "filePath": "/path/to/file.pdf",
  "outputDir": "/path/to/output",
  "options": { ... },
  "result": {
    "results": {
      "file.pdf": {
        "md_content": "# 提取的内容...",
        "images": {
          "image_1.jpg": "base64数据..."
        }
      }
    }
  }
}
```

#### 2. `save_images`
从 MinerU 响应中保存图片到本地目录。

**参数**：
- `mineruResult` (object, required): MinerU API 返回的完整响应对象
- `originalFilename` (string, required): 原始 PDF 文件名
- `imageOutputDir` (string, required): 图片保存目录的绝对路径

**返回**：
```json
{
  "success": true,
  "totalImages": 5,
  "outputDir": "/path/to/images",
  "images": [
    {
      "source": "file.pdf",
      "type": "PDF内嵌图片",
      "path": "/path/to/images/pdf_file_image_1.jpg",
      "originalName": "image_1.jpg",
      "fileName": "pdf_file_image_1.jpg",
      "size": 12345,
      "extractedFrom": "MinerU"
    }
  ]
}
```

#### 3. `get_pdf_content`
从 MinerU 响应中获取 PDF 的 Markdown 内容。

**参数**：
- `mineruResult` (object, required): MinerU API 返回的完整响应对象
- `filename` (string, optional): PDF 文件名（不提供则返回第一个结果）

**返回**：
```json
{
  "success": true,
  "filename": "file.pdf",
  "contentLength": 1234,
  "content": "# Markdown 内容..."
}
```

## 配置

MinerU API 配置已硬编码：
- **Base URL**: `http://36.151.194.11:8100`
- **Timeout**: 5400000ms (90 分钟)

## 使用示例

### 在 Claude Code 中使用

```typescript
// 1. 处理 PDF
const result = await use_mcp_tool("mineru", "process_pdf", {
  filePath: "/path/to/document.pdf",
  outputDir: "/path/to/output",
  options: {
    formula_enable: "true",
    table_enable: "true",
    return_images: "true"
  }
});

// 2. 保存图片
const savedImages = await use_mcp_tool("mineru", "save_images", {
  mineruResult: result.result,
  originalFilename: "document.pdf",
  imageOutputDir: "/path/to/images"
});

// 3. 获取 Markdown 内容
const content = await use_mcp_tool("mineru", "get_pdf_content", {
  mineruResult: result.result
});

console.log(content.content);
```

## 安装

```bash
cd mcp-servers/mineru
pnpm install
```

## 启动

MCP 服务器会通过 `.mcp.json` 自动启动：

```json
{
  "mcpServers": {
    "mineru": {
      "command": "npx",
      "args": ["ts-node", "mcp-servers/mineru/index.ts"]
    }
  }
}
```

## 技术栈

- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **HTTP Client**: axios ^1.7.9
- **Form Data**: form-data ^4.0.1
- **TypeScript**: ^5.3.3

## API 端点

MinerU API: `POST http://36.151.194.11:8100/parse`

## 错误处理

所有工具在出错时返回：
```json
{
  "success": false,
  "error": "错误消息",
  "stack": "错误堆栈"
}
```

## 限制

- 仅支持 PDF 文件
- 超时时间为 90 分钟
- 图片以 base64 格式返回
- 默认启用 Markdown 和图片提取
