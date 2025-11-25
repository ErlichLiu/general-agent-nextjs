# MCP 服务使用指南

本项目提供两个 MCP (Model Context Protocol) 服务器，用于 PDF 处理和文件上传。

## ✅ 测试结果

两个 MCP 服务器均已测试通过：

### 1. MinerU MCP Server
- **状态**: ✅ 正常运行
- **服务器名**: `mineru`
- **工具数量**: 3 个
- **启动命令**: `npx tsx mcp-servers/mineru/index.ts`

### 2. Tuotu OSS MCP Server
- **状态**: ✅ 正常运行
- **服务器名**: `tuotu-oss`
- **工具数量**: 1 个
- **启动命令**: `npx tsx mcp-servers/tuotu-oss/index.ts`

## 🧪 测试 MCP 服务器

运行测试脚本验证服务器状态：

```bash
# 测试 MinerU
npx tsx test-mcp.ts mineru

# 测试 Tuotu OSS
npx tsx test-mcp.ts tuotu-oss
```

## 📋 可用工具列表

### MinerU 工具

#### 1. `process_pdf`
处理 PDF 文件，提取 Markdown 内容和图片。

**参数**：
```typescript
{
  filePath: string;           // PDF 文件绝对路径（必需）
  outputDir?: string;         // 输出目录（可选）
  options?: {
    lang_list?: string;       // 语言列表，默认 "auto"
    formula_enable?: string;  // 公式识别 "true" | "false"
    table_enable?: string;    // 表格识别 "true" | "false"
    return_md?: string;       // 返回 Markdown "true" | "false"
    return_images?: string;   // 返回图片 "true" | "false"
    start_page_id?: number;   // 起始页码
    end_page_id?: number;     // 结束页码
  }
}
```

#### 2. `save_images`
从 MinerU 响应中保存图片到本地。

**参数**：
```typescript
{
  mineruResult: object;       // MinerU API 返回的响应（必需）
  originalFilename: string;   // 原始 PDF 文件名（必需）
  imageOutputDir: string;     // 图片保存目录（必需）
}
```

#### 3. `get_pdf_content`
获取 PDF 的 Markdown 内容。

**参数**：
```typescript
{
  mineruResult: object;       // MinerU API 返回的响应（必需）
  filename?: string;          // PDF 文件名（可选）
}
```

### Tuotu OSS 工具

#### 1. `upload_report`
上传报告文件到拖兔 OSS。

**参数**：
```typescript
{
  taskId: string;             // 任务ID（必需）
  outputDirectory: string;    // 报告文件目录（必需）
  queryId: string;            // 企业ID（必需）
  requirementId: string;      // 需求单ID（必需）
}
```

## 💡 在 Claude Code 中使用

### 示例 1: 处理 PDF 文件

```typescript
// 1. 处理 PDF，提取内容和图片
const result = await use_mcp_tool("mineru", "process_pdf", {
  filePath: "/path/to/document.pdf",
  options: {
    formula_enable: "true",
    table_enable: "true",
    return_images: "true"
  }
});

console.log("处理结果:", result);

// 2. 保存提取的图片
const images = await use_mcp_tool("mineru", "save_images", {
  mineruResult: result.result,
  originalFilename: "document.pdf",
  imageOutputDir: "/path/to/images"
});

console.log(`保存了 ${images.totalImages} 张图片`);

// 3. 获取 Markdown 内容
const content = await use_mcp_tool("mineru", "get_pdf_content", {
  mineruResult: result.result
});

console.log("文档内容:", content.content);
```

### 示例 2: 完整工作流（PDF 处理 + 上传）

```typescript
// 步骤 1: 处理 PDF
const pdfResult = await use_mcp_tool("mineru", "process_pdf", {
  filePath: "/Users/you/documents/report.pdf",
  outputDir: "/Users/you/output",
  options: {
    formula_enable: "true",
    table_enable: "true"
  }
});

// 步骤 2: 保存图片
await use_mcp_tool("mineru", "save_images", {
  mineruResult: pdfResult.result,
  originalFilename: "report.pdf",
  imageOutputDir: "/Users/you/output/images"
});

// 步骤 3: 上传到拖兔 OSS
const uploadResult = await use_mcp_tool("tuotu-oss", "upload_report", {
  taskId: "task_123",
  outputDirectory: "/Users/you/output",
  queryId: "company_456",
  requirementId: "req_789"
});

console.log("上传结果:", uploadResult);
```

### 示例 3: 批量处理多个 PDF

```typescript
const pdfFiles = [
  "/path/to/doc1.pdf",
  "/path/to/doc2.pdf",
  "/path/to/doc3.pdf"
];

for (const pdfPath of pdfFiles) {
  console.log(`处理: ${pdfPath}`);

  const result = await use_mcp_tool("mineru", "process_pdf", {
    filePath: pdfPath,
    options: {
      return_md: "true",
      return_images: "true"
    }
  });

  const content = await use_mcp_tool("mineru", "get_pdf_content", {
    mineruResult: result.result
  });

  console.log(`✅ ${pdfPath} 处理完成`);
  console.log(`内容长度: ${content.contentLength} 字符`);
}
```

## 🔧 配置文件

MCP 服务器配置在 [.mcp.json](.mcp.json)：

```json
{
  "mcpServers": {
    "tuotu-oss": {
      "command": "npx",
      "args": ["tsx", "mcp-servers/tuotu-oss/index.ts"],
      "env": {
        "TUOTU_USERNAME": "...",
        "TUOTU_PASSWORD": "...",
        "TUOTU_UID": "...",
        "TUOTU_FIELD_NAME": "...",
        "TUOTU_FORM_HEAD_UUID": "...",
        "TUOTU_API_HOST": "api.ontuotu.com",
        "TUOTU_API_ORIGIN": "https://paas.ontuotu.com"
      }
    },
    "mineru": {
      "command": "npx",
      "args": ["tsx", "mcp-servers/mineru/index.ts"]
    }
  }
}
```

## 📦 依赖管理

所有 MCP 服务器共享根目录的 node_modules：

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "axios": "^1.13.2",
    "form-data": "^4.0.5"
  },
  "devDependencies": {
    "tsx": "^4.20.6"
  }
}
```

无需在 MCP 服务器目录安装依赖。

## 🚀 部署

### 开发环境
```bash
pnpm install
# MCP 服务器自动可用
```

### 生产环境
```bash
pnpm install --prod
# 配置 .mcp.json
# 重启 Claude Code
```

## ❓ 故障排查

### 问题：服务器无法启动

**检查清单**：
1. 确认 `tsx` 已安装: `npx tsx --version`
2. 检查 `.mcp.json` 配置格式
3. 验证 TypeScript 文件路径正确
4. 运行测试脚本: `npx tsx test-mcp.ts <server-name>`

### 问题：工具调用失败

**调试步骤**：
```bash
# 1. 测试服务器响应
npx tsx test-mcp.ts mineru

# 2. 检查工具列表
# 服务器输出会显示所有可用工具

# 3. 验证参数格式
# 参考上述示例确保参数类型正确
```

### 问题：MinerU 超时

MinerU 处理大型 PDF 可能需要较长时间（默认超时 90 分钟）。如果需要调整：

编辑 [mcp-servers/mineru/index.ts](mcp-servers/mineru/index.ts)：
```typescript
const MINERU_TIMEOUT = 5400000; // 修改此值（毫秒）
```

## 📚 更多信息

- [MinerU 详细文档](mcp-servers/mineru/README.md)
- [MCP 服务器架构说明](mcp-servers/README.md)
- [MCP Protocol 规范](https://modelcontextprotocol.io)

## ✨ 成功标志

如果看到以下输出，说明服务器运行正常：

```
✅ MCP 服务器基础启动测试通过

💡 提示: 服务器已启动并等待 JSON-RPC 消息
   在 Claude Code 中可以通过以下方式使用:
   - use_mcp_tool("mineru", "tool_name", { ... })
```
