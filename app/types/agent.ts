/**
 * Agent SDK 消息类型定义
 * 基于 @anthropic-ai/claude-agent-sdk 的 SDKMessage 类型
 */

// Anthropic API 内容块类型
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<{ type: string; [key: string]: unknown }>;
  is_error?: boolean;
}

export type ContentBlock = TextContent | ToolUseContent | ToolResultContent;

// SDK 消息类型定义
export interface SDKAssistantMessage {
  type: 'assistant';
  message: {
    id: string;
    role: 'assistant';
    content: ContentBlock[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
}

export interface SDKUserMessage {
  type: 'user';
  content: Array<{ type: string; [key: string]: unknown }>;
  uuid?: string;
  session_id: string;
}

export interface SDKResultMessage {
  type: 'result';
  subtype: 'success' | 'error';
  duration_ms: number;
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
  result?: unknown;
}

export interface SDKStatusMessage {
  type: 'status';
  status: 'compacting' | null;
  session_id: string;
}

export interface SDKPartialAssistantMessage {
  type: 'partial_assistant';
  event: {
    type: string;
    [key: string]: unknown;
  };
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
}

export interface SDKSystemMessage {
  type: 'system';
  subtype: string;
  cwd?: string;
  session_id: string;
  tools?: string[];
  mcp_servers?: unknown[];
  model?: string;
  permissionMode?: string;
  slash_commands?: string[];
  apiKeySource?: string;
  claude_code_version?: string;
  output_style?: string;
  agents?: string[];
  skills?: unknown[];
  plugins?: unknown[];
  uuid: string;
  [key: string]: unknown;
}

export type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKResultMessage
  | SDKStatusMessage
  | SDKPartialAssistantMessage
  | SDKSystemMessage;

/**
 * Agent 请求参数
 */
export interface AgentQueryRequest {
  /** 用户提示词 */
  prompt: string;
  /** Agent 配置（可选） */
  config?: {
    model?: string;
    cwd?: string;
    allowedTools?: string[];
    permissionMode?: string;
    systemPrompt?: string;
  };
}

/**
 * Agent 响应（流式）
 */
export interface AgentStreamResponse {
  /** 是否完成 */
  done: boolean;
  /** 消息数据 */
  value?: Uint8Array;
}

// 用于 UI 展示的统一消息类型
export type DisplayMessage = SDKMessage | { error: string };
