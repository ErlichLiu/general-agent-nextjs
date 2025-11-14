import type { AgentQueryRequest } from '@/app/types/agent';

/**
 * Agent 服务 API 封装
 */
export const agentService = {
  /**
   * 查询 Agent（流式响应）
   * @param request - 查询请求参数
   * @returns ReadableStream 用于处理流式数据
   */
  async queryAgent(request: AgentQueryRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to call agent');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    return reader;
  },
};
