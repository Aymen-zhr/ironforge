import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateEstimated1Rm } from './workoutHistoryService';

export type GoalPhase = 'aggressive_cut' | 'moderate_cut' | 'recomp' | 'lean_bulk' | 'aggressive_bulk';

export interface WeightGoalConfig {
  phase: GoalPhase;
  currentWeightKg: number;
  targetWeightKg: number;
  weeklyPaceKg: number;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  baselineTdee: number;
  dailyCaloricDelta: number;
}

export interface DayActivitySnapshot {
  date: string; // YYYY-MM-DD
  workoutCompleted: boolean;
  workoutSplit?: string;
  workoutVolumeKg: number;
  workoutSetsCount: number;
  workoutPrsCount: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed?: number;
  fatsConsumed?: number;
  waterConsumedMl: number;
  waterTargetMl: number;
  weightKg?: number;
  cnsReadinessPct?: number;
  sleepHours?: number;
}

export interface ActiveWorkoutState {
  isActive: boolean;
  splitName: string;
  startTime: number | null;
  elapsedSeconds: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  prsAchieved: number;
}

export interface AegisMealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: string;
  source: 'ai-recipe' | 'quick-log' | 'pantry-manual';
}

export interface MuscleRecoveryState {
  chest: number; // 0-100%
  back: number;
  shoulders: number;
  legs: number;
  arms: number;
  core: number;
  lastTrainedChest?: string;
  lastTrainedBack?: string;
  lastTrainedShoulders?: string;
  lastTrainedLegs?: string;
  lastTrainedArms?: string;
}

export interface WeightCheckIn {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  note?: string;
}

export interface BigLift1Rm {
  benchPress: number;
  squat: number;
  deadlift: number;
  overheadPress: number;
  barbellRow: number;
  weightedPullUp: number;
}

export interface AegisGlobalState {
  activeSession: ActiveWorkoutState;
  // Nutrition & Hydration
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWaterMl: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFats: number;
  consumedWaterMl: number;
  loggedMeals: AegisMealItem[];
  // Recovery & CNS
  sleepHours: number;
  sleepQualityPct: number;
  cnsReadinessPct: number;
  muscleRecovery: MuscleRecoveryState;
  ambientTempC: number;
  heatOffsetWaterMl: number;
  // Progress & Trajectory
  strength1Rm: BigLift1Rm;
  weightCheckIns: WeightCheckIn[];
  currentStreakDays: number;
  // Goal & Calendar tracking
  weightGoal: WeightGoalConfig;
  dailySnapshots: Record<string, DayActivitySnapshot>;
}

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STORAGE_KEY_GLOBAL_STATE = '@aegis_global_store_v2';

// Seed authentic historical snapshots for the athlete's current calendar
function buildInitialSnapshots(): Record<string, DayActivitySnapshot> {
  const t0 = getTodayDateString(0);
  const t1 = getTodayDateString(-1);
  const t2 = getTodayDateString(-2);
  const t3 = getTodayDateString(-3);
  const t4 = getTodayDateString(-4);
  const t5 = getTodayDateString(-5);

  return {
    [t5]: {
      date: t5,
      workoutCompleted: true,
      workoutSplit: 'Posterior Chain & Deadlift',
      workoutVolumeKg: 10400,
      workoutSetsCount: 17,
      workoutPrsCount: 0,
      caloriesConsumed: 2550,
      caloriesTarget: 2600,
      proteinConsumed: 178,
      proteinTarget: 180,
      carbsConsumed: 265,
      fatsConsumed: 68,
      waterConsumedMl: 3500,
      waterTargetMl: 3500,
      weightKg: 80.1,
      cnsReadinessPct: 84,
      sleepHours: 7.2,
    },
    [t4]: {
      date: t4,
      workoutCompleted: true,
      workoutSplit: 'Chest & Tricep Hypertrophy',
      workoutVolumeKg: 9100,
      workoutSetsCount: 19,
      workoutPrsCount: 1,
      caloriesConsumed: 2610,
      caloriesTarget: 2600,
      proteinConsumed: 182,
      proteinTarget: 180,
      carbsConsumed: 275,
      fatsConsumed: 70,
      waterConsumedMl: 3700,
      waterTargetMl: 3500,
      weightKg: 79.8,
      cnsReadinessPct: 88,
      sleepHours: 7.8,
    },
    [t3]: {
      date: t3,
      workoutCompleted: false,
      workoutSplit: 'Active Mobility & Recovery',
      workoutVolumeKg: 0,
      workoutSetsCount: 0,
      workoutPrsCount: 0,
      caloriesConsumed: 2420,
      caloriesTarget: 2600,
      proteinConsumed: 175,
      proteinTarget: 180,
      carbsConsumed: 250,
      fatsConsumed: 62,
      waterConsumedMl: 3400,
      waterTargetMl: 3500,
      weightKg: 79.5,
      cnsReadinessPct: 91,
      sleepHours: 8.0,
    },
    [t2]: {
      date: t2,
      workoutCompleted: true,
      workoutSplit: 'Heavy Quad & Hamstring Dominance',
      workoutVolumeKg: 11200,
      workoutSetsCount: 20,
      workoutPrsCount: 2,
      caloriesConsumed: 2650,
      caloriesTarget: 2600,
      proteinConsumed: 190,
      proteinTarget: 180,
      carbsConsumed: 280,
      fatsConsumed: 72,
      waterConsumedMl: 3800,
      waterTargetMl: 3500,
      weightKg: 79.6,
      cnsReadinessPct: 82,
      sleepHours: 7.4,
    },
    [t1]: {
      date: t1,
      workoutCompleted: true,
      workoutSplit: 'Pull & Upper Lat Hypertrophy',
      workoutVolumeKg: 8450,
      workoutSetsCount: 18,
      workoutPrsCount: 1,
      caloriesConsumed: 2580,
      caloriesTarget: 2600,
      proteinConsumed: 185,
      proteinTarget: 180,
      carbsConsumed: 265,
      fatsConsumed: 68,
      waterConsumedMl: 3600,
      waterTargetMl: 3500,
      weightKg: 79.2,
      cnsReadinessPct: 89,
      sleepHours: 7.6,
    },
    [t0]: {
      date: t0,
      workoutCompleted: false,
      workoutSplit: 'Chest Hypertrophy',
      workoutVolumeKg: 0,
      workoutSetsCount: 0,
      workoutPrsCount: 0,
      caloriesConsumed: 1420,
      caloriesTarget: 2600,
      proteinConsumed: 115,
      proteinTarget: 180,
      carbsConsumed: 145,
      fatsConsumed: 38,
      waterConsumedMl: 2250,
      waterTargetMl: 3500,
      weightKg: 79.0,
      cnsReadinessPct: 92,
      sleepHours: 7.5,
    },
  };
}

const INITIAL_STATE: AegisGlobalState = {
  activeSession: {
    isActive: false,
    splitName: 'Chest Hypertrophy',
    startTime: null,
    elapsedSeconds: 0,
    totalVolumeKg: 0,
    completedSetsCount: 0,
    prsAchieved: 0,
  },
  targetCalories: 2600,
  targetProtein: 180,
  targetCarbs: 270,
  targetFats: 70,
  targetWaterMl: 3500,
  consumedCalories: 1420,
  consumedProtein: 115,
  consumedCarbs: 145,
  consumedFats: 38,
  consumedWaterMl: 2250,
  loggedMeals: [
    {
      id: 'meal-init-1',
      name: 'Pre-Workout Oats & Whey',
      calories: 520,
      protein: 42,
      carbs: 68,
      fats: 9,
      timestamp: '08:30 AM',
      source: 'quick-log',
    },
    {
      id: 'meal-init-2',
      name: 'Anabolic Chicken & Jasmine Rice',
      calories: 680,
      protein: 58,
      carbs: 72,
      fats: 14,
      timestamp: '01:15 PM',
      source: 'ai-recipe',
    },
    {
      id: 'meal-init-3',
      name: 'Greek Yogurt & Almonds',
      calories: 220,
      protein: 15,
      carbs: 5,
      fats: 15,
      timestamp: '04:45 PM',
      source: 'pantry-manual',
    },
  ],
  sleepHours: 7.5,
  sleepQualityPct: 88,
  cnsReadinessPct: 92,
  muscleRecovery: {
    chest: 95,
    back: 88,
    shoulders: 76,
    legs: 45,
    arms: 92,
    core: 85,
  },
  ambientTempC: 24,
  heatOffsetWaterMl: 350,
  strength1Rm: {
    benchPress: 100,
    squat: 140,
    deadlift: 180,
    overheadPress: 65,
    barbellRow: 90,
    weightedPullUp: 35,
  },
  weightCheckIns: [
    { id: 'w-1', date: 'Mon', weightKg: 79.8, bodyFatPct: 13.8 },
    { id: 'w-2', date: 'Tue', weightKg: 79.5, bodyFatPct: 13.7 },
    { id: 'w-3', date: 'Wed', weightKg: 79.6, bodyFatPct: 13.7 },
    { id: 'w-4', date: 'Thu', weightKg: 79.2, bodyFatPct: 13.5 },
    { id: 'w-5', date: 'Today', weightKg: 79.0, bodyFatPct: 13.4 },
  ],
  currentStreakDays: 5,
  weightGoal: {
    phase: 'lean_bulk',
    currentWeightKg: 79.0,
    targetWeightKg: 83.5,
    weeklyPaceKg: 0.30,
    startDate: getTodayDateString(-14),
    targetDate: getTodayDateString(70),
    baselineTdee: 2350,
    dailyCaloricDelta: 250,
  },
  dailySnapshots: buildInitialSnapshots(),
};

// In-Memory State & Pub/Sub
let currentState: AegisGlobalState = { ...INITIAL_STATE };
const listeners = new Set<(state: AegisGlobalState) => void>();
let isInitialized = false;

function calculateDynamicCns(state: AegisGlobalState): number {
  const sleepFactor = Math.min(100, Math.max(20, (state.sleepHours / 8) * 100 * (state.sleepQualityPct / 100)));
  const { chest, back, shoulders, legs, arms } = state.muscleRecovery;
  const avgMuscle = (chest + back + shoulders + legs + arms) / 5;
  const hydrationPct = Math.min(100, (state.consumedWaterMl / Math.max(1, state.targetWaterMl)) * 100);

  const rawScore = 0.4 * sleepFactor + 0.35 * avgMuscle + 0.25 * hydrationPct;
  return Math.min(99, Math.max(35, Math.round(rawScore)));
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_GLOBAL_STATE, JSON.stringify(currentState));
  } catch (err) {
    console.warn('[aegisStateStore] Persist error:', err);
  }
}

function notify() {
  currentState.cnsReadinessPct = calculateDynamicCns(currentState);
  listeners.forEach((l) => l({ ...currentState }));
  persist();
}

// Synchronize today's activities into the active snapshot
function syncTodaySnapshot() {
  const today = getTodayDateString(0);
  const existing = currentState.dailySnapshots[today] || {
    date: today,
    workoutCompleted: false,
    workoutVolumeKg: 0,
    workoutSetsCount: 0,
    workoutPrsCount: 0,
    caloriesConsumed: 0,
    caloriesTarget: currentState.targetCalories,
    proteinConsumed: 0,
    proteinTarget: currentState.targetProtein,
    waterConsumedMl: 0,
    waterTargetMl: currentState.targetWaterMl,
  };

  currentState.dailySnapshots = {
    ...currentState.dailySnapshots,
    [today]: {
      ...existing,
      caloriesConsumed: currentState.consumedCalories,
      caloriesTarget: currentState.targetCalories,
      proteinConsumed: currentState.consumedProtein,
      proteinTarget: currentState.targetProtein,
      carbsConsumed: currentState.consumedCarbs,
      fatsConsumed: currentState.consumedFats,
      waterConsumedMl: currentState.consumedWaterMl,
      waterTargetMl: currentState.targetWaterMl,
      cnsReadinessPct: currentState.cnsReadinessPct,
      sleepHours: currentState.sleepHours,
      weightKg: currentState.weightCheckIns[0]?.weightKg ?? existing.weightKg,
    },
  };
}

export const aegisState = {
  get(): AegisGlobalState {
    return { ...currentState };
  },

  subscribe(listener: (state: AegisGlobalState) => void): () => void {
    listeners.add(listener);
    listener({ ...currentState });
    return () => listeners.delete(listener);
  },

  async init(): Promise<void> {
    if (isInitialized) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_GLOBAL_STATE);
      if (raw) {
        const loaded = JSON.parse(raw);
        currentState = {
          ...INITIAL_STATE,
          ...loaded,
          activeSession: {
            ...INITIAL_STATE.activeSession,
            ...(loaded.activeSession || {}),
          },
          weightGoal: {
            ...INITIAL_STATE.weightGoal,
            ...(loaded.weightGoal || {}),
          },
          dailySnapshots: {
            ...INITIAL_STATE.dailySnapshots,
            ...(loaded.dailySnapshots || {}),
          },
        };
      }
    } catch (e) {
      console.warn('[aegisStateStore] Init error:', e);
    }
    isInitialized = true;
    notify();
  },

  // Active Training Engine
  startWorkoutSession(splitName: string) {
    currentState.activeSession = {
      isActive: true,
      splitName,
      startTime: Date.now(),
      elapsedSeconds: 0,
      totalVolumeKg: 0,
      completedSetsCount: 0,
      prsAchieved: 0,
    };
    notify();
  },

  updateSessionProgress(volumeDeltaKg: number, setsDelta: number, prsDelta: number = 0) {
    if (!currentState.activeSession.isActive) return;
    currentState.activeSession.totalVolumeKg = Math.max(0, currentState.activeSession.totalVolumeKg + volumeDeltaKg);
    currentState.activeSession.completedSetsCount = Math.max(0, currentState.activeSession.completedSetsCount + setsDelta);
    currentState.activeSession.prsAchieved = Math.max(0, currentState.activeSession.prsAchieved + prsDelta);
    notify();
  },

  finishWorkoutSession(): { durationMin: number; volumeKg: number; sets: number; prs: number; split: string } {
    const session = currentState.activeSession;
    const elapsed = session.startTime ? Math.round((Date.now() - session.startTime) / 1000) : session.elapsedSeconds;
    const durationMin = Math.max(1, Math.round(elapsed / 60));
    const result = {
      durationMin,
      volumeKg: session.totalVolumeKg,
      sets: session.completedSetsCount,
      prs: session.prsAchieved,
      split: session.splitName,
    };

    // Apply fatigue to corresponding muscle group
    const lowerSplit = session.splitName.toLowerCase();
    if (lowerSplit.includes('chest')) currentState.muscleRecovery.chest = 35;
    else if (lowerSplit.includes('back')) currentState.muscleRecovery.back = 38;
    else if (lowerSplit.includes('shoulder')) currentState.muscleRecovery.shoulders = 40;
    else if (lowerSplit.includes('leg')) currentState.muscleRecovery.legs = 25;
    else if (lowerSplit.includes('arm')) currentState.muscleRecovery.arms = 42;

    currentState.currentStreakDays += 1;

    // Record completed session in today's calendar snapshot
    const today = getTodayDateString(0);
    const existingSnap = currentState.dailySnapshots[today] || {
      date: today,
      workoutCompleted: false,
      workoutVolumeKg: 0,
      workoutSetsCount: 0,
      workoutPrsCount: 0,
      caloriesConsumed: currentState.consumedCalories,
      caloriesTarget: currentState.targetCalories,
      proteinConsumed: currentState.consumedProtein,
      proteinTarget: currentState.targetProtein,
      waterConsumedMl: currentState.consumedWaterMl,
      waterTargetMl: currentState.targetWaterMl,
    };

    currentState.dailySnapshots = {
      ...currentState.dailySnapshots,
      [today]: {
        ...existingSnap,
        workoutCompleted: true,
        workoutSplit: session.splitName,
        workoutVolumeKg: (existingSnap.workoutVolumeKg || 0) + session.totalVolumeKg,
        workoutSetsCount: (existingSnap.workoutSetsCount || 0) + session.completedSetsCount,
        workoutPrsCount: (existingSnap.workoutPrsCount || 0) + session.prsAchieved,
      },
    };

    currentState.activeSession = {
      ...INITIAL_STATE.activeSession,
      splitName: session.splitName,
    };

    notify();
    return result;
  },

  cancelWorkoutSession() {
    currentState.activeSession = { ...INITIAL_STATE.activeSession };
    notify();
  },

  // Nutrition Actions
  logMeal(meal: Omit<AegisMealItem, 'id' | 'timestamp'>) {
    const newMeal: AegisMealItem = {
      ...meal,
      id: `meal-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    currentState.loggedMeals = [newMeal, ...currentState.loggedMeals];
    currentState.consumedCalories += newMeal.calories;
    currentState.consumedProtein += newMeal.protein;
    currentState.consumedCarbs += newMeal.carbs;
    currentState.consumedFats += newMeal.fats;

    syncTodaySnapshot();
    notify();
  },

  deleteMeal(mealId: string) {
    const target = currentState.loggedMeals.find((m) => m.id === mealId);
    if (target) {
      currentState.consumedCalories = Math.max(0, currentState.consumedCalories - target.calories);
      currentState.consumedProtein = Math.max(0, currentState.consumedProtein - target.protein);
      currentState.consumedCarbs = Math.max(0, currentState.consumedCarbs - target.carbs);
      currentState.consumedFats = Math.max(0, currentState.consumedFats - target.fats);
      currentState.loggedMeals = currentState.loggedMeals.filter((m) => m.id !== mealId);

      syncTodaySnapshot();
      notify();
    }
  },

  logWater(amountMl: number, maxLimitMl?: number) {
    const limit = maxLimitMl || currentState.targetWaterMl || 3500;
    currentState.consumedWaterMl = Math.max(0, Math.min(limit, currentState.consumedWaterMl + amountMl));
    syncTodaySnapshot();
    notify();
  },

  setWater(amountMl: number, maxLimitMl?: number) {
    const limit = maxLimitMl || currentState.targetWaterMl || 3500;
    currentState.consumedWaterMl = Math.max(0, Math.min(limit, amountMl));
    syncTodaySnapshot();
    notify();
  },

  resetWater() {
    currentState.consumedWaterMl = 0;
    syncTodaySnapshot();
    notify();
  },

  // Biometrics & Sleep
  logSleep(hours: number, qualityPct: number) {
    currentState.sleepHours = Math.max(0, Math.min(24, hours));
    currentState.sleepQualityPct = Math.max(0, Math.min(100, qualityPct));
    syncTodaySnapshot();
    notify();
  },

  // Strength 1RM Record
  record1Rm(lift: keyof BigLift1Rm, weightKg: number, reps: number) {
    const estimated = calculateEstimated1Rm(weightKg, reps);
    if (estimated > (currentState.strength1Rm[lift] || 0)) {
      currentState.strength1Rm[lift] = estimated;
      notify();
      return true; // Set new PR
    }
    return false;
  },

  // Weigh-in Record
  logWeightCheckIn(weightKg: number, bodyFatPct?: number, note?: string) {
    const cleanWeight = Math.round(weightKg * 10) / 10;
    const checkIn: WeightCheckIn = {
      id: `checkin-${Date.now()}`,
      date: 'Today',
      weightKg: cleanWeight,
      bodyFatPct,
      note,
    };
    currentState.weightCheckIns = [checkIn, ...currentState.weightCheckIns.slice(0, 10)];

    // Sync to goal current weight
    currentState.weightGoal = {
      ...currentState.weightGoal,
      currentWeightKg: cleanWeight,
    };

    syncTodaySnapshot();
    notify();
  },

  // Weight Goal Engine Configuration
  setWeightGoal(config: Partial<WeightGoalConfig>) {
    currentState.weightGoal = {
      ...currentState.weightGoal,
      ...config,
    };
    notify();
  },

  // Update Macro & Water Targets
  setNutritionTargets(targets: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    water?: number;
  }) {
    if (targets.calories !== undefined) currentState.targetCalories = targets.calories;
    if (targets.protein !== undefined) currentState.targetProtein = targets.protein;
    if (targets.carbs !== undefined) currentState.targetCarbs = targets.carbs;
    if (targets.fats !== undefined) currentState.targetFats = targets.fats;
    if (targets.water !== undefined) currentState.targetWaterMl = targets.water;

    syncTodaySnapshot();
    notify();
  },

  // Day Snapshot Management
  recordDaySnapshot(dateStr: string, updates: Partial<DayActivitySnapshot>) {
    const existing = currentState.dailySnapshots[dateStr] || {
      date: dateStr,
      workoutCompleted: false,
      workoutVolumeKg: 0,
      workoutSetsCount: 0,
      workoutPrsCount: 0,
      caloriesConsumed: 0,
      caloriesTarget: currentState.targetCalories,
      proteinConsumed: 0,
      proteinTarget: currentState.targetProtein,
      waterConsumedMl: 0,
      waterTargetMl: currentState.targetWaterMl,
    };

    currentState.dailySnapshots = {
      ...currentState.dailySnapshots,
      [dateStr]: {
        ...existing,
        ...updates,
      },
    };
    notify();
  },

  getDaySnapshot(dateStr: string): DayActivitySnapshot | undefined {
    return currentState.dailySnapshots[dateStr];
  },
};
