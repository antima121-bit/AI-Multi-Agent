'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChatInterface from '@/components/chat-interface';
import Dashboard from '@/components/dashboard';
import AgentStatus from '@/components/agent-status';

export default function Home() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalConversations: 0,
    activeAgents: 2,
    needsInitialization: false
  });

  const [agentStatuses, setAgentStatuses] = useState({
    studentAgent: { status: 'idle', lastActivity: null },
    teacherAgent: { status: 'idle', lastActivity: null }
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats(prev => ({ ...prev, needsInitialization: true }));
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setInitError('');
    
    try {
      const response = await fetch('/api/v1/init-database', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchStats();
        setStats(prev => ({ ...prev, needsInitialization: false }));
      } else {
        const error = await response.json();
        setInitError(error.details || 'Failed to initialize database');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setInitError('Failed to initialize database');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-12 text-center">
            <div className="floating-animation">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl">
                AI Multi-Agent 
                <span className="block text-gradient">CRUD System</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-bold">
                Intelligent student and teacher management through natural language powered by advanced AI agents
              </p>
            </div>
            
            {/* Feature Icons */}
            <div className="flex justify-center items-center gap-4 sm:gap-8 mt-8">
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-2xl">🧠</span>
                <span className="text-sm sm:text-base font-bold">AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-2xl">⚡</span>
                <span className="text-sm sm:text-base font-bold">Real-time</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-2xl">✨</span>
                <span className="text-sm sm:text-base font-bold">Intelligent</span>
              </div>
            </div>
          </div>

          {/* Database Initialization Alert */}
          {stats.needsInitialization && (
            <div className="mb-6 sm:mb-8">
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🗄️</span>
                    <span className="text-white font-medium">Database tables need to be initialized with sample data.</span>
                  </div>
                  <Button 
                    onClick={initializeDatabase} 
                    disabled={isInitializing}
                    className="professional-gradient text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                  >
                    {isInitializing ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Initializing...
                      </>
                    ) : (
                      'Initialize Database'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {initError && (
            <div className="mb-6 sm:mb-8">
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-red-300/30 bg-red-500/10">
                <p className="text-red-200">{initError}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white/90">Students</CardTitle>
                <span className="text-2xl">🎓</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalStudents}</div>
                <p className="text-xs text-white/70 mt-1">Total enrolled</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white/90">Teachers</CardTitle>
                <span className="text-2xl">👥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalTeachers}</div>
                <p className="text-xs text-white/70 mt-1">Faculty members</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white/90">Conversations</CardTitle>
                <span className="text-2xl">💬</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalConversations}</div>
                <p className="text-xs text-white/70 mt-1">AI interactions</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-white/90">AI Agents</CardTitle>
                <span className="text-2xl">🤖</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.activeAgents}</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30 text-xs">Student</Badge>
                  <Badge className="bg-green-500/20 text-green-200 border-green-300/30 text-xs">Teacher</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Status */}
          <div className="mb-8 sm:mb-12">
            <AgentStatus 
              studentAgent={agentStatuses.studentAgent}
              teacherAgent={agentStatuses.teacherAgent}
            />
          </div>

          {/* Main Content */}
          <div className="glass-card rounded-3xl border-white/20 overflow-hidden">
            <Tabs defaultValue="chat" className="w-full">
              <div className="border-b border-white/10 bg-white/5">
                <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 p-2">
                  <TabsTrigger 
                    value="chat" 
                    className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-xl transition-all duration-300"
                  >
                    <span className="mr-2">💬</span>
                    <span className="hidden sm:inline">AI Chat Interface</span>
                    <span className="sm:hidden">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dashboard" 
                    className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-xl transition-all duration-300"
                  >
                    <span className="mr-2">📊</span>
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">Stats</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="p-4 sm:p-6 lg:p-8 space-y-4">
                <ChatInterface 
                  onAgentStatusChange={setAgentStatuses}
                  onStatsUpdate={fetchStats}
                  databaseInitialized={!stats.needsInitialization}
                />
              </TabsContent>

              <TabsContent value="dashboard" className="p-4 sm:p-6 lg:p-8 space-y-4">
                <Dashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
