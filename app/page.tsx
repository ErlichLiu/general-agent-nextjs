'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setMessages([]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to call agent');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            setMessages(prev => [...prev, JSON.stringify(message, null, 2)]);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <main className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-black dark:text-white">
          Claude Agent SDK Test
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入你的问题，例如：列出当前目录的所有文件"
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-400 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? '处理中...' : '发送'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {messages.length > 0 && (
            <div className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Agent 响应流
              </h2>
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className="rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-black"
                  >
                    <pre className="overflow-x-auto text-sm text-zinc-800 dark:text-zinc-300">
                      {msg}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.length === 0 && !isLoading && (
            <div className="rounded-lg border border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                输入一个问题来测试 Claude Agent SDK
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                示例：列出当前目录的所有 TypeScript 文件
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
