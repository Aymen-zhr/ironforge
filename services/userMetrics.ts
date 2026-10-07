import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { updateDailyTargets } from './dietService';

export type FitnessGoal = 'Aggressive Cut' | 'Moderate Cut' | 'Lean Bulk' | 'Recomp';
export type SplitPreference = 'Push / Pull / Legs' | 'Upper / Lower' | 'Bro Split';

export interface MacroTargets {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
}

export interface UserProfile {
  id?: string;
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'Male' | 'Female';
  goal: FitnessGoal;
  monthlyKgDelta: number; // e.g., -2.0, -1.0, 0, +0.5, +1.0
  trainingDaysCount: number; // 3 to 6
  trainingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  splitPreference: SplitPreference;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWaterMl: number;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_KEY_PROFILE = '@ironforge_user_profile';

/**
 * 1. Calculate Basal Metabolic Rate using Mifflin-St Jeor formula.
 * Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'Male' | 'Female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'Male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * 2. Calculate Total Daily Energy Expenditure (TDEE) based on weekly training frequency.
 */
export function calculateTDEE(bmr: number, trainingDaysCount: number): number {
  let multiplier = 1.2; // Sedentary baseline

  if (trainingDaysCount <= 1) {
    multiplier = 1.2;
  } else if (trainingDaysCount === 2) {
    multiplier = 1.3;
  } else if (trainingDaysCount === 3) {
    multiplier = 1.375; // Lightly active
  } else if (trainingDaysCount === 4) {
    multiplier = 1.465;
  } else if (trainingDaysCount === 5) {
    multiplier = 1.55; // Moderately active
  } else {
    multiplier = 1.725; // Highly active (6-7 days)
  }

  return Math.round(bmr * multiplier);
}

/**
 * 3. Calculate target calories and macronutrients:
 * - Protein: 2.2g per kg of bodyweight
 * - Fats: 0.9g per kg of bodyweight
 * - Remainder allocated to Carbohydrates (4 kcal/g)
 * - Calorie surplus/deficit derived from target monthly kg delta (1kg fat ~ 7700 kcal)
 */
export function calculateMacros(
  tdee: number,
  goal: FitnessGoal,
  monthlyKgDelta: number,
  weightKg: number
): MacroTargets {
  // 1 kg of body fat ~ 7700 kcal -> daily calorie delta over 30 days
  const dailyDelta = Math.round((monthlyKgDelta * 7700) / 30);
  const targetCalories = Math.max(1200, Math.round(tdee + dailyDelta));

  // Protein: 2.2g / kg
  const targetProtein = Math.round(2.2 * weightKg);
  const proteinKcal = targetProtein * 4;

  // Fats: 0.9g / kg
  const targetFats = Math.round(0.9 * weightKg);
  const fatsKcal = targetFats * 9;

  // Remainder to Carbs
  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatsKcal));
  const targetCarbs = Math.max(20, Math.round(remainingKcal / 4));

  return {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
  };
}

/**
 * 4. Calculate daily hydration target:
 * Base: 35ml / kg + training activity bonus + ambient heat adjustment (>25°C).
 */
export function calculateHydrationTarget(
  weightKg: number,
  trainingDaysCount: number,
  temperatureC?: number
): number {
  const baseMl = weightKg * 35;
  const trainingBonusMl = (trainingDaysCount / 7) * 500;
  let heatBonusMl = 0;

  if (temperatureC !== undefined) {
    if (temperatureC > 32) {
      heatBonusMl = 1000;
    } else if (temperatureC > 25) {
      heatBonusMl = 500;
    }
  }

  const rawTarget = baseMl + trainingBonusMl + heatBonusMl;
  // Round to nearest 50 ml, minimum 2500 ml
  const rounded = Math.round(rawTarget / 50) * 50;
  return Math.max(2500, rounded);
}

/**
 * Load user profile from AsyncStorage.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.warn('[getUserProfile] Error reading profile:', err);
    return null;
  }
}

/**
 * Check if the user has completed onboarding.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getUserProfile();
  return Boolean(profile && profile.weightKg > 0);
}

/**
 * Save user profile to AsyncStorage and sync with Supabase profiles table.
 */
export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const now = new Date().toISOString();
  const updatedProfile: UserProfile = {
    ...profile,
    updatedAt: now,
    createdAt: profile.createdAt || now,
  };

  try {
    // 1. Local Persistence
    await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));

    // 2. Synchronize Diet Target Service
    await updateDailyTargets({
      targetCalories: updatedProfile.targetCalories,
      targetProteinGrams: updatedProfile.targetProtein,
      targetCarbsGrams: updatedProfile.targetCarbs,
      targetFatsGrams: updatedProfile.targetFats,
      maintenanceCalories: updatedProfile.tdee,
      goal:
        updatedProfile.goal === 'Moderate Cut'
          ? 'Aggressive Cut'
          : updatedProfile.goal === 'Recomp'
          ? 'Recomposition'
          : updatedProfile.goal,
      targetKgPerMonth: updatedProfile.monthlyKgDelta,
      targetWaterMl: updatedProfile.targetWaterMl,
    });

    // 3. Supabase Remote Sync (best effort)
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          weight_kg: updatedProfile.weightKg,
          height_cm: updatedProfile.heightCm,
          training_goal: `${updatedProfile.goal} (${updatedProfile.monthlyKgDelta >= 0 ? '+' : ''}${updatedProfile.monthlyKgDelta}kg/mo)`,
        });
      }
    } catch (supabaseErr) {
      console.log('[saveUserProfile] Supabase sync skipped/offline:', supabaseErr);
    }
  } catch (err) {
    console.error('[saveUserProfile] Error saving profile:', err);
    throw err;
  }

  return updatedProfile;
}

/**
 * Clear user profile from storage.
 */
export async function clearUserProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_PROFILE);
  } catch (err) {
    console.warn('[clearUserProfile] Error clearing profile:', err);
  }
}
