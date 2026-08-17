// טיפוסי מסד הנתונים, כתובים ידנית להתאמה למיגרציה ב-
// supabase/migrations/20260811000000_init_schema.sql
//
// לאחר חיבור פרויקט Supabase חי, אפשר להחליף קובץ זה בפלט של:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type UserRole = "admin" | "student";

export type StudentStatus =
  | "pending_submission"
  | "not_submitted"
  | "pending_review"
  | "published"
  | "expired";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          last_seen_at: string | null;
          notify_new_activity: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          last_seen_at?: string | null;
          notify_new_activity?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          last_seen_at?: string | null;
          notify_new_activity?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          kind: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          kind: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          name: string;
          opened_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          opened_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          opened_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          cohort_id: string;
          profile_id: string | null;
          full_name: string;
          email: string;
          phone: string;
          display_name: string | null;
          bio: string | null;
          quote: string | null;
          work_description: string | null;
          personal_note: string | null;
          trait_1: string | null;
          trait_2: string | null;
          trait_3: string | null;
          profile_photo_path: string | null;
          birth_year: number | null;
          website_url: string | null;
          show_contact_info: boolean;
          status: StudentStatus;
          color_hue: number;
          color_variation: number;
          invite_token: string;
          invite_token_used: boolean;
          invite_sent_at: string | null;
          submission_deadline: string | null;
          submitted_at: string | null;
          published_at: string | null;
          extension_requested_at: string | null;
          extension_approved_at: string | null;
          extension_approved_by: string | null;
          extension_request_count: number;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          profile_id?: string | null;
          full_name: string;
          email: string;
          phone: string;
          display_name?: string | null;
          bio?: string | null;
          quote?: string | null;
          work_description?: string | null;
          personal_note?: string | null;
          trait_1?: string | null;
          trait_2?: string | null;
          trait_3?: string | null;
          profile_photo_path?: string | null;
          birth_year?: number | null;
          website_url?: string | null;
          show_contact_info?: boolean;
          status?: StudentStatus;
          color_hue?: number;
          color_variation?: number;
          invite_token?: string;
          invite_token_used?: boolean;
          invite_sent_at?: string | null;
          submission_deadline?: string | null;
          submitted_at?: string | null;
          published_at?: string | null;
          extension_requested_at?: string | null;
          extension_approved_at?: string | null;
          extension_approved_by?: string | null;
          extension_request_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          student_id: string;
          storage_path: string;
          title: string | null;
          is_selected: boolean;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          storage_path: string;
          title?: string | null;
          is_selected?: boolean;
          display_order?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      public_portfolio_view: {
        Row: {
          id: string;
          display_name: string | null;
          bio: string | null;
          quote: string | null;
          work_description: string | null;
          personal_note: string | null;
          trait_1: string | null;
          trait_2: string | null;
          trait_3: string | null;
          color_hue: number;
          color_variation: number;
          status: StudentStatus;
          published_at: string | null;
          profile_photo_path: string | null;
          birth_year: number | null;
          phone: string | null;
          email: string | null;
          website_url: string | null;
        };
        Relationships: [];
      };
      public_portfolio_photos_view: {
        Row: {
          id: string;
          student_id: string;
          storage_path: string;
          title: string | null;
          display_order: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      check_invite_token: {
        Args: { p_token: string };
        Returns: { student_full_name: string; student_email: string }[];
      };
      claim_invite: {
        Args: { p_token: string };
        Returns: string;
      };
      admin_create_student: {
        Args: {
          p_cohort_id: string;
          p_full_name: string;
          p_email: string;
          p_phone: string;
        };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      admin_resend_invite: {
        Args: { p_student_id: string };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      submit_portfolio: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      admin_publish_portfolio: {
        Args: { p_student_id: string };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      increment_view_count: {
        Args: { p_student_id: string };
        Returns: undefined;
      };
      request_extension: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      admin_approve_extension: {
        Args: { p_student_id: string };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      cron_expire_not_submitted: {
        Args: Record<string, never>;
        Returns: number;
      };
      cron_expire_published_portfolios: {
        Args: Record<string, never>;
        Returns: number;
      };
      create_notification: {
        Args: {
          p_kind: string;
          p_title: string;
          p_body: string | null;
          p_link: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
