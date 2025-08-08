import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// Initialize Google Gemini model
const geminiModel = google('gemini-1.5-pro-latest');

export interface AIContext {
  sessionId: string;
  agentType: 'student' | 'teacher';
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  databaseContext?: any;
}

export class AIAgentService {
  private static instance: AIAgentService;
  
  static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  async processQuery(message: string, context: AIContext): Promise<{
    content: string;
    agentUsed: string;
    context: any;
    actions?: string[];
  }> {
    try {
      // Determine the best agent for this query
      const agentType = await this.determineAgent(message, context.agentType);
      
      // Get relevant database context
      const dbContext = await this.getDatabaseContext(message, agentType);
      
      // Build the system prompt based on agent type
      const systemPrompt = this.buildSystemPrompt(agentType, dbContext);
      
      // Build conversation history for context
      const conversationHistory = context.conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate response using Gemini
      const { text } = await generateText({
        model: geminiModel,
        system: systemPrompt,
        prompt: `
Previous conversation:
${conversationHistory}

Current user message: ${message}

Please provide a helpful response as the ${agentType} management agent. If the user is asking to perform CRUD operations, provide specific guidance or execute the operation if possible.
        `,
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Extract potential actions from the response
      const actions = this.extractActions(text, agentType);

      // Execute any database operations if needed
      const executionResult = await this.executeActions(actions, message, agentType);

      return {
        content: executionResult.response || text,
        agentUsed: agentType,
        context: {
          queryType: this.classifyQuery(message),
          agent: agentType,
          dbContext,
          actionsExecuted: executionResult.actionsExecuted
        },
        actions
      };
    } catch (error) {
      console.error('Error in AI processing:', error);
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
        agentUsed: context.agentType,
        context: { error: true, agent: context.agentType }
      };
    }
  }

  async streamQuery(message: string, context: AIContext) {
    const agentType = await this.determineAgent(message, context.agentType);
    const dbContext = await this.getDatabaseContext(message, agentType);
    const systemPrompt = this.buildSystemPrompt(agentType, dbContext);

    return streamText({
      model: geminiModel,
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  private async determineAgent(message: string, preferredAgent: string): Promise<'student' | 'teacher'> {
    if (preferredAgent !== 'auto') {
      return preferredAgent as 'student' | 'teacher';
    }

    try {
      const { text } = await generateText({
        model: geminiModel,
        system: `You are an AI router that determines which agent should handle a query.
        
        Respond with ONLY "student" or "teacher" based on the query content.
        
        Student agent handles: student records, enrollment, grades, student information, roll numbers, student courses
        Teacher agent handles: teacher records, faculty information, employee IDs, departments, course assignments, teacher specializations`,
        prompt: `Classify this query: "${message}"`,
        temperature: 0.1,
        maxTokens: 10,
      });

      return text.toLowerCase().includes('teacher') ? 'teacher' : 'student';
    } catch (error) {
      // Fallback to keyword-based detection
      const lowerMessage = message.toLowerCase();
      const studentKeywords = ['student', 'enroll', 'grade', 'course', 'roll number', 'admission'];
      const teacherKeywords = ['teacher', 'faculty', 'professor', 'department', 'subject', 'employee'];

      const studentScore = studentKeywords.reduce((score, keyword) => 
        lowerMessage.includes(keyword) ? score + 1 : score, 0);
      const teacherScore = teacherKeywords.reduce((score, keyword) => 
        lowerMessage.includes(keyword) ? score + 1 : score, 0);

      return studentScore >= teacherScore ? 'student' : 'teacher';
    }
  }

  private async getDatabaseContext(message: string, agentType: string): Promise<any> {
    try {
      if (agentType === 'student') {
        const [students, courses] = await Promise.all([
          sql`SELECT COUNT(*) as count FROM students`,
          sql`SELECT course_name, course_code FROM courses LIMIT 5`
        ]);
        return { studentCount: students[0].count, availableCourses: courses };
      } else {
        const [teachers, departments] = await Promise.all([
          sql`SELECT COUNT(*) as count FROM teachers`,
          sql`SELECT DISTINCT department FROM teachers LIMIT 5`
        ]);
        return { teacherCount: teachers[0].count, departments: departments.map(d => d.department) };
      }
    } catch (error) {
      return {};
    }
  }

  private buildSystemPrompt(agentType: string, dbContext: any): string {
    const basePrompt = `You are an intelligent ${agentType} management agent in an educational institution's CRUD system.`;
    
    if (agentType === 'student') {
      return `${basePrompt}

Your responsibilities:
- Manage student records (Create, Read, Update, Delete)
- Handle student enrollment and course assignments
- Provide information about students, courses, and academic records
- Assist with student-related queries and operations

Current system context:
- Total students in system: ${dbContext.studentCount || 0}
- Available courses: ${dbContext.availableCourses?.map(c => c.course_name).join(', ') || 'None'}

Guidelines:
- Be helpful and professional
- Provide specific guidance for CRUD operations
- Ask for required information when needed
- Confirm actions before executing them
- Use natural, conversational language`;
    } else {
      return `${basePrompt}

Your responsibilities:
- Manage teacher/faculty records (Create, Read, Update, Delete)
- Handle department assignments and specializations
- Provide information about teachers, departments, and faculty data
- Assist with teacher-related queries and operations

Current system context:
- Total teachers in system: ${dbContext.teacherCount || 0}
- Departments: ${dbContext.departments?.join(', ') || 'None'}

Guidelines:
- Be helpful and professional
- Provide specific guidance for CRUD operations
- Ask for required information when needed
- Confirm actions before executing them
- Use natural, conversational language`;
    }
  }

  private classifyQuery(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('add') || lowerMessage.includes('create')) return 'create';
    if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('get')) return 'read';
    if (lowerMessage.includes('update') || lowerMessage.includes('modify')) return 'update';
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) return 'delete';
    if (lowerMessage.includes('statistics') || lowerMessage.includes('count')) return 'analytics';
    
    return 'general';
  }

  private extractActions(response: string, agentType: string): string[] {
    const actions = [];
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('create') || lowerResponse.includes('add')) {
      actions.push(`create_${agentType}`);
    }
    if (lowerResponse.includes('update') || lowerResponse.includes('modify')) {
      actions.push(`update_${agentType}`);
    }
    if (lowerResponse.includes('delete') || lowerResponse.includes('remove')) {
      actions.push(`delete_${agentType}`);
    }
    
    return actions;
  }

  private async executeActions(actions: string[], message: string, agentType: string): Promise<{
    response?: string;
    actionsExecuted: string[];
  }> {
    const executedActions = [];
    
    // This is where you would implement actual database operations
    // For now, we'll return guidance for the user
    
    if (actions.includes(`create_${agentType}`)) {
      executedActions.push('create_guidance');
      return {
        response: this.getCreateGuidance(agentType),
        actionsExecuted: executedActions
      };
    }
    
    return { actionsExecuted: [] };
  }

  private getCreateGuidance(agentType: string): string {
    if (agentType === 'student') {
      return `To create a new student record, I need the following information:

📝 **Required Information:**
• Student name
• Roll number (must be unique)
• Email address
• Course to enroll in

📋 **Optional Information:**
• Phone number
• Date of birth
• Advisor teacher

**Example:** "Add student John Smith with roll number STU2024009, email john.smith@student.edu, enrolled in Computer Science course"

Would you like to provide this information now?`;
    } else {
      return `To create a new teacher record, I need the following information:

📝 **Required Information:**
• Teacher name
• Employee ID (must be unique)
• Email address
• Department
• Subject specialization

📋 **Optional Information:**
• Phone number
• Hire date

**Example:** "Add teacher Dr. Jane Wilson with employee ID EMP006, email jane.wilson@university.edu, department Mathematics, specialization Statistics"

Would you like to provide this information now?`;
    }
  }
}
