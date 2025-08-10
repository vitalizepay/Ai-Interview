'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Video, Clock, CheckCircle, XCircle, Search, Filter, Download, Eye, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import type { Interview, JobRole, Profile } from '@/lib/types/database'

type InterviewWithRole = Interview & {
  job_roles: Pick<JobRole, 'id' | 'title' | 'slug'>
  profiles: Pick<Profile, 'id' | 'full_name'>
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewWithRole[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<InterviewWithRole[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [roles, setRoles] = useState<JobRole[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profile)

        // Load interviews
        const { data: interviews } = await supabase
          .from('interviews')
          .select(`
            *,
            job_roles (
              id,
              title,
              slug
            ),
            profiles (
              id,
              full_name
            )
          `)
          .order('created_at', { ascending: false })

        setInterviews(interviews || [])
        setFilteredInterviews(interviews || [])

        // Load roles for filter
        const { data: roles } = await supabase
          .from('job_roles')
          .select('*')
          .order('title')

        setRoles(roles || [])
      } catch (error) {
        console.error('Error loading interviews:', error)
        toast.error('Failed to load interviews')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  useEffect(() => {
    let filtered = interviews

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(interview =>
        interview.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.job_roles.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(interview => interview.job_role_id === roleFilter)
    }

    setFilteredInterviews(filtered)
  }, [interviews, searchTerm, statusFilter, roleFilter])

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const exportToCsv = () => {
    const csvContent = [
      ['ID', 'Candidate', 'Role', 'Status', 'Started', 'Duration', 'Score'].join(','),
      ...filteredInterviews.map(interview => [
        interview.id,
        interview.profiles.full_name || 'N/A',
        interview.job_roles.title,
        interview.status,
        interview.started_at ? new Date(interview.started_at).toLocaleString() : 'N/A',
        formatDuration(interview.duration_sec),
        interview.ai_scorecard ? (interview.ai_scorecard as any).overallScore || 'N/A' : 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interviews-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-2">
            {profile?.role === 'admin' ? 'All interview sessions' : 'Your interview history'}
          </p>
        </div>
        
        {profile?.role === 'admin' && (
          <Button onClick={exportToCsv} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.ai_scorecard).length > 0
                ? Math.round(
                    interviews
                      .filter(i => i.ai_scorecard)
                      .reduce((acc, i) => acc + ((i.ai_scorecard as any)?.overallScore || 0), 0) /
                    interviews.filter(i => i.ai_scorecard).length
                  )
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search interviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Sessions ({filteredInterviews.length})</CardTitle>
          <CardDescription>
            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
              ? 'Filtered results' 
              : 'All interview sessions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">
                    {interview.profiles.full_name || 'Anonymous'}
                  </TableCell>
                  <TableCell>{interview.job_roles.title}</TableCell>
                  <TableCell>{getStatusBadge(interview.status)}</TableCell>
                  <TableCell>
                    {interview.started_at 
                      ? new Date(interview.started_at).toLocaleDateString()
                      : 'Not started'
                    }
                  </TableCell>
                  <TableCell>{formatDuration(interview.duration_sec)}</TableCell>
                  <TableCell>
                    {interview.ai_scorecard 
                      ? `${(interview.ai_scorecard as any).overallScore || 0}/100`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/interviews/${interview.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredInterviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {interviews.length === 0 
                ? 'No interviews found. Start your first interview!'
                : 'No interviews match your current filters.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}