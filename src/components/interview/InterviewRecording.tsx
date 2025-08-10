'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Square, Upload, Clock, AlertCircle, Mic, MicOff, Volume2 } from 'lucide-react'
import type { Interview, JobRole, JobRoleConfig } from '@/lib/types/database'

interface InterviewRecordingProps {
  interview: Interview & { job_roles: JobRole }
  jobConfig: JobRoleConfig
  isRecording: boolean
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
  onStart: () => void
  onEnd: () => void
  onReset: () => void
}

export function InterviewRecording({
  interview,
  jobConfig,
  isRecording,
  isUploading,
  uploadProgress,
  uploadError,
  onStart,
  onEnd,
  onReset,
}: InterviewRecordingProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const speechRecognitionRef = useRef<any>(null)

  const maxDuration = jobConfig.duration // in seconds
  const progress = (currentTime / maxDuration) * 100

  // Initialize speech features
  useEffect(() => {
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis supported')
    }

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      console.log('Speech recognition supported')
      setSpeechSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
      }

      speechRecognitionRef.current = recognition
    } else {
      console.log('Speech recognition not supported')
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel()
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop()
      }
    }
  }, [])

  const getCurrentQuestion = useMemo((): string => {
    console.log('Getting current question - Started:', interviewStarted, 'Index:', currentQuestionIndex)
    console.log('Job config:', jobConfig)
    
    if (!interviewStarted) {
      return jobConfig.intro || "Welcome to your interview! Please get ready to begin."
    }

    // Handle old format (direct questions array) for backward compatibility
    if (jobConfig.questions && Array.isArray(jobConfig.questions)) {
      console.log('Using old questions format')
      const questionIndex = currentQuestionIndex % jobConfig.questions.length
      return jobConfig.questions[questionIndex] || "Thank you for your time. Do you have any questions for us?"
    }

    // Handle new format (openingQuestions + questionBank)
    if (jobConfig.openingQuestions && Array.isArray(jobConfig.openingQuestions)) {
      console.log('Using new format - opening questions available')

    if (currentQuestionIndex < jobConfig.openingQuestions.length) {
        console.log('Returning opening question:', currentQuestionIndex)
      return jobConfig.openingQuestions[currentQuestionIndex]
    }

      // Get questions from question bank
      if (jobConfig.questionBank && Array.isArray(jobConfig.questionBank)) {
        const allQuestions = jobConfig.questionBank.flatMap(bank => 
          Array.isArray(bank.questions) ? bank.questions : []
        )
        console.log('All questions from bank:', allQuestions.length)
        
        if (allQuestions.length > 0) {
    const questionIndex = (currentQuestionIndex - jobConfig.openingQuestions.length) % allQuestions.length
          console.log('Returning bank question:', questionIndex)
          return allQuestions[questionIndex]
        }
      }
    }

    console.log('Fallback to wrap up')
    return jobConfig.wrapUpPrompt || "Thank you for your time. Do you have any questions for us?"
  }, [interviewStarted, currentQuestionIndex, jobConfig])

  // Get current question
  const currentQuestion = getCurrentQuestion()

  // Speech functions
  const speakQuestion = useCallback((text: string) => {
    // Prevent multiple simultaneous speech calls
    if ('speechSynthesis' in window && !isAISpeaking && speechSynthesis.speaking === false) {
      console.log('🎙️ Preparing to speak:', text.substring(0, 50) + '...')
      
      // Cancel any pending speech first
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.7  // Slower for clarity
      utterance.pitch = 1
      utterance.volume = 1
      utterance.lang = 'en-US'
      
      utterance.onstart = () => {
        console.log('✅ AI started speaking successfully')
        setIsAISpeaking(true)
      }
      
      utterance.onend = () => {
        console.log('✅ AI finished speaking')
        setIsAISpeaking(false)
        speechSynthesisRef.current = null
        
        // Start listening after AI finishes (only if interview is still active)
        if (interviewStarted && isRecording) {
          setTimeout(() => {
            console.log('🎧 Starting to listen for response...')
            startListening()
          }, 1000)
        }
      }
      
      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event.error)
        setIsAISpeaking(false)
        speechSynthesisRef.current = null
      }
      
      // Set ref and speak
      speechSynthesisRef.current = utterance
      speechSynthesis.speak(utterance)
    } else {
      console.log('🚫 Skipping speech - already speaking or AI speaking:', { isAISpeaking, speechSynthesisSpeaking: speechSynthesis.speaking })
    }
  }, [isAISpeaking, interviewStarted, isRecording])

  const startListening = () => {
    if (speechRecognitionRef.current && !isListening) {
      console.log('Starting speech recognition')
      setIsListening(true)
      speechRecognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (speechRecognitionRef.current && isListening) {
      console.log('Stopping speech recognition')
      speechRecognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Speak question when it changes (with ref to prevent infinite loops)
  const lastSpokenQuestionIndexRef = useRef<number>(-1)
  
  useEffect(() => {
    if (interviewStarted && currentQuestion && currentQuestionIndex !== lastSpokenQuestionIndexRef.current) {
      console.log('🎯 New question at index', currentQuestionIndex, ':', currentQuestion.substring(0, 50) + '...')
      lastSpokenQuestionIndexRef.current = currentQuestionIndex
      
      // Cancel any ongoing speech first
      if (speechSynthesisRef.current) {
        console.log('🛑 Canceling previous speech')
        speechSynthesis.cancel()
        setIsAISpeaking(false)
      }
      
      // Delay speaking to prevent conflicts
      setTimeout(() => {
        if (interviewStarted && !isAISpeaking) { // Double check before speaking
          speakQuestion(currentQuestion)
        }
      }, 800)
    }
  }, [currentQuestionIndex, interviewStarted, currentQuestion, speakQuestion]) // Include currentQuestion to ensure we have the latest

  const handleStart = () => {
    setInterviewStarted(true)
    onStart()
    
    // Start timer
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1
        
        // Auto-advance questions every 3 minutes (increased from 2)
        if (newTime > 0 && newTime % 180 === 0 && newTime < maxDuration - 60) {
          console.log('Auto-advancing to next question at', newTime, 'seconds')
          setCurrentQuestionIndex(prevIndex => prevIndex + 1)
        }
        
        // Auto-end interview when time is up
        if (newTime >= maxDuration) {
          console.log('Interview time completed, ending interview')
          handleEnd()
          return maxDuration
        }
        
        return newTime
      })
    }, 1000)
  }

  const handleEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Stop speech features
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel()
    }
    stopListening()
    
    // Reset the interview state
    setInterviewStarted(false)
    setCurrentTime(0)
    setCurrentQuestionIndex(0)
    setIsAISpeaking(false)
    setTranscript('')
    onEnd()
  }

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeRemaining = () => {
    return Math.max(0, maxDuration - currentTime)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Interview Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {interview.job_roles.title} Interview
              </CardTitle>
              <CardDescription>
                {isRecording ? 'Recording in progress...' : 'Ready to start recording'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-500">
                {formatTime(getTimeRemaining())} remaining
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Duration: {Math.floor(maxDuration / 60)} minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle>
            {!interviewStarted ? 'Welcome' : `Question ${currentQuestionIndex + 1}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI Voice Status */}
          {interviewStarted && (
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                isAISpeaking ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Volume2 className={`w-5 h-5 ${isAISpeaking ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium">
                  {isAISpeaking ? 'AI Speaking...' : 'AI Ready'}
                </span>
              </div>
              
              {speechSupported && (
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  isListening ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
                  <span className="text-sm font-medium">
                    {isListening ? 'Listening...' : 'Ready to Listen'}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-lg leading-relaxed text-blue-900">
              {currentQuestion}
            </p>
          </div>

          {/* Speech Recognition Transcript */}
          {transcript && interviewStarted && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center space-x-2 mb-2">
                <Mic className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Your Response:</span>
              </div>
              <div className="text-sm text-green-700 italic">{transcript}</div>
            </div>
          )}

          {/* Voice Controls */}
          {interviewStarted && isRecording && (
            <div className="mt-4 flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={currentTime < 15} // Reduced from 30 to 15 seconds
              >
                Next Question
              </Button>

              <Button
                variant="destructive"
                onClick={handleEnd}
                className="ml-2"
              >
                End Interview
              </Button>
              
              {speechSupported && (
                <Button
                  variant="outline"
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? 'bg-red-50 border-red-200' : ''}
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => speakQuestion(currentQuestion)}
                disabled={isAISpeaking}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Repeat Question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardContent className="pt-6">
          {!isRecording && !isUploading && (
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Ready to start?</span>
                </div>
                <p className="text-yellow-700 text-sm mt-2">
                  Once you click start, recording will begin immediately. Make sure you're ready!
                </p>
              </div>
              <Button
                onClick={handleStart}
                size="lg"
                className="w-full max-w-xs"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Interview
              </Button>
            </div>
          )}

          {isRecording && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Badge className="bg-red-100 text-red-800">RECORDING</Badge>
              </div>
              <p className="text-gray-600">
                Speak clearly and look at the camera. Take your time to answer thoughtfully.
              </p>
              <Button
                onClick={handleEnd}
                variant="destructive"
                size="lg"
                className="w-full max-w-xs"
              >
                <Square className="w-5 h-5 mr-2" />
                End Interview
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600 animate-bounce" />
                <Badge className="bg-blue-100 text-blue-800">UPLOADING</Badge>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-600">
                  Uploading your interview... {Math.round(uploadProgress)}%
                </p>
              </div>
              <p className="text-gray-500 text-sm">
                Please don't close this window while uploading.
              </p>
            </div>
          )}

          {uploadError && (
            <div className="text-center space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Upload Failed</span>
                </div>
                <p className="text-red-700 text-sm mt-2">{uploadError}</p>
              </div>
              <Button
                onClick={onReset}
                variant="outline"
                className="w-full max-w-xs"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Tips */}
      {!interviewStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Speaking Tips:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Look directly at the camera</li>
                  <li>• Use specific examples in your answers</li>
                  <li>• Take a moment to think before responding</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Tips:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Ensure stable internet connection</li>
                  <li>• Keep your face well-lit and visible</li>
                  <li>• Minimize background noise</li>
                  <li>• Don't refresh or close the browser</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}