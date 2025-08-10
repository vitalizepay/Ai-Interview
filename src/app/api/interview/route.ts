import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { jobRoleId } = body

    if (!jobRoleId) {
      return NextResponse.json(
        { error: 'Job role ID is required' },
        { status: 400 }
      )
    }

    // Verify the job role exists and is active
    const { data: jobRole, error: roleError } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', jobRoleId)
      .eq('is_active', true)
      .single()

    if (roleError || !jobRole) {
      return NextResponse.json(
        { error: 'Invalid or inactive job role' },
        { status: 400 }
      )
    }

    // Check if user already has an interview for this role
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('job_role_id', jobRoleId)
      .single()

    if (existingInterview) {
      // If there's already an interview, return it instead of creating a new one
      return NextResponse.json({
        interview: existingInterview,
        jobRole,
        message: 'Existing interview found'
      })
    }

    // Create the interview record
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        job_role_id: jobRoleId,
        status: 'pending',
      })
      .select()
      .single()

    if (interviewError) {
      console.error('Error creating interview:', interviewError)
      return NextResponse.json(
        { error: 'Failed to create interview' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      interview,
      jobRole,
    })
  } catch (error) {
    console.error('Error in interview creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('interviews')
      .select(`
        *,
        job_roles (
          id,
          title,
          slug,
          description
        ),
        profiles (
          id,
          full_name
        )
      `)

    // If not admin, only show user's own interviews
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data: interviews, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching interviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error in interview fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}