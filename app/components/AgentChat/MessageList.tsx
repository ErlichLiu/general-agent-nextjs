'use client';

import { useEffect, useRef } from 'react';
import { DisplayMessage } from '@/app/types/agent';
import { SDKMessageCard } from './SDKMessageCard';

interface MessageListProps {
  messages: DisplayMessage[];
  isLoading: boolean;
}

// 辅助函数：判断消息是否为执行步骤
function isStepMessage(msg: DisplayMessage): boolean {
  if ('error' in msg) return true; // 错误消息归类为步骤

  // 步骤消息：assistant（所有 Main/Sub Agent）、system、status
  return (
    msg.type === 'assistant' ||
    msg.type === 'system' ||
    msg.type === 'status' ||
    msg.type === 'user'
  );
}

// 辅助函数：判断消息是否为最终结果（仅 success 类型的 result）
function isFinalResultMessage(msg: DisplayMessage): boolean {
  if ('error' in msg) return false;
  return msg.type === 'result' && msg.subtype === 'success';
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const stepsRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollTop = stepsRef.current.scrollHeight;
    }
  }, [messages]);

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

  // 分离步骤消息和最终结果
  const stepMessages = messages.filter(isStepMessage);
  const finalResults = messages.filter(isFinalResultMessage);

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

      {/* 步骤区域 - 固定高度可滚动 */}
      {stepMessages.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-500">
              Execution Steps
            </h3>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div
            ref={stepsRef}
            className="relative max-h-[400px] overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="space-y-3">
              {stepMessages.map((msg, index) => {
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

                // SDK 步骤消息
                return <SDKMessageCard key={index} message={msg} index={index} />;
              })}

              {isLoading && stepMessages.length === 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Initializing...
                  </span>
                </div>
              )}
            </div>

            {/* 底部渐变遮罩 - 提示可滚动 */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-50/80 to-transparent dark:from-zinc-900/80" />
          </div>
        </div>
      )}

      {/* 最终结果区域 */}
      {finalResults.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-500">
              Final Result
            </h3>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="space-y-3">
            {finalResults.map((msg, index) => (
              <SDKMessageCard key={index} message={msg} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
