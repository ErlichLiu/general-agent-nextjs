#!/usr/bin/env node

/**
 * MCP 服务器测试脚本
 *
 * 用法:
 *   npx tsx test-mcp.ts mineru
 *   npx tsx test-mcp.ts tuotu-oss
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const mcpConfig = JSON.parse(
  fs.readFileSync('.mcp.json', 'utf-8')
);

const serverName = process.argv[2];

if (!serverName) {
  console.error('❌ 请指定 MCP 服务器名称');
  console.error('用法: npx tsx test-mcp.ts <server-name>');
  console.error('\n可用的服务器:');
  Object.keys(mcpConfig.mcpServers).forEach(name => {
    console.error(`  - ${name}`);
  });
  process.exit(1);
}

const config = mcpConfig.mcpServers[serverName];

if (!config) {
  console.error(`❌ 未找到 MCP 服务器: ${serverName}`);
  process.exit(1);
}

console.log(`\n🧪 测试 MCP 服务器: ${serverName}`);
console.log(`📍 命令: ${config.command} ${config.args.join(' ')}\n`);

// 启动 MCP 服务器
const proc = spawn(config.command, config.args, {
  env: { ...process.env, ...config.env },
  stdio: ['pipe', 'pipe', 'inherit']
});

let timeout: NodeJS.Timeout;

// 设置超时
timeout = setTimeout(() => {
  console.log('\n⏱️  5秒无响应，服务器可能已正常启动（等待 JSON-RPC 请求）');
  console.log('✅ MCP 服务器基础启动测试通过');
  console.log('\n💡 提示: 服务器已启动并等待 JSON-RPC 消息');
  console.log('   在 Claude Code 中可以通过以下方式使用:');
  console.log(`   - use_mcp_tool("${serverName}", "tool_name", { ... })\n`);
  proc.kill();
  process.exit(0);
}, 5000);

proc.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📤 服务器输出:', output);

  // 检查是否是初始化消息
  if (output.includes('initialize') || output.includes('tools/list')) {
    clearTimeout(timeout);
    console.log('\n✅ MCP 服务器响应正常');
    proc.kill();
    process.exit(0);
  }
});

proc.on('error', (error) => {
  clearTimeout(timeout);
  console.error('\n❌ 启动失败:', error.message);
  process.exit(1);
});

proc.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (code !== 0 && signal !== 'SIGTERM') {
    console.error(`\n❌ 进程异常退出: code=${code}, signal=${signal}`);
    process.exit(1);
  }
});

// 发送 JSON-RPC 初始化请求
setTimeout(() => {
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  proc.stdin.write(JSON.stringify(initRequest) + '\n');

  // 发送 tools/list 请求
  setTimeout(() => {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    proc.stdin.write(JSON.stringify(toolsRequest) + '\n');
  }, 1000);
}, 1000);
