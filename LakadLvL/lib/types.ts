export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          completed_at: string;
          distance_km: number;
          id: number;
          title: string;
          user_id: string;
          xp_earned: number;
        };
        Insert: {
          completed_at?: string;
          distance_km: number;
          id?: number;
          title: string;
          user_id: string;
          xp_earned?: number;
        };
        Update: {
          completed_at?: string;
          distance_km?: number;
          id?: number;
          title?: string;
          user_id?: string;
          xp_earned?: number;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          activity: string;
          activity_km: number;
          ai_advice: string | null;
          created_at: string;
          health_score: number;
          id: number;
          log_date: string;
          mood: number;
          sleep_hours: number;
          user_id: string;
          water_intake: number;
        };
        Insert: {
          activity: string;
          activity_km?: number;
          ai_advice?: string | null;
          created_at?: string;
          health_score: number;
          id?: number;
          log_date: string;
          mood: number;
          sleep_hours: number;
          user_id: string;
          water_intake: number;
        };
        Update: {
          activity?: string;
          activity_km?: number;
          ai_advice?: string | null;
          created_at?: string;
          health_score?: number;
          id?: number;
          log_date?: string;
          mood?: number;
          sleep_hours?: number;
          user_id?: string;
          water_intake?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          hp: number;
          id: string;
          updated_at: string;
          username: string | null;
          xp: number;
        };
        Insert: {
          created_at?: string;
          hp?: number;
          id: string;
          updated_at?: string;
          username?: string | null;
          xp?: number;
        };
        Update: {
          created_at?: string;
          hp?: number;
          id?: string;
          updated_at?: string;
          username?: string | null;
          xp?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_profile_hp: {
        Args: {
          hp_to_add: number;
          user_id: string;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
      add_profile_xp: {
        Args: {
          user_id: string;
          xp_to_add: number;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
