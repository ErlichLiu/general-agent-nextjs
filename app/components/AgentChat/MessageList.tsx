'use client';

import { DisplayMessage } from '@/app/types/agent';
import { SDKMessageCard } from './SDKMessageCard';

interface MessageListProps {
  messages: DisplayMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="rounded-lg border border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          输入一个问题来测试 Claude Agent SDK
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          示例：读取 uploads 目录中某个文件的内容
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Agent Response
        </h2>
        {isLoading && (
          <span className="ml-auto text-xs text-zinc-400">
            Processing...
          </span>
        )}
      </div>

      <div className="space-y-3">
        {messages.map((msg, index) => {
          // 错误消息
          if ('error' in msg) {
            return (
              <div
                key={index}
                className="animate-fadeIn rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ Error: {msg.error}
                </p>
              </div>
            );
          }

          // SDK 消息
          return <SDKMessageCard key={index} message={msg} index={index} />;
        })}

        {isLoading && messages.length === 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Initializing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
