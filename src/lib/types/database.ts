export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'candidate' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'candidate' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: 'candidate' | 'admin'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      job_roles: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          config: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          config: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          config?: Json
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          user_id: string
          job_role_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          started_at: string | null
          ended_at: string | null
          duration_sec: number | null
          video_drive_file_id: string | null
          transcript: Json | null
          ai_scorecard: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_role_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          started_at?: string | null
          ended_at?: string | null
          duration_sec?: number | null
          video_drive_file_id?: string | null
          transcript?: Json | null
          ai_scorecard?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_role_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          started_at?: string | null
          ended_at?: string | null
          duration_sec?: number | null
          video_drive_file_id?: string | null
          transcript?: Json | null
          ai_scorecard?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_role_id_fkey"
            columns: ["job_role_id"]
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'candidate' | 'admin'
      interview_status: 'pending' | 'in_progress' | 'completed' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Utility types
export type Profile = Tables<'profiles'>
export type JobRole = Tables<'job_roles'>
export type Interview = Tables<'interviews'>

export interface JobRoleConfig {
  language: string
  intro: string
  openingQuestions: string[]
  questionBank: {
    category: string
    questions: string[]
  }[]
  followupPolicy: {
    maxFollowups: number
    triggerConditions: string[]
  }
  scoringRubric: {
    criteria: string
    weight: number
    description: string
  }[]
  wrapUpPrompt: string
  duration: number
}