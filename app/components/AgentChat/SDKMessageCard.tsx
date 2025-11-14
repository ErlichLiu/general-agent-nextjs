'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SDKMessage, SDKAssistantMessage, SDKResultMessage } from '@/app/types/agent';
import { MessageItem } from './MessageItem';

interface SDKMessageCardProps {
  message: SDKMessage;
  index: number;
}

export function SDKMessageCard({ message }: SDKMessageCardProps) {
  // Assistant 消息 - 显示 Claude 的回复和工具调用
  if (message.type === 'assistant') {
    const assistantMsg = message as SDKAssistantMessage;
    const isSubAgent = message.parent_tool_use_id !== null;

    return (
      <div className="animate-fadeIn space-y-2">
        {/* 标题：显示是主 Agent 还是子 Agent */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {isSubAgent ? 'Sub-Agent' : 'Main Agent'}
          </span>
          {isSubAgent && (
            <span className="text-zinc-500 dark:text-zinc-500">
              Tool: {message.parent_tool_use_id?.slice(0, 8)}
            </span>
          )}
        </div>

        {/* 渲染内容块 */}
        <div className="space-y-2">
          {assistantMsg.message.content.map((block, blockIndex) => (
            <MessageItem key={blockIndex} content={block} index={blockIndex} />
          ))}
        </div>
      </div>
    );
  }

  // User 消息 - 显示用户输入 (通常是工具调用结果)
  if (message.type === 'user') {
    // 如果内容为空数组，不渲染
    if (!message.message?.content || message.message.content.length === 0) {
      return null;
    }

    return (
      <div className="animate-fadeIn rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Tool Result
        </div>
        <pre className="overflow-x-auto break-all whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
          {JSON.stringify(message.message.content, null, 2)}
        </pre>
      </div>
    );
  }

  // Result 消息 - 显示最终结果
  if (message.type === 'result') {
    const resultMsg = message as SDKResultMessage;
    const isSuccess = resultMsg.subtype === 'success';

    // 成功时显示完整结果（包括统计信息和 Markdown 内容）
    if (isSuccess) {
      return (
        <div className="animate-fadeIn space-y-3">
          {/* 统计信息标签 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-green-100 px-2 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              ✓ Completed in {resultMsg.duration_ms}ms
            </span>
            {resultMsg.num_turns !== undefined && (
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {resultMsg.num_turns} {resultMsg.num_turns === 1 ? 'turn' : 'turns'}
              </span>
            )}
            {resultMsg.usage && (
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {resultMsg.usage.input_tokens + resultMsg.usage.output_tokens} tokens
              </span>
            )}
            {resultMsg.total_cost_usd !== undefined && (
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                ${resultMsg.total_cost_usd.toFixed(4)}
              </span>
            )}
          </div>

          {/* Markdown 渲染的最终结果 */}
          {resultMsg.result && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resultMsg.result}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 失败时显示完整错误信息
    return (
      <div className="animate-fadeIn rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-red-900 dark:text-red-100">
            Execution Failed: {resultMsg.subtype}
          </span>
          <span className="text-xs text-red-600 dark:text-red-400">
            {resultMsg.duration_ms}ms
          </span>
        </div>
        {resultMsg.result !== undefined && (
          <pre className="overflow-x-auto break-all whitespace-pre-wrap text-xs text-red-800 dark:text-red-200">
            {typeof resultMsg.result === 'string'
              ? resultMsg.result
              : JSON.stringify(resultMsg.result, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // Status 消息
  if (message.type === 'status') {
    return (
      <div className="animate-fadeIn flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
        Status: {message.status || 'idle'}
      </div>
    );
  }

  // System 消息 - 初始化信息
  if (message.type === 'system') {
    // 提取目录的最后两层
    const getShortPath = (fullPath: string) => {
      const parts = fullPath.split('/').filter(Boolean);
      return parts.slice(-2).join('/');
    };

    return (
      <div className="animate-fadeIn rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          System: {message.subtype}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {message.model && (
            <span className="rounded-md bg-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {message.model}
            </span>
          )}
          {message.cwd && (
            <span className="rounded-md bg-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {getShortPath(message.cwd)}
            </span>
          )}
          {message.tools && message.tools.length > 0 && (
            <>
              {message.tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tool}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // Partial Assistant 消息 - 流式更新
  if (message.type === 'partial_assistant') {
    return (
      <div className="animate-fadeIn rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
          Streaming: {message.event.type}
        </div>
        <pre className="overflow-x-auto break-all whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {JSON.stringify(message.event, null, 2)}
        </pre>
      </div>
    );
  }

  // 其他未知类型
  return (
    <div className="animate-fadeIn rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
        Unknown message type: {(message as any).type}
      </div>
      <pre className="overflow-x-auto break-all whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
        {JSON.stringify(message, null, 2)}
      </pre>
    </div>
  );
}
