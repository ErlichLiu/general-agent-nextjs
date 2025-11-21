# Claude Agent SDK Test

一个基于 Next.js 的 Web 应用，用于测试和演示 Anthropic Claude Agent SDK 的功能。该项目提供了完整的交互界面，包含文件管理、AI 对话和配置面板，支持通过自然语言与 Claude AI Agent 交互，执行文件系统操作。

## ✨ 功能特性

- **🎯 三栏式布局**：文件管理器 + Agent 聊天 + 配置面板
- **📁 文件管理**：拖拽上传文件，支持预览和删除操作
- **💬 流式对话**：实时显示 Agent 的响应消息流，支持 Markdown 渲染
- **⚙️ 灵活配置**：动态配置 AI 模型、工具权限、工作目录和系统提示
- **🎨 现代 UI**：支持深色/浅色主题的响应式界面
- **📊 消息类型**：区分用户消息、Agent 响应和工具调用
- **🔄 实时反馈**：通过 NDJSON 流式传输即时查看处理过程

## 🛠 技术栈

- **框架**：Next.js 16 (App Router)
- **前端**：React 19 + TypeScript 5
- **样式**：Tailwind CSS 4
- **AI SDK**：@anthropic-ai/claude-agent-sdk v0.1.37
- **Markdown**：react-markdown + remark-gfm
- **包管理器**：pnpm (必须)

## 📂 项目结构

```plaintext
general-agent-test/
├── app/
│   ├── api/
│   │   └── agent/
│   │       └── route.ts           # Agent API 端点 (NDJSON 流式响应)
│   ├── components/
│   │   ├── AgentChat/             # 聊天组件
│   │   │   ├── index.tsx          # 主聊天容器
│   │   │   ├── ChatInput.tsx      # 输入框组件
│   │   │   ├── MessageList.tsx    # 消息列表
│   │   │   ├── MessageItem.tsx    # 单条消息
│   │   │   └── SDKMessageCard.tsx # SDK 消息卡片
│   │   ├── ConfigPanel/           # 配置面板
│   │   │   ├── index.tsx          # 配置容器
│   │   │   └── ConfigForm.tsx     # 配置表单
│   │   └── FileManager/           # 文件管理器
│   │       ├── index.tsx          # 文件管理容器
│   │       ├── FileUploadZone.tsx # 上传区域
│   │       └── FileList.tsx       # 文件列表
│   ├── hooks/
│   │   ├── useAgentChat.ts        # 聊天逻辑 Hook
│   │   ├── useAgentConfig.ts      # 配置管理 Hook
│   │   ├── useFileManager.ts      # 文件管理 Hook
│   │   └── useDragAndDrop.ts      # 拖拽上传 Hook
│   ├── types/
│   │   ├── agent.ts               # Agent 类型定义
│   │   ├── config.ts              # 配置类型定义
│   │   └── file.ts                # 文件类型定义
│   ├── utils/
│   │   └── formatters.ts          # 工具函数
│   ├── layout.tsx                 # 根布局
│   └── page.tsx                   # 主页面 (三栏布局)
├── public/
│   └── uploads/                   # 默认文件上传目录
├── package.json
├── README.md
└── CLAUDE.md                      # Claude Code 项目指南
```

## 🚀 快速开始

### 前置要求

- **Node.js**: 20+
- **包管理器**: pnpm（必须使用，不要使用 npm/yarn）
- **API Key**: [Anthropic API Key](https://console.anthropic.com/)

### 1. 环境配置

在项目根目录创建 `.env.local` 文件并添加你的 Anthropic API Key：

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 💡 使用指南

### 基础工作流程

1. **上传文件**（左侧文件管理器）
   - 拖拽文件到上传区域
   - 或点击上传区域选择文件
   - 支持查看和删除已上传文件

2. **配置 Agent**（右侧配置面板）
   - 选择 AI 模型（Sonnet/Opus/Haiku）
   - 配置允许的工具权限
   - 设置工作目录（相对于项目根目录）
   - 可选：添加系统提示（System Prompt）

3. **与 Agent 对话**（中间聊天区域）
   - 输入自然语言问题或指令
   - 点击发送按钮或按 Enter
   - 实时查看流式响应和工具调用

### 示例提示词

#### 文件操作
- "列出当前目录的所有文件"
- "读取 package.json 文件的内容"
- "在 uploads 目录中查找所有图片文件"

#### 代码分析
- "分析 app/api/agent/route.ts 的实现逻辑"
- "查找项目中所有使用了 React Hooks 的组件"
- "搜索包含 'useAgentChat' 的代码"

#### 内容搜索
- "在项目中搜索包含 'Claude' 的代码"
- "查找所有 TypeScript 类型定义文件"
- "找出所有使用 Tailwind CSS 的组件"

## 🔧 核心架构

### 流式通信机制

#### 后端实现（[app/api/agent/route.ts](app/api/agent/route.ts)）

```typescript
// 使用 ReadableStream 实现服务端流式响应
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();

    const result = query({
      prompt,
      options: {
        model: 'sonnet',
        cwd: process.cwd(),
        allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash'],
        dangerouslySkipPermissions: true,  // API 路由必须
      },
    });

    // 通过 NDJSON 格式逐行返回
    for await (const message of result) {
      const data = JSON.stringify(message) + '\n';
      controller.enqueue(encoder.encode(data));
    }

    controller.close();
  },
});
```

#### 前端实现（[app/hooks/useAgentChat.ts](app/hooks/useAgentChat.ts)）

```typescript
// 使用 Fetch API 的 ReadableStream 处理流式数据
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const message = JSON.parse(line);  // 解析每条 NDJSON 消息
    // 根据消息类型更新 UI 状态...
  }
}
```

### 关键设计决策

1. **服务端限制**
   - Agent SDK 必须在 API 路由中运行，不能在客户端组件中使用
   - 使用 `dangerouslySkipPermissions: true` 避免交互式权限对话框

2. **流式协议**
   - 使用 NDJSON (Newline Delimited JSON) 格式
   - 每行一个完整的 JSON 对象
   - Content-Type: `application/x-ndjson`

3. **工作目录隔离**
   - 默认工作目录：`public/uploads/`
   - 可通过配置面板动态修改
   - 所有文件操作限定在指定目录内

4. **组件化架构**
   - 使用自定义 Hooks 分离业务逻辑
   - 组件负责 UI 渲染，Hooks 负责状态管理
   - 类型定义集中管理于 `app/types/`

## ⚙️ 配置选项

### Agent SDK 配置

在右侧配置面板或直接修改 [app/api/agent/route.ts](app/api/agent/route.ts) 中的配置：

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|--------|--------|
| **model** | AI 模型选择 | `sonnet`, `opus`, `haiku` | `sonnet` |
| **cwd** | 工作目录（相对路径） | 任意目录路径 | `public/uploads` |
| **allowedTools** | 允许的工具列表 | `Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash` 等 | `['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash']` |
| **systemPrompt** | 系统提示（可选） | 任意文本 | 无 |
| **dangerouslySkipPermissions** | 跳过权限确认 | `true`, `false` | `true` |

### 工具权限说明

- **只读工具**：`Read`, `Glob`, `Grep`
- **写入工具**：`Write`, `Edit`
- **系统工具**：`Bash`

**安全提示**：在生产环境中，建议只启用必要的工具，避免使用 `Bash` 等高风险工具。

## 📜 可用脚本

```bash
pnpm dev      # 启动开发服务器 (localhost:3000)
pnpm build    # 构建生产版本
pnpm start    # 运行生产服务器
pnpm lint     # 运行 ESLint 代码检查
```

## 🔌 API 端点

### POST /api/agent

处理用户提示词并返回 Agent 的流式响应。

#### 请求体

```json
{
  "prompt": "你的问题或指令",
  "config": {
    "model": "sonnet",
    "cwd": "public/uploads",
    "allowedTools": ["Read", "Glob", "Grep"],
    "systemPrompt": "You are a helpful assistant..."
  }
}
```

#### 响应格式

- **Content-Type**: `application/x-ndjson`
- **格式**: 换行分隔的 JSON 消息流

```json
{"type":"text","content":"思考中..."}
{"type":"tool_use","tool":"Read","parameters":{"file_path":"..."}}
{"type":"text","content":"结果输出"}
```

## 🎨 UI 组件说明

### FileManager（文件管理器）
- **位置**：左侧边栏
- **功能**：拖拽上传、文件列表、删除操作
- **实现**：[app/components/FileManager/](app/components/FileManager/)

### AgentChat（对话界面）
- **位置**：中间主区域
- **功能**：消息列表、输入框、流式渲染
- **实现**：[app/components/AgentChat/](app/components/AgentChat/)

### ConfigPanel（配置面板）
- **位置**：右侧边栏
- **功能**：模型选择、工具配置、系统提示
- **实现**：[app/components/ConfigPanel/](app/components/ConfigPanel/)

## 🔍 开发注意事项

### 必须使用 pnpm
项目配置了特定的 pnpm 依赖结构，使用 npm 或 yarn 可能导致兼容性问题。

### 流式响应处理
- API 路由返回 `Content-Type: application/x-ndjson`，不是标准 JSON
- 前端必须使用 `'use client'` 指令（需要浏览器 API）
- 正确处理 async iterator 和 ReadableStream

### 权限模式
- 在 API 路由中不能使用 `permissionMode: 'ask'`
- 必须使用 `dangerouslySkipPermissions: true` 或其他非交互式模式
- 权限控制应通过 `allowedTools` 实现

### TypeScript 配置
- 路径别名：`@/*` 映射到项目根目录
- 严格模式已启用
- 使用 bundler 模式的模块解析

## 📚 相关资源

- [Claude Agent SDK 文档](https://github.com/anthropics/anthropic-sdk-typescript)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 19 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

在提交代码前，请确保：
1. 运行 `pnpm lint` 检查代码规范
2. 运行 `pnpm build` 确保构建成功
3. 遵循项目现有的代码风格

## 📄 许可证

MIT

---

**开发者**: [Your Name]
**最后更新**: 2025-11-14
