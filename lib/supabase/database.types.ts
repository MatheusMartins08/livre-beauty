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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          booked_with: string | null
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          performed_by: string
          price: number
          service_id: string
          source: Database["public"]["Enums"]["appointment_source"]
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          booked_with?: string | null
          client_id: string
          created_at?: string
          ends_at: string
          id?: string
          notes?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          performed_by: string
          price: number
          service_id: string
          source?: Database["public"]["Enums"]["appointment_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          booked_with?: string | null
          client_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          performed_by?: string
          price?: number
          service_id?: string
          source?: Database["public"]["Enums"]["appointment_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_booked_with_fkey"
            columns: ["booked_with"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          active: boolean
          closes_at: string | null
          created_at: string
          opens_at: string | null
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          closes_at?: string | null
          created_at?: string
          opens_at?: string | null
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          closes_at?: string | null
          created_at?: string
          opens_at?: string | null
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      salon_settings: {
        Row: {
          booking_window_days: number
          created_at: string
          demo_commission_rate: number
          id: boolean
          show_prices: boolean
          slot_interval_minutes: number
          time_zone: string
          updated_at: string
        }
        Insert: {
          booking_window_days?: number
          created_at?: string
          demo_commission_rate?: number
          id?: boolean
          show_prices?: boolean
          slot_interval_minutes?: number
          time_zone?: string
          updated_at?: string
        }
        Update: {
          booking_window_days?: number
          created_at?: string
          demo_commission_rate?: number
          id?: boolean
          show_prices?: boolean
          slot_interval_minutes?: number
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          duration: number
          id: string
          image: string
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description: string
          duration: number
          id: string
          image: string
          name: string
          price: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          duration?: number
          id?: string
          image?: string
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          stylist_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          stylist_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          stylist_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: true
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_services: {
        Row: {
          active: boolean
          created_at: string
          service_id: string
          sort_order: number
          stylist_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          service_id: string
          sort_order?: number
          stylist_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          service_id?: string
          sort_order?: number
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          active: boolean
          biography: string
          created_at: string
          description: string
          experience: number
          id: string
          image: string
          name: string
          role: string
          slug: string
          sort_order: number
          specialties: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          biography: string
          created_at?: string
          description: string
          experience: number
          id: string
          image: string
          name: string
          role: string
          slug: string
          sort_order?: number
          specialties?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          biography?: string
          created_at?: string
          description?: string
          experience?: number
          id?: string
          image?: string
          name?: string
          role?: string
          slug?: string
          sort_order?: number
          specialties?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_public_booking: {
        Args: {
          p_email: string
          p_name: string
          p_phone: string
          p_service_id: string
          p_starts_at: string
          p_stylist_id: string
        }
        Returns: Json
      }
      get_booked_ranges: {
        Args: { p_date: string; p_stylist_id?: string }
        Returns: {
          ends_at: string
          performed_by: string
          starts_at: string
        }[]
      }
      get_booking_settings: {
        Args: never
        Returns: {
          booking_window_days: number
          show_prices: boolean
          slot_interval_minutes: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "staff"
      appointment_source: "site" | "painel"
      appointment_status: "agendado" | "concluido" | "faltou" | "cancelado"
      payment_method: "pix" | "cartao" | "dinheiro"
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
    Enums: {
      app_role: ["owner", "staff"],
      appointment_source: ["site", "painel"],
      appointment_status: ["agendado", "concluido", "faltou", "cancelado"],
      payment_method: ["pix", "cartao", "dinheiro"],
    },
  },
} as const
