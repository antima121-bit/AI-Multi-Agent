import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function GET() {
  try {
    // Check if conversations table exists
    const tableExists = await checkTableExists('conversations');
    
    if (!tableExists) {
      return NextResponse.json([]);
    }

    const activities = await sql`
      SELECT 
        conversation_id as id,
        'query' as type,
        CONCAT('User asked: ', LEFT(message, 50), '...') as description,
        created_at as timestamp,
        agent_type as agent
      FROM conversations
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json(activities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    })));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json([]);
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
