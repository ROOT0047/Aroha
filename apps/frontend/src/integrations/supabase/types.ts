export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          energy: number | null
          id: string
          log_date: string
          mood: string | null
          notes: string
          sleep_hours: number
          updated_at: string
          user_id: string
          water_ml: number
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          energy?: number | null
          id?: string
          log_date: string
          mood?: string | null
          notes?: string
          sleep_hours?: number
          updated_at?: string
          user_id: string
          water_ml?: number
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          energy?: number | null
          id?: string
          log_date?: string
          mood?: string | null
          notes?: string
          sleep_hours?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
          weight_kg?: number | null
        }
        Relationships: []
      }
      daily_reviews: {
        Row: {
          created_at: string
          id: string
          insights: Json
          kind: string
          missions: Json
          plan: Json
          review_date: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insights?: Json
          kind: string
          missions?: Json
          plan?: Json
          review_date: string
          summary?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insights?: Json
          kind?: string
          missions?: Json
          plan?: Json
          review_date?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          block_id: string | null
          completed: boolean
          created_at: string
          duration_min: number
          goal_id: string | null
          id: string
          session_date: string
          started_at: string
          user_id: string
        }
        Insert: {
          block_id?: string | null
          completed?: boolean
          created_at?: string
          duration_min?: number
          goal_id?: string | null
          id?: string
          session_date?: string
          started_at?: string
          user_id: string
        }
        Update: {
          block_id?: string | null
          completed?: boolean
          created_at?: string
          duration_min?: number
          goal_id?: string | null
          id?: string
          session_date?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          attribute: string
          completed: boolean
          created_at: string
          id: string
          progress: number
          target_date: string | null
          title: string
          user_id: string
          why: string | null
        }
        Insert: {
          attribute?: string
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target_date?: string | null
          title: string
          user_id: string
          why?: string | null
        }
        Update: {
          attribute?: string
          completed?: boolean
          created_at?: string
          id?: string
          progress?: number
          target_date?: string | null
          title?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          cadence: string
          created_at: string
          goal: number
          icon: string
          id: string
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          cadence?: string
          created_at?: string
          goal?: number
          icon?: string
          id?: string
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          cadence?: string
          created_at?: string
          goal?: number
          icon?: string
          id?: string
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          focus_mode_enabled: boolean
          haptics_enabled: boolean
          id: string
          journal_lock_enabled: boolean
          push_enabled: boolean
          reminders_enabled: boolean
          timezone: string
          updated_at: string
          voice_alerts_enabled: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          focus_mode_enabled?: boolean
          haptics_enabled?: boolean
          id: string
          journal_lock_enabled?: boolean
          push_enabled?: boolean
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          voice_alerts_enabled?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          focus_mode_enabled?: boolean
          haptics_enabled?: boolean
          id?: string
          journal_lock_enabled?: boolean
          push_enabled?: boolean
          reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          voice_alerts_enabled?: boolean
        }
        Relationships: []
      }
      schedule_templates: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          name: string
          tagline: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          name: string
          tagline?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          name?: string
          tagline?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          block_date: string
          color: string
          completed: boolean
          created_at: string
          description: string
          end_time: string
          id: string
          priority: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_date?: string
          color?: string
          completed?: boolean
          created_at?: string
          description?: string
          end_time: string
          id?: string
          priority?: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_date?: string
          color?: string
          completed?: boolean
          created_at?: string
          description?: string
          end_time?: string
          id?: string
          priority?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
