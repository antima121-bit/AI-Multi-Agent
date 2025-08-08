import { WebSocketServer, WebSocket } from 'ws';
import { AIAgentService } from './ai-service';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

interface MCPMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export class MCPServer {
  private wss: WebSocketServer;
  private aiService: AIAgentService;
  private tools: Map<string, MCPTool> = new Map();

  constructor(port: number = 8081) {
    this.wss = new WebSocketServer({ port });
    this.aiService = AIAgentService.getInstance();
    this.initializeTools();
    this.setupMCPServer();
  }

  private initializeTools() {
    // Student management tools
    this.tools.set('create_student', {
      name: 'create_student',
      description: 'Create a new student record',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Student full name' },
          roll_number: { type: 'string', description: 'Unique roll number' },
          email: { type: 'string', description: 'Student email address' },
          phone_number: { type: 'string', description: 'Phone number (optional)' },
          date_of_birth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
          course_id: { type: 'number', description: 'Course ID to enroll in' },
          teacher_id: { type: 'number', description: 'Advisor teacher ID (optional)' }
        },
        required: ['name', 'roll_number', 'email']
      }
    });

    this.tools.set('get_students', {
      name: 'get_students',
      description: 'Retrieve student records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of records' },
          course_id: { type: 'number', description: 'Filter by course ID' },
          teacher_id: { type: 'number', description: 'Filter by advisor teacher ID' }
        }
      }
    });

    // Teacher management tools
    this.tools.set('create_teacher', {
      name: 'create_teacher',
      description: 'Create a new teacher record',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Teacher full name' },
          employee_id: { type: 'string', description: 'Unique employee ID' },
          email: { type: 'string', description: 'Teacher email address' },
          phone_number: { type: 'string', description: 'Phone number (optional)' },
          department: { type: 'string', description: 'Department name' },
          subject_specialization: { type: 'string', description: 'Subject specialization' },
          hire_date: { type: 'string', description: 'Hire date (YYYY-MM-DD)' }
        },
        required: ['name', 'employee_id', 'email', 'department', 'subject_specialization']
      }
    });

    this.tools.set('get_teachers', {
      name: 'get_teachers',
      description: 'Retrieve teacher records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of records' },
          department: { type: 'string', description: 'Filter by department' }
        }
      }
    });

    // Analytics tools
    this.tools.set('get_analytics', {
      name: 'get_analytics',
      description: 'Get system analytics and statistics',
      inputSchema: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['overview', 'departments', 'courses', 'student_teacher_ratio'],
            description: 'Type of analytics to retrieve'
          }
        }
      }
    });
  }

  private setupMCPServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('MCP client connected');

      ws.on('message', async (data: Buffer) => {
        try {
          const message: MCPMessage = JSON.parse(data.toString());
          const response = await this.handleMCPMessage(message);
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error('MCP message error:', error);
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error'
            }
          }));
        }
      });

      ws.on('close', () => {
        console.log('MCP client disconnected');
      });

      // Send initialization message
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialized',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: true
            }
          },
          serverInfo: {
            name: 'AI Multi-Agent CRUD Server',
            version: '1.0.0'
          }
        }
      }));
    });

    console.log(`MCP server running on port ${this.wss.options.port}`);
  }

  private async handleMCPMessage(message: MCPMessage): Promise<MCPMessage> {
    switch (message.method) {
      case 'tools/list':
        return this.handleToolsList(message);
      
      case 'tools/call':
        return await this.handleToolCall(message);
      
      case 'ping':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: { status: 'pong' }
        };
      
      default:
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
    }
  }

  private handleToolsList(message: MCPMessage): MCPMessage {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: Array.from(this.tools.values())
      }
    };
  }

  private async handleToolCall(message: MCPMessage): Promise<MCPMessage> {
    try {
      const { name, arguments: args } = message.params;
      const result = await this.executeTool(name, args);
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'create_student':
        return await this.createStudent(args);
      
      case 'get_students':
        return await this.getStudents(args);
      
      case 'create_teacher':
        return await this.createTeacher(args);
      
      case 'get_teachers':
        return await this.getTeachers(args);
      
      case 'get_analytics':
        return await this.getAnalytics(args);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async createStudent(args: any): Promise<any> {
    const result = await sql`
      INSERT INTO students (name, roll_number, email, phone_number, date_of_birth, course_id, teacher_id)
      VALUES (${args.name}, ${args.roll_number}, ${args.email}, ${args.phone_number || null}, 
              ${args.date_of_birth || null}, ${args.course_id || null}, ${args.teacher_id || null})
      RETURNING *
    `;
    return { success: true, student: result[0] };
  }

  private async getStudents(args: any): Promise<any> {
    let query = sql`
      SELECT s.*, c.course_name, t.name as teacher_name
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
    `;

    if (args.course_id) {
      query = sql`${query} WHERE s.course_id = ${args.course_id}`;
    }
    if (args.teacher_id) {
      query = sql`${query} WHERE s.teacher_id = ${args.teacher_id}`;
    }

    query = sql`${query} ORDER BY s.created_at DESC`;
    
    if (args.limit) {
      query = sql`${query} LIMIT ${args.limit}`;
    }

    const students = await query;
    return { students, count: students.length };
  }

  private async createTeacher(args: any): Promise<any> {
    const result = await sql`
      INSERT INTO teachers (name, employee_id, email, phone_number, department, subject_specialization, hire_date)
      VALUES (${args.name}, ${args.employee_id}, ${args.email}, ${args.phone_number || null},
              ${args.department}, ${args.subject_specialization}, ${args.hire_date || null})
      RETURNING *
    `;
    return { success: true, teacher: result[0] };
  }

  private async getTeachers(args: any): Promise<any> {
    let query = sql`
      SELECT t.*, COUNT(s.student_id) as student_count
      FROM teachers t
      LEFT JOIN students s ON t.teacher_id = s.teacher_id
    `;

    if (args.department) {
      query = sql`${query} WHERE t.department = ${args.department}`;
    }

    query = sql`${query} GROUP BY t.teacher_id ORDER BY t.created_at DESC`;
    
    if (args.limit) {
      query = sql`${query} LIMIT ${args.limit}`;
    }

    const teachers = await query;
    return { teachers, count: teachers.length };
  }

  private async getAnalytics(args: any): Promise<any> {
    switch (args.type) {
      case 'overview':
        const [students, teachers, conversations] = await Promise.all([
          sql`SELECT COUNT(*) as count FROM students`,
          sql`SELECT COUNT(*) as count FROM teachers`,
          sql`SELECT COUNT(*) as count FROM conversations`
        ]);
        return {
          totalStudents: parseInt(students[0].count),
          totalTeachers: parseInt(teachers[0].count),
          totalConversations: parseInt(conversations[0].count)
        };
      
      case 'departments':
        const departments = await sql`
          SELECT department, COUNT(*) as teacher_count
          FROM teachers
          GROUP BY department
          ORDER BY teacher_count DESC
        `;
        return { departments };
      
      case 'student_teacher_ratio':
        const ratios = await sql`
          SELECT t.name, t.department, COUNT(s.student_id) as student_count
          FROM teachers t
          LEFT JOIN students s ON t.teacher_id = s.teacher_id
          GROUP BY t.teacher_id, t.name, t.department
          ORDER BY student_count DESC
        `;
        return { ratios };
      
      default:
        throw new Error(`Unknown analytics type: ${args.type}`);
    }
  }
}

// Export singleton instance
export const mcpServer = new MCPServer();
