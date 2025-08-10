import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { driveService, GoogleDriveService } from '@/lib/drive'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📤 Upload init API called')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('📤 Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: interviewId } = await params
    console.log('📤 Interview ID:', interviewId)
    
    const body = await request.json()
    const { fileSize, mimeType = 'video/webm' } = body
    console.log('📤 File size:', fileSize, 'MIME type:', mimeType)

    if (!fileSize) {
      console.error('📤 No file size provided')
      return NextResponse.json(
        { error: 'File size is required' },
        { status: 400 }
      )
    }

    // Verify the interview exists and belongs to the user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        job_roles (
          slug
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

    // Check if interview is in the right state for upload
    if (interview.status !== 'pending' && interview.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Interview is not in a state that allows upload' },
        { status: 400 }
      )
    }

    // Generate file name and path
    const fileName = GoogleDriveService.generateFileName(interviewId)
    
    // Create folder structure in Google Drive
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    
    const parentFolderId = await driveService.createFolderStructure(
      interview.job_roles.slug,
      year,
      month,
      user.id
    )

    // Create resumable upload session
    let uploadUrl: string
    try {
      console.log('Attempting to create Google Drive upload session...')
      const result = await driveService.createResumableUploadSession(
        fileName,
        fileSize,
        mimeType
      )
      uploadUrl = result.uploadUrl
      console.log('Google Drive upload session created successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Google Drive upload failed:', errorMessage)
      
      // For now, let's see the actual error instead of falling back to mock
      return NextResponse.json(
        { error: `Google Drive upload failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Update interview status to in_progress
    await supabase
      .from('interviews')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', interviewId)

    return NextResponse.json({
      uploadUrl,
      fileName,
      parentFolderId,
    })
  } catch (error) {
    console.error('Error initializing upload:', error)
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    )
  }
}