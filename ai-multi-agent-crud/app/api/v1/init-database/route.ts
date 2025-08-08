import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function POST() {
  try {
    // Create tables
    await createTables();
    
    // Insert seed data
    await insertSeedData();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully with sample data' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}

async function createTables() {
  // Create Teachers table first (referenced by Students)
  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
        teacher_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        department VARCHAR(100),
        subject_specialization VARCHAR(100),
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create Courses table
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
        course_id SERIAL PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 3,
        teacher_id INTEGER REFERENCES teachers(teacher_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create Students table
  await sql`
    CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        date_of_birth DATE,
        enrollment_date DATE DEFAULT CURRENT_DATE,
        course_id INTEGER REFERENCES courses(course_id),
        teacher_id INTEGER REFERENCES teachers(teacher_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create Conversations table for agent communication logs
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
        conversation_id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        agent_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        response TEXT,
        context JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_teachers_employee_id ON teachers(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id)`;
}

async function insertSeedData() {
  // Insert sample teachers
  await sql`
    INSERT INTO teachers (name, employee_id, email, phone_number, department, subject_specialization, hire_date) VALUES
    ('Dr. Sarah Johnson', 'EMP001', 'sarah.johnson@university.edu', '+1-555-0101', 'Computer Science', 'Artificial Intelligence', '2020-01-15'),
    ('Prof. Michael Chen', 'EMP002', 'michael.chen@university.edu', '+1-555-0102', 'Mathematics', 'Statistics', '2018-08-20'),
    ('Dr. Emily Rodriguez', 'EMP003', 'emily.rodriguez@university.edu', '+1-555-0103', 'Computer Science', 'Database Systems', '2019-03-10'),
    ('Prof. David Wilson', 'EMP004', 'david.wilson@university.edu', '+1-555-0104', 'Physics', 'Quantum Computing', '2017-09-05'),
    ('Dr. Lisa Thompson', 'EMP005', 'lisa.thompson@university.edu', '+1-555-0105', 'Mathematics', 'Linear Algebra', '2021-02-01')
    ON CONFLICT (employee_id) DO NOTHING
  `;

  // Insert sample courses
  await sql`
    INSERT INTO courses (course_name, course_code, credits, teacher_id) VALUES
    ('Introduction to AI', 'CS401', 4, 1),
    ('Database Management Systems', 'CS301', 3, 3),
    ('Statistics for Data Science', 'MATH201', 3, 2),
    ('Quantum Computing Basics', 'PHYS501', 4, 4),
    ('Linear Algebra', 'MATH101', 3, 5),
    ('Machine Learning', 'CS402', 4, 1),
    ('Advanced Databases', 'CS501', 3, 3)
    ON CONFLICT (course_code) DO NOTHING
  `;

  // Insert sample students
  await sql`
    INSERT INTO students (name, roll_number, email, phone_number, date_of_birth, course_id, teacher_id) VALUES
    ('John Doe', 'STU2024001', 'john.doe@student.edu', '+1-555-1001', '2002-05-15', 1, 1),
    ('Jane Smith', 'STU2024002', 'jane.smith@student.edu', '+1-555-1002', '2001-12-08', 2, 3),
    ('Alex Johnson', 'STU2024003', 'alex.johnson@student.edu', '+1-555-1003', '2002-03-22', 3, 2),
    ('Maria Garcia', 'STU2024004', 'maria.garcia@student.edu', '+1-555-1004', '2001-09-14', 1, 1),
    ('Robert Brown', 'STU2024005', 'robert.brown@student.edu', '+1-555-1005', '2002-07-30', 4, 4),
    ('Emma Wilson', 'STU2024006', 'emma.wilson@student.edu', '+1-555-1006', '2001-11-18', 5, 5),
    ('James Davis', 'STU2024007', 'james.davis@student.edu', '+1-555-1007', '2002-01-25', 6, 1),
    ('Sophie Miller', 'STU2024008', 'sophie.miller@student.edu', '+1-555-1008', '2001-08-12', 2, 3)
    ON CONFLICT (roll_number) DO NOTHING
  `;
}
