# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 应用，集成 Claude Agent SDK 进行测试和演示。该项目通过流式 API 实现与 Claude Agent 的实时交互。

## 包管理器

**必须使用 pnpm**，不要使用 npm 或 yarn：

```bash
pnpm dev              # 开发服务器
pnpm build            # 生产构建
pnpm add <package>    # 添加依赖
```

## 环境变量

`.env.local` 中需要配置：
- `ANTHROPIC_API_KEY`: Anthropic API 密钥（格式：`cr_...`）

## 核心架构

### Agent SDK 集成模式

**后端流式处理** ([app/api/agent/route.ts](app/api/agent/route.ts)):
```typescript
// 使用 ReadableStream 实现流式响应
const result = query({
  prompt,
  options: {
    model: 'sonnet',
    cwd: process.cwd(),
    allowedTools: ['Read', 'Glob', 'Grep'],  // 当前仅只读工具
  },
});

// 通过 NDJSON 格式逐行返回
for await (const message of result) {
  const data = JSON.stringify(message) + '\n';
  controller.enqueue(encoder.encode(data));
}
```

**前端流式消费** ([app/page.tsx](app/page.tsx)):
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
    // 处理消息...
  }
}
```

### 关键设计决策

1. **服务端限制**：Agent SDK 必须在 API 路由中运行，不能在客户端组件中使用
2. **工具权限**：默认配置为只读模式（Read/Glob/Grep），需要写入权限时修改 `allowedTools` 数组
3. **流式协议**：使用 NDJSON (Newline Delimited JSON) 格式，每行一个完整的 JSON 对象
4. **工作目录**：Agent 的操作范围限定在 `process.cwd()`（项目根目录）

## 修改 Agent 行为

在 [app/api/agent/route.ts:22-30](app/api/agent/route.ts#L22-L30) 修改 `query()` 的 `options`：

- **添加工具**：`allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit']`
- **更换模型**：`model: 'opus'` 或 `'haiku'`
- **权限模式**：添加 `permissionMode: 'acceptEdits'` 等选项
- **系统提示**：添加 `systemPrompt` 自定义 Agent 行为

## TypeScript 配置

- 路径别名：`@/*` 映射到项目根目录
- Target: ES2017
- Module resolution: bundler (Next.js 特定)
- 严格模式已启用

## 开发注意事项

- API 路由返回 `Content-Type: application/x-ndjson`，不是标准 JSON
- 前端必须使用 `'use client'` 指令（需要浏览器 API）
- 当前配置防止文件修改，测试写入操作前需解除工具限制
- Agent 响应是异步流式的，需要正确处理 async iterator
