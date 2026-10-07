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

export type MealType = 'Breakfast' | 'Lunch' | 'Post-Workout' | 'Dinner' | 'Snack';

export interface MealItem {
  id: string;
  user_id?: string;
  log_id?: string;
  name: string;
  meal_type: MealType;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  source?: 'FridgeScan' | 'OpenFoodFacts' | 'Manual';
  logged_at: string;
}

export interface DietLog {
  id: string;
  user_id: string;
  date: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
  consumed_calories: number;
  consumed_protein: number;
  consumed_carbs: number;
  consumed_fats: number;
  meals_json?: MealItem[];
  created_at?: string;
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      diet_logs: {
        Row: DietLog;
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          target_calories: number;
          target_protein: number;
          target_carbs: number;
          target_fats: number;
          consumed_calories?: number;
          consumed_protein?: number;
          consumed_carbs?: number;
          consumed_fats?: number;
          meals_json?: Record<string, any>[] | MealItem[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          target_calories?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fats?: number;
          consumed_calories?: number;
          consumed_protein?: number;
          consumed_carbs?: number;
          consumed_fats?: number;
          meals_json?: Record<string, any>[] | MealItem[];
          created_at?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: MealItem;
        Insert: {
          id?: string;
          user_id?: string;
          log_id?: string;
          name: string;
          meal_type: MealType;
          calories: number;
          protein_grams: number;
          carbs_grams: number;
          fats_grams: number;
          source?: 'FridgeScan' | 'OpenFoodFacts' | 'Manual';
          logged_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          log_id?: string;
          name?: string;
          meal_type?: MealType;
          calories?: number;
          protein_grams?: number;
          carbs_grams?: number;
          fats_grams?: number;
          source?: 'FridgeScan' | 'OpenFoodFacts' | 'Manual';
          logged_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      muscle_group_type: MuscleGroup;
      tier_rank_type: TierRank;
    };
    CompositeTypes: Record<string, never>;
  };
}
