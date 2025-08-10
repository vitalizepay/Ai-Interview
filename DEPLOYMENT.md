# Deployment Guide

## Pre-deployment Checklist

### 1. Environment Setup
- [ ] Set up Supabase project
- [ ] Configure Google Cloud Project with Drive API
- [ ] Get OpenAI API key
- [ ] Create service account for Google Drive
- [ ] Set up environment variables

### 2. Database Setup
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Copy content from `supabase/schema.sql`
   - Run in Supabase SQL Editor
   - This creates tables, RLS policies, and triggers

3. **Seed Initial Data**
   - Copy content from `supabase/seed.sql`
   - Run in Supabase SQL Editor
   - This creates sample job roles

4. **Create Admin User**
   - Sign up through your app
   - Manually update the user's role to 'admin' in the profiles table:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

### 3. Google Drive Setup
1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google Drive API

2. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download JSON key file
   - Note the client email

3. **Create Drive Folder**
   - Create a folder in Google Drive for interview videos
   - Share folder with service account email (Editor access)
   - Note the folder ID from URL

4. **Set Environment Variables**
   - `GOOGLE_DRIVE_CLIENT_EMAIL`: Service account email
   - `GOOGLE_DRIVE_PRIVATE_KEY`: Private key from JSON (with \\n for newlines)
   - `GOOGLE_DRIVE_PARENT_FOLDER_ID`: Folder ID from step 3

### 4. Environment Variables
Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Drive
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PARENT_FOLDER_ID=your-folder-id

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Auth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   npm run lint
   ```

2. **Deploy to Vercel**
   - Push code to GitHub
   - Connect repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Update Environment Variables**
   - Update `NEXTAUTH_URL` to your production domain
   - Ensure all other variables are set correctly

### Option 2: Docker Deployment

1. **Create Dockerfile** (already included)
2. **Build Image**
   ```bash
   docker build -t ai-interview-app .
   ```
3. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local ai-interview-app
   ```

### Option 3: Traditional Hosting

1. **Build Application**
   ```bash
   npm run build
   ```
2. **Start Production Server**
   ```bash
   npm start
   ```

## Post-Deployment

### 1. Test Core Features
- [ ] User registration/login
- [ ] Admin role assignment
- [ ] Create job role
- [ ] Start interview
- [ ] Device check works
- [ ] Video recording works
- [ ] File upload to Google Drive
- [ ] AI transcription and scoring

### 2. Configure OAuth (Optional)
- Set up Google OAuth in Google Cloud Console
- Add redirect URIs for your domain
- Update Supabase Auth settings

### 3. Monitor and Maintain
- Set up error monitoring (Sentry, LogRocket, etc.)
- Monitor API usage (OpenAI, Google Drive)
- Regular database backups
- Security updates

## Troubleshooting

### Common Issues

1. **Google Drive Upload Fails**
   - Check service account permissions
   - Verify folder sharing settings
   - Ensure API is enabled

2. **OpenAI API Errors**
   - Check API key validity
   - Monitor usage limits
   - Verify model availability

3. **Database Connection Issues**
   - Check Supabase project status
   - Verify RLS policies
   - Check environment variables

4. **Authentication Problems**
   - Verify Supabase Auth configuration
   - Check NEXTAUTH_SECRET is set
   - Ensure redirect URLs are correct

### Performance Optimization

1. **Database**
   - Monitor query performance
   - Add indexes as needed
   - Optimize RLS policies

2. **File Storage**
   - Monitor Google Drive quota
   - Implement file cleanup policies
   - Consider CDN for video streaming

3. **AI Processing**
   - Monitor OpenAI costs
   - Implement rate limiting
   - Consider background job processing

## Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies tested
- [ ] API endpoints protected
- [ ] File upload validation
- [ ] Input sanitization
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting implemented

## Monitoring

Set up monitoring for:
- Application errors
- API response times
- Database performance
- File upload success rates
- AI processing completion
- User authentication flows

## Support

For issues during deployment:
1. Check the troubleshooting section above
2. Review application logs
3. Test individual components
4. Verify environment configuration
5. Contact development team if needed