'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agent?: 'student' | 'teacher';
  timestamp: Date;
  context?: any;
  actions?: string[];
}

interface ChatInterfaceProps {
  onAgentStatusChange: (statuses: any) => void;
  onStatsUpdate: () => void;
  databaseInitialized: boolean;
}

export default function ChatInterface({ onAgentStatusChange, onStatsUpdate, databaseInitialized }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<'student' | 'teacher' | 'auto'>('auto');
  const [connectionStatus, setConnectionStatus] = useState<'http' | 'websocket' | 'error'>('http');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(Math.random().toString(36).substring(7));
  const wsRef = useRef<WebSocket | null>(null);
  const [wsEnabled, setWsEnabled] = useState(false);

  // Optional WebSocket connection - only try if explicitly enabled
  useEffect(() => {
    // Don't try to connect to WebSocket by default
    // This prevents the error from occurring
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const enableWebSocket = () => {
    if (wsRef.current) return; // Already connected or connecting

    try {
      setConnectionStatus('websocket');
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setWsEnabled(true);
        setConnectionStatus('websocket');
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsEnabled(false);
        setConnectionStatus('http');
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        console.log('WebSocket server not available, using HTTP mode');
        setWsEnabled(false);
        setConnectionStatus('http');
        wsRef.current = null;
        ws.close();
      };

    } catch (error) {
      console.log('WebSocket not supported or server unavailable, using HTTP mode');
      setConnectionStatus('http');
      setWsEnabled(false);
    }
  };

  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'chat_response':
        handleAIResponse(message.data);
        break;
      case 'agent_status_update':
        onAgentStatusChange(message.data);
        break;
      case 'connection':
        console.log('WebSocket connection established:', message.data);
        break;
      case 'error':
        console.error('WebSocket error:', message.data);
        break;
    }
  }

  function handleAIResponse(data: any) {
    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: data.response || data.content,
      agent: data.agentUsed,
      timestamp: new Date(data.timestamp || Date.now()),
      context: data.context,
      actions: data.actions
    };

    setMessages(prev => [...prev, agentMessage]);
    setIsLoading(false);
    onStatsUpdate();
  }

  useEffect(() => {
    const welcomeMessage = databaseInitialized
      ? 'Hello! I\'m your AI assistant powered by Google Gemini. I can help you manage students and teachers using natural language. Try asking me something like "Add a new student" or "Show me all teachers in Computer Science department".'
      : 'Hello! I\'m your AI assistant powered by Google Gemini. Please initialize the database first using the button above, then I can help you manage students and teachers with advanced AI capabilities.';

    setMessages([
      {
        id: '1',
        type: 'agent',
        content: welcomeMessage,
        agent: 'student',
        timestamp: new Date()
      }
    ]);
  }, [databaseInitialized]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendWebSocketMessage = (message: any): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!databaseInitialized) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'agent',
        content: 'Please initialize the database first before I can help you with student and teacher management.',
        agent: 'student',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    // Update agent status
    onAgentStatusChange({
      studentAgent: { status: 'thinking', lastActivity: new Date() },
      teacherAgent: { status: 'thinking', lastActivity: new Date() }
    });

    // Try WebSocket first if enabled and connected
    let wsSuccess = false;
    if (wsEnabled) {
      wsSuccess = sendWebSocketMessage({
        type: 'chat',
        data: {
          message: messageText,
          sessionId: sessionId.current,
          agentType: selectedAgent,
          history: messages.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
            timestamp: m.timestamp
          }))
        }
      });
    }

    // Use HTTP API (primary method)
    if (!wsSuccess) {
      try {
        const response = await fetch('/api/v1/agents/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: sessionId.current,
            agentType: selectedAgent,
            conversationHistory: messages.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content,
              timestamp: m.timestamp
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        handleAIResponse(data);

      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: 'Sorry, I encountered an error. Please try again. If the problem persists, check your internet connection or try refreshing the page.',
          agent: 'student',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'websocket': return 'bg-green-500';
      case 'http': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'websocket': return 'WebSocket';
      case 'http': return 'HTTP API';
      case 'error': return 'Error';
      default: return 'Connecting';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Chat */}
      <div className="xl:col-span-3">
        <div className="glass-card rounded-2xl border-white/20 h-[500px] sm:h-[600px] flex flex-col overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  AI Chat Interface
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                  <span className="text-xs text-white/60 font-semibold">
                    {getConnectionStatusText()}
                  </span>
                  {connectionStatus === 'http' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={enableWebSocket}
                      className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/20 px-2 py-1"
                    >
                      Try WebSocket
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={selectedAgent === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAgent('auto')}
                  className={`${
                    selectedAgent === 'auto' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-0' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  } transition-all duration-300 flex-1 sm:flex-none`}
                >
                  <span className="mr-1">✨</span>
                  Auto
                </Button>
                <Button
                  variant={selectedAgent === 'student' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAgent('student')}
                  className={`${
                    selectedAgent === 'student' 
                      ? 'bg-green-700 hover:bg-green-600 text-white border-0' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  } transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm`}
                >
                  Student
                </Button>
                <Button
                  variant={selectedAgent === 'teacher' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAgent('teacher')}
                  className={`${
                    selectedAgent === 'teacher' 
                      ? 'bg-purple-700 hover:bg-purple-600 text-white border-0' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  } transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm`}
                >
                  Teacher
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col p-4 sm:p-6">
            <ScrollArea className="flex-1 pr-2 sm:pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                        message.type === 'user'
                          ? 'bg-gray-700 text-white shadow-lg'
                          : 'glass-card border-white/20 text-white'
                      } transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.type === 'user' ? (
                          <span className="text-lg">👤</span>
                        ) : (
                          <span className="text-lg">🤖</span>
                        )}
                        <span className="text-xs opacity-75 font-semibold">
                          {message.type === 'user' ? 'You' : `${message.agent} Agent`}
                        </span>
                        {message.agent && (
                          <Badge className={`text-xs ${
                            message.agent === 'student' 
                              ? 'bg-green-500/20 text-green-200 border-green-300/30' 
                              : 'bg-purple-500/20 text-purple-200 border-purple-300/30'
                          }`}>
                            {message.agent}
                          </Badge>
                        )}
                        {message.actions && message.actions.length > 0 && (
                          <Badge className="text-xs bg-blue-500/20 text-blue-200 border-blue-300/30">
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed font-semibold whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-50 mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="glass-card border-white/20 rounded-2xl p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-block animate-spin text-lg">🤔</span>
                        <span className="text-sm text-white font-semibold">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about students or teachers..."
                disabled={isLoading}
                className="glass-card border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="bg-gray-700 hover:bg-gray-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="text-lg">📤</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <div className="xl:col-span-1 space-y-4 sm:space-y-6">
        <div className="glass-card rounded-2xl border-white/20 overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 p-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Quick Actions
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {[
              { text: 'Add a new student with AI guidance', icon: '👨‍🎓' },
              { text: 'Show all teachers in Computer Science', icon: '👩‍🏫' },
              { text: 'Which teacher has the most students?', icon: '📊' },
              { text: 'Create a teacher profile', icon: '➕' },
              { text: 'Get system analytics', icon: '📈' },
              { text: 'Find students by course', icon: '🔍' }
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-sm font-semibold"
                onClick={() => setInput(action.text)}
              >
                <span className="mr-2">{action.icon}</span>
                <span className="truncate">{action.text}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* AI Status */}
        <div className="glass-card rounded-2xl border-white/20 overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 p-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🧠</span>
              AI Status
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Google Gemini</span>
              <Badge className="bg-green-500/20 text-green-200 border-green-300/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Connection</span>
              <Badge className={`${
                connectionStatus === 'websocket'
                  ? 'bg-green-500/20 text-green-200 border-green-300/30' 
                  : connectionStatus === 'http'
                  ? 'bg-blue-500/20 text-blue-200 border-blue-300/30'
                  : 'bg-red-500/20 text-red-200 border-red-300/30'
              }`}>
                {getConnectionStatusText()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Status</span>
              <Badge className="bg-green-500/20 text-green-200 border-green-300/30">
                Ready
              </Badge>
            </div>
            {connectionStatus === 'http' && (
              <div className="text-xs text-white/50 mt-2 p-2 bg-white/5 rounded-lg">
                💡 Using reliable HTTP API. WebSocket is optional for real-time features.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
