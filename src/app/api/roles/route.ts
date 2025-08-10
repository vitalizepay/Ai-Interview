import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get active job roles
    const { data: roles, error } = await supabase
      .from('job_roles')
      .select('id, slug, title, description, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error in roles fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { slug, title, description, config, is_active = true } = body

    if (!slug || !title || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, config' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existingRole } = await supabase
      .from('job_roles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this slug already exists' },
        { status: 400 }
      )
    }

    // Create the job role
    const { data: role, error: roleError } = await supabase
      .from('job_roles')
      .insert({
        slug,
        title,
        description,
        config,
        is_active,
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating role:', roleError)
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error in role creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}