import AsyncStorage from '@react-native-async-storage/async-storage';

export type GoalPhase = 'aggressive_cut' | 'moderate_cut' | 'recomp' | 'lean_bulk' | 'aggressive_bulk';

export interface GoalPhaseDetail {
  id: GoalPhase;
  label: string;
  badge: string;
  tagline: string;
  weeklyPaceKg: number;
  caloricDelta: number;
  proteinPerKg: number;
  accentColor: string;
}

export const GOAL_PHASE_CONFIGS: Record<GoalPhase, GoalPhaseDetail> = {
  aggressive_cut: {
    id: 'aggressive_cut',
    label: 'Aggressive Cut',
    badge: 'DEFICIT -600',
    tagline: 'Accelerated adipose depletion with maximum muscle preservation',
    weeklyPaceKg: -0.75,
    caloricDelta: -600,
    proteinPerKg: 2.3,
    accentColor: '#EF4444',
  },
  moderate_cut: {
    id: 'moderate_cut',
    label: 'Moderate Cut',
    badge: 'DEFICIT -350',
    tagline: 'Sustainable steady fat loss without metabolic slow-down',
    weeklyPaceKg: -0.45,
    caloricDelta: -350,
    proteinPerKg: 2.1,
    accentColor: '#F59E0B',
  },
  recomp: {
    id: 'recomp',
    label: 'Body Recomposition',
    badge: 'EQUILIBRIUM',
    tagline: 'Simultaneous lean accretion and fat reduction at mass maintenance',
    weeklyPaceKg: 0.0,
    caloricDelta: 0,
    proteinPerKg: 2.0,
    accentColor: '#00D2FF',
  },
  lean_bulk: {
    id: 'lean_bulk',
    label: 'Lean Bulk',
    badge: 'SURPLUS +275',
    tagline: 'Clean myofibrillar hypertrophy with minimal adipose accumulation',
    weeklyPaceKg: 0.30,
    caloricDelta: 275,
    proteinPerKg: 1.9,
    accentColor: '#10E760',
  },
  aggressive_bulk: {
    id: 'aggressive_bulk',
    label: 'Hypertrophy Overdrive',
    badge: 'SURPLUS +500',
    tagline: 'Aggressive strength acceleration and heavy mass building',
    weeklyPaceKg: 0.50,
    caloricDelta: 500,
    proteinPerKg: 1.8,
    accentColor: '#8B5CF6',
  },
};

export interface UserProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  goal: 'cut' | 'bulk' | 'recomp';
  goalPhase?: GoalPhase;
  targetWeightKg?: number;
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

export interface GoalMilestoneEstimate {
  weeksRemaining: number;
  daysRemaining: number;
  projectedDate: string;
  projectedIsoDate: string;
  weightDeltaKg: number;
  isCompleted: boolean;
  weeklyPaceKg: number;
  newCalories: number;
  newProteinG: number;
  newCarbsG: number;
  newFatsG: number;
}

export function calculateGoalMilestone(params: {
  currentWeightKg: number;
  targetWeightKg: number;
  phase: GoalPhase;
  heightCm?: number;
  age?: number;
  sex?: 'male' | 'female';
  trainingDaysPerWeek?: number;
}): GoalMilestoneEstimate {
  const safeWeight = Math.min(250, Math.max(35, params.currentWeightKg || 75));
  const safeTarget = Math.min(250, Math.max(35, params.targetWeightKg || safeWeight));
  const cfg = GOAL_PHASE_CONFIGS[params.phase] || GOAL_PHASE_CONFIGS.lean_bulk;

  const weightDeltaKg = Math.round(Math.abs(safeTarget - safeWeight) * 10) / 10;
  const isCompleted = weightDeltaKg <= 0.1 && params.phase !== 'recomp';

  let weeklyPaceKg = Math.abs(cfg.weeklyPaceKg);
  let weeksRemaining = 0;

  if (params.phase === 'recomp') {
    weeksRemaining = 12; // 12-week recomposition protocol
  } else if (weeklyPaceKg > 0) {
    weeksRemaining = Math.max(1, Math.round((weightDeltaKg / weeklyPaceKg) * 10) / 10);
  }

  const daysRemaining = Math.round(weeksRemaining * 7);

  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + daysRemaining);
  const projectedIsoDate = `${targetDateObj.getFullYear()}-${String(targetDateObj.getMonth() + 1).padStart(2, '0')}-${String(targetDateObj.getDate()).padStart(2, '0')}`;
  const projectedDate = targetDateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const bmr = calculateBMR(safeWeight, params.heightCm || 178, params.age || 24, params.sex || 'male');
  const tdee = calculateTDEE(bmr, params.trainingDaysPerWeek || 4);

  let newCalories = tdee + cfg.caloricDelta;
  if (cfg.caloricDelta < 0) {
    const floor = (params.sex || 'male') === 'male' ? Math.max(1500, Math.round(bmr * 0.85)) : Math.max(1200, Math.round(bmr * 0.85));
    newCalories = Math.max(floor, newCalories);
  } else {
    newCalories = Math.min(5000, newCalories);
  }

  const newProteinG = Math.min(300, Math.max(80, Math.round(safeWeight * cfg.proteinPerKg)));
  const newFatsG = Math.min(140, Math.max(35, Math.round(safeWeight * 0.85)));
  const remainingCals = newCalories - (newProteinG * 4 + newFatsG * 9);
  const newCarbsG = Math.max(50, Math.round(Math.max(0, remainingCals) / 4));
  newCalories = Math.max(newCalories, newProteinG * 4 + newFatsG * 9 + newCarbsG * 4);

  return {
    weeksRemaining,
    daysRemaining,
    projectedDate,
    projectedIsoDate,
    weightDeltaKg,
    isCompleted,
    weeklyPaceKg: cfg.weeklyPaceKg,
    newCalories,
    newProteinG,
    newCarbsG,
    newFatsG,
  };
}

export function calculateFullProfile(params: {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  goal: 'cut' | 'bulk' | 'recomp';
  goalPhase?: GoalPhase;
  targetWeightKg?: number;
  monthlyKgTarget: number;
  trainingDaysPerWeek: number;
  trainingDays: string[];
  splitPreference: 'ppl' | 'upper_lower' | 'bro_split';
  unitSystem?: 'metric' | 'imperial';
}): UserProfile {
  const safeWeight = Math.min(250, Math.max(35, params.weightKg || 75));
  const safeHeight = Math.min(240, Math.max(120, params.heightCm || 178));
  const safeAge = Math.min(99, Math.max(14, params.age || 22));
  const safeDays = Math.min(7, Math.max(1, params.trainingDaysPerWeek || params.trainingDays?.length || 4));
  const safePace = Math.min(4.0, Math.max(0.1, params.monthlyKgTarget || 1.0));

  const bmr = calculateBMR(safeWeight, safeHeight, safeAge, params.sex);
  const tdee = calculateTDEE(bmr, safeDays);

  const rawDailyDelta = Math.round((safePace * 7700) / 30);
  const dailyCaloricDelta = Math.min(1000, Math.max(100, rawDailyDelta));

  let targetCalories = tdee;
  if (params.goal === 'cut') {
    targetCalories = tdee - dailyCaloricDelta;
    const floor = params.sex === 'male' ? Math.max(1500, Math.round(bmr * 0.85)) : Math.max(1200, Math.round(bmr * 0.85));
    targetCalories = Math.max(floor, targetCalories);
  } else if (params.goal === 'bulk') {
    targetCalories = tdee + dailyCaloricDelta;
    targetCalories = Math.min(5000, targetCalories);
  }

  const targetProteinG = Math.min(300, Math.max(60, Math.round(2.2 * safeWeight)));
  const targetFatsG = Math.min(150, Math.max(35, Math.round(0.9 * safeWeight)));

  const remainingCals = targetCalories - (targetProteinG * 4 + targetFatsG * 9);
  const targetCarbsG = Math.max(50, Math.round(Math.max(0, remainingCals) / 4));

  const calculatedCalorieSum = targetProteinG * 4 + targetFatsG * 9 + targetCarbsG * 4;
  targetCalories = Math.max(targetCalories, calculatedCalorieSum);

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
