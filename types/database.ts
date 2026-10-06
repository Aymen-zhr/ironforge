export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MuscleGroup =
  | 'Delts'
  | 'Chest'
  | 'Lats'
  | 'Quads'
  | 'Hamstrings'
  | 'Arms'
  | 'Calves'
  | 'Abs';

export type TierRank = 'S' | 'A' | 'B' | 'C';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  training_goal: string | null;
  created_at: string;
}

export interface BodyScan {
  id: string;
  user_id: string;
  front_image_url: string | null;
  side_image_url: string | null;
  analyzed_at: string;
  overall_symmetry_score: number | null;
}

export interface MuscleTier {
  id: string;
  scan_id: string;
  muscle_group: MuscleGroup;
  rank: TierRank;
  notes: string | null;
}

export interface FridgeIngredient {
  id: string;
  user_id: string;
  name: string;
  detected_quantity: string | null;
  category: string | null;
  expires_at: string | null;
}

export interface WorkoutRoutine {
  id: string;
  user_id: string;
  split_name: string;
  target_weak_points: string[];
  schedule_json: Record<string, any> | null;
  is_active: boolean;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          training_goal?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          training_goal?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      body_scans: {
        Row: BodyScan;
        Insert: {
          id?: string;
          user_id: string;
          front_image_url?: string | null;
          side_image_url?: string | null;
          analyzed_at?: string;
          overall_symmetry_score?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          front_image_url?: string | null;
          side_image_url?: string | null;
          analyzed_at?: string;
          overall_symmetry_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_scans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      muscle_rankings: {
        Row: MuscleTier;
        Insert: {
          id?: string;
          scan_id: string;
          muscle_group: MuscleGroup;
          rank: TierRank;
          notes?: string | null;
        };
        Update: {
          id?: string;
          scan_id?: string;
          muscle_group?: MuscleGroup;
          rank?: TierRank;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "muscle_rankings_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "body_scans";
            referencedColumns: ["id"];
          }
        ];
      };
      fridge_ingredients: {
        Row: FridgeIngredient;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          detected_quantity?: string | null;
          category?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          detected_quantity?: string | null;
          category?: string | null;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fridge_ingredients_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_routines: {
        Row: WorkoutRoutine;
        Insert: {
          id?: string;
          user_id: string;
          split_name: string;
          target_weak_points?: string[];
          schedule_json?: Record<string, any> | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          split_name?: string;
          target_weak_points?: string[];
          schedule_json?: Record<string, any> | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "workout_routines_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      muscle_group: MuscleGroup;
      tier_rank: TierRank;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
