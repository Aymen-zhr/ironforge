-- ==============================================================================
-- IronForge Database Schema Migration: 01_initial_schema.sql
-- Description: Core tables, foreign keys, cascade rules, RLS policies, and triggers
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE muscle_group_type AS ENUM (
        'Delts', 'Chest', 'Lats', 'Quads', 'Hamstrings', 'Arms', 'Calves', 'Abs'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tier_rank_type AS ENUM ('S', 'A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 3. Table Definitions
-- ==============================================================================

-- A. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    training_goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. BODY SCANS TABLE
CREATE TABLE IF NOT EXISTS public.body_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front_image_url TEXT,
    side_image_url TEXT,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    overall_symmetry_score NUMERIC(5, 2)
);

-- C. MUSCLE RANKINGS TABLE
CREATE TABLE IF NOT EXISTS public.muscle_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.body_scans(id) ON DELETE CASCADE,
    muscle_group muscle_group_type NOT NULL,
    rank tier_rank_type NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. FRIDGE INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS public.fridge_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    detected_quantity TEXT,
    category TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. WORKOUT ROUTINES TABLE
CREATE TABLE IF NOT EXISTS public.workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    split_name TEXT NOT NULL,
    target_weak_points TEXT[] NOT NULL DEFAULT '{}',
    schedule_json JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. Indexes for Query Optimization
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_body_scans_user_id ON public.body_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_body_scans_analyzed_at ON public.body_scans(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_muscle_rankings_scan_id ON public.muscle_rankings(scan_id);
CREATE INDEX IF NOT EXISTS idx_fridge_ingredients_user_id ON public.fridge_ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_active ON public.workout_routines(user_id, is_active);

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Body Scans Policies
CREATE POLICY "Users can view own body scans"
    ON public.body_scans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body scans"
    ON public.body_scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body scans"
    ON public.body_scans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own body scans"
    ON public.body_scans FOR DELETE
    USING (auth.uid() = user_id);

-- Muscle Rankings Policies
CREATE POLICY "Users can view own muscle rankings"
    ON public.muscle_rankings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.body_scans
            WHERE public.body_scans.id = public.muscle_rankings.scan_id
              AND public.body_scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own muscle rankings"
    ON public.muscle_rankings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.body_scans
            WHERE public.body_scans.id = public.muscle_rankings.scan_id
              AND public.body_scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own muscle rankings"
    ON public.muscle_rankings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.body_scans
            WHERE public.body_scans.id = public.muscle_rankings.scan_id
              AND public.body_scans.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.body_scans
            WHERE public.body_scans.id = public.muscle_rankings.scan_id
              AND public.body_scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own muscle rankings"
    ON public.muscle_rankings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.body_scans
            WHERE public.body_scans.id = public.muscle_rankings.scan_id
              AND public.body_scans.user_id = auth.uid()
        )
    );

-- Fridge Ingredients Policies
CREATE POLICY "Users can view own fridge ingredients"
    ON public.fridge_ingredients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fridge ingredients"
    ON public.fridge_ingredients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fridge ingredients"
    ON public.fridge_ingredients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fridge ingredients"
    ON public.fridge_ingredients FOR DELETE
    USING (auth.uid() = user_id);

-- Workout Routines Policies
CREATE POLICY "Users can view own workout routines"
    ON public.workout_routines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout routines"
    ON public.workout_routines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout routines"
    ON public.workout_routines FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout routines"
    ON public.workout_routines FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 6. Trigger for Automatic Profile Creation on Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
