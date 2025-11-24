import { query } from '@anthropic-ai/claude-agent-sdk';
import { NextRequest } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { prompt, config } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 创建一个 ReadableStream 用于流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // 构建 Agent SDK 配置，使用传入的 config 或默认值
          // 处理 cwd 路径，移除前导斜杠避免路径错误
          const cwdPath = 'public/uploads'

          const agentOptions: any = {
            model: config?.model || 'sonnet',
            cwd: cwdPath,
            allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash', 'SeaTaskrch','webFetch', 'WebSearch', 'mcp__tuotu-oss__upload_report'],
            // 🔧 在 API 路由中必须使用非交互式权限模式
            // "ask" 模式会导致进程退出，因为无法弹出对话框
            dangerouslySkipPermissions: true,
            // 传递环境变量，支持代理配置
            env: {
              PATH: process.env.PATH,
              ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
              ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
              TUOTU_USERNAME: process.env.TUOTU_USERNAME,
              TUOTU_PASSWORD: process.env.TUOTU_PASSWORD,
              TUOTU_UID: process.env.TUOTU_UID,
              TUOTU_FIELD_NAME: process.env.TUOTU_FIELD_NAME,
              TUOTU_FORM_HEAD_UUID: process.env.TUOTU_FORM_HEAD_UUID,
              TUOTU_API_HOST: process.env.TUOTU_API_HOST,
              TUOTU_API_ORIGIN: process.env.TUOTU_API_ORIGIN,
            },
            // MCP 服务器配置
            mcpServers: {
              'tuotu-oss': {
                command: 'npx',
                args: ['ts-node', path.join(process.cwd(), 'mcp-servers/tuotu-oss/index.ts')],
                env: {
                  TUOTU_USERNAME: process.env.TUOTU_USERNAME,
                  TUOTU_PASSWORD: process.env.TUOTU_PASSWORD,
                  TUOTU_UID: process.env.TUOTU_UID,
                  TUOTU_FIELD_NAME: process.env.TUOTU_FIELD_NAME,
                  TUOTU_FORM_HEAD_UUID: process.env.TUOTU_FORM_HEAD_UUID,
                  TUOTU_API_HOST: process.env.TUOTU_API_HOST,
                  TUOTU_API_ORIGIN: process.env.TUOTU_API_ORIGIN,
                },
              },
            },
          };

          // ⚠️ 忽略用户传入的 permissionMode，因为在 API 路由中不支持交互式权限
          // 如果需要权限控制，应该在 allowedTools 中限制工具列表

          // 只有在明确设置时才添加 systemPrompt
          if (config?.systemPrompt) {
            agentOptions.systemPrompt = config.systemPrompt;
          }

          // 🔍 调试日志：显示 Agent SDK 配置
          console.log('🚀 Starting Agent SDK with config:');
          console.log('Prompt:', prompt);
          console.log('Options:', JSON.stringify(agentOptions, null, 2));
          console.log('CWD exists?', require('fs').existsSync(agentOptions.cwd));
          console.log('ANTHROPIC_API_KEY set?', !!process.env.ANTHROPIC_API_KEY);

          // 调用 Agent SDK
          const result = query({
            prompt,
            options: agentOptions,
          });

          // 流式处理响应
          for await (const message of result) {
            const data = JSON.stringify(message) + '\n';
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        } catch (error) {
          // 🔴 详细错误日志：后端捕获 Agent SDK 错误
          console.error('❌ Agent SDK Error Details:');
          console.error('Error object:', error);
          console.error('Error type:', error?.constructor?.name);
          console.error('Error message:', error instanceof Error ? error.message : String(error));
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

          if (error && typeof error === 'object') {
            console.error('Error properties:', Object.keys(error));
            console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorData = {
            error: errorMessage,
            type: error?.constructor?.name,
            stack: error instanceof Error ? error.stack : undefined,
          };

          controller.enqueue(
            encoder.encode(JSON.stringify(errorData) + '\n')
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    // 🔴 详细错误日志：外层请求错误
    console.error('❌ API Route Error Details:');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
