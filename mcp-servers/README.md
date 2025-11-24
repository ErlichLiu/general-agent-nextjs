# MCP Servers

本目录包含项目的 Model Context Protocol (MCP) 服务器。

## 架构设计

### 依赖管理策略

所有 MCP 服务器**共享根目录的 node_modules**，不需要独立的 `package.json`。

**优点**：
- ✅ 减小 Git 仓库体积
- ✅ 避免依赖重复
- ✅ 简化部署流程
- ✅ 统一依赖版本管理

### 目录结构

```
mcp-servers/
├── tuotu-oss/
│   └── index.ts          # 拖兔 OSS 上传服务
├── mineru/
│   ├── index.ts          # MinerU PDF 解析服务
│   └── README.md         # 使用文档
└── README.md             # 本文件
```

### 运行方式

MCP 服务器通过 `.mcp.json` 配置，使用 `tsx`（根目录依赖）运行：

```json
{
  "mcpServers": {
    "mineru": {
      "command": "npx",
      "args": ["tsx", "mcp-servers/mineru/index.ts"]
    }
  }
}
```

## 可用的服务器

### 1. tuotu-oss
拖兔平台 OSS 文件上传服务

**工具**：
- `upload_file_to_tuotu_oss`: 上传文件到拖兔 OSS

### 2. mineru
MinerU PDF 文档解析服务

**工具**：
- `process_pdf`: 处理 PDF 文件，提取 Markdown 和图片
- `save_images`: 保存提取的图片到本地
- `get_pdf_content`: 获取 PDF 的 Markdown 内容

详见 [mineru/README.md](mineru/README.md)

## 添加新的 MCP 服务器

1. 在 `mcp-servers/` 下创建新目录
2. 创建 `index.ts` 实现 MCP 服务器
3. 在根目录 `package.json` 中添加所需依赖
4. 更新 `.mcp.json` 配置

**示例**：
```bash
mkdir mcp-servers/my-service
# 编写 index.ts
# 添加依赖到根 package.json
pnpm install
# 更新 .mcp.json
```

## 部署

### 生产环境

```bash
# 1. 安装根目录依赖
pnpm install

# 2. MCP 服务器自动通过 tsx 运行，无需额外配置
```

### Git 忽略

以下文件已在 `.gitignore` 中忽略：
- `mcp-servers/*/node_modules`
- `mcp-servers/*/package-lock.json`
- `mcp-servers/*/pnpm-lock.yaml`

## 依赖说明

所有 MCP 服务器使用的依赖已在根目录安装：

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "axios": "^1.13.2",
    "form-data": "^4.0.5"
  },
  "devDependencies": {
    "tsx": "^4.20.6",
    "typescript": "^5"
  }
}
```

## 常见问题

### Q: 为什么不在每个 MCP 目录创建 package.json？
A: 为了减小仓库体积和避免依赖重复。所有依赖统一在根目录管理。

### Q: 如何调试 MCP 服务器？
A: 使用 `tsx` 直接运行：
```bash
npx tsx mcp-servers/mineru/index.ts
```

### Q: 新增依赖怎么办？
A: 在根目录添加：
```bash
pnpm add <package-name>
```
