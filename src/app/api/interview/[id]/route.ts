import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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
          description,
          config
        ),
        profiles (
          id,
          full_name
        )
      `)
      .eq('id', interviewId)

    // If not admin, only allow access to user's own interviews
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data: interview, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Interview not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching interview:', error)
      return NextResponse.json(
        { error: 'Failed to fetch interview' },
        { status: 500 }
      )
    }

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Error in interview fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user owns this interview or is admin
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('user_id')
      .eq('id', interviewId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    if (interview.user_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update the interview
    const { data: updatedInterview, error: updateError } = await supabase
      .from('interviews')
      .update(body)
      .eq('id', interviewId)
      .select(`
        *,
        job_roles (
          id,
          title,
          slug,
          description,
          config
        ),
        profiles (
          id,
          full_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating interview:', updateError)
      return NextResponse.json(
        { error: 'Failed to update interview' },
        { status: 500 }
      )
    }

    return NextResponse.json({ interview: updatedInterview })
  } catch (error) {
    console.error('Error in interview update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}