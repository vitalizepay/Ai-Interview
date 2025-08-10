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

    const { id: roleId } = await params

    // Get the role
    const { data: role, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching role:', error)
      return NextResponse.json(
        { error: 'Failed to fetch role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error in role fetch:', error)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id: roleId } = await params
    const body = await request.json()

    // Update the role
    const { data: role, error: updateError } = await supabase
      .from('job_roles')
      .update(body)
      .eq('id', roleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error in role update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id: roleId } = await params

    // Check if role has any interviews
    const { data: interviews, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('job_role_id', roleId)
      .limit(1)

    if (interviewError) {
      console.error('Error checking interviews:', interviewError)
      return NextResponse.json(
        { error: 'Failed to check role usage' },
        { status: 500 }
      )
    }

    if (interviews && interviews.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with existing interviews. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete the role
    const { error: deleteError } = await supabase
      .from('job_roles')
      .delete()
      .eq('id', roleId)

    if (deleteError) {
      console.error('Error deleting role:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in role deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}