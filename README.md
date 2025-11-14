# Claude Agent SDK Test

一个基于 Next.js 的 Web 应用，用于测试和演示 Anthropic Claude Agent SDK 的功能。该项目提供了一个简洁的用户界面，可以通过自然语言与 Claude AI Agent 交互，执行文件系统操作。

## 功能特性

- **流式响应**：实时显示 Agent 的响应消息流
- **安全限制**：仅允许只读操作（Read、Glob、Grep 工具），防止意外修改文件
- **现代 UI**：支持深色/浅色主题的响应式界面
- **实时反馈**：通过流式传输即时查看 Agent 的处理过程

## 技术栈

- **框架**：Next.js 16 (App Router)
- **前端**：React 19
- **样式**：Tailwind CSS 4
- **AI SDK**：@anthropic-ai/claude-agent-sdk
- **语言**：TypeScript

## 项目结构

```plaintext
general-agent-test/
├── app/
│   ├── api/
│   │   └── agent/
│   │       └── route.ts      # Agent API 端点，处理流式响应
│   ├── layout.tsx            # 根布局组件
│   └── page.tsx              # 主页面，包含交互界面
├── package.json
└── README.md
```

## 快速开始

### 前置要求

- Node.js 20+
- pnpm（推荐）或 npm/yarn
- Anthropic API Key

### 环境配置

在项目根目录创建 `.env.local` 文件并添加你的 Anthropic API Key：

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 使用方法

1. 在输入框中输入自然语言问题或指令
2. 点击"发送"按钮
3. 查看实时流式响应，显示 Agent 的处理过程和结果

### 示例提示词

- "列出当前目录的所有文件"
- "查找所有 TypeScript 文件"
- "在项目中搜索包含 'Claude' 的代码"
- "读取 package.json 文件的内容"

## API 端点

### POST /api/agent

处理用户提示词并返回 Agent 的流式响应。

**请求体：**

```json
{
  "prompt": "你的问题或指令"
}
```

**响应：**

- Content-Type: `application/x-ndjson`
- 流式返回换行分隔的 JSON 消息

## 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 运行生产服务器
- `pnpm lint` - 运行 ESLint 代码检查

## 安全说明

当前配置仅允许以下只读工具：

- **Read**: 读取文件内容
- **Glob**: 匹配文件模式
- **Grep**: 搜索文件内容

如需启用更多工具或写入权限，请修改 [app/api/agent/route.ts](app/api/agent/route.ts#L28) 中的 `allowedTools` 配置。

## 开发笔记

- 使用 Next.js App Router 和 React Server Components
- API 路由使用 ReadableStream 实现流式响应
- 前端通过 Fetch API 的 ReadableStream reader 处理流式数据
- 支持深色模式，使用 Tailwind CSS 的 `dark:` 变体

## 相关资源

- [Anthropic Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 许可证

MIT
