// Hand-authored to match supabase/migrations/0001_init.sql.
// Once the Supabase project is linked, regenerate the authoritative version with:
//   npx supabase gen types typescript --linked > types/database.ts

export type UserRole = "admin" | "auditor" | "viewer";
export type UserStatus = "active" | "inactive";
export type RoundStatus = "draft" | "completed";

export type RoundItemState = {
  comp: "yes" | "partial" | "no" | "na" | null;
  note: string;
  person: string;
};

export type RoundState = Record<string, Record<number, RoundItemState>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          fullname: string;
          role: UserRole;
          dept: string | null;
          status: UserStatus;
          last_login: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          fullname: string;
          role: UserRole;
          dept?: string | null;
          status?: UserStatus;
          last_login?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          auditor_id: string;
          dept: string | null;
          date_shift: string | null;
          status: RoundStatus;
          saved_at: string | null;
          pct: number | null;
          non_compliant: number | null;
          partial: number | null;
          critical_nc: number | null;
          total_items: number | null;
          state: RoundState;
          created_at: string;
        };
        Insert: {
          id?: string;
          auditor_id: string;
          dept?: string | null;
          date_shift?: string | null;
          status: RoundStatus;
          saved_at?: string | null;
          pct?: number | null;
          non_compliant?: number | null;
          partial?: number | null;
          critical_nc?: number | null;
          total_items?: number | null;
          state?: RoundState;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rounds"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
