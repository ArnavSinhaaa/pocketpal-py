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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_type: string
          created_at: string
          current_value: number
          depreciation_rate: number | null
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          current_value: number
          depreciation_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          current_value?: number
          depreciation_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_reminders: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          frequency: string
          id: string
          is_paid: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          frequency?: string
          id?: string
          is_paid?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          frequency?: string
          id?: string
          is_paid?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_documents: {
        Row: {
          created_at: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          related_expense_id: string | null
          related_investment_id: string | null
          tags: string[] | null
          title: string
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          related_expense_id?: string | null
          related_investment_id?: string | null
          tags?: string[] | null
          title: string
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          related_expense_id?: string | null
          related_investment_id?: string | null
          tags?: string[] | null
          title?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          id: string
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          id?: string
          target_amount: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          id?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      indirect_income_sources: {
        Row: {
          amount: number
          created_at: string
          frequency: string
          id: string
          income_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          frequency?: string
          id?: string
          income_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: string
          id?: string
          income_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          beneficiaries: string | null
          coverage_amount: number
          created_at: string
          end_date: string
          id: string
          next_premium_date: string | null
          notes: string | null
          policy_number: string
          policy_type: string
          premium_amount: number
          premium_frequency: string
          provider: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          beneficiaries?: string | null
          coverage_amount: number
          created_at?: string
          end_date: string
          id?: string
          next_premium_date?: string | null
          notes?: string | null
          policy_number: string
          policy_type: string
          premium_amount: number
          premium_frequency: string
          provider: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          beneficiaries?: string | null
          coverage_amount?: number
          created_at?: string
          end_date?: string
          id?: string
          next_premium_date?: string | null
          notes?: string | null
          policy_number?: string
          policy_type?: string
          premium_amount?: number
          premium_frequency?: string
          provider?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          category: string | null
          created_at: string
          current_price: number | null
          current_value: number | null
          id: string
          investment_type: string
          name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          investment_type: string
          name: string
          notes?: string | null
          purchase_date: string
          purchase_price: number
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          investment_type?: string
          name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          created_at: string
          emi_amount: number | null
          end_date: string | null
          id: string
          interest_rate: number
          lender: string
          liability_type: string
          next_payment_date: string | null
          notes: string | null
          outstanding_amount: number
          principal_amount: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emi_amount?: number | null
          end_date?: string | null
          id?: string
          interest_rate: number
          lender: string
          liability_type: string
          next_payment_date?: string | null
          notes?: string | null
          outstanding_amount: number
          principal_amount: number
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emi_amount?: number | null
          end_date?: string | null
          id?: string
          interest_rate?: number
          lender?: string
          liability_type?: string
          next_payment_date?: string | null
          notes?: string | null
          outstanding_amount?: number
          principal_amount?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          annual_salary: number | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_salary?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_salary?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_deductions: {
        Row: {
          amount: number
          claimed: boolean | null
          created_at: string
          deduction_type: string
          description: string
          financial_year: string
          id: string
          proof_document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed?: boolean | null
          created_at?: string
          deduction_type: string
          description: string
          financial_year: string
          id?: string
          proof_document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed?: boolean | null
          created_at?: string
          deduction_type?: string
          description?: string
          financial_year?: string
          id?: string
          proof_document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type: string
          description: string | null
          earned_at: string
          id: string
          points: number
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          earned_at?: string
          id?: string
          points?: number
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          points?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          room_type: string | null
          upload_timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          room_type?: string | null
          upload_timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          room_type?: string | null
          upload_timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_streak: number
          expenses_count: number
          goals_completed: number
          id: string
          last_expense_date: string | null
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          expenses_count?: number
          goals_completed?: number
          id?: string
          last_expense_date?: string | null
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          expenses_count?: number
          goals_completed?: number
          id?: string
          last_expense_date?: string | null
          longest_streak?: number
          total_points?: number
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
    Enums: {},
  },
} as const
