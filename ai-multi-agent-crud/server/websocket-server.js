const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

class AIWebSocketServer {
  constructor(port = 8080) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Map();
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      const sessionId = uuidv4();
      
      const client = {
        id: clientId,
        ws,
        sessionId,
        lastActivity: new Date()
      };

      this.clients.set(clientId, client);
      console.log(`Client ${clientId} connected`);

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
      ws.on('message', async (data) => {
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

  async handleMessage(clientId, message) {
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

  async handleChatMessage(client, data) {
    try {
      // Broadcast typing indicator
      this.broadcastToSession(client.sessionId, {
        type: 'agent_typing',
        data: { agentType: data.agentType || 'auto' }
      });

      // Make HTTP request to our API instead of direct AI processing
      const response = await fetch('http://localhost:3000/api/v1/agents/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: data.message,
          sessionId: client.sessionId,
          agentType: data.agentType || 'auto',
          conversationHistory: data.history || []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.json();

      // Send response back to client
      this.sendMessage(client.ws, {
        type: 'chat_response',
        data: {
          ...aiResponse,
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

  broadcastAgentStatus(status) {
    const message = {
      type: 'agent_status_update',
      data: status
    };

    this.clients.forEach(client => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        this.sendMessage(client.ws, message);
      }
    });
  }

  broadcastToSession(sessionId, message) {
    this.clients.forEach(client => {
      if (client.sessionId === sessionId && client.ws.readyState === 1) {
        this.sendMessage(client.ws, message);
      }
    });
  }

  sendMessage(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendMessage(ws, {
      type: 'error',
      data: { message: error, timestamp: new Date() }
    });
  }

  cleanupInactiveConnections() {
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

// Start the server
const wsServer = new AIWebSocketServer(8080);

// Cleanup inactive connections every 5 minutes
setInterval(() => {
  wsServer.cleanupInactiveConnections();
}, 5 * 60 * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  process.exit(0);
});
