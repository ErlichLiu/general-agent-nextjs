export type ModelType = 'sonnet' | 'opus' | 'haiku';
export type PermissionMode = 'ask' | 'acceptEdits' | 'acceptAll';

export interface AgentConfig {
  model: ModelType;
  cwd: string;
  allowedTools: string[];
  permissionMode?: PermissionMode;
  systemPrompt?: string;
}

export const DEFAULT_CONFIG: AgentConfig = {
  model: 'sonnet',
  cwd: 'public/uploads',
  allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash'],
  permissionMode: undefined,
  systemPrompt: undefined,
};

export const AVAILABLE_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'Write',
  'Edit',
  'Bash',
  'Task',
  'WebFetch',
  'WebSearch',
] as const;

export const MODEL_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  { value: 'sonnet', label: 'Sonnet', description: 'Balanced performance and speed' },
  { value: 'opus', label: 'Opus', description: 'Most capable, slower' },
  { value: 'haiku', label: 'Haiku', description: 'Fastest, lighter tasks' },
];

export const PERMISSION_OPTIONS: { value: PermissionMode | 'none'; label: string; description: string }[] = [
  { value: 'ask', label: 'Ask', description: 'Prompt before each action' },
  { value: 'acceptEdits', label: 'Accept Edits', description: 'Auto-approve file edits' },
  { value: 'acceptAll', label: 'Accept All', description: 'Auto-approve all actions' },
  { value: 'none', label: 'None', description: 'No permission mode' },
];
