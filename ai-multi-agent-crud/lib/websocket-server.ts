import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AIAgentService } from './ai-service';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  sessionId: string;
  lastActivity: Date;
}

export class AIWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private aiService: AIAgentService;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.aiService = AIAgentService.getInstance();
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      const sessionId = uuidv4();
      
      const client: ClientConnection = {
        id: clientId,
        ws,
        sessionId,
        lastActivity: new Date()
      };

      this.clients.set(clientId, client);

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connection',
        data: {
          clientId,
          sessionId,
          message: 'Connected to AI Multi-Agent System'
        }
      });

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    console.log(`WebSocket server running on port ${this.wss.options.port}`);
  }

  private async handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (message.type) {
      case 'chat':
        await this.handleChatMessage(client, message.data);
        break;
      case 'agent_status':
        this.broadcastAgentStatus(message.data);
        break;
      case 'ping':
        this.sendMessage(client.ws, { type: 'pong', data: { timestamp: new Date() } });
        break;
      default:
        this.sendError(client.ws, 'Unknown message type');
    }
  }

  private async handleChatMessage(client: ClientConnection, data: any) {
    try {
      // Broadcast typing indicator
      this.broadcastToSession(client.sessionId, {
        type: 'agent_typing',
        data: { agentType: data.agentType || 'auto' }
      });

      // Process with AI service
      const response = await this.aiService.processQuery(data.message, {
        sessionId: client.sessionId,
        agentType: data.agentType || 'auto',
        conversationHistory: data.history || []
      });

      // Send response back to client
      this.sendMessage(client.ws, {
        type: 'chat_response',
        data: {
          ...response,
          timestamp: new Date(),
          sessionId: client.sessionId
        }
      });

      // Broadcast agent status update
      this.broadcastAgentStatus({
        studentAgent: { status: 'idle', lastActivity: new Date() },
        teacherAgent: { status: 'idle', lastActivity: new Date() }
      });

    } catch (error) {
      console.error('Error processing chat message:', error);
      this.sendError(client.ws, 'Failed to process message');
    }
  }

  private broadcastAgentStatus(status: any) {
    const message = {
      type: 'agent_status_update',
      data: status
    };

    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message);
      }
    });
  }

  private broadcastToSession(sessionId: string, message: any) {
    this.clients.forEach(client => {
      if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message);
      }
    });
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { message: error, timestamp: new Date() }
    });
  }

  // Cleanup inactive connections
  public cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastActivity.getTime() > timeout) {
        client.ws.close();
        this.clients.delete(clientId);
      }
    });
  }
}

// Export singleton instance
export const wsServer = new AIWebSocketServer();

// Cleanup inactive connections every 5 minutes
setInterval(() => {
  wsServer.cleanupInactiveConnections();
}, 5 * 60 * 1000);
