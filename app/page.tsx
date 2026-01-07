'use client';

import { AgentChat } from '@/app/components/AgentChat';
import { ConfigPanel } from '@/app/components/ConfigPanel';
import { FilePanel } from '@/app/components/FilePanel';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <FilePanel />
      <AgentChat />
      <ConfigPanel />
    </div>
  );
}
