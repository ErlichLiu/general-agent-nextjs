import { query } from '@anthropic-ai/claude-agent-sdk';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

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
          // 调用 Agent SDK
          const result = query({
            prompt,
            options: {
              model: 'sonnet',
              cwd: process.cwd(),
              // 限制可用工具，只允许读取文件，避免意外修改
              allowedTools: ['Read', 'Glob', 'Grep'],
            },
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
