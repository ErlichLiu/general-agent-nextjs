'use client';

import { FileManager } from '@/app/components/FileManager';
import { AgentChat } from '@/app/components/AgentChat';
import { ConfigPanel } from '@/app/components/ConfigPanel';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <FileManager />
      <AgentChat />
      <ConfigPanel />
    </div>
  );
}
