import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { AIAgentService } from '@/lib/ai-service';

// We'll handle WebSocket upgrade in a different way for Next.js
export async function GET(request: NextRequest) {
  return new Response('WebSocket endpoint - use upgrade connection', {
    status: 426,
    headers: {
      'Upgrade': 'websocket',
    },
  });
}
