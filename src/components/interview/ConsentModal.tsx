'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, Clock, Video, Mic } from 'lucide-react'

interface ConsentModalProps {
  jobTitle: string
  duration: number // in minutes
  onConsent: () => void
  onCancel: () => void
}

export function ConsentModal({ jobTitle, duration, onConsent, onCancel }: ConsentModalProps) {
  const [consents, setConsents] = useState({
    recording: false,
    dataProcessing: false,
    terms: false,
  })

  const handleConsentChange = (key: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({ ...prev, [key]: checked }))
  }

  const allConsentsGiven = Object.values(consents).every(Boolean)

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Interview Consent & Privacy</CardTitle>
          <CardDescription className="text-lg">
            Please review and accept the following terms before starting your {jobTitle} interview
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Interview Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Interview Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-blue-600" />
                <span>Video Recording: Yes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-blue-600" />
                <span>Audio Recording: Yes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Duration: ~{duration} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>AI Analysis: Yes</span>
              </div>
            </div>
          </div>

          {/* Consent Items */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="recording"
                checked={consents.recording}
                onCheckedChange={(checked) => handleConsentChange('recording', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="recording" className="font-medium cursor-pointer">
                  Video and Audio Recording Consent
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  I consent to having my interview session recorded (video and audio) for evaluation purposes. 
                  The recording will be securely stored and only accessible to authorized personnel involved 
                  in the hiring process.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="dataProcessing"
                checked={consents.dataProcessing}
                onCheckedChange={(checked) => handleConsentChange('dataProcessing', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="dataProcessing" className="font-medium cursor-pointer">
                  Data Processing and AI Analysis
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  I consent to the processing of my interview data using AI technology for transcription, 
                  analysis, and scoring purposes. This includes speech-to-text conversion and automated 
                  evaluation of my responses against job-relevant criteria.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="terms"
                checked={consents.terms}
                onCheckedChange={(checked) => handleConsentChange('terms', checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="terms" className="font-medium cursor-pointer">
                  Terms and Conditions
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  I acknowledge that I have read and agree to the terms and conditions, privacy policy, 
                  and understand my rights regarding data protection and interview process.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Your Privacy Rights</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Your data will be processed in accordance with GDPR and applicable privacy laws</li>
              <li>• You can request access to your data or request its deletion at any time</li>
              <li>• Interview recordings are encrypted and stored securely</li>
              <li>• Only authorized hiring team members can access your interview</li>
              <li>• Data will be retained only as long as necessary for the hiring process</li>
            </ul>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notice</h4>
            <p className="text-yellow-800 text-sm">
              Once you start the interview, recording will begin automatically. Please ensure you're 
              in a private, quiet environment. You can end the interview at any time, but partial 
              interviews may not be considered complete for evaluation purposes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel Interview
            </Button>
            <Button
              onClick={onConsent}
              disabled={!allConsentsGiven}
              className="flex-1"
            >
              {allConsentsGiven ? 'Start Interview' : 'Please accept all terms'}
            </Button>
          </div>

          {/* Contact Information */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>
              Questions about privacy or data processing? Contact us at{' '}
              <a href="mailto:privacy@company.com" className="text-blue-600 hover:underline">
                privacy@company.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}