import { useState } from 'react';

interface ChatInputProps {
  isLoading: boolean;
  onSubmit: (prompt: string) => void;
}

export function ChatInput({ isLoading, onSubmit }: ChatInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的问题，例如：列出 uploads 目录的所有文件"
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
  );
}
