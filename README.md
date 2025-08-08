<div align="center">
  <h1>🤖 AI Multi-Agent CRUD System 🤖</h1>
</div>

<p align="center">
  An intelligent multi-agent system that performs CRUD operations on a mock database through natural language chat interfaces.
</p>

---

## 🚀 Project Overview

This project involves building an intelligent multi-agent system that can perform **Create, Read, Update, and Delete (CRUD)** operations on a mock database through natural language chat interfaces. The system will feature two specialized AI agents that communicate with each other and learn from interactions to provide contextual assistance.

---

## 🎯 Project Objectives

The primary goals of this project are to:
* Evaluate a candidate's ability to integrate multiple technologies.
* Assess the understanding of AI agent architecture and communication.
* Test database design and CRUD operation implementation.
* Measure proficiency in full-stack development.
* Evaluate natural language processing integration skills.

---

## 🛠️ Tech Stack & Requirements

### Core Technologies
<table>
  <tr>
    <td valign="top" width="50%">
      <strong>Frontend:</strong>
      <ul>
        <li>React.js with functional components and hooks</li>
        <li>Tailwind CSS for styling</li>
        <li>Real-time chat interface</li>
        <li>Agent status indicators</li>
      </ul>
    </td>
    <td valign="top" width="50%">
      <strong>Backend:</strong>
      <ul>
        <li>Node.js with Express.js <strong>OR</strong> Python with FastAPI/Flask</li>
        <li>RESTful API endpoints</li>
        <li>WebSocket support for real-time communication</li>
        <li>MCP (Model Context Protocol) server implementation</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <strong>Database:</strong>
      <ul>
        <li>PostgreSQL (preferred)</li>
        <li>Proper normalization and relationships</li>
        <li>Mock data generation scripts</li>
      </ul>
    </td>
    <td valign="top" width="50%">
      <strong>AI/ML Integration:</strong>
      <ul>
        <li>Google Gemini API for language model</li>
        <li>Context management system</li>
        <li>Agent-to-agent communication protocols</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛️ System Architecture

### Agent Structure
The system is composed of two primary agents:

* **Agent 1: Student Management Agent**
    * Handles all student-related CRUD operations.
    * Manages student profiles, enrollment, and grades.
    * Communicates with the Teacher Agent for related queries.

* **Agent 2: Teacher Management Agent**
    * Handles all teacher-related CRUD operations.
    * Manages teacher profiles, subjects, and assignments.
    * Communicates with the Student Agent for related queries.

---

## 🗄️ Database Schema

### Tables
**Students Table:**
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `student_id` | SERIAL | **Primary Key** |
| `name` | VARCHAR(255) | **Required** |
| `roll_number` | VARCHAR(50) | **Unique, Required** |
| `email` | VARCHAR(255) | |
| `phone_number`| VARCHAR(20) | |
| `date_of_birth`| DATE | |
| `enrollment_date`| DATE | |
| `course_id` | INTEGER | Foreign Key |
| `teacher_id` | INTEGER | Foreign Key (Advisor) |
| `created_at` | TIMESTAMP | Default NOW() |
| `updated_at` | TIMESTAMP | Default NOW() |

**Teachers Table:**
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `teacher_id` | SERIAL | **Primary Key** |
| `name` | VARCHAR(255) | **Required** |
| `employee_id` | VARCHAR(50) | **Unique, Required** |
| `email` | VARCHAR(255) | |
| `phone_number`| VARCHAR(20) | |
| `department` | VARCHAR(100) | |
| `subject_specialization`| VARCHAR(100)| |
| `hire_date` | DATE | |
| `created_at` | TIMESTAMP | Default NOW() |
| `updated_at` | TIMESTAMP | Default NOW() |

### Relationships
* A teacher can advise multiple students.
* A teacher can teach multiple courses.
* Students are enrolled in courses taught by teachers.

---

## 🧠 Agent Intelligence Requirements

### Context Understanding
The agents must intelligently parse natural language inputs. For example:
> **User:** "Add student with name John Doe"
>
> **Agent:** "What's John's roll number?"
>
> **User:** "12345"
>
> **Agent:** "Which course should John be enrolled in?"

### Inter-Agent Communication
Agents should communicate when queries span both domains.
> **User:** "Which teacher has the most students?"
>
> **System:** *Student Agent communicates with Teacher Agent to resolve the query.*

### Learning System
* Agents should remember user preferences and learn common query patterns.
* Suggest related actions based on context and maintain conversation history.

---

## 💻 UI/UX Requirements

### Chat Interface
* Clean, modern design using **Tailwind CSS**.
* Separate chat windows for each agent.
* Agent status indicators (e.g., active, thinking, communicating).
* Message timestamps and sender identification.

### Dashboard Features
* Quick stats (total students, teachers, etc.).
* Recent activities feed.
* Agent performance metrics and database connection status.

### Responsive Design
* Mobile-first approach, optimized for tablets and desktops.
* Adherence to accessible design principles.

---


