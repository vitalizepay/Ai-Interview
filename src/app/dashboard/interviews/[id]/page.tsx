'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Video, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  FileText, 
  BarChart3, 
  User, 
  Calendar,
  ExternalLink,
  Play
} from 'lucide-react'
import { toast } from 'sonner'
import type { Interview, JobRole, Profile } from '@/lib/types/database'

type InterviewWithDetails = Interview & {
  job_roles: JobRole
  profiles: Profile
}

interface TranscriptSegment {
  start: number
  end: number
  text: string
  speaker: string
}

interface Transcript {
  segments: TranscriptSegment[]
  fullText: string
  duration: number
}

interface Scorecard {
  overallScore: number
  individualScores: {
    criteria: string
    score: number
    feedback: string
  }[]
  strengths: string[]
  improvements: string[]
  feedback: string
  recommendation: string
  processedAt: string
}

export default function InterviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string
  const [interview, setInterview] = useState<InterviewWithDetails | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profile)

        // Get interview details
        const response = await fetch(`/api/interview/${interviewId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Interview not found')
            router.push('/dashboard/interviews')
            return
          }
          throw new Error('Failed to load interview')
        }

        const { interview } = await response.json()
        setInterview(interview)
      } catch (error) {
        console.error('Error loading interview:', error)
        toast.error('Failed to load interview')
        router.push('/dashboard/interviews')
      } finally {
        setIsLoading(false)
      }
    }

    if (interviewId) {
      loadInterview()
    }
  }, [interviewId, router, supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'hire':
        return <Badge className="bg-green-100 text-green-800">Recommend Hire</Badge>
      case 'interview_further':
        return <Badge className="bg-yellow-100 text-yellow-800">Interview Further</Badge>
      case 'not_hire':
        return <Badge className="bg-red-100 text-red-800">Not Recommended</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Manual Review</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Interview Not Found</h2>
        <p className="text-gray-600 mt-2">The interview you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/dashboard/interviews')} className="mt-4">
          Back to Interviews
        </Button>
      </div>
    )
  }

  const transcript = interview.transcript as Transcript | null
  const scorecard = interview.ai_scorecard as Scorecard | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/interviews')}
            className="mb-4"
          >
            ← Back to Interviews
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Interview Details</h1>
          <p className="text-gray-600 mt-2">
            {interview.job_roles.title} • {interview.profiles.full_name || 'Anonymous'}
          </p>
        </div>
        {getStatusBadge(interview.status)}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {interview.status.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDuration(interview.duration_sec)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${scorecard ? getScoreColor(scorecard.overallScore) : ''}`}>
              {scorecard ? `${scorecard.overallScore}/100` : 'Processing...'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(interview.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          {interview.video_drive_file_id && (
            <TabsTrigger value="video">Video</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{interview.profiles.full_name || 'Anonymous'}</p>
                </div>
                {interview.profiles.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg">{interview.profiles.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Role Applied</label>
                  <p className="text-lg">{interview.job_roles.title}</p>
                </div>
              </CardContent>
            </Card>

            {/* Interview Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-lg">{new Date(interview.created_at).toLocaleString()}</p>
                </div>
                {interview.started_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Started</label>
                    <p className="text-lg">{new Date(interview.started_at).toLocaleString()}</p>
                  </div>
                )}
                {interview.ended_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed</label>
                    <p className="text-lg">{new Date(interview.ended_at).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                {interview.video_drive_file_id && (
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video
                  </Button>
                )}
                {transcript && (
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Transcript
                  </Button>
                )}
                {scorecard && (
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Interview Transcript
              </CardTitle>
              <CardDescription>
                {transcript ? 'AI-generated transcript from the interview recording' : 'Transcript is being processed...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transcript ? (
                <ScrollArea className="h-[600px] w-full border rounded-lg p-4">
                  <div className="space-y-4">
                    {transcript.segments.map((segment, index) => (
                      <div key={index} className="flex space-x-4">
                        <div className="flex-shrink-0 w-16 text-sm text-gray-500 font-mono">
                          {formatTimestamp(segment.start)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={segment.speaker === 'candidate' ? 'default' : 'secondary'}>
                              {segment.speaker === 'candidate' ? 'Candidate' : 'AI Interviewer'}
                            </Badge>
                          </div>
                          <p className="text-gray-900">{segment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Transcript is being processed...</p>
                  <p className="text-sm mt-2">This usually takes a few minutes after the interview ends.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorecard" className="space-y-6">
          {scorecard ? (
            <>
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Overall Score
                    </span>
                    {getRecommendationBadge(scorecard.recommendation)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-4 ${getScoreColor(scorecard.overallScore)}`}>
                      {scorecard.overallScore}
                    </div>
                    <Progress value={scorecard.overallScore} className="w-full max-w-md mx-auto" />
                    <p className="text-gray-600 mt-4">
                      Processed on {new Date(scorecard.processedAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Scoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {scorecard.individualScores.map((score, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{score.criteria}</h4>
                          <span className={`font-bold ${getScoreColor(score.score)}`}>
                            {score.score}/100
                          </span>
                        </div>
                        <Progress value={score.score} className="w-full" />
                        <p className="text-sm text-gray-600">{score.feedback}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-700">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scorecard.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-700">Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scorecard.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <XCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* AI Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{scorecard.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">AI scoring is in progress...</p>
                <p className="text-sm text-gray-400 mt-2">
                  This usually takes a few minutes after the interview ends.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {interview.video_drive_file_id && (
          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Interview Recording
                </CardTitle>
                <CardDescription>
                  Watch the full interview recording
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">
                    Video playback will be available soon.
                  </p>
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://drive.google.com/file/d/${interview.video_drive_file_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Google Drive
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}