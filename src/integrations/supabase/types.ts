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
      default_prices: {
        Row: {
          created_at: string
          fisherman_id: string
          form: string
          id: string
          price_per_kg: number
          species: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fisherman_id: string
          form: string
          id?: string
          price_per_kg: number
          species: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fisherman_id?: string
          form?: string
          id?: string
          price_per_kg?: number
          species?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "default_prices_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fisherman_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscriptions: {
        Row: {
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      fisherman_profiles: {
        Row: {
          created_at: string
          default_delivery_fee: number
          display_on_homepage: boolean
          fishermans_note: string | null
          id: string
          pickup_address: string
          public_phone_number: string | null
          signature_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_delivery_fee?: number
          display_on_homepage?: boolean
          fishermans_note?: string | null
          id?: string
          pickup_address: string
          public_phone_number?: string | null
          signature_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_delivery_fee?: number
          display_on_homepage?: boolean
          fishermans_note?: string | null
          id?: string
          pickup_address?: string
          public_phone_number?: string | null
          signature_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fisherman_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_slots: {
        Row: {
          created_at: string
          end_time: string
          fisherman_id: string
          id: string
          start_time: string
          type: Database["public"]["Enums"]["fulfillment_type"]
        }
        Insert: {
          created_at?: string
          end_time: string
          fisherman_id: string
          id?: string
          start_time: string
          type: Database["public"]["Enums"]["fulfillment_type"]
        }
        Update: {
          created_at?: string
          end_time?: string
          fisherman_id?: string
          id?: string
          start_time?: string
          type?: Database["public"]["Enums"]["fulfillment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_slots_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fisherman_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          final_delivery_fee: number | null
          fulfillment_slot_id: string
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          final_delivery_fee?: number | null
          fulfillment_slot_id: string
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          final_delivery_fee?: number | null
          fulfillment_slot_id?: string
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_fulfillment_slot_id_fkey"
            columns: ["fulfillment_slot_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_trips: {
        Row: {
          created_at: string
          fisherman_id: string
          id: string
          notes: string | null
          trip_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fisherman_id: string
          id?: string
          notes?: string | null
          trip_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fisherman_id?: string
          id?: string
          notes?: string | null
          trip_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_planned_trips_fisherman"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fisherman_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_quantity: number
          catch_date: string
          created_at: string
          fisherman_id: string
          form: string
          id: string
          price_per_kg: number
          species: string
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          catch_date: string
          created_at?: string
          fisherman_id: string
          form: string
          id?: string
          price_per_kg: number
          species: string
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          catch_date?: string
          created_at?: string
          fisherman_id?: string
          form?: string
          id?: string
          price_per_kg?: number
          species?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fisherman_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_catch_groups: {
        Args: { fisherman_profile_id: string }
        Returns: {
          catch_date: string
          fulfillment_slots: Json
          products: Json
        }[]
      }
    }
    Enums: {
      fulfillment_type: "PICKUP" | "DELIVERY"
      order_status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
      user_role: "ADMIN" | "CUSTOMER"
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
      fulfillment_type: ["PICKUP", "DELIVERY"],
      order_status: ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"],
      user_role: ["ADMIN", "CUSTOMER"],
    },
  },
} as const
