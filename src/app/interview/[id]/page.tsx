'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useResumableUpload } from '@/hooks/useResumableUpload'
import { DeviceCheck } from '@/components/interview/DeviceCheck'
import { ConsentModal } from '@/components/interview/ConsentModal'
import { InterviewRecording } from '@/components/interview/InterviewRecording'
import { toast } from 'sonner'
import type { Interview, JobRole, JobRoleConfig } from '@/lib/types/database'

type InterviewWithRole = Interview & {
  job_roles: JobRole
}

export default function InterviewPage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string
  const supabase = createClient()

  const [interview, setInterview] = useState<InterviewWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<'device-check' | 'consent' | 'interview' | 'completed'>('device-check')
  const [deviceCheckPassed, setDeviceCheckPassed] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  const {
    isRecording,
    isUploading,
    uploadProgress,
    error: uploadError,
    startRecording,
    stopRecording,
    resetUpload,
  } = useResumableUpload({
    interviewId,
    onUploadComplete: (fileId) => {
      toast.success('Interview completed successfully!')
      setCurrentStep('completed')
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
    },
  })

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const response = await fetch(`/api/interview/${interviewId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Interview not found')
            router.push('/dashboard')
            return
          }
          throw new Error('Failed to load interview')
        }

        const { interview } = await response.json()
        setInterview(interview)

        // If interview is already completed, show completed state
        if (interview.status === 'completed') {
          setCurrentStep('completed')
        }
      } catch (error) {
        console.error('Error loading interview:', error)
        toast.error('Failed to load interview')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    if (interviewId) {
      loadInterview()
    }
  }, [interviewId, router])

  const handleDeviceCheckComplete = () => {
    setDeviceCheckPassed(true)
    setCurrentStep('consent')
  }

  const handleConsentGiven = () => {
    setConsentGiven(true)
    setCurrentStep('interview')
  }

  const handleInterviewStart = async () => {
    try {
      // Update interview status to in_progress
      await fetch(`/api/interview/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }),
      })

      await startRecording()
    } catch (error) {
      toast.error('Failed to start recording')
    }
  }

  const handleInterviewEnd = async () => {
    try {
      console.log('Ending interview and stopping recording...')
      await stopRecording()
      
      // Force cleanup to ensure camera stops
      setTimeout(() => {
        console.log('Force resetting upload to stop camera...')
        resetUpload()
      }, 1000)
    } catch (error) {
      console.error('Error stopping recording:', error)
      toast.error('Failed to stop recording')
      // Still try to reset to stop camera
      resetUpload()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Interview Not Found</CardTitle>
            <CardDescription>
              The interview you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const jobConfig = interview.job_roles.config as JobRoleConfig

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {interview.job_roles.title} Interview
              </h1>
              <p className="text-gray-600">
                Interview ID: {interview.id.slice(0, 8)}...
              </p>
            </div>
            <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
              {interview.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'device-check' && (
          <DeviceCheck
            onComplete={handleDeviceCheckComplete}
            onError={(error) => toast.error(error)}
          />
        )}

        {currentStep === 'consent' && (
          <ConsentModal
            jobTitle={interview.job_roles.title}
            duration={Math.floor(jobConfig.duration / 60)} // Convert to minutes
            onConsent={handleConsentGiven}
            onCancel={() => router.push('/dashboard')}
          />
        )}

        {currentStep === 'interview' && (
          <InterviewRecording
            interview={interview}
            jobConfig={jobConfig}
            isRecording={isRecording}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            onStart={handleInterviewStart}
            onEnd={handleInterviewEnd}
            onReset={resetUpload}
          />
        )}

        {currentStep === 'completed' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Interview Completed!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Thank you for completing the {interview.job_roles.title} interview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Your interview is being processed and scored by AI</li>
                  <li>• You'll receive an email notification when results are ready</li>
                  <li>• Check your dashboard for updates on your application status</li>
                  <li>• Our hiring team will review your interview and reach out if selected</li>
                </ul>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/interviews/${interview.id}`)}
                  className="flex-1"
                >
                  View Interview Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}