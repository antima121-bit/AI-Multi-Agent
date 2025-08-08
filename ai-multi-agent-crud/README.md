# AI Multi-Agent CRUD System

A sophisticated educational management system powered by Google Gemini AI with intelligent agent routing and professional UI.

## Features

- 🧠 **Google Gemini AI Integration** - Advanced natural language processing
- 🤖 **Multi-Agent System** - Specialized student and teacher management agents
- 📊 **Professional Dashboard** - Analytics and monitoring
- 🎨 **Modern UI** - Glassmorphism design with responsive layout
- 🗄️ **PostgreSQL Database** - Robust data management with Neon
- ⚡ **HTTP API** - Fast and reliable communication
- 🔌 **Optional WebSocket** - Real-time features when available

## Quick Start

### 1. Environment Setup

\`\`\`bash
# Copy environment template
cp .env.example .env.local

# Add your configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
DATABASE_URL=your_neon_database_url
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Run the Application

\`\`\`bash
npm run dev
\`\`\`

### 4. Access the Application

- **Web Interface**: http://localhost:3000

## Architecture

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with glassmorphism effects
- **AI**: Google Gemini via AI SDK
- **Database**: PostgreSQL via Neon
- **Communication**: HTTP API (WebSocket optional)
- **State Management**: React hooks and context

## Usage

1. **Initialize Database** - Click the initialization button on first run
2. **Chat with AI** - Use natural language to manage students and teachers
3. **View Dashboard** - Monitor system statistics and recent activities
4. **Optional WebSocket** - Click "Try WebSocket" for real-time features

## Example Queries

- "Add a new student named John Doe"
- "Show all teachers in Computer Science department"
- "Which teacher has the most students?"
- "Create a teacher profile for Dr. Smith"
- "Get system analytics"

## Connection Modes

- **HTTP API** (Default): Reliable, fast, works everywhere
- **WebSocket** (Optional): Real-time updates, requires separate server

## Troubleshooting

- **Database Errors**: Ensure your Neon database URL is correct and accessible
- **AI Responses**: Verify your Google AI API key is valid and has sufficient quota
- **WebSocket**: Optional feature - app works perfectly with HTTP API only

## Environment Variables

\`\`\`env
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
DATABASE_URL=your_neon_database_url

# Optional
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
