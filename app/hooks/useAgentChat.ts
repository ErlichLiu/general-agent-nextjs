import { useState } from 'react';
import { agentService } from '@/app/services/agentService';
import { DisplayMessage } from '@/app/types/agent';
import { AgentConfig } from '@/app/types/config';

/**
 * Agent 聊天功能的自定义 Hook
 */
export function useAgentChat(config: AgentConfig) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 发送查询
  const sendQuery = async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setMessages([]);

    try {
      const reader = await agentService.queryAgent({
        prompt,
        config: {
          model: config.model,
          cwd: config.cwd,
          allowedTools: config.allowedTools,
          permissionMode: config.permissionMode,
          systemPrompt: config.systemPrompt,
        },
      });
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const message = JSON.parse(line) as DisplayMessage;

            // 📊 详细日志：查看消息结构
            console.group('🔍 Agent Message Received');
            console.log('Raw message:', message);
            console.log('Message type:', (message as any).type);
            console.log('Message role:', (message as any).role);
            console.log('Message content:', (message as any).content);
            console.log('Full structure:', JSON.stringify(message, null, 2));
            console.groupEnd();

            setMessages(prev => [...prev, message]);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { error: error instanceof Error ? error.message : 'Unknown error' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空消息
  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendQuery,
    clearMessages,
  };
}
