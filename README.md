# AI Interview Web App

A production-ready AI-powered interview platform built with Next.js, Supabase, and OpenAI. This application enables automated candidate screening through AI-led video interviews with automatic transcription and scoring.

## 🚀 Features

### Core Functionality
- **AI-Led Interviews**: Intelligent conversational interviews with dynamic follow-up questions
- **Video Recording**: In-browser recording with secure cloud storage via Google Drive
- **Automatic Transcription**: OpenAI Whisper integration for speech-to-text conversion
- **AI Scoring**: Automated candidate evaluation using configurable scoring rubrics
- **Role Management**: Admin interface for creating and managing interview roles
- **Real-time Dashboards**: Comprehensive analytics for both candidates and administrators

### Technical Features
- **Authentication**: Supabase Auth with Email OTP and Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **File Storage**: Google Drive API with resumable uploads
- **Responsive Design**: Mobile and desktop optimized UI
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: shadcn/ui components with TailwindCSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Google Drive API
- **AI Services**: OpenAI (Whisper + GPT-4)
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this application, ensure you have:

1. Node.js 18+ installed
2. A Supabase project
3. A Google Cloud Project with Drive API enabled
4. An OpenAI API account
5. Environment variables configured (see setup below)

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd ai-interview-app
npm install
\`\`\`

### 2. Environment Setup

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_EMAIL=your_service_account_email
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PARENT_FOLDER_ID=your_parent_folder_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 3. Database Setup

Run the database schema and seed data:

\`\`\`bash
# Copy the SQL from supabase/schema.sql and run it in your Supabase SQL editor
# Then copy and run supabase/seed.sql for sample data
\`\`\`

### 4. Google Drive Setup

1. Create a Google Cloud Project
2. Enable the Google Drive API
3. Create a Service Account
4. Download the service account JSON key
5. Share your target Google Drive folder with the service account email
6. Add the credentials to your environment variables

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

The application uses three main tables:

### profiles
- User profiles with role-based access (candidate/admin)
- Links to Supabase Auth users

### job_roles
- Interview role definitions
- JSON configuration for questions, scoring rubrics, and interview flow
- Admin-manageable through the web interface

### interviews
- Interview sessions and their metadata
- Links to users and job roles
- Stores video file IDs, transcripts, and AI scorecards

## 🎯 User Roles

### Candidates
- Start AI interviews for available roles
- View their interview history and results
- Access transcripts and scorecards
- Download interview recordings

### Administrators
- Manage job roles and interview configurations
- View all interviews across the platform
- Access detailed analytics and reports
- Export data to CSV
- Watch interview recordings

## 🔧 Configuration

### Interview Role Configuration

Job roles are configured via JSON objects with the following structure:

\`\`\`json
{
  "language": "en",
  "intro": "Welcome message...",
  "openingQuestions": ["Question 1", "Question 2"],
  "questionBank": [
    {
      "category": "Experience",
      "questions": ["Tell me about...", "Describe a time..."]
    }
  ],
  "followupPolicy": {
    "maxFollowups": 2,
    "triggerConditions": ["Answer too brief", "Needs clarification"]
  },
  "scoringRubric": [
    {
      "criteria": "Communication Skills",
      "weight": 25,
      "description": "Clarity and effectiveness of communication"
    }
  ],
  "wrapUpPrompt": "Thank you message...",
  "duration": 1200
}
\`\`\`

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your production environment:
- Update \`NEXTAUTH_URL\` to your production domain
- Use production Supabase credentials
- Configure Google Drive API for production use
- Set up proper OpenAI API limits

## 📁 Project Structure

\`\`\`
ai-interview-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── interview/         # Interview flow pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── interview/        # Interview-specific components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Supabase client configuration
│   │   └── types/            # TypeScript type definitions
│   └── middleware.ts         # Next.js middleware
├── supabase/                 # Database schema and seeds
└── public/                   # Static assets
\`\`\`

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Candidate and admin role separation
- **Encrypted Storage**: Secure file storage in Google Drive
- **HTTPS Only**: Secure data transmission
- **Input Validation**: Server-side validation for all inputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the documentation above
2. Review the issues on GitHub
3. Contact the development team

## 🔄 Updates and Maintenance

- Regular dependency updates
- Security patches
- Feature enhancements based on user feedback
- Performance optimizations

---

Built with ❤️ using Next.js, Supabase, and OpenAI