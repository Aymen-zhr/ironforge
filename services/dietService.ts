import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { MealItem, MealType } from '../types/database';

export type FitnessGoal = 'Aggressive Cut' | 'Lean Bulk' | 'Recomposition';
export type TrainingIntensity = 'Low' | 'Moderate' | 'High';

export interface UserNutritionStats {
  weightKg: number;
  heightCm?: number;
  goal: FitnessGoal;
  intensity?: TrainingIntensity;
  targetKcalPerDay?: number; // Goal kcal per day
  targetKgPerMonth?: number; // Target weight change velocity in kg per month (e.g. +1.0 kg/mo, -2.0 kg/mo)
  targetWaterMl?: number; // Daily water goal in ml (e.g. 3500 ml)
}

export interface DailyTargets {
  targetCalories: number; // Goal kcal per day
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatsGrams: number;
  maintenanceCalories: number;
  goal: FitnessGoal;
  targetKgPerMonth: number; // Target kg per month
  targetWaterMl: number; // Daily water target in ml
}

export interface NewMealPayload {
  name: string;
  meal_type?: MealType;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  source?: 'FridgeScan' | 'OpenFoodFacts' | 'Manual';
}

export interface DietLogData {
  id?: string;
  date: string;
  targetCalories: number; // Goal kcal per day
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFats: number;
  targetKgPerMonth?: number; // Target kg per month
  targetWaterMl?: number; // Goal water in ml per day (e.g. 3500 ml)
  consumedWaterMl?: number; // Consumed water in ml
  waterReminderEnabled?: boolean;
  waterReminderIntervalMinutes?: number;
  meals: MealItem[];
}

export interface OpenFoodProduct {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
}

/**
 * Calculates evidence-based daily caloric and macro targets:
 * - Protein: strict 2.2g per kg of body weight (hypertrophy / retention rule)
 * - Fats: ~25% of total caloric budget for hormone and endocrine support
 * - Carbs: balance allocated to glycogen replenishment and training performance
 */
export function calculateDailyTargets(userStats: UserNutritionStats): DailyTargets {
  const weight = Math.max(40, userStats.weightKg);
  const intensity = userStats.intensity || 'Moderate';

  // Activity multipliers
  const multiplier = intensity === 'High' ? 1.75 : intensity === 'Low' ? 1.35 : 1.55;

  // Baseline maintenance calculation (Mifflin-St Jeor / Katch-McArdle empirical baseline)
  const maintenance = Math.round(weight * 22 * multiplier);

  // Determine monthly weight velocity goal (kg per month)
  let targetKgPerMonth = 0;
  if (userStats.targetKgPerMonth !== undefined) {
    targetKgPerMonth = userStats.targetKgPerMonth;
  } else {
    switch (userStats.goal) {
      case 'Aggressive Cut':
        targetKgPerMonth = -2.0; // -2.0 kg / month
        break;
      case 'Lean Bulk':
        targetKgPerMonth = 1.0; // +1.0 kg / month
        break;
      case 'Recomposition':
      default:
        targetKgPerMonth = 0.0; // 0.0 kg / month
        break;
    }
  }

  // Calculate target calories per day
  let targetCalories = maintenance;
  if (userStats.targetKcalPerDay !== undefined && userStats.targetKcalPerDay > 0) {
    targetCalories = Math.round(userStats.targetKcalPerDay);
    // Sync monthly kg rate from custom daily kcal (7700 kcal per kg)
    const dailyDelta = targetCalories - maintenance;
    targetKgPerMonth = Number(((dailyDelta * 30) / 7700).toFixed(1));
  } else {
    // Derive daily kcal target from monthly kg goal:
    // 1 kg = 7700 kcal -> daily delta = (targetKgPerMonth * 7700) / 30
    const dailyDelta = Math.round((targetKgPerMonth * 7700) / 30);
    targetCalories = maintenance + dailyDelta;
  }

  // Safe floor
  targetCalories = Math.max(1200, targetCalories);

  // Protein rule: exactly 2.2g per kg of total body mass
  const targetProteinGrams = Math.round(weight * 2.2);
  const proteinKcal = targetProteinGrams * 4;

  // Fats rule: ~25% of caloric intake
  const targetFatsGrams = Math.round((targetCalories * 0.25) / 9);
  const fatsKcal = targetFatsGrams * 9;

  // Carbs rule: remaining caloric budget
  const remainingKcal = Math.max(100, targetCalories - (proteinKcal + fatsKcal));
  const targetCarbsGrams = Math.round(remainingKcal / 4);

  // Water rule: 45ml per kg of bodyweight for training hydration
  const targetWaterMl = userStats.targetWaterMl || Math.max(2500, Math.round(weight * 45));

  return {
    targetCalories,
    targetProteinGrams,
    targetCarbsGrams,
    targetFatsGrams,
    maintenanceCalories: maintenance,
    goal: userStats.goal,
    targetKgPerMonth,
    targetWaterMl,
  };
}

/**
 * Retrieves the daily nutrition log for a given date.
 */
export async function getDailyLog(dateString?: string): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;

  // Default baseline fallback if brand new
  const defaultTargets = calculateDailyTargets({
    weightKg: 78,
    goal: 'Lean Bulk',
    intensity: 'Moderate',
  });

  let loadedData: DietLogData = {
    date: targetDate,
    targetCalories: defaultTargets.targetCalories,
    targetProtein: defaultTargets.targetProteinGrams,
    targetCarbs: defaultTargets.targetCarbsGrams,
    targetFats: defaultTargets.targetFatsGrams,
    targetKgPerMonth: defaultTargets.targetKgPerMonth,
    targetWaterMl: defaultTargets.targetWaterMl || 3500,
    consumedWaterMl: 0,
    waterReminderEnabled: true,
    waterReminderIntervalMinutes: 90,
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFats: 0,
    meals: [],
  };

  // 1. Try local cache first for instant 0ms latency
  try {
    const cached = await AsyncStorage.getItem(storageKey);
    if (cached) {
      loadedData = JSON.parse(cached);
      if (loadedData.targetKgPerMonth === undefined) {
        loadedData.targetKgPerMonth = defaultTargets.targetKgPerMonth;
      }
      if (loadedData.targetWaterMl === undefined) {
        loadedData.targetWaterMl = defaultTargets.targetWaterMl || 3500;
      }
      if (loadedData.consumedWaterMl === undefined) {
        loadedData.consumedWaterMl = 0;
      }
      if (loadedData.waterReminderEnabled === undefined) {
        loadedData.waterReminderEnabled = true;
      }
      if (loadedData.waterReminderIntervalMinutes === undefined) {
        loadedData.waterReminderIntervalMinutes = 90;
      }
    }
  } catch (err) {
    console.warn('[dietService] Cache read error:', err);
  }

  // 2. Query Supabase if authenticated
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (user) {
      const { data: dbLog, error } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .maybeSingle();

      if (dbLog && !error) {
        const meals: MealItem[] = Array.isArray(dbLog.meals_json)
          ? (dbLog.meals_json as any as MealItem[])
          : [];

        loadedData = {
          id: dbLog.id,
          date: dbLog.date,
          targetCalories: dbLog.target_calories,
          targetProtein: dbLog.target_protein,
          targetCarbs: dbLog.target_carbs,
          targetFats: dbLog.target_fats,
          consumedCalories: dbLog.consumed_calories,
          consumedProtein: dbLog.consumed_protein,
          consumedCarbs: dbLog.consumed_carbs,
          consumedFats: dbLog.consumed_fats,
          meals,
        };

        // Cache latest remote state
        await AsyncStorage.setItem(storageKey, JSON.stringify(loadedData));
      }
    }
  } catch (dbErr) {
    console.warn('[dietService] Supabase read error:', dbErr);
  }

  return loadedData;
}

/**
 * Adds a new meal to today's log (connecting fridge vision recipes & manual entries).
 */
export async function addMealToDailyLog(
  mealPayload: NewMealPayload,
  dateString?: string
): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;

  const currentLog = await getDailyLog(targetDate);

  const newMeal: MealItem = {
    id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: mealPayload.name,
    meal_type: mealPayload.meal_type || 'Lunch',
    calories: Math.round(Number(mealPayload.calories) || 0),
    protein_grams: Math.round(Number(mealPayload.protein_grams) || 0),
    carbs_grams: Math.round(Number(mealPayload.carbs_grams) || 0),
    fats_grams: Math.round(Number(mealPayload.fats_grams) || 0),
    source: mealPayload.source || 'Manual',
    logged_at: new Date().toISOString(),
  };

  const updatedMeals = [newMeal, ...currentLog.meals];
  const consumedCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
  const consumedProtein = updatedMeals.reduce((sum, m) => sum + m.protein_grams, 0);
  const consumedCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs_grams, 0);
  const consumedFats = updatedMeals.reduce((sum, m) => sum + m.fats_grams, 0);

  const updatedLog: DietLogData = {
    ...currentLog,
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFats,
    meals: updatedMeals,
  };

  // 1. Write to local storage
  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));

  // 2. Persist to Supabase if authenticated
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (user) {
      await supabase.from('diet_logs').upsert(
        {
          user_id: user.id,
          date: targetDate,
          target_calories: updatedLog.targetCalories,
          target_protein: updatedLog.targetProtein,
          target_carbs: updatedLog.targetCarbs,
          target_fats: updatedLog.targetFats,
          consumed_calories: updatedLog.consumedCalories,
          consumed_protein: updatedLog.consumedProtein,
          consumed_carbs: updatedLog.consumedCarbs,
          consumed_fats: updatedLog.consumedFats,
          meals_json: updatedMeals,
        },
        { onConflict: 'user_id,date' }
      );
    }
  } catch (dbErr) {
    console.warn('[dietService] Supabase write warning:', dbErr);
  }

  return updatedLog;
}

/**
 * Removes a meal from today's daily log.
 */
export async function deleteMealFromDailyLog(
  mealId: string,
  dateString?: string
): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;

  const currentLog = await getDailyLog(targetDate);
  const updatedMeals = currentLog.meals.filter((m) => m.id !== mealId);

  const consumedCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
  const consumedProtein = updatedMeals.reduce((sum, m) => sum + m.protein_grams, 0);
  const consumedCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs_grams, 0);
  const consumedFats = updatedMeals.reduce((sum, m) => sum + m.fats_grams, 0);

  const updatedLog: DietLogData = {
    ...currentLog,
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFats,
    meals: updatedMeals,
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));

  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (user) {
      await supabase.from('diet_logs').upsert(
        {
          user_id: user.id,
          date: targetDate,
          target_calories: updatedLog.targetCalories,
          target_protein: updatedLog.targetProtein,
          target_carbs: updatedLog.targetCarbs,
          target_fats: updatedLog.targetFats,
          consumed_calories: updatedLog.consumedCalories,
          consumed_protein: updatedLog.consumedProtein,
          consumed_carbs: updatedLog.consumedCarbs,
          consumed_fats: updatedLog.consumedFats,
          meals_json: updatedMeals,
        },
        { onConflict: 'user_id,date' }
      );
    }
  } catch (dbErr) {
    console.warn('[dietService] Supabase delete warning:', dbErr);
  }

  return updatedLog;
}

/**
 * Updates daily targets (e.g. from user goal switcher or profile update).
 */
export async function updateDailyTargets(
  targets: DailyTargets,
  dateString?: string
): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;

  const currentLog = await getDailyLog(targetDate);

  const updatedLog: DietLogData = {
    ...currentLog,
    targetCalories: targets.targetCalories,
    targetProtein: targets.targetProteinGrams,
    targetCarbs: targets.targetCarbsGrams,
    targetFats: targets.targetFatsGrams,
    targetKgPerMonth: targets.targetKgPerMonth,
    targetWaterMl: targets.targetWaterMl || currentLog.targetWaterMl || 3500,
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));

  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (user) {
      await supabase.from('diet_logs').upsert(
        {
          user_id: user.id,
          date: targetDate,
          target_calories: updatedLog.targetCalories,
          target_protein: updatedLog.targetProtein,
          target_carbs: updatedLog.targetCarbs,
          target_fats: updatedLog.targetFats,
          consumed_calories: updatedLog.consumedCalories,
          consumed_protein: updatedLog.consumedProtein,
          consumed_carbs: updatedLog.consumedCarbs,
          consumed_fats: updatedLog.consumedFats,
          meals_json: updatedLog.meals,
        },
        { onConflict: 'user_id,date' }
      );
    }
  } catch (dbErr) {
    console.warn('[dietService] Target update error:', dbErr);
  }

  return updatedLog;
}

/**
 * Logs consumed water in milliliters (e.g., +250ml glass, +500ml bottle).
 */
export async function logWaterIntake(
  amountMl: number,
  dateString?: string
): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;
  const currentLog = await getDailyLog(targetDate);

  const updatedLog: DietLogData = {
    ...currentLog,
    consumedWaterMl: Math.max(0, (currentLog.consumedWaterMl || 0) + amountMl),
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));
  return updatedLog;
}

/**
 * Resets consumed water for today to 0 ml.
 */
export async function resetWaterIntake(dateString?: string): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;
  const currentLog = await getDailyLog(targetDate);

  const updatedLog: DietLogData = {
    ...currentLog,
    consumedWaterMl: 0,
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));
  return updatedLog;
}

/**
 * Updates daily water target and reminder preferences.
 */
export async function updateWaterSettings(
  settings: {
    targetWaterMl?: number;
    waterReminderEnabled?: boolean;
    waterReminderIntervalMinutes?: number;
  },
  dateString?: string
): Promise<DietLogData> {
  const targetDate = dateString || new Date().toISOString().split('T')[0];
  const storageKey = `@ironforge_diet_log_${targetDate}`;
  const currentLog = await getDailyLog(targetDate);

  const updatedLog: DietLogData = {
    ...currentLog,
    targetWaterMl: settings.targetWaterMl !== undefined ? settings.targetWaterMl : (currentLog.targetWaterMl || 3500),
    waterReminderEnabled: settings.waterReminderEnabled !== undefined ? settings.waterReminderEnabled : currentLog.waterReminderEnabled,
    waterReminderIntervalMinutes: settings.waterReminderIntervalMinutes !== undefined ? settings.waterReminderIntervalMinutes : currentLog.waterReminderIntervalMinutes,
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLog));
  return updatedLog;
}

/**
 * Searches the public Open Food Facts database for branded groceries, ingredients, and snacks.
 */
export async function searchOpenFoodFacts(query: string): Promise<OpenFoodProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=8`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IronForge-NutritionApp/1.0 (contact@ironforge.app)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const products = data.products || [];

    return products
      .filter((p: any) => p.product_name || p.generic_name)
      .map((p: any) => {
        const nutriments = p.nutriments || {};
        const kcal = Math.round(
          nutriments['energy-kcal_100g'] ||
            (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0)
        );
        const protein = Math.round(Number(nutriments.proteins_100g) || 0);
        const carbs = Math.round(Number(nutriments.carbohydrates_100g) || 0);
        const fats = Math.round(Number(nutriments.fat_100g) || 0);

        return {
          id: p.code || p.id || String(Math.random()),
          name: p.product_name || p.generic_name || 'Food Item',
          brand: p.brands || 'Generic',
          calories: kcal,
          protein,
          carbs,
          fats,
          servingSize: p.serving_size || '100g',
        };
      });
  } catch (err) {
    console.warn('[OpenFoodFacts Search] Error:', err);
    return [];
  }
}

/**
 * Looks up an exact barcode in the Open Food Facts API.
 */
export async function lookupBarcodeOpenFoodFacts(barcode: string): Promise<OpenFoodProduct | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      cleanBarcode
    )}.json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IronForge-NutritionApp/1.0 (contact@ironforge.app)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments || {};
      const kcal = Math.round(
        nutriments['energy-kcal_100g'] ||
          (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0)
      );
      const protein = Math.round(Number(nutriments.proteins_100g) || 0);
      const carbs = Math.round(Number(nutriments.carbohydrates_100g) || 0);
      const fats = Math.round(Number(nutriments.fat_100g) || 0);

      return {
        id: p.code || cleanBarcode,
        name: p.product_name || p.generic_name || 'Scanned Food',
        brand: p.brands || 'Generic',
        calories: kcal,
        protein,
        carbs,
        fats,
        servingSize: p.serving_size || '100g',
      };
    }
  } catch (err) {
    console.warn('[OpenFoodFacts Barcode] Error:', err);
  }
  return null;
}
