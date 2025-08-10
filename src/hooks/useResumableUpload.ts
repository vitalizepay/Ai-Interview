'use client'

import { useState, useRef, useCallback } from 'react'

interface UseResumableUploadProps {
  interviewId: string
  onUploadComplete?: (fileId: string) => void
  onUploadError?: (error: Error) => void
  onUploadProgress?: (progress: number) => void
}

interface UploadState {
  isRecording: boolean
  isUploading: boolean
  uploadProgress: number
  error: string | null
}

export function useResumableUpload({
  interviewId,
  onUploadComplete,
  onUploadError,
  onUploadProgress,
}: UseResumableUploadProps) {
  const [state, setState] = useState<UploadState>({
    isRecording: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const uploadUrlRef = useRef<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received chunk:', event.data.size, 'bytes')
          chunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        await handleRecordingStop()
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setState(prev => ({ ...prev, isRecording: true }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording')
      setState(prev => ({ ...prev, error: err.message }))
      onUploadError?.(err)
    }
  }, [interviewId, onUploadError])

  const stopRecording = useCallback(() => {
    console.log('Stopping recording and camera...')
    
    // Stop MediaRecorder first
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    // Force stop all media tracks
    if (streamRef.current) {
      console.log('Force stopping all camera/microphone tracks...')
      streamRef.current.getTracks().forEach((track, index) => {
        console.log(`Stopping track ${index}: ${track.kind} - ${track.readyState}`)
        track.stop()
        console.log(`Track ${index} after stop: ${track.readyState}`)
      })
      streamRef.current = null
      console.log('Stream reference cleared')
    }

    // Clear chunks
    chunksRef.current = []

    setState(prev => ({ ...prev, isRecording: false }))
    console.log('Recording state set to false')
  }, [])

  const handleRecordingStop = useCallback(async () => {
    try {
      // Immediately stop camera when recording stops
      if (streamRef.current) {
        console.log('Force stopping camera tracks in handleRecordingStop...')
        streamRef.current.getTracks().forEach(track => {
          console.log(`Force stopping track: ${track.kind}`)
          track.stop()
        })
      }

      setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }))

      // Create blob from chunks
      console.log('Creating blob from', chunksRef.current.length, 'chunks')
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      console.log('Blob created - Size:', blob.size, 'bytes, Type:', blob.type)
      
      // Initialize upload session
      const initResponse = await fetch(`/api/interview/${interviewId}/upload-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileSize: blob.size,
          mimeType: blob.type,
        }),
      })

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload')
      }

      const { uploadUrl } = await initResponse.json()
      uploadUrlRef.current = uploadUrl

      // Upload the blob
      await uploadBlob(blob, uploadUrl)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: 0, 
        error: err.message 
      }))
      onUploadError?.(err)
    }
  }, [interviewId, onUploadError])

  const uploadBlob = useCallback(async (blob: Blob, uploadUrl: string) => {
    try {
      // Check if this is a mock URL (for testing without Google Drive)
      if (uploadUrl.includes('mock-upload.example.com')) {
        console.log('Mock upload - skipping actual upload for testing')
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setState(prev => ({ ...prev, uploadProgress: i }))
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        // Use a mock file ID
        const fileId = `mock-file-${Date.now()}`
        
        // Notify server that upload is complete
        const completeResponse = await fetch(`/api/interview/${interviewId}/upload-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            fileSize: blob.size,
          }),
        })

        if (!completeResponse.ok) {
          throw new Error('Failed to complete upload')
        }

        setState(prev => ({ 
          ...prev, 
          isUploading: false, 
          uploadProgress: 100 
        }))

        onUploadComplete?.(fileId)
        return
      }

      // Upload the complete blob to Google Drive
      console.log('Starting Google Drive upload...')
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'video/webm',
        },
      })

      console.log('Upload response status:', uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed:', errorText)
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`)
      }

      // Get the file ID from the response
      const fileData = await uploadResponse.json()
      console.log('Upload successful, file data:', fileData)
      const fileId = fileData.id

      // Notify server that upload is complete
      const completeResponse = await fetch(`/api/interview/${interviewId}/upload-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileSize: blob.size,
        }),
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload')
      }

      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: 100 
      }))

      onUploadComplete?.(fileId)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: 0, 
        error: err.message 
      }))
      onUploadError?.(err)
    }
  }, [interviewId, onUploadComplete, onUploadError])

  const resetUpload = useCallback(() => {
    console.log('Resetting upload and stopping camera...')
    
    // Stop recording if still active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Stop all camera tracks with extra force
    if (streamRef.current) {
      console.log('Force stopping camera tracks during reset...')
      streamRef.current.getTracks().forEach(track => {
        console.log(`Force stopping track during reset: ${track.kind} - ${track.readyState}`)
        track.stop()
        console.log(`Track after stop: ${track.readyState}`)
      })
      streamRef.current = null
    }

    // Additional cleanup - try to get new stream and immediately stop it to force camera off
    try {
      navigator.mediaDevices.getUserMedia({ video: false, audio: false }).then(stream => {
        stream.getTracks().forEach(track => track.stop())
      }).catch(() => {
        // Ignore errors, this is just cleanup
      })
    } catch (error) {
      // Ignore errors
    }

    setState({
      isRecording: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,
    })
    chunksRef.current = []
    uploadUrlRef.current = null
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    resetUpload,
  }
}