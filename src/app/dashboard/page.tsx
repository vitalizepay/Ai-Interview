'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import type { JobRole, Interview, Profile } from '@/lib/types/database'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [roles, setRoles] = useState<JobRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // If no profile exists, create one
        if (!profile) {
          // Check if this is the first user (make them admin)
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

          const isFirstUser = (count || 0) === 0

          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.email?.split('@')[0] || 'User',
              role: isFirstUser ? 'admin' : 'candidate'
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating profile:', error)
          } else {
            profile = newProfile
          }
        }

        setProfile(profile)

        // Get recent interviews
        const { data: interviews } = await supabase
          .from('interviews')
          .select(`
            *,
            job_roles (
              title,
              slug
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setInterviews(interviews || [])

        // Get active roles
        const { data: roles } = await supabase
          .from('job_roles')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setRoles(roles || [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const startInterview = async (roleId: string) => {
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobRoleId: roleId }),
      })

      if (response.ok) {
        const { interview } = await response.json()
        router.push(`/interview/${interview.id}`)
      }
    } catch (error) {
      console.error('Error starting interview:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          {profile?.role === 'admin' 
            ? 'Manage interviews and roles from your admin dashboard.'
            : 'Ready to start your next AI interview?'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Roles</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Roles */}
      {profile?.role === 'candidate' && (
        <Card>
          <CardHeader>
            <CardTitle>Available Interview Positions</CardTitle>
            <CardDescription>
              Select a role to start your AI interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg">{role.title}</h3>
                  {role.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {role.description}
                    </p>
                  )}
                  <Button
                    className="mt-4 w-full"
                    onClick={() => startInterview(role.id)}
                  >
                    Start Interview
                  </Button>
                </div>
              ))}
            </div>
            
            {roles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No interview positions are currently available.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interviews</CardTitle>
          <CardDescription>
            Your latest interview sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/interviews/${interview.id}`)}
              >
                <div className="flex items-center space-x-4">
                  <Video className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">
                      {(interview as any).job_roles?.title || 'Interview'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusBadge(interview.status)}
                </div>
              </div>
            ))}
            
            {interviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No interviews yet. Start your first interview above!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}