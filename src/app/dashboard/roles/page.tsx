'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { JobRole, Profile } from '@/lib/types/database'

export default function RolesPage() {
  const [roles, setRoles] = useState<JobRole[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<JobRole | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('Profile data:', profile)
        console.log('Profile error:', profileError)

        // If no profile exists, create one and make it admin (since this is roles page)
        if (!profile) {
          console.log('No profile found, creating admin profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.email?.split('@')[0] || 'Admin User',
              role: 'admin'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            setProfile(null)
            setIsLoading(false)
            return
          }
          
          profile = newProfile
          console.log('Created new admin profile:', profile)
        }

        console.log('User role:', profile?.role)

        if (profile?.role !== 'admin') {
          console.log('Access denied - not admin:', profile?.role)
          setProfile(profile)
          setIsLoading(false)
          return
        }

        setProfile(profile)

        // Load all roles (including inactive for admin)
        const { data: roles } = await supabase
          .from('job_roles')
          .select('*')
          .order('created_at', { ascending: false })

        // If no roles exist, create the bike delivery role
        if (!roles || roles.length === 0) {
          console.log('No roles found, creating bike delivery role...')
          const { data: newRole, error: roleError } = await supabase
            .from('job_roles')
            .insert({
              slug: 'bike-delivery-rider',
              title: 'Bike Delivery Rider',
              description: 'Join our delivery team! Perfect for active individuals who enjoy working independently.',
              config: {
                "language": "en",
                "intro": "Hi! Welcome to your AI interview for the Bike Delivery Rider position. This should take about 10-15 minutes. Please speak clearly and give specific examples. Let us begin!",
                "openingQuestions": [
                  "Can you tell me about yourself and why you want to be a bike delivery rider?",
                  "Do you have any delivery or customer service experience?",
                  "How comfortable are you riding a bike in city traffic?"
                ],
                "questionBank": [
                  {
                    "category": "Experience",
                    "questions": [
                      "Tell me about your work experience, especially with transportation or customer service.",
                      "Have you worked in fast-paced environments? How did you handle pressure?",
                      "Are you familiar with smartphone apps for navigation?"
                    ]
                  },
                  {
                    "category": "Safety & Physical",
                    "questions": [
                      "How would you stay safe while riding in busy traffic?",
                      "Are you physically fit enough to ride for several hours?",
                      "What would you do if your bike broke down during delivery?"
                    ]
                  },
                  {
                    "category": "Customer Service",
                    "questions": [
                      "How would you handle an upset customer about a late delivery?",
                      "What would you do if you could not find the customer address?",
                      "How would you keep food fresh during delivery?"
                    ]
                  }
                ],
                "scoringRubric": [
                  {
                    "criteria": "Communication",
                    "weight": 25,
                    "description": "Clear communication skills"
                  },
                  {
                    "criteria": "Customer Service",
                    "weight": 30,
                    "description": "Customer-focused attitude"
                  },
                  {
                    "criteria": "Physical Readiness",
                    "weight": 25,
                    "description": "Understanding of physical demands"
                  },
                  {
                    "criteria": "Problem Solving",
                    "weight": 20,
                    "description": "Ability to handle challenges"
                  }
                ],
                "duration": 900
              },
              is_active: true
            })
            .select()
            .single()

          if (roleError) {
            console.error('Error creating bike delivery role:', roleError)
          } else {
            console.log('Created bike delivery role:', newRole)
            setRoles([newRole])
          }
        } else {
          setRoles(roles)
        }
      } catch (error) {
        console.error('Error loading roles:', error)
        toast.error('Failed to load roles')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingRole) {
        // Update existing role
        const response = await fetch(`/api/roles/${editingRole.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to update role')
        }

        const { role } = await response.json()
        setRoles(prev => prev.map(r => r.id === role.id ? role : r))
        toast.success('Role updated successfully')
      } else {
        // Create new role with default config
        const defaultConfig = {
          language: "en",
          intro: "Welcome to your AI interview! I'll be asking you questions about your experience and suitability for this role.",
          openingQuestions: [
            "Can you tell me a bit about yourself and your background?",
            "Why are you interested in this position?",
            "What relevant experience do you have?"
          ],
          questionBank: [
            {
              category: "Experience & Background",
              questions: [
                "Describe your previous work experience.",
                "Tell me about a challenging project you worked on.",
                "How do you handle working under pressure?"
              ]
            }
          ],
          followupPolicy: {
            maxFollowups: 2,
            triggerConditions: [
              "Answer is too brief",
              "Answer lacks specific examples",
              "Answer doesn't fully address the question"
            ]
          },
          scoringRubric: [
            {
              criteria: "Communication Skills",
              weight: 25,
              description: "Ability to communicate clearly and effectively"
            },
            {
              criteria: "Relevant Experience",
              weight: 30,
              description: "Previous experience relevant to the role"
            },
            {
              criteria: "Problem Solving",
              weight: 20,
              description: "Ability to analyze and solve problems"
            },
            {
              criteria: "Cultural Fit",
              weight: 25,
              description: "Alignment with company values and culture"
            }
          ],
          wrapUpPrompt: "Thank you for your time. Do you have any questions about the role or our company?",
          duration: 1200
        }

        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            config: defaultConfig,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create role')
        }

        const { role } = await response.json()
        setRoles(prev => [role, ...prev])
        toast.success('Role created successfully')
      }

      // Reset form and close dialog
      setFormData({
        slug: '',
        title: '',
        description: '',
        is_active: true,
      })
      setEditingRole(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save role')
    }
  }

  const handleEdit = (role: JobRole) => {
    setEditingRole(role)
    setFormData({
      slug: role.slug,
      title: role.title,
      description: role.description || '',
      is_active: role.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete role')
      }

      setRoles(prev => prev.filter(r => r.id !== roleId))
      toast.success('Role deleted successfully')
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    }
  }

  const toggleRoleStatus = async (role: JobRole) => {
    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !role.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update role status')
      }

      const { role: updatedRole } = await response.json()
      setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r))
      toast.success(`Role ${updatedRole.is_active ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating role status:', error)
      toast.error('Failed to update role status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // For now, allow access regardless of profile status for setup
  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Setting Up Your Account</h2>
        <p className="text-gray-600 mt-2">Creating your admin profile and initial job roles...</p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm font-medium">Setup Status:</p>
          <p className="text-sm">✅ Database connected</p>
          <p className="text-sm">⏳ Creating admin profile...</p>
          <p className="text-sm">⏳ Setting up job roles...</p>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          This page will refresh automatically once setup is complete.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Refresh Page
        </Button>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <p className="text-sm">Debug Info:</p>
          <p className="text-sm">Profile exists: {profile ? 'Yes' : 'No'}</p>
          <p className="text-sm">Current role: {profile?.role || 'None'}</p>
          <p className="text-sm">User ID: {profile?.id || 'None'}</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard')} 
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Roles Management</h1>
          <p className="text-gray-600 mt-2">Create and manage interview roles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRole(null)
              setFormData({
                slug: '',
                title: '',
                description: '',
                is_active: true,
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </DialogTitle>
              <DialogDescription>
                {editingRole ? 'Update the role details below.' : 'Create a new interview role with basic information.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="e.g. senior-software-engineer"
                  required
                />
                <p className="text-xs text-gray-500">
                  Used in URLs. Will be automatically formatted.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the role..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active (visible to candidates)</Label>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles ({roles.length})</CardTitle>
          <CardDescription>
            Manage interview roles and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.title}</TableCell>
                  <TableCell className="font-mono text-sm">{role.slug}</TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${
                        role.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleRoleStatus(role)}
                    >
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/roles/${role.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/roles/${role.id}/config`)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No roles created yet. Click "Create Role" to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}