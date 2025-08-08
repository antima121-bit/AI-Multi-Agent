import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { AIAgentService } from '@/lib/ai-service';

const sql = neon(process.env.DATABASE_URL || '');

export async function POST(request: Request) {
  try {
    const { message, sessionId, agentType, conversationHistory = [] } = await request.json();

    // Get AI service instance
    const aiService = AIAgentService.getInstance();
    
    // Process the query with real AI
    const response = await aiService.processQuery(message, {
      sessionId,
      agentType: agentType === 'auto' ? 'student' : agentType,
      conversationHistory
    });
    
    // Log the conversation to database
    try {
      await sql`
        INSERT INTO conversations (session_id, agent_type, message, response, context)
        VALUES (${sessionId}, ${response.agentUsed}, ${message}, ${response.content}, ${JSON.stringify(response.context)})
      `;
    } catch (dbError) {
      console.error('Error logging conversation:', dbError);
      // Continue even if logging fails
    }

    return NextResponse.json({
      response: response.content,
      agentUsed: response.agentUsed,
      context: response.context,
      actions: response.actions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
