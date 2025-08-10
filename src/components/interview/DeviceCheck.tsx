'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Mic, Monitor, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DeviceCheckProps {
  onComplete: () => void
  onError: (error: string) => void
}

interface DeviceStatus {
  camera: 'checking' | 'success' | 'error'
  microphone: 'checking' | 'success' | 'error'
  browser: 'checking' | 'success' | 'error'
}

export function DeviceCheck({ onComplete, onError }: DeviceCheckProps) {
  const [status, setStatus] = useState<DeviceStatus>({
    camera: 'checking',
    microphone: 'checking',
    browser: 'checking',
  })
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const checkDevices = async () => {
    setStatus({
      camera: 'checking',
      microphone: 'checking',
      browser: 'checking',
    })

    // Check browser compatibility
    const browserSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setStatus(prev => ({
      ...prev,
      browser: browserSupported ? 'success' : 'error'
    }))

    if (!browserSupported) {
      onError('Your browser does not support the required features. Please use Chrome, Firefox, or Safari.')
      return
    }

    try {
      // Request camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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

      setStream(mediaStream)

      // Check if we got video track
      const videoTracks = mediaStream.getVideoTracks()
      setStatus(prev => ({
        ...prev,
        camera: videoTracks.length > 0 ? 'success' : 'error'
      }))

      // Check if we got audio track
      const audioTracks = mediaStream.getAudioTracks()
      setStatus(prev => ({
        ...prev,
        microphone: audioTracks.length > 0 ? 'success' : 'error'
      }))

      // Show video preview
      if (videoRef.current && videoTracks.length > 0) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

    } catch (error) {
      console.error('Device access error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setStatus(prev => ({
            ...prev,
            camera: 'error',
            microphone: 'error'
          }))
          onError('Camera and microphone access denied. Please allow access and try again.')
        } else if (error.name === 'NotFoundError') {
          setStatus(prev => ({
            ...prev,
            camera: 'error',
            microphone: 'error'
          }))
          onError('Camera or microphone not found. Please check your devices.')
        } else {
          setStatus(prev => ({
            ...prev,
            camera: 'error',
            microphone: 'error'
          }))
          onError('Failed to access camera and microphone. Please check your devices and permissions.')
        }
      }
    }
  }

  const retryDeviceCheck = async () => {
    setIsRetrying(true)
    
    // Stop existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    await checkDevices()
    setIsRetrying(false)
  }

  const handleContinue = () => {
    // Keep the stream for the interview
    onComplete()
  }

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  useEffect(() => {
    checkDevices()

    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const getStatusIcon = (deviceStatus: string) => {
    switch (deviceStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = (deviceStatus: string) => {
    switch (deviceStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>
    }
  }

  const allDevicesReady = status.camera === 'success' && status.microphone === 'success' && status.browser === 'success'
  const hasErrors = status.camera === 'error' || status.microphone === 'error' || status.browser === 'error'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-6 h-6 mr-2" />
            Device Check
          </CardTitle>
          <CardDescription>
            We need to check your camera and microphone before starting the interview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="w-6 h-6 text-gray-600" />
                <span className="font-medium">Camera</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.camera)}
                {getStatusBadge(status.camera)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="w-6 h-6 text-gray-600" />
                <span className="font-medium">Microphone</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.microphone)}
                {getStatusBadge(status.microphone)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-gray-600" />
                <span className="font-medium">Browser</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.browser)}
                {getStatusBadge(status.browser)}
              </div>
            </div>
          </div>

          {/* Video Preview */}
          {status.camera === 'success' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Camera Preview</h3>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-md mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm">
                  LIVE
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Make sure you can see yourself clearly and you're well-lit.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Before you continue:</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Make sure you're in a quiet environment</li>
              <li>• Ensure good lighting on your face</li>
              <li>• Position yourself at eye level with the camera</li>
              <li>• Test your microphone by speaking normally</li>
              <li>• Close other applications that might use your camera/microphone</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {hasErrors && (
              <Button
                variant="outline"
                onClick={retryDeviceCheck}
                disabled={isRetrying}
                className="flex-1"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Device Check
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleContinue}
              disabled={!allDevicesReady}
              className="flex-1"
            >
              {allDevicesReady ? 'Continue to Interview' : 'Waiting for devices...'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}