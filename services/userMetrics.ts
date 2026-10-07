import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  goal: 'cut' | 'bulk' | 'recomp';
  monthlyKgTarget: number;
  trainingDaysPerWeek: number;
  trainingDays: string[]; // e.g. ['Monday', 'Wednesday', 'Friday']
  splitPreference: 'ppl' | 'upper_lower' | 'bro_split';
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  dailyWaterMl: number;
  unitSystem?: 'metric' | 'imperial';
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

export function calculateTDEE(bmr: number, daysPerWeek: number): number {
  const multiplier = daysPerWeek <= 3 ? 1.375 : daysPerWeek <= 5 ? 1.55 : 1.725;
  return Math.round(bmr * multiplier);
}

export function calculateFullProfile(params: {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  goal: 'cut' | 'bulk' | 'recomp';
  monthlyKgTarget: number;
  trainingDaysPerWeek: number;
  trainingDays: string[];
  splitPreference: 'ppl' | 'upper_lower' | 'bro_split';
  unitSystem?: 'metric' | 'imperial';
}): UserProfile {
  // 1. Strict physiological clamping on inputs so nothing can trespass limits
  const safeWeight = Math.min(250, Math.max(35, params.weightKg || 75));
  const safeHeight = Math.min(240, Math.max(120, params.heightCm || 178));
  const safeAge = Math.min(99, Math.max(14, params.age || 22));
  const safeDays = Math.min(7, Math.max(1, params.trainingDaysPerWeek || params.trainingDays?.length || 4));
  const safePace = Math.min(4.0, Math.max(0.1, params.monthlyKgTarget || 1.0));

  const bmr = calculateBMR(safeWeight, safeHeight, safeAge, params.sex);
  const tdee = calculateTDEE(bmr, safeDays);
  
  // 7700 kcal per kg of adipose/muscle tissue, capped between 0 and 1000 kcal/day delta
  const rawDailyDelta = Math.round((safePace * 7700) / 30);
  const dailyCaloricDelta = Math.min(1000, Math.max(100, rawDailyDelta));

  // Determine baseline target calories
  let targetCalories = tdee;
  if (params.goal === 'cut') {
    targetCalories = tdee - dailyCaloricDelta;
    // Hard floor: Never drop below metabolic crash limit or BMR * 0.85
    const floor = params.sex === 'male' ? Math.max(1500, Math.round(bmr * 0.85)) : Math.max(1200, Math.round(bmr * 0.85));
    targetCalories = Math.max(floor, targetCalories);
  } else if (params.goal === 'bulk') {
    targetCalories = tdee + dailyCaloricDelta;
    // Hard ceiling: Never exceed 5000 kcal for athletic safety
    targetCalories = Math.min(5000, targetCalories);
  }

  // Protein & Fat prescription based on physical mass
  const targetProteinG = Math.min(300, Math.max(60, Math.round(2.2 * safeWeight)));
  const targetFatsG = Math.min(150, Math.max(35, Math.round(0.9 * safeWeight)));
  
  // Remaining calories allocated to carbohydrates (minimum 50g for brain/thyroid function)
  const remainingCals = targetCalories - (targetProteinG * 4 + targetFatsG * 9);
  const targetCarbsG = Math.max(50, Math.round(Math.max(0, remainingCals) / 4));

  // Ensure total calories logically match macro sums
  const calculatedCalorieSum = targetProteinG * 4 + targetFatsG * 9 + targetCarbsG * 4;
  targetCalories = Math.max(targetCalories, calculatedCalorieSum);

  // Daily hydration clamped between 2000ml and 6000ml
  const dailyWaterMl = Math.min(6000, Math.max(2000, Math.round(safeWeight * 35 + 500)));

  return {
    ...params,
    weightKg: safeWeight,
    heightCm: safeHeight,
    age: safeAge,
    monthlyKgTarget: safePace,
    trainingDaysPerWeek: safeDays,
    bmr,
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatsG,
    dailyWaterMl,
    unitSystem: params.unitSystem ?? 'metric',
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem('@ironforge_user_profile');
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem('@ironforge_user_profile', JSON.stringify(profile));
}

export function calculateHydrationTarget(weightKg: number, daysPerWeek: number = 4, temperatureC: number = 20): number {
  const safeWeight = Math.min(250, Math.max(35, weightKg || 75));
  const safeDays = Math.min(7, Math.max(1, daysPerWeek || 4));
  const safeTemp = Math.min(50, Math.max(-20, temperatureC || 20));

  const baseWater = safeWeight * 35;
  const trainingAddition = safeDays > 3 ? 500 : 250;
  const heatAddition = safeTemp > 25 ? 500 : 0;
  return Math.min(6500, Math.max(1800, Math.round(baseWater + trainingAddition + heatAddition)));
}

