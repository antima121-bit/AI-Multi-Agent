'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Student {
  student_id: number;
  name: string;
  roll_number: string;
  email: string;
  course_name?: string;
  teacher_name?: string;
}

interface Teacher {
  teacher_id: number;
  name: string;
  employee_id: string;
  email: string;
  department: string;
  subject_specialization: string;
  student_count?: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  agent: string;
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, activitiesRes] = await Promise.all([
        fetch('/api/v1/students/list'),
        fetch('/api/v1/teachers/list'),
        fetch('/api/v1/activities/recent')
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentStats = () => {
    const departments = teachers.reduce((acc, teacher) => {
      acc[teacher.department] = (acc[teacher.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(departments).map(([dept, count]) => ({ dept, count }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card rounded-2xl p-8 border-white/20">
          <span className="text-4xl animate-spin inline-block">⏳</span>
          <p className="text-white mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="glass-card border-white/20 hover:border-blue-300/40 transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white/90">Active Students</CardTitle>
            <span className="text-2xl">🎓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white">{students.length}</div>
            <p className="text-xs text-white/60 mt-1">Enrolled across all courses</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 hover:border-green-300/40 transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white/90">Faculty Members</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white">{teachers.length}</div>
            <p className="text-xs text-white/60 mt-1">Active teaching staff</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 hover:border-purple-300/40 transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white/90">Departments</CardTitle>
            <span className="text-2xl">📚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white">{getDepartmentStats().length}</div>
            <p className="text-xs text-white/60 mt-1">Academic departments</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 hover:border-yellow-300/40 transition-all duration-300 hover:scale-105 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white/90">Avg Ratio</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {teachers.length > 0 ? Math.round(students.length / teachers.length) : 0}:1
            </div>
            <p className="text-xs text-white/60 mt-1">Student-teacher ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="glass-card rounded-2xl border-white/20 overflow-hidden">
        <Tabs defaultValue="students" className="w-full">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4 sm:p-6">
            <TabsList className="bg-transparent border-0 p-1">
              <TabsTrigger 
                value="students" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-lg transition-all duration-300 font-bold"
              >
                <span className="mr-2">🎓</span>
                Students
              </TabsTrigger>
              <TabsTrigger 
                value="teachers" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-lg transition-all duration-300 font-bold"
              >
                <span className="mr-2">👥</span>
                Teachers
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-lg transition-all duration-300 font-bold"
              >
                <span className="mr-2">📈</span>
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 border-0 rounded-lg transition-all duration-300 font-bold"
              >
                <span className="mr-2">📚</span>
                Activities
              </TabsTrigger>
            </TabsList>
            <Button 
              onClick={fetchDashboardData} 
              variant="outline" 
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300"
            >
              <span className="mr-2">🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          <TabsContent value="students" className="p-4 sm:p-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-black text-white mb-2">Student Directory</h3>
              <p className="text-white/60">Manage and view all enrolled students</p>
            </div>
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="grid gap-4">
                {students.map((student) => (
                  <div key={student.student_id} className="glass-card border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg">{student.name}</h4>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <span>🎓</span>
                            {student.roll_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📧</span>
                            {student.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        {student.course_name && (
                          <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30">
                            {student.course_name}
                          </Badge>
                        )}
                        {student.teacher_name && (
                          <p className="text-xs text-white/60">
                            Advisor: {student.teacher_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="teachers" className="p-4 sm:p-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-black text-white mb-2">Faculty Directory</h3>
              <p className="text-white/60">View and manage teaching staff</p>
            </div>
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="grid gap-4">
                {teachers.map((teacher) => (
                  <div key={teacher.teacher_id} className="glass-card border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg">{teacher.name}</h4>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <span>👥</span>
                            {teacher.employee_id}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📧</span>
                            {teacher.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <Badge className="bg-green-500/20 text-green-200 border-green-300/30">
                          {teacher.department}
                        </Badge>
                        <p className="text-xs text-white/60">
                          {teacher.subject_specialization}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  Department Distribution
                </h4>
                <div className="space-y-3">
                  {getDepartmentStats().map(({ dept, count }) => (
                    <div key={dept} className="flex items-center justify-between p-3 glass-card border-white/5 rounded-lg">
                      <span className="text-white font-medium">{dept}</span>
                      <Badge className="bg-purple-500/20 text-purple-200 border-purple-300/30">
                        {count} {count === 1 ? 'teacher' : 'teachers'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  System Health
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 glass-card border-white/5 rounded-lg">
                    <span className="text-white font-medium">Database Connection</span>
                    <Badge className="bg-green-500/20 text-green-200 border-green-300/30">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 glass-card border-white/5 rounded-lg">
                    <span className="text-white font-medium">AI Agents</span>
                    <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 glass-card border-white/5 rounded-lg">
                    <span className="text-white font-medium">API Response Time</span>
                    <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-300/30">
                      {'< 200ms'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="p-4 sm:p-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-black text-white mb-2">Recent Activities</h3>
              <p className="text-white/60">Track system interactions and agent activities</p>
            </div>
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="glass-card border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-2 shadow-lg" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{activity.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge className={`text-xs ${
                              activity.agent === 'student' 
                                ? 'bg-blue-500/20 text-blue-200 border-blue-300/30' 
                                : 'bg-green-500/20 text-green-200 border-green-300/30'
                            }`}>
                              {activity.agent} Agent
                            </Badge>
                            <span className="text-xs text-white/60 flex items-center gap-1">
                              <span>📅</span>
                              {activity.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card border-white/10 rounded-xl p-8 text-center">
                    <span className="text-6xl mb-4 block">📚</span>
                    <p className="text-white/60">No recent activities to display</p>
                    <p className="text-white/40 text-sm mt-2">Start chatting with the AI agents to see activities here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
