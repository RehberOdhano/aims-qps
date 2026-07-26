// Generated via `npx supabase gen types typescript --linked > types/database.ts`,
// then hand-patched to narrow a few check-constraint columns (role, status,
// grp, risk) from `string` to their literal unions — supabase-gen doesn't
// infer literal types from non-enum check constraints. Everything else below
// is exactly what the generator produced; regenerate freely after schema
// changes, just re-apply these narrowing edits (search "NARROWED:").

import type { RiskLevel, SectionGroup } from "@/lib/sections";

export type UserRole = "admin" | "auditor";
export type UserStatus = "active" | "inactive";
export type RoundStatus = "draft" | "completed";

export type RoundItemState = {
  comp: "yes" | "partial" | "no" | "na" | null;
  note: string;
  person: string;
  // Snapshotted onto a *completed* round at save time so a finalized audit
  // record stays self-contained and immune to later edits to the live
  // section/item content (see app/actions/rounds.ts's saveRound()). Absent
  // on drafts, which always resolve against live content instead.
  question?: string;
  std?: string;
  risk?: RiskLevel;
  sectionLabel?: string;
};

export type RoundState = Record<string, Record<string, RoundItemState>>;

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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dept: string | null
          fullname: string
          id: string
          last_login: string | null
          role: UserRole // NARROWED: string
          status: UserStatus // NARROWED: string
          username: string
        }
        Insert: {
          created_at?: string
          dept?: string | null
          fullname: string
          id: string
          last_login?: string | null
          role: UserRole // NARROWED: string
          status?: UserStatus // NARROWED: string
          username: string
        }
        Update: {
          created_at?: string
          dept?: string | null
          fullname?: string
          id?: string
          last_login?: string | null
          role?: UserRole // NARROWED: string
          status?: UserStatus // NARROWED: string
          username?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          auditor_id: string
          created_at: string
          critical_nc: number | null
          date_shift: string | null
          dept: string | null
          id: string
          non_compliant: number | null
          partial: number | null
          pct: number | null
          saved_at: string | null
          state: RoundState // NARROWED: Json
          status: RoundStatus // NARROWED: string
          total_items: number | null
        }
        Insert: {
          auditor_id: string
          created_at?: string
          critical_nc?: number | null
          date_shift?: string | null
          dept?: string | null
          id?: string
          non_compliant?: number | null
          partial?: number | null
          pct?: number | null
          saved_at?: string | null
          state?: RoundState // NARROWED: Json
          status: RoundStatus // NARROWED: string
          total_items?: number | null
        }
        Update: {
          auditor_id?: string
          created_at?: string
          critical_nc?: number | null
          date_shift?: string | null
          dept?: string | null
          id?: string
          non_compliant?: number | null
          partial?: number | null
          pct?: number | null
          saved_at?: string | null
          state?: RoundState // NARROWED: Json
          status?: RoundStatus // NARROWED: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section_items: {
        Row: {
          created_at: string
          id: string
          question: string
          risk: RiskLevel // NARROWED: string
          section_id: string
          sort_order: number
          std: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          risk: RiskLevel // NARROWED: string
          section_id: string
          sort_order: number
          std?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          risk?: RiskLevel // NARROWED: string
          section_id?: string
          sort_order?: number
          std?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          grp: SectionGroup // NARROWED: string
          id: string
          label: string
          sort_order: number
          std: string | null
        }
        Insert: {
          created_at?: string
          grp: SectionGroup // NARROWED: string
          id?: string
          label: string
          sort_order: number
          std?: string | null
        }
        Update: {
          created_at?: string
          grp?: SectionGroup // NARROWED: string
          id?: string
          label?: string
          sort_order?: number
          std?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
