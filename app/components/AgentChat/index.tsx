import { useAgentChat } from '@/app/hooks/useAgentChat';
import { useAgentConfig } from '@/app/hooks/useAgentConfig';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

export function AgentChat() {
  const { config } = useAgentConfig();
  const { messages, isLoading, sendQuery } = useAgentChat(config);

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <h1 className="mb-8 text-3xl font-bold text-black dark:text-white">
        Claude Agent SDK Test
      </h1>

      <ChatInput isLoading={isLoading} onSubmit={sendQuery} />

      <div className="space-y-4">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
    </main>
  );
}
