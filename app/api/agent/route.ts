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
          const agentOptions: any = {
            model: config?.model || 'sonnet',
            cwd: config?.cwd
              ? path.join(process.cwd(), config.cwd)
              : path.join(process.cwd(), 'public', 'uploads'),
            allowedTools: config?.allowedTools || ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash'],
          };

          // 只有在明确设置时才添加 permissionMode
          if (config?.permissionMode) {
            agentOptions.permissionMode = config.permissionMode;
          }

          // 只有在明确设置时才添加 systemPrompt
          if (config?.systemPrompt) {
            agentOptions.systemPrompt = config.systemPrompt;
          }

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
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: errorMessage }) + '\n')
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
