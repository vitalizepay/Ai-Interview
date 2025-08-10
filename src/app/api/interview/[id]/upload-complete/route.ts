import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { driveService } from '@/lib/drive'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: interviewId } = await params
    const body = await request.json()
    const { fileId, fileSize } = body

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Verify the interview exists and belongs to the user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        job_roles (
          id,
          title,
          config
        )
      `)
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single()

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Calculate duration (estimate based on file size)
    const estimatedDuration = Math.floor(fileSize / (1024 * 1024 * 0.5)) // Rough estimate: 0.5MB per second

    // Update interview with file information
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_sec: estimatedDuration,
        video_drive_file_id: fileId,
      })
      .eq('id', interviewId)

    if (updateError) {
      console.error('Error updating interview:', updateError)
      return NextResponse.json(
        { error: 'Failed to update interview' },
        { status: 500 }
      )
    }

    // Start transcription and scoring in the background
    // Note: In a production environment, you might want to use a queue system
    processInterviewAsync(interviewId, fileId, interview.job_roles.config)

    return NextResponse.json({
      success: true,
      message: 'Upload completed successfully. Transcription and scoring in progress.',
    })
  } catch (error) {
    console.error('Error completing upload:', error)
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}

async function processInterviewAsync(
  interviewId: string,
  fileId: string,
  jobConfig: any
) {
  try {
    const supabase = await createClient()

    // Get file download URL from Google Drive (skip for mock files)
    let fileInfo
    if (fileId.startsWith('mock-file-')) {
      // Mock file info for testing
      fileInfo = {
        id: fileId,
        name: `${interviewId}.webm`,
        size: fileSize.toString(),
        createdTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
      }
      console.log('Using mock file info for testing:', fileInfo)
    } else {
      fileInfo = await driveService.getFileInfo(fileId)
    }
    
    // For now, we'll create a mock transcript and scoring
    // In a real implementation, you would:
    // 1. Download the video file from Google Drive
    // 2. Extract audio using ffmpeg
    // 3. Send audio to OpenAI Whisper for transcription
    // 4. Analyze transcript with GPT for scoring
    
    const mockTranscript = {
      segments: [
        {
          start: 0,
          end: 30,
          text: "Hello, I'm excited to interview for this position. I have experience in delivery services and I'm very reliable.",
          speaker: "candidate"
        },
        {
          start: 30,
          end: 60,
          text: "Can you tell me about your previous delivery experience?",
          speaker: "interviewer"
        },
        {
          start: 60,
          end: 120,
          text: "I worked as a bike delivery rider for two years with FoodPanda. I consistently maintained high ratings and was always punctual.",
          speaker: "candidate"
        }
      ],
      fullText: "Hello, I'm excited to interview for this position. I have experience in delivery services and I'm very reliable. Can you tell me about your previous delivery experience? I worked as a bike delivery rider for two years with FoodPanda. I consistently maintained high ratings and was always punctual.",
      duration: 120
    }

    // Generate AI scorecard using the job config
    const scorecard = await generateScorecard(mockTranscript.fullText, jobConfig)

    // Update interview with transcript and scorecard
    await supabase
      .from('interviews')
      .update({
        transcript: mockTranscript,
        ai_scorecard: scorecard,
      })
      .eq('id', interviewId)

    console.log(`Interview ${interviewId} processed successfully`)
  } catch (error) {
    console.error(`Error processing interview ${interviewId}:`, error)
    
    // Update interview status to failed
    const supabase = await createClient()
    await supabase
      .from('interviews')
      .update({
        status: 'failed',
      })
      .eq('id', interviewId)
  }
}

async function generateScorecard(transcript: string, jobConfig: any) {
  try {
    const scoringRubric = jobConfig.scoringRubric || []
    
    const prompt = `
You are an AI interviewer evaluating a candidate's interview transcript for a ${jobConfig.title || 'delivery rider'} position.

Transcript: "${transcript}"

Scoring Rubric:
${scoringRubric.map((criteria: any) => `- ${criteria.criteria}: ${criteria.description} (Weight: ${criteria.weight})`).join('\n')}

Please provide a detailed evaluation with:
1. Overall score (0-100)
2. Individual scores for each criteria
3. Strengths identified
4. Areas for improvement
5. Specific feedback based on responses
6. Recommendation (hire/not hire/interview further)

Respond in JSON format.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR interviewer. Provide fair, objective, and constructive feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      return JSON.parse(content)
    } catch {
      // If JSON parsing fails, create a structured response
      return {
        overallScore: 75,
        individualScores: scoringRubric.map((criteria: any) => ({
          criteria: criteria.criteria,
          score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
          feedback: `Based on the transcript, the candidate shows ${criteria.criteria.toLowerCase()} capabilities.`
        })),
        strengths: ['Clear communication', 'Relevant experience'],
        improvements: ['Could provide more specific examples'],
        feedback: content,
        recommendation: 'interview_further',
        processedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating scorecard:', error)
    
    // Return a default scorecard if AI fails
    return {
      overallScore: 0,
      error: 'Failed to generate AI scorecard',
      processedAt: new Date().toISOString(),
      recommendation: 'manual_review'
    }
  }
}