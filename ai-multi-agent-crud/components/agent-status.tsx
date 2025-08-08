'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentStatusProps {
  studentAgent: {
    status: 'idle' | 'thinking' | 'communicating';
    lastActivity: Date | null;
  };
  teacherAgent: {
    status: 'idle' | 'thinking' | 'communicating';
    lastActivity: Date | null;
  };
}

export default function AgentStatus({ studentAgent, teacherAgent }: AgentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-green-400 shadow-green-400/50';
      case 'thinking':
        return 'bg-yellow-400 animate-pulse shadow-yellow-400/50';
      case 'communicating':
        return 'bg-blue-400 animate-pulse shadow-blue-400/50';
      default:
        return 'bg-gray-400 shadow-gray-400/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'thinking':
        return 'Processing';
      case 'communicating':
        return 'Communicating';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="glass-card border-white/20 hover:border-blue-300/40 transition-all duration-300 hover:scale-[1.02] group">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg text-white font-black">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:from-blue-400 group-hover:to-cyan-400 transition-all duration-300">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <span className="block">Student Management Agent</span>
              <span className="text-sm text-white/60 font-bold">Handles student operations</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-lg ${getStatusColor(studentAgent.status)}`} />
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30 font-bold">
                {getStatusText(studentAgent.status)}
              </Badge>
            </div>
            {studentAgent.lastActivity && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-sm">🕐</span>
                {studentAgent.lastActivity.toLocaleTimeString()}
              </div>
            )}
          </div>
          <p className="text-sm text-white/70 leading-relaxed font-bold">
            Manages student CRUD operations, enrollment records, and academic data with intelligent context understanding.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/20 hover:border-green-300/40 transition-all duration-300 hover:scale-[1.02] group">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg text-white font-black">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-green-400 group-hover:to-emerald-400 transition-all duration-300">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <span className="block">Teacher Management Agent</span>
              <span className="text-sm text-white/60 font-bold">Manages faculty operations</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-lg ${getStatusColor(teacherAgent.status)}`} />
              <Badge className="bg-green-500/20 text-green-200 border-green-300/30 font-bold">
                {getStatusText(teacherAgent.status)}
              </Badge>
            </div>
            {teacherAgent.lastActivity && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-sm">🕐</span>
                {teacherAgent.lastActivity.toLocaleTimeString()}
              </div>
            )}
          </div>
          <p className="text-sm text-white/70 leading-relaxed font-bold">
            Handles teacher profiles, course assignments, department management, and faculty-related queries with AI precision.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
