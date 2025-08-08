#!/usr/bin/env tsx

import { wsServer } from '../lib/websocket-server';
import { mcpServer } from '../lib/mcp-server';

console.log('🚀 Starting AI Multi-Agent CRUD System servers...');

// The servers are already initialized when imported
console.log('✅ WebSocket server started');
console.log('✅ MCP server started');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});

console.log('🎯 All servers are running. Press Ctrl+C to stop.');
