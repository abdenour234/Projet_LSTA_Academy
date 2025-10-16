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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          layout_data: Json | null
          level: string
          school_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          layout_data?: Json | null
          level: string
          school_id: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          layout_data?: Json | null
          level?: string
          school_id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          annee_scolaire: string
          created_at: string | null
          effectif: number | null
          filiere: string | null
          id: string
          level: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          annee_scolaire: string
          created_at?: string | null
          effectif?: number | null
          filiere?: string | null
          id?: string
          level: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          annee_scolaire?: string
          created_at?: string | null
          effectif?: number | null
          filiere?: string | null
          id?: string
          level?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participant_ids: string[]
          school_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_ids: string[]
          school_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_ids?: string[]
          school_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          created_at: string | null
          criteria_data: Json
          final_result: string
          id: string
          session_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria_data: Json
          final_result: string
          id?: string
          session_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria_data?: Json
          final_result?: string
          id?: string
          session_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_students"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_sessions: {
        Row: {
          class_name: string | null
          created_at: string | null
          diagnostic_type: Database["public"]["Enums"]["diagnostic_type"]
          grade_level: string
          id: string
          school_id: string
          session_date: string
          teacher_id: string
          total_students: number
          updated_at: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          diagnostic_type: Database["public"]["Enums"]["diagnostic_type"]
          grade_level: string
          id?: string
          school_id: string
          session_date?: string
          teacher_id: string
          total_students?: number
          updated_at?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          diagnostic_type?: Database["public"]["Enums"]["diagnostic_type"]
          grade_level?: string
          id?: string
          school_id?: string
          session_date?: string
          teacher_id?: string
          total_students?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      diagnostic_students: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          student_name: string
          student_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          student_name: string
          student_order: number
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          student_name?: string
          student_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_students_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          created_at: string | null
          id: string
          level: string
          result: number | null
          school_id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          result?: number | null
          school_id: string
          subject: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          result?: number | null
          school_id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_by: string[] | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          matiere: string | null
          phone: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          matiere?: string | null
          phone?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          matiere?: string | null
          phone?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          last_diagnostic: string | null
          level: string
          logo_url: string | null
          name: string
          region: string
          status: string
          students: number
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id: string
          last_diagnostic?: string | null
          level: string
          logo_url?: string | null
          name: string
          region: string
          status: string
          students: number
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          last_diagnostic?: string | null
          level?: string
          logo_url?: string | null
          name?: string
          region?: string
          status?: string
          students?: number
        }
        Relationships: []
      }
      session_progress: {
        Row: {
          acquired_count: number | null
          competence: string
          created_at: string | null
          id: string
          not_acquired_count: number | null
          session_id: string
        }
        Insert: {
          acquired_count?: number | null
          competence: string
          created_at?: string | null
          id?: string
          not_acquired_count?: number | null
          session_id: string
        }
        Update: {
          acquired_count?: number | null
          competence?: string
          created_at?: string | null
          id?: string
          not_acquired_count?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_sessions: {
        Row: {
          activities_realized: string[] | null
          class_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          percentage_acquired: number | null
          remarks: string | null
          school_id: string
          session_date: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          activities_realized?: string[] | null
          class_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          percentage_acquired?: number | null
          remarks?: string | null
          school_id: string
          session_date: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          activities_realized?: string[] | null
          class_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          percentage_acquired?: number | null
          remarks?: string | null
          school_id?: string
          session_date?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          school_id: string
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          school_id: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          school_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher"
      diagnostic_type:
        | "learning_pace"
        | "learning_style"
        | "multiple_intelligences"
        | "family_support"
        | "participation_motivation"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher"],
      diagnostic_type: [
        "learning_pace",
        "learning_style",
        "multiple_intelligences",
        "family_support",
        "participation_motivation",
      ],
    },
  },
} as const
