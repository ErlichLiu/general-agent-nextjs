'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ContentBlock } from '@/app/types/agent';

interface MessageItemProps {
  content: ContentBlock;
  index: number;
}

export function MessageItem({ content }: MessageItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 文本消息
  if (content.type === 'text') {
    return (
      <div className="animate-fadeIn rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.text}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // 工具调用
  if (content.type === 'tool_use') {
    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {content.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    #{content.id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tool invocation
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                {isExpanded ? '▼' : '▶'}
              </div>
            </div>
            {isExpanded && (
              <div className="mt-2 rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
                <pre className="overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(content.input, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  // 工具结果
  if (content.type === 'tool_result') {
    const isError = content.is_error;
    const resultText = typeof content.content === 'string'
      ? content.content
      : JSON.stringify(content.content, null, 2);

    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {isError ? 'Error' : 'Result'}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    #{content.tool_use_id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isError ? 'Failed' : 'Completed'}
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                {isExpanded ? '▼' : '▶'}
              </div>
            </div>
            {isExpanded && (
              <div className="mt-2 rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
                <pre className="overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
                  {resultText.length > 1000
                    ? resultText.slice(0, 1000) + '\n... (truncated)'
                    : resultText}
                </pre>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  return null;
}
