import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function GET() {
  try {
    // Check if teachers table exists
    const tableExists = await checkTableExists('teachers');
    
    if (!tableExists) {
      return NextResponse.json({
        error: 'Teachers table does not exist. Please initialize the database first.',
        needsInitialization: true
      }, { status: 404 });
    }

    const teachers = await sql`
      SELECT 
        t.*,
        COUNT(s.student_id) as student_count
      FROM teachers t
      LEFT JOIN students s ON t.teacher_id = s.teacher_id
      GROUP BY t.teacher_id
      ORDER BY t.created_at DESC
    `;

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers', needsInitialization: true },
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
