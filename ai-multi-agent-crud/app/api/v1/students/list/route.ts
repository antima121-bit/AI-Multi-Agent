import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function GET() {
  try {
    // Check if students table exists
    const tableExists = await checkTableExists('students');
    
    if (!tableExists) {
      return NextResponse.json({
        error: 'Students table does not exist. Please initialize the database first.',
        needsInitialization: true
      }, { status: 404 });
    }

    const students = await sql`
      SELECT 
        s.*,
        c.course_name,
        t.name as teacher_name
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
      ORDER BY s.created_at DESC
    `;

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students', needsInitialization: true },
      { status: 500 }
    );
  }
}

async function checkTableExists(tableName: string) {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    `;
    return result.length > 0;
  } catch (error) {
    return false;
  }
}
