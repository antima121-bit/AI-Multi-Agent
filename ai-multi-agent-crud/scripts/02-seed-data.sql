-- Seed data for AI Multi-Agent CRUD System

-- Insert sample teachers
INSERT INTO teachers (name, employee_id, email, phone_number, department, subject_specialization, hire_date) VALUES
('Dr. Sarah Johnson', 'EMP001', 'sarah.johnson@university.edu', '+1-555-0101', 'Computer Science', 'Artificial Intelligence', '2020-01-15'),
('Prof. Michael Chen', 'EMP002', 'michael.chen@university.edu', '+1-555-0102', 'Mathematics', 'Statistics', '2018-08-20'),
('Dr. Emily Rodriguez', 'EMP003', 'emily.rodriguez@university.edu', '+1-555-0103', 'Computer Science', 'Database Systems', '2019-03-10'),
('Prof. David Wilson', 'EMP004', 'david.wilson@university.edu', '+1-555-0104', 'Physics', 'Quantum Computing', '2017-09-05'),
('Dr. Lisa Thompson', 'EMP005', 'lisa.thompson@university.edu', '+1-555-0105', 'Mathematics', 'Linear Algebra', '2021-02-01');

-- Insert sample courses
INSERT INTO courses (course_name, course_code, credits, teacher_id) VALUES
('Introduction to AI', 'CS401', 4, 1),
('Database Management Systems', 'CS301', 3, 3),
('Statistics for Data Science', 'MATH201', 3, 2),
('Quantum Computing Basics', 'PHYS501', 4, 4),
('Linear Algebra', 'MATH101', 3, 5),
('Machine Learning', 'CS402', 4, 1),
('Advanced Databases', 'CS501', 3, 3);

-- Insert sample students
INSERT INTO students (name, roll_number, email, phone_number, date_of_birth, course_id, teacher_id) VALUES
('John Doe', 'STU2024001', 'john.doe@student.edu', '+1-555-1001', '2002-05-15', 1, 1),
('Jane Smith', 'STU2024002', 'jane.smith@student.edu', '+1-555-1002', '2001-12-08', 2, 3),
('Alex Johnson', 'STU2024003', 'alex.johnson@student.edu', '+1-555-1003', '2002-03-22', 3, 2),
('Maria Garcia', 'STU2024004', 'maria.garcia@student.edu', '+1-555-1004', '2001-09-14', 1, 1),
('Robert Brown', 'STU2024005', 'robert.brown@student.edu', '+1-555-1005', '2002-07-30', 4, 4),
('Emma Wilson', 'STU2024006', 'emma.wilson@student.edu', '+1-555-1006', '2001-11-18', 5, 5),
('James Davis', 'STU2024007', 'james.davis@student.edu', '+1-555-1007', '2002-01-25', 6, 1),
('Sophie Miller', 'STU2024008', 'sophie.miller@student.edu', '+1-555-1008', '2001-08-12', 2, 3);
