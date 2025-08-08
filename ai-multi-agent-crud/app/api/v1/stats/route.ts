import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function GET() {
  try {
    // Check if tables exist first
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist.students || !tablesExist.teachers || !tablesExist.conversations) {
      return NextResponse.json({
        totalStudents: 0,
        totalTeachers: 0,
        totalConversations: 0,
        activeAgents: 2,
        needsInitialization: true,
        missingTables: {
          students: !tablesExist.students,
          teachers: !tablesExist.teachers,
          conversations: !tablesExist.conversations
        }
      });
    }

    const [studentsResult, teachersResult, conversationsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM students`,
      sql`SELECT COUNT(*) as count FROM teachers`,
      sql`SELECT COUNT(*) as count FROM conversations`
    ]);

    const stats = {
      totalStudents: parseInt(studentsResult[0].count),
      totalTeachers: parseInt(teachersResult[0].count),
      totalConversations: parseInt(conversationsResult[0].count),
      activeAgents: 2,
      needsInitialization: false
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      totalStudents: 0,
      totalTeachers: 0,
      totalConversations: 0,
      activeAgents: 2,
      needsInitialization: true,
      error: 'Failed to fetch stats'
    });
  }
}

async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('students', 'teachers', 'conversations', 'courses')
    `;
    
    const existingTables = result.map(row => row.table_name);
    
    return {
      students: existingTables.includes('students'),
      teachers: existingTables.includes('teachers'),
      conversations: existingTables.includes('conversations'),
      courses: existingTables.includes('courses')
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      students: false,
      teachers: false,
      conversations: false,
      courses: false
    };
  }
}
