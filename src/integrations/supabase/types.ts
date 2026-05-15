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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          bestseller: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          position: number
          show_in_menu: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bestseller?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          show_in_menu?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bestseller?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          show_in_menu?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          code: string
          created_at: string
          email: string
          id: string
          order_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          id?: string
          order_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          id?: string
          order_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          product_interest: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lumi_conversations: {
        Row: {
          context: Json
          created_at: string
          id: string
          last_user_message: string | null
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          lead_status: string
          message_count: number
          messages: Json
          page_url: string | null
          product_interest: string | null
          updated_at: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          last_user_message?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_status?: string
          message_count?: number
          messages?: Json
          page_url?: string | null
          product_interest?: string | null
          updated_at?: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          last_user_message?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_status?: string
          message_count?: number
          messages?: Json
          page_url?: string | null
          product_interest?: string | null
          updated_at?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumi_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lumi_knowledge: {
        Row: {
          active: boolean
          content: string | null
          created_at: string
          file_path: string | null
          id: string
          kind: string
          position: number
          tags: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          position?: number
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          position?: number
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_payload: string | null
          asaas_pix_qrcode: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qrcode?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qrcode?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          caption: string | null
          color: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          size_kb: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          size_kb?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          size_kb?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_jobs: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          height_cm: number | null
          id: string
          notes: string | null
          order_id: string | null
          product_name: string
          stage: string
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_name: string
          stage?: string
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_name?: string
          stage?: string
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          badge: string | null
          bando_price: number
          bestseller: boolean
          category_id: string | null
          colors: Json
          cover_image: string | null
          created_at: string
          description: string | null
          faq: Json
          featured: boolean
          features: Json
          gallery: Json
          id: string
          installation: string | null
          manual_pdf_url: string | null
          max_height_cm: number
          max_width_cm: number
          min_area: number
          min_height_cm: number
          min_width_cm: number
          motor_manual_price: number
          motor_rf_price: number
          motor_wifi_price: number
          name: string
          package_height_cm: number
          package_length_cm: number
          package_width_cm: number
          price: number
          price_per_sqm: number
          processing_days: number
          product_type: string
          rating: number
          reviews_count: number
          sale_price: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          specs: Json
          stock: number
          stock_min: number
          tags: string[]
          updated_at: string
          video_url: string | null
          weight_kg: number
        }
        Insert: {
          active?: boolean
          badge?: string | null
          bando_price?: number
          bestseller?: boolean
          category_id?: string | null
          colors?: Json
          cover_image?: string | null
          created_at?: string
          description?: string | null
          faq?: Json
          featured?: boolean
          features?: Json
          gallery?: Json
          id?: string
          installation?: string | null
          manual_pdf_url?: string | null
          max_height_cm?: number
          max_width_cm?: number
          min_area?: number
          min_height_cm?: number
          min_width_cm?: number
          motor_manual_price?: number
          motor_rf_price?: number
          motor_wifi_price?: number
          name: string
          package_height_cm?: number
          package_length_cm?: number
          package_width_cm?: number
          price?: number
          price_per_sqm?: number
          processing_days?: number
          product_type?: string
          rating?: number
          reviews_count?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          specs?: Json
          stock?: number
          stock_min?: number
          tags?: string[]
          updated_at?: string
          video_url?: string | null
          weight_kg?: number
        }
        Update: {
          active?: boolean
          badge?: string | null
          bando_price?: number
          bestseller?: boolean
          category_id?: string | null
          colors?: Json
          cover_image?: string | null
          created_at?: string
          description?: string | null
          faq?: Json
          featured?: boolean
          features?: Json
          gallery?: Json
          id?: string
          installation?: string | null
          manual_pdf_url?: string | null
          max_height_cm?: number
          max_width_cm?: number
          min_area?: number
          min_height_cm?: number
          min_width_cm?: number
          motor_manual_price?: number
          motor_rf_price?: number
          motor_wifi_price?: number
          name?: string
          package_height_cm?: number
          package_length_cm?: number
          package_width_cm?: number
          price?: number
          price_per_sqm?: number
          processing_days?: number
          product_type?: string
          rating?: number
          reviews_count?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          specs?: Json
          stock?: number
          stock_min?: number
          tags?: string[]
          updated_at?: string
          video_url?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_first_purchase: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
