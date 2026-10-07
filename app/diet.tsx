import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Flame,
  Utensils,
  Plus,
  Trash2,
  Search,
  Barcode,
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  Clock,
  ShieldCheck,
  X,
  Sliders,
  ChevronRight,
  TrendingUp,
  Droplets,
  Bell,
  RotateCcw,
  Sun,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard, GlowButton, MetricBadge, AnimatedMetricRing, AmbientGlow } from '../components/ui';
import { fetchWeather, WeatherData } from '../services/weatherService';
import {
  calculateDailyTargets,
  getDailyLog,
  addMealToDailyLog,
  deleteMealFromDailyLog,
  updateDailyTargets,
  logWaterIntake,
  resetWaterIntake,
  updateWaterSettings,
  searchOpenFoodFacts,
  lookupBarcodeOpenFoodFacts,
  DietLogData,
  DailyTargets,
  FitnessGoal,
  OpenFoodProduct,
  NewMealPayload,
} from '../services/dietService';
import { MealItem, MealType } from '../types/database';

export interface DietScreenProps {
  onBack?: () => void;
  onNavigateToFridge?: () => void;
}

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Post-Workout', 'Dinner', 'Snack'];

export default function DietScreen({ onBack, onNavigateToFridge }: DietScreenProps) {
  // Target Calculation State
  const [weightKg, setWeightKg] = useState<number>(78);
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>('Lean Bulk');
  const [dailyLog, setDailyLog] = useState<DietLogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [modalKcalInput, setModalKcalInput] = useState<string>('2580');
  const [modalKgPerMonth, setModalKgPerMonth] = useState<number>(1.0);
  const [modalWaterMl, setModalWaterMl] = useState<number>(3500);

  // Quick Add Food Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'search' | 'barcode' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<OpenFoodProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodProduct | null>(null);
  const [servingGrams, setServingGrams] = useState<string>('100');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Lunch');

  // Manual Entry Form State
  const [manualName, setManualName] = useState<string>('');
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualProtein, setManualProtein] = useState<string>('');
  const [manualCarbs, setManualCarbs] = useState<string>('');
  const [manualFats, setManualFats] = useState<string>('');

  // Barcode Lookup State
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = useState<boolean>(false);

  // Meal Timeline Filter
  const [timelineFilter, setTimelineFilter] = useState<'All' | MealType>('All');

  // Climate / Weather Hydration Advisory State
  const [climateWeather, setClimateWeather] = useState<WeatherData | null>(null);

  // Fetch daily log & climate telemetry on mount
  useEffect(() => {
    async function loadLog() {
      setLoading(true);
      try {
        const log = await getDailyLog();
        setDailyLog(log);
        setModalKcalInput(String(log.targetCalories || 2580));
        setModalKgPerMonth(log.targetKgPerMonth ?? 1.0);
        setModalWaterMl(log.targetWaterMl || 3500);
      } catch (err) {
        console.warn('[DietScreen] Log load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLog();
    fetchWeather().then(setClimateWeather).catch(() => {});
  }, []);

  // Recalculate and update targets (supports custom kcal per day, custom kg per month & custom water goal)
  const handleApplyNewGoal = async (
    newGoal: FitnessGoal,
    newWeight: number,
    customKcal?: number,
    customKgRate?: number,
    customWaterMl?: number
  ) => {
    const updated = calculateDailyTargets({
      weightKg: newWeight,
      goal: newGoal,
      intensity: 'Moderate',
      targetKcalPerDay: customKcal,
      targetKgPerMonth: customKgRate,
      targetWaterMl: customWaterMl,
    });
    setSelectedGoal(newGoal);
    setWeightKg(newWeight);
    const updatedLog = await updateDailyTargets(updated);
    setDailyLog(updatedLog);
    setModalKcalInput(String(updatedLog.targetCalories));
    setModalKgPerMonth(updatedLog.targetKgPerMonth ?? 1.0);
    setModalWaterMl(updatedLog.targetWaterMl || 3500);
    setShowGoalModal(false);
  };

  // Water Logging & Reminder Handlers
  const handleLogWater = async (amountMl: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    const updated = await logWaterIntake(amountMl);
    setDailyLog(updated);
  };

  const handleResetWater = async () => {
    Alert.alert('Reset Water Intake', "Reset today's logged water to 0 ml?", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const updated = await resetWaterIntake();
          setDailyLog(updated);
        },
      },
    ]);
  };

  const handleToggleReminder = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    const nextState = !(dailyLog?.waterReminderEnabled ?? true);
    const updated = await updateWaterSettings({ waterReminderEnabled: nextState });
    setDailyLog(updated);
  };

  const handleSetReminderInterval = async (intervalMinutes: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    const updated = await updateWaterSettings({ waterReminderIntervalMinutes: intervalMinutes });
    setDailyLog(updated);
  };

  const handleTestReminder = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    const currentL = ((dailyLog?.consumedWaterMl || 0) / 1000).toFixed(2);
    const targetL = ((dailyLog?.targetWaterMl || 3500) / 1000).toFixed(1);
    Alert.alert(
      '💧 Hydration Check Alert',
      `Time to drink water! You've logged ${currentL}L of your ${targetL}L daily goal.\n\nInterval set to every ${dailyLog?.waterReminderIntervalMinutes ?? 90} minutes.`
    );
  };

  // Open Food Facts Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSelectedProduct(null);
    try {
      const results = await searchOpenFoodFacts(searchQuery);
      setSearchResults(results);
    } catch {
      Alert.alert('Search Error', 'Could not fetch Open Food Facts items.');
    } finally {
      setSearching(false);
    }
  };

  // Barcode Search handler
  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeLoading(true);
    setSelectedProduct(null);
    try {
      const product = await lookupBarcodeOpenFoodFacts(barcodeInput);
      if (product) {
        setSelectedProduct(product);
        setServingGrams('100');
      } else {
        Alert.alert('Not Found', 'Barcode not found in Open Food Facts registry.');
      }
    } catch {
      Alert.alert('Lookup Error', 'Could not query barcode registry.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Log Product from Open Food Facts
  const handleLogSelectedProduct = async () => {
    if (!selectedProduct) return;
    const factor = (Number(servingGrams) || 100) / 100;

    const payload: NewMealPayload = {
      name: `${selectedProduct.name} (${Math.round(factor * 100)}g)`,
      meal_type: selectedMealType,
      calories: Math.round(selectedProduct.calories * factor),
      protein_grams: Math.round(selectedProduct.protein * factor),
      carbs_grams: Math.round(selectedProduct.carbs * factor),
      fats_grams: Math.round(selectedProduct.fats * factor),
      source: 'OpenFoodFacts',
    };

    const updated = await addMealToDailyLog(payload);
    setDailyLog(updated);
    setShowAddModal(false);
    setSelectedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
    Alert.alert('Meal Logged', `Logged "${payload.name}" to today's intake!`);
  };

  // Log Manual Food Entry
  const handleLogManualFood = async () => {
    if (!manualName.trim()) {
      Alert.alert('Required', 'Please enter a meal or food name.');
      return;
    }

    const payload: NewMealPayload = {
      name: manualName.trim(),
      meal_type: selectedMealType,
      calories: Number(manualCalories) || 0,
      protein_grams: Number(manualProtein) || 0,
      carbs_grams: Number(manualCarbs) || 0,
      fats_grams: Number(manualFats) || 0,
      source: 'Manual',
    };

    const updated = await addMealToDailyLog(payload);
    setDailyLog(updated);
    setShowAddModal(false);
    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    Alert.alert('Meal Logged', `Logged "${payload.name}" to today's intake!`);
  };

  // Delete Meal handler
  const handleDeleteMeal = (meal: MealItem) => {
    Alert.alert('Remove Meal', `Are you sure you want to remove "${meal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteMealFromDailyLog(meal.id);
          setDailyLog(updated);
        },
      },
    ]);
  };

  if (loading || !dailyLog) {
    return (
      <SafeAreaView className="flex-1 bg-obsidian items-center justify-center">
        <ActivityIndicator size="large" color="#DC2626" />
        <Text className="text-white text-xs font-bold mt-3">Loading Nutritional Telemetry...</Text>
      </SafeAreaView>
    );
  }

  // Derived progress values
  const calorieTarget = dailyLog.targetCalories;
  const calorieConsumed = dailyLog.consumedCalories;
  const calorieRemaining = calorieTarget - calorieConsumed;
  const caloriePercent = Math.min(100, Math.round((calorieConsumed / calorieTarget) * 100));

  const proteinTarget = dailyLog.targetProtein;
  const proteinConsumed = dailyLog.consumedProtein;
  const proteinPercent = Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100));

  const carbsTarget = dailyLog.targetCarbs;
  const carbsConsumed = dailyLog.consumedCarbs;
  const carbsPercent = Math.min(100, Math.round((carbsConsumed / carbsTarget) * 100));

  const fatsTarget = dailyLog.targetFats;
  const fatsConsumed = dailyLog.consumedFats;
  const fatsPercent = Math.min(100, Math.round((fatsConsumed / fatsTarget) * 100));

  const waterTarget = dailyLog.targetWaterMl || 3500;
  const waterConsumed = dailyLog.consumedWaterMl || 0;
  const waterPercent = Math.min(100, Math.round((waterConsumed / waterTarget) * 100));
  const waterTargetLiters = (waterTarget / 1000).toFixed(1);
  const reminderEnabled = dailyLog.waterReminderEnabled ?? true;
  const reminderInterval = dailyLog.waterReminderIntervalMinutes ?? 90;

  // Filtered meals list
  const filteredMeals = timelineFilter === 'All'
    ? dailyLog.meals
    : dailyLog.meals.filter((m) => m.meal_type === timelineFilter);

  return (
    <SafeAreaView className="flex-1 bg-obsidian" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border-dark bg-surface/70">
        <Pressable
          onPress={onBack}
          className="flex-row items-center py-1.5 px-2.5 rounded-lg bg-surface border border-border-dark active:opacity-75"
        >
          <ArrowLeft size={16} color="#94A3B8" />
          <Text className="text-text-dim text-xs font-bold uppercase ml-1.5">
            Back
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Utensils size={16} color="#DC2626" />
          <Text className="text-white text-sm font-black tracking-wider uppercase ml-1.5">
            Diet & Macro Hub
          </Text>
        </View>

        <Pressable
          onPress={() => setShowGoalModal(true)}
          className="flex-row items-center px-2.5 py-1 rounded-full bg-blood-red/15 border border-blood-red/40 active:opacity-75"
        >
          <Sliders size={12} color="#DC2626" />
          <Text className="text-blood-red text-[10px] font-black uppercase tracking-wider ml-1">
            {calorieTarget} kcal/day • {(dailyLog?.targetKgPerMonth ?? 1.0) >= 0 ? '+' : ''}{dailyLog?.targetKgPerMonth ?? 1.0} kg/mo
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Visual Banner */}
        <View className="w-full h-36 rounded-2xl overflow-hidden mb-5 border border-forge-border relative">
          <Image
            source={require('../assets/generated/hero-nutrition.jpg')}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-forge-black/60" />
          <View className="absolute bottom-3 left-3 right-3 flex-row items-end justify-between">
            <View>
              <View className="px-2 py-0.5 rounded-full bg-blood-red/20 border border-blood-red/50 self-start mb-1">
                <Text className="text-blood-red text-[9px] font-black uppercase tracking-wider">
                  {(dailyLog?.targetKgPerMonth ?? 1.0) >= 0 ? '+' : ''}{dailyLog?.targetKgPerMonth ?? 1.0} KG / MONTH GOAL
                </Text>
              </View>
              <Text className="text-bone-white font-black text-xl tracking-tight leading-tight">
                Daily Macro Targets & Fuel
              </Text>
              <Text className="text-ash-gray text-xs mt-0.5">
                Target: {calorieTarget} kcal/day • 2.2g/kg protein priority.
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-xl bg-forge-black/90 border border-forge-border">
              <Text className="text-blood-red text-[10px] font-mono font-bold">
                {(dailyLog?.targetKgPerMonth ?? 1.0) >= 0 ? '+' : ''}{dailyLog?.targetKgPerMonth ?? 1.0} KG/MO
              </Text>
            </View>
          </View>
        </View>

        {/* HERO CALORIE PROGRESS CARD */}
        <GlassCard variant="glow" className="p-4 mb-5 border-blood-red/40 bg-[#0D0D11]/95">
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/[0.07]">
            <View className="flex-row items-center">
              <Flame size={16} color="#DC2626" />
              <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-widest ml-1.5">
                Goal: {calorieTarget.toLocaleString()} kcal / day
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-blood-red/20 border border-blood-red/40">
              <Text className="text-blood-red text-[10px] font-mono tabular-nums font-black tracking-widest uppercase">
                {(dailyLog?.targetKgPerMonth ?? 1.0) >= 0 ? '+' : ''}{dailyLog?.targetKgPerMonth ?? 1.0} KG/MO PACING
              </Text>
            </View>
          </View>

          {/* Center Gauge + Readouts */}
          <View className="flex-row items-center justify-between my-2">
            <View className="items-center justify-center pr-3">
              <AnimatedMetricRing
                score={caloriePercent}
                size={118}
                strokeWidth={9}
                label="KCAL/DAY"
                sublabel={`${caloriePercent}%`}
                variant="blood"
              />
            </View>

            <View className="flex-1 pl-3 border-l border-white/[0.07] justify-center">
              <View className="mb-2.5">
                <Text className="text-[#71717A] text-[10px] font-extrabold uppercase tracking-widest">
                  Consumed Today
                </Text>
                <Text className="text-[#F4F4F5] font-mono tabular-nums font-black text-2xl tracking-tight">
                  {calorieConsumed.toLocaleString()}{' '}
                  <Text className="text-[#71717A] text-xs font-normal">/ {calorieTarget.toLocaleString()} kcal/day</Text>
                </Text>
              </View>

              <View>
                <Text className="text-[#71717A] text-[10px] font-extrabold uppercase tracking-widest">
                  {calorieRemaining >= 0 ? 'Remaining Energy Today' : 'Caloric Surplus'}
                </Text>
                <Text
                  className={`font-mono tabular-nums font-black text-lg ${
                    calorieRemaining >= 0 ? 'text-blood-red' : 'text-amber-400'
                  }`}
                >
                  {Math.abs(calorieRemaining).toLocaleString()} kcal
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-white/[0.07] mt-2">
            <Text className="text-[#71717A] text-[10px] font-mono">
              Daily Goal: {calorieTarget} kcal/day • Target: {(dailyLog?.targetKgPerMonth ?? 1.0) >= 0 ? '+' : ''}{dailyLog?.targetKgPerMonth ?? 1.0} kg/mo
            </Text>
            <Pressable
              onPress={() => setShowGoalModal(true)}
              className="flex-row items-center active:opacity-75"
            >
              <Text className="text-blood-red text-[11px] font-extrabold uppercase tracking-widest mr-0.5">Calibrate Goals</Text>
              <ChevronRight size={12} color="#DC2626" />
            </Pressable>
          </View>
        </GlassCard>

        {/* 3 HIGH-CONTRAST MACRO BADGES */}
        <View className="flex-row gap-2.5 mb-5">
          {/* PROTEIN CARD */}
          <View className="flex-1 p-3 rounded-xl bg-[#0D0D11]/90 border border-red-600/30 shadow-sm shadow-blood-red/10">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-blood-red text-[11px] font-black uppercase tracking-widest">
                Protein
              </Text>
              <Text className="text-[#71717A] text-[10px] font-mono tabular-nums font-bold">{proteinPercent}%</Text>
            </View>
            <Text className="text-[#F4F4F5] text-lg font-mono tabular-nums font-black tracking-tight">
              {proteinConsumed}
              <Text className="text-[#71717A] text-xs font-semibold"> / {proteinTarget}g</Text>
            </Text>
            <View className="w-full h-1.5 rounded-full bg-forge-black mt-2 overflow-hidden">
              <View
                className="h-full bg-blood-red rounded-full"
                style={{ width: `${proteinPercent}%` }}
              />
            </View>
            <Text className="text-blood-red/80 text-[9px] font-extrabold uppercase tracking-widest mt-1.5">
              2.2g/kg Strict
            </Text>
          </View>

          {/* CARBS CARD */}
          <View className="flex-1 p-3 rounded-xl bg-[#0D0D11]/90 border border-white/[0.07] shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-cyan-400 text-[11px] font-black uppercase tracking-widest">
                Carbs
              </Text>
              <Text className="text-[#71717A] text-[10px] font-mono tabular-nums font-bold">{carbsPercent}%</Text>
            </View>
            <Text className="text-[#F4F4F5] text-lg font-mono tabular-nums font-black tracking-tight">
              {carbsConsumed}
              <Text className="text-[#71717A] text-xs font-semibold"> / {carbsTarget}g</Text>
            </Text>
            <View className="w-full h-1.5 rounded-full bg-forge-black mt-2 overflow-hidden">
              <View
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${carbsPercent}%` }}
              />
            </View>
            <Text className="text-cyan-400/80 text-[9px] font-extrabold uppercase tracking-widest mt-1.5">
              Glycogen Drive
            </Text>
          </View>

          {/* FATS CARD */}
          <View className="flex-1 p-3 rounded-xl bg-[#0D0D11]/90 border border-white/[0.07] shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-amber-400 text-[11px] font-black uppercase tracking-widest">
                Fats
              </Text>
              <Text className="text-[#71717A] text-[10px] font-mono tabular-nums font-bold">{fatsPercent}%</Text>
            </View>
            <Text className="text-[#F4F4F5] text-lg font-mono tabular-nums font-black tracking-tight">
              {fatsConsumed}
              <Text className="text-[#71717A] text-xs font-semibold"> / {fatsTarget}g</Text>
            </Text>
            <View className="w-full h-1.5 rounded-full bg-forge-black mt-2 overflow-hidden">
              <View
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${fatsPercent}%` }}
              />
            </View>
            <Text className="text-amber-400/80 text-[9px] font-extrabold uppercase tracking-widest mt-1.5">
              Hormone Base
            </Text>
          </View>
        </View>

        {/* HYDRATION COMMAND CENTER & WATER REMINDER */}
        <GlassCard variant="default" className="p-4 mb-5 border-cyan-500/30 bg-[#0D0D11]/95 rounded-2xl">
          <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/[0.07]">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 items-center justify-center mr-2.5">
                <Droplets size={16} color="#06B6D4" />
              </View>
              <View>
                <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-widest">
                  Daily Water Target
                </Text>
                <Text className="text-[#71717A] text-[9.5px] font-mono">
                  Goal: {waterTargetLiters}L ({waterTarget.toLocaleString()} ml / day)
                </Text>
              </View>
            </View>

            <View className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40">
              <Text className="text-cyan-400 text-[10px] font-mono font-bold tabular-nums">
                {waterPercent}% LOGGED
              </Text>
            </View>
          </View>

          {/* Water Intake Progress Readout */}
          <View className="flex-row items-center justify-between mb-2.5">
            <View>
              <Text className="text-[#F4F4F5] font-mono font-black text-2xl tabular-nums tracking-tight">
                {(waterConsumed / 1000).toFixed(2)}L{' '}
                <Text className="text-[#71717A] text-xs font-normal">/ {waterTargetLiters}L per day</Text>
              </Text>
              <Text className="text-cyan-400 text-[10px] font-bold mt-0.5">
                {waterConsumed >= waterTarget
                  ? 'Goal Hit! 100% cellular hydration achieved'
                  : `${((waterTarget - waterConsumed) / 1000).toFixed(2)}L remaining today`}
              </Text>
            </View>

            <Pressable
              onPress={handleResetWater}
              className="py-1 px-2.5 rounded-lg bg-[#0A0A0C] border border-white/[0.08] active:opacity-75 flex-row items-center"
            >
              <RotateCcw size={10} color="#71717A" />
              <Text className="text-[#71717A] text-[9.5px] font-mono uppercase ml-1">Reset</Text>
            </Pressable>
          </View>

          {/* High-Contrast Water Progress Bar */}
          <View className="w-full h-2 rounded-full bg-[#0A0A0C] mb-3.5 overflow-hidden border border-white/[0.05]">
            <View
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${Math.min(100, waterPercent)}%` }}
            />
          </View>

          {/* Climate & Weather Hydration Sync Module (Open-Meteo Public API) */}
          {climateWeather && (
            <View className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 mb-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Sun size={15} color="#F59E0B" />
                <View className="ml-2 flex-1">
                  <Text className="text-[#F4F4F5] text-[10px] font-bold">
                    {climateWeather.location.name}: {climateWeather.temperature}°C &bull; {climateWeather.weatherLabel}
                  </Text>
                  <Text className="text-cyan-400 text-[9px] font-mono">
                    {climateWeather.hydrationBonusMl > 0
                      ? `+${climateWeather.hydrationBonusMl}ml suggested due to ambient heat`
                      : 'Optimal ambient climate for cellular hydration'}
                  </Text>
                </View>
              </View>

              {climateWeather.hydrationBonusMl > 0 && (
                <Pressable
                  onPress={() => handleLogWater(climateWeather.hydrationBonusMl)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                  className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 active:opacity-75"
                >
                  <Text className="text-cyan-300 font-mono font-bold text-[9px]">
                    +LOG {climateWeather.hydrationBonusMl}ML
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Quick-Log Water Buttons */}
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[#71717A] text-[9.5px] font-mono uppercase tracking-widest">
              Quick Log Intake:
            </Text>
            <Text className="text-[#71717A] text-[9px] font-mono">
              +45ml/kg strength benchmark
            </Text>
          </View>

          <View className="flex-row gap-2 mb-4">
            {[
              { amount: 250, label: '+250ml', sub: 'Glass' },
              { amount: 500, label: '+500ml', sub: 'Bottle' },
              { amount: 750, label: '+750ml', sub: 'Shaker' },
              { amount: 1000, label: '+1,000ml', sub: 'Jug' },
            ].map((btn) => (
              <Pressable
                key={btn.amount}
                onPress={() => handleLogWater(btn.amount)}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                className="flex-1 py-2 px-1 rounded-xl bg-[#0A0A0C] border border-cyan-500/30 items-center justify-center shadow-sm"
              >
                <Text className="text-cyan-400 text-xs font-black font-mono">{btn.label}</Text>
                <Text className="text-[#71717A] text-[8.5px] mt-0.5">{btn.sub}</Text>
              </Pressable>
            ))}
          </View>

          {/* WATER REMINDER SECTION */}
          <View className="pt-3 border-t border-white/[0.07]">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Bell size={13} color="#06B6D4" />
                <Text className="text-[#F4F4F5] text-xs font-bold uppercase tracking-wider ml-1.5">
                  Hydration Reminders
                </Text>
              </View>

              <Pressable
                onPress={handleToggleReminder}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                className={`px-3 py-1 rounded-full border flex-row items-center ${
                  reminderEnabled
                    ? 'bg-cyan-500/20 border-cyan-400'
                    : 'bg-[#0A0A0C] border-white/[0.1]'
                }`}
              >
                <View className={`w-2 h-2 rounded-full mr-1.5 ${reminderEnabled ? 'bg-cyan-400' : 'bg-[#71717A]'}`} />
                <Text className={`text-[9.5px] font-black uppercase ${reminderEnabled ? 'text-cyan-400' : 'text-[#71717A]'}`}>
                  {reminderEnabled ? 'ACTIVE' : 'MUTED'}
                </Text>
              </Pressable>
            </View>

            {reminderEnabled && (
              <View>
                <Text className="text-[#71717A] text-[9.5px] mb-2 font-mono uppercase tracking-widest">
                  Reminder Interval:
                </Text>
                <View className="flex-row gap-1.5 mb-2.5">
                  {[45, 60, 90, 120].map((mins) => (
                    <Pressable
                      key={mins}
                      onPress={() => handleSetReminderInterval(mins)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      className={`flex-1 py-1.5 rounded-lg border items-center ${
                        reminderInterval === mins
                          ? 'bg-cyan-500/20 border-cyan-400'
                          : 'bg-[#0A0A0C] border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-mono font-bold ${
                          reminderInterval === mins ? 'text-cyan-400' : 'text-[#71717A]'
                        }`}
                      >
                        {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.06] flex-row items-center justify-between">
                  <Text className="text-[#71717A] text-[9.5px] font-mono flex-1 mr-2">
                    Active: pinging every {reminderInterval} mins during training & recovery
                  </Text>
                  <Pressable
                    onPress={handleTestReminder}
                    style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40"
                  >
                    <Text className="text-cyan-400 text-[9px] font-black uppercase">Test Alert</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </GlassCard>

        {/* QUICK ACTION BAR */}
        <View className="gap-2.5 mb-6">
          {/* Fridge Scanner Bridge CTA */}
          <Pressable
            onPress={onNavigateToFridge}
            className="p-3.5 rounded-xl bg-[#0D0D11]/90 border border-cyan-500/40 flex-row items-center justify-between active:opacity-85 shadow-sm shadow-cyan-500/20"
          >
            <View className="flex-row items-center flex-1 pr-2">
              <View className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 items-center justify-center mr-3">
                <Sparkles size={18} color="#06B6D4" />
              </View>
              <View>
                <Text className="text-cyan-400 font-extrabold text-xs uppercase tracking-widest">
                  Fridge AI Recipe Engine
                </Text>
                <Text className="text-[#F4F4F5] font-bold text-sm">
                  Scan Fridge for High-Protein Meal
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#06B6D4" />
          </Pressable>

          {/* Quick Add Food Button */}
          <GlowButton
            title="+ QUICK ADD FOOD // OPEN FOOD FACTS"
            variant="blood"
            size="md"
            icon={<Plus size={16} color="#F4F4F5" />}
            onPress={() => {
              setModalMode('search');
              setShowAddModal(true);
            }}
          />
        </View>

        {/* TODAY'S MEALS TIMELINE */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Clock size={16} color="#DC2626" />
              <Text className="text-[#F4F4F5] text-base font-extrabold tracking-widest uppercase ml-2">
                TODAY'S MEALS TIMELINE ({dailyLog.meals.length})
              </Text>
            </View>
            <Text className="text-[#71717A] text-[11px] font-mono">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {/* Meal Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3.5"
            contentContainerStyle={{ gap: 6 }}
          >
            {(['All', 'Breakfast', 'Lunch', 'Post-Workout', 'Dinner', 'Snack'] as ('All' | MealType)[]).map((tab) => {
              const isActive = timelineFilter === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setTimelineFilter(tab)}
                  className={`py-1.5 px-3 rounded-full border ${
                    isActive
                      ? 'bg-accent/20 border-accent/60'
                      : 'bg-surface border-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? 'text-accent' : 'text-text-dim'
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Meals List */}
          {filteredMeals.length === 0 ? (
            <GlassCard variant="default" className="p-6 items-center text-center">
              <Utensils size={28} color="#64748B" />
              <Text className="text-white font-extrabold text-sm mt-3">
                No meals logged for this category yet
              </Text>
              <Text className="text-text-dim text-xs mt-1 text-center max-w-[260px]">
                Add branded items from Open Food Facts or generate macro-targeted recipes from your fridge.
              </Text>
              <Pressable
                onPress={() => {
                  setModalMode('search');
                  setShowAddModal(true);
                }}
                className="mt-3.5 py-2 px-4 rounded-xl bg-accent/20 border border-accent/40 active:opacity-75"
              >
                <Text className="text-accent text-xs font-bold uppercase">
                  + Add First Meal
                </Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View className="gap-3">
              {filteredMeals.map((meal) => {
                const timeStr = meal.logged_at
                  ? new Date(meal.logged_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Today';

                return (
                  <GlassCard key={meal.id} variant="default" className="p-3.5">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <View className="px-2 py-0.5 rounded bg-accent/15 border border-accent/30">
                          <Text className="text-accent text-[10px] font-extrabold uppercase">
                            {meal.meal_type}
                          </Text>
                        </View>
                        {meal.source && (
                          <View className="px-2 py-0.5 rounded bg-surface border border-border-dark">
                            <Text className="text-text-dim text-[10px] font-mono">
                              {meal.source === 'FridgeScan' ? 'Fridge AI' : meal.source}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Text className="text-text-dim text-[11px] font-mono">{timeStr}</Text>
                        <Pressable
                          onPress={() => handleDeleteMeal(meal)}
                          className="p-1 rounded active:opacity-75"
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>

                    <Text className="text-white font-extrabold text-base mb-2.5">
                      {meal.name}
                    </Text>

                    {/* Macro Breakdown Pills */}
                    <View className="flex-row gap-2">
                      <View className="flex-1 py-1 px-2 rounded-lg bg-obsidian border border-border-dark items-center">
                        <Text className="text-text-dim text-[9px] font-bold uppercase">Kcal</Text>
                        <Text className="text-white text-xs font-black mt-0.5">
                          {meal.calories}
                        </Text>
                      </View>

                      <View className="flex-1 py-1 px-2 rounded-lg bg-accent/10 border border-accent/40 items-center">
                        <Text className="text-accent text-[9px] font-bold uppercase">Protein</Text>
                        <Text className="text-accent text-xs font-black mt-0.5">
                          {meal.protein_grams}g
                        </Text>
                      </View>

                      <View className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 items-center">
                        <Text className="text-cyan-400 text-[9px] font-bold uppercase">Carbs</Text>
                        <Text className="text-cyan-400 text-xs font-black mt-0.5">
                          {meal.carbs_grams}g
                        </Text>
                      </View>

                      <View className="flex-1 py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/40 items-center">
                        <Text className="text-amber-400 text-[9px] font-bold uppercase">Fats</Text>
                        <Text className="text-amber-400 text-xs font-black mt-0.5">
                          {meal.fats_grams}g
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* QUICK ADD FOOD MODAL */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-obsidian/80">
          <View className="bg-surface-card border-t border-border-dark rounded-t-3xl max-h-[85%] p-5">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border-dark mb-4">
              <View className="flex-row items-center">
                <Utensils size={18} color="#DC2626" />
                <Text className="text-white font-extrabold text-base uppercase tracking-tight ml-2">
                  Quick Add Food Intake
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-obsidian items-center justify-center active:opacity-75"
              >
                <X size={16} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Mode Switcher */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => {
                  setModalMode('search');
                  setSelectedProduct(null);
                }}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  modalMode === 'search'
                    ? 'bg-accent/20 border-accent/60'
                    : 'bg-obsidian border-border-dark'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    modalMode === 'search' ? 'text-accent' : 'text-text-dim'
                  }`}
                >
                  Open Food Facts
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setModalMode('barcode');
                  setSelectedProduct(null);
                }}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  modalMode === 'barcode'
                    ? 'bg-accent/20 border-accent/60'
                    : 'bg-obsidian border-border-dark'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    modalMode === 'barcode' ? 'text-accent' : 'text-text-dim'
                  }`}
                >
                  Barcode Lookup
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setModalMode('manual');
                  setSelectedProduct(null);
                }}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  modalMode === 'manual'
                    ? 'bg-accent/20 border-accent/60'
                    : 'bg-obsidian border-border-dark'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    modalMode === 'manual' ? 'text-accent' : 'text-text-dim'
                  }`}
                >
                  Custom Manual
                </Text>
              </Pressable>
            </View>

            {/* Meal Type Selection */}
            <View className="mb-4">
              <Text className="text-text-dim text-[11px] font-bold uppercase mb-1.5">
                Target Meal Slot:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {MEAL_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedMealType(type)}
                    className={`py-1.5 px-3 rounded-lg border ${
                      selectedMealType === type
                        ? 'bg-accent/20 border-accent/60'
                        : 'bg-obsidian border-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedMealType === type ? 'text-accent' : 'text-text-dim'
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* MODE 1: OPEN FOOD FACTS SEARCH */}
            {modalMode === 'search' && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="flex-1 flex-row items-center px-3 py-2 rounded-xl bg-obsidian border border-border-dark">
                    <Search size={16} color="#94A3B8" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="e.g. Greek Yogurt, Oats, Chicken..."
                      placeholderTextColor="#64748B"
                      onSubmitEditing={handleSearch}
                      className="flex-1 text-white text-xs ml-2 font-medium"
                    />
                  </View>
                  <Pressable
                    onPress={handleSearch}
                    disabled={searching}
                    className="py-2.5 px-3.5 rounded-xl bg-accent items-center justify-center active:opacity-85"
                  >
                    {searching ? (
                      <ActivityIndicator size="small" color="#090A0F" />
                    ) : (
                      <Text className="text-obsidian text-xs font-black uppercase">Search</Text>
                    )}
                  </Pressable>
                </View>

                {/* Selected Product Review or Search Results */}
                {selectedProduct ? (
                  <View className="p-3.5 rounded-2xl bg-obsidian border border-accent/40 mb-3">
                    <Text className="text-white font-extrabold text-sm mb-0.5">
                      {selectedProduct.name}
                    </Text>
                    <Text className="text-text-dim text-xs mb-3">
                      Brand: {selectedProduct.brand} • Per 100g base
                    </Text>

                    {/* Grams Portion Input */}
                    <View className="flex-row items-center justify-between mb-3 p-2.5 rounded-xl bg-surface border border-border-dark">
                      <Text className="text-white text-xs font-bold">Portion Size (grams):</Text>
                      <TextInput
                        value={servingGrams}
                        onChangeText={setServingGrams}
                        keyboardType="numeric"
                        className="w-20 py-1 px-2 rounded-lg bg-obsidian border border-border-dark text-white text-xs font-black text-center"
                      />
                    </View>

                    {/* Computed Macros Preview */}
                    {(() => {
                      const factor = (Number(servingGrams) || 100) / 100;
                      return (
                        <View className="flex-row gap-2 mb-3">
                          <View className="flex-1 p-1.5 rounded-lg bg-surface items-center">
                            <Text className="text-text-dim text-[9px] uppercase font-bold">Kcal</Text>
                            <Text className="text-white text-xs font-bold">
                              {Math.round(selectedProduct.calories * factor)}
                            </Text>
                          </View>
                          <View className="flex-1 p-1.5 rounded-lg bg-surface items-center">
                            <Text className="text-accent text-[9px] uppercase font-bold">Protein</Text>
                            <Text className="text-accent text-xs font-bold">
                              {Math.round(selectedProduct.protein * factor)}g
                            </Text>
                          </View>
                          <View className="flex-1 p-1.5 rounded-lg bg-surface items-center">
                            <Text className="text-cyan-400 text-[9px] uppercase font-bold">Carbs</Text>
                            <Text className="text-cyan-400 text-xs font-bold">
                              {Math.round(selectedProduct.carbs * factor)}g
                            </Text>
                          </View>
                          <View className="flex-1 p-1.5 rounded-lg bg-surface items-center">
                            <Text className="text-amber-400 text-[9px] uppercase font-bold">Fats</Text>
                            <Text className="text-amber-400 text-xs font-bold">
                              {Math.round(selectedProduct.fats * factor)}g
                            </Text>
                          </View>
                        </View>
                      );
                    })()}

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => setSelectedProduct(null)}
                        className="py-2.5 px-3 rounded-xl bg-surface border border-border-dark flex-1 items-center"
                      >
                        <Text className="text-text-dim text-xs font-bold">Back to Results</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleLogSelectedProduct}
                        className="py-2.5 px-3 rounded-xl bg-accent flex-1 items-center"
                      >
                        <Text className="text-obsidian text-xs font-black uppercase">+ Log Meal</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                    {searchResults.length === 0 && !searching && (
                      <Text className="text-text-dim text-xs text-center py-4">
                        Search any grocery item to pull certified macros from Open Food Facts.
                      </Text>
                    )}
                    <View className="gap-2">
                      {searchResults.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            setSelectedProduct(item);
                            setServingGrams('100');
                          }}
                          className="p-2.5 rounded-xl bg-obsidian border border-border-dark flex-row items-center justify-between active:opacity-75"
                        >
                          <View className="flex-1 pr-2">
                            <Text className="text-white font-bold text-xs" numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text className="text-text-dim text-[10px]">
                              {item.brand} • {item.calories} kcal / 100g
                            </Text>
                          </View>
                          <View className="px-2 py-1 rounded bg-accent/15 border border-accent/30">
                            <Text className="text-accent text-[11px] font-bold">
                              {item.protein}g Prot
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {/* MODE 2: BARCODE LOOKUP */}
            {modalMode === 'barcode' && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="flex-1 flex-row items-center px-3 py-2 rounded-xl bg-obsidian border border-border-dark">
                    <Barcode size={16} color="#94A3B8" />
                    <TextInput
                      value={barcodeInput}
                      onChangeText={setBarcodeInput}
                      placeholder="Enter UPC/EAN (e.g. 3017620422003)"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      onSubmitEditing={handleBarcodeLookup}
                      className="flex-1 text-white text-xs ml-2 font-medium font-mono"
                    />
                  </View>
                  <Pressable
                    onPress={handleBarcodeLookup}
                    disabled={barcodeLoading}
                    className="py-2.5 px-3.5 rounded-xl bg-cyan-500 items-center justify-center active:opacity-85"
                  >
                    {barcodeLoading ? (
                      <ActivityIndicator size="small" color="#090A0F" />
                    ) : (
                      <Text className="text-obsidian text-xs font-black uppercase">Lookup</Text>
                    )}
                  </Pressable>
                </View>

                {selectedProduct && (
                  <View className="p-3.5 rounded-2xl bg-obsidian border border-cyan-500/40 mb-3">
                    <Text className="text-white font-extrabold text-sm mb-0.5">
                      {selectedProduct.name}
                    </Text>
                    <Text className="text-text-dim text-xs mb-3">
                      Brand: {selectedProduct.brand} • Scanned Product
                    </Text>

                    <View className="flex-row items-center justify-between mb-3 p-2.5 rounded-xl bg-surface border border-border-dark">
                      <Text className="text-white text-xs font-bold">Portion (grams):</Text>
                      <TextInput
                        value={servingGrams}
                        onChangeText={setServingGrams}
                        keyboardType="numeric"
                        className="w-20 py-1 px-2 rounded-lg bg-obsidian border border-border-dark text-white text-xs font-black text-center"
                      />
                    </View>

                    <Pressable
                      onPress={handleLogSelectedProduct}
                      className="py-2.5 px-3 rounded-xl bg-accent items-center"
                    >
                      <Text className="text-obsidian text-xs font-black uppercase">+ Log Scanned Food</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* MODE 3: CUSTOM MANUAL ENTRY */}
            {modalMode === 'manual' && (
              <View className="gap-2.5">
                <View>
                  <Text className="text-text-dim text-[10px] font-bold uppercase mb-1">
                    Food Name
                  </Text>
                  <TextInput
                    value={manualName}
                    onChangeText={setManualName}
                    placeholder="e.g. 4 Scrambled Eggs with Sourdough"
                    placeholderTextColor="#64748B"
                    className="py-2 px-3 rounded-xl bg-obsidian border border-border-dark text-white text-xs"
                  />
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-text-dim text-[10px] font-bold uppercase mb-1">Calories</Text>
                    <TextInput
                      value={manualCalories}
                      onChangeText={setManualCalories}
                      placeholder="kcal"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      className="py-2 px-3 rounded-xl bg-obsidian border border-border-dark text-white text-xs text-center font-bold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-accent text-[10px] font-bold uppercase mb-1">Protein (g)</Text>
                    <TextInput
                      value={manualProtein}
                      onChangeText={setManualProtein}
                      placeholder="g"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      className="py-2 px-3 rounded-xl bg-obsidian border border-accent/40 text-accent text-xs text-center font-bold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-cyan-400 text-[10px] font-bold uppercase mb-1">Carbs (g)</Text>
                    <TextInput
                      value={manualCarbs}
                      onChangeText={setManualCarbs}
                      placeholder="g"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      className="py-2 px-3 rounded-xl bg-obsidian border border-cyan-500/40 text-cyan-400 text-xs text-center font-bold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-amber-400 text-[10px] font-bold uppercase mb-1">Fats (g)</Text>
                    <TextInput
                      value={manualFats}
                      onChangeText={setManualFats}
                      placeholder="g"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      className="py-2 px-3 rounded-xl bg-obsidian border border-amber-500/40 text-amber-400 text-xs text-center font-bold"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleLogManualFood}
                  className="py-3 rounded-xl bg-accent items-center justify-center mt-2 active:opacity-85"
                >
                  <Text className="text-obsidian text-xs font-black uppercase">
                    + Log Custom Intake
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* GOAL / TARGET ADJUSTMENT MODAL */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-obsidian/85 px-4">
          <View className="bg-surface-card border border-border-dark rounded-3xl p-5 w-full max-w-sm max-h-[90%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-border-dark mb-3">
              <View className="flex-row items-center">
                <Sliders size={18} color="#DC2626" />
                <Text className="text-white font-extrabold text-base uppercase ml-2">
                  Protocol Calibrator
                </Text>
              </View>
              <Pressable
                onPress={() => setShowGoalModal(false)}
                className="w-7 h-7 rounded-full bg-obsidian items-center justify-center active:opacity-75"
              >
                <X size={16} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="pr-0.5">
              {/* 1. Monthly Weight Goal (kg / month) */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-wider">
                    Weight Goal per Month
                  </Text>
                  <View className="px-2 py-0.5 rounded bg-blood-red/20 border border-blood-red/40">
                    <Text className="text-blood-red text-[10px] font-mono font-bold">
                      {modalKgPerMonth >= 0 ? '+' : ''}{modalKgPerMonth} KG / MO
                    </Text>
                  </View>
                </View>

                <View className="gap-1.5">
                  {[
                    { rate: -2.0, label: '-2.0 kg/mo', desc: 'Aggressive Fat Loss', goal: 'Aggressive Cut' as FitnessGoal },
                    { rate: -1.0, label: '-1.0 kg/mo', desc: 'Moderate Fat Loss', goal: 'Aggressive Cut' as FitnessGoal },
                    { rate: 0.0, label: '0.0 kg/mo', desc: 'Body Recomposition', goal: 'Recomposition' as FitnessGoal },
                    { rate: 1.0, label: '+1.0 kg/mo', desc: 'Lean Muscle Hypertrophy', goal: 'Lean Bulk' as FitnessGoal },
                    { rate: 2.0, label: '+2.0 kg/mo', desc: 'Surplus Mass Building', goal: 'Lean Bulk' as FitnessGoal },
                  ].map((item) => {
                    const isSelected = modalKgPerMonth === item.rate;
                    return (
                      <Pressable
                        key={item.rate}
                        onPress={() => {
                          setModalKgPerMonth(item.rate);
                          setSelectedGoal(item.goal);
                          const maintenance = Math.round(weightKg * 22 * 1.55);
                          const dailyDelta = Math.round((item.rate * 7700) / 30);
                          const derivedKcal = Math.max(1200, maintenance + dailyDelta);
                          setModalKcalInput(String(derivedKcal));
                        }}
                        className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                          isSelected
                            ? 'bg-blood-red/20 border-red-600/50'
                            : 'bg-[#0A0A0C] border-white/[0.08]'
                        }`}
                      >
                        <View>
                          <Text className={`text-xs font-black ${isSelected ? 'text-blood-red' : 'text-[#F4F4F5]'}`}>
                            {item.label}
                          </Text>
                          <Text className="text-[#71717A] text-[9.5px]">
                            {item.desc}
                          </Text>
                        </View>
                        {isSelected && <CheckCircle2 size={15} color="#DC2626" />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 2. Goal Kcal / Day */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-wider">
                    Goal Kcal per Day
                  </Text>
                  <Text className="text-blood-red text-[11px] font-mono font-bold">
                    {modalKcalInput} kcal/day
                  </Text>
                </View>

                <View className="flex-row items-center gap-2 mb-2">
                  <Pressable
                    onPress={() => {
                      const current = parseInt(modalKcalInput, 10) || 2500;
                      const nextVal = Math.max(1200, current - 100);
                      setModalKcalInput(String(nextVal));
                      const maintenance = Math.round(weightKg * 22 * 1.55);
                      const delta = nextVal - maintenance;
                      setModalKgPerMonth(Number(((delta * 30) / 7700).toFixed(1)));
                    }}
                    className="w-10 h-10 rounded-xl bg-[#0A0A0C] border border-white/[0.08] items-center justify-center active:opacity-75"
                  >
                    <Text className="text-[#F4F4F5] font-black text-sm">-100</Text>
                  </Pressable>

                  <View className="flex-1 py-2 px-3 rounded-xl bg-[#0A0A0C] border border-white/[0.08] items-center justify-center">
                    <TextInput
                      value={modalKcalInput}
                      onChangeText={(val) => {
                        setModalKcalInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 500) {
                          const maintenance = Math.round(weightKg * 22 * 1.55);
                          const delta = num - maintenance;
                          setModalKgPerMonth(Number(((delta * 30) / 7700).toFixed(1)));
                        }
                      }}
                      keyboardType="numeric"
                      className="text-[#F4F4F5] font-mono font-black text-base text-center"
                      placeholder="2580"
                      placeholderTextColor="#71717A"
                    />
                    <Text className="text-[#71717A] text-[9px] font-mono uppercase">TARGET KCAL / DAY</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      const current = parseInt(modalKcalInput, 10) || 2500;
                      const nextVal = current + 100;
                      setModalKcalInput(String(nextVal));
                      const maintenance = Math.round(weightKg * 22 * 1.55);
                      const delta = nextVal - maintenance;
                      setModalKgPerMonth(Number(((delta * 30) / 7700).toFixed(1)));
                    }}
                    className="w-10 h-10 rounded-xl bg-[#0A0A0C] border border-white/[0.08] items-center justify-center active:opacity-75"
                  >
                    <Text className="text-[#F4F4F5] font-black text-sm">+100</Text>
                  </Pressable>
                </View>
              </View>

              {/* 3. Daily Water Goal (L / day) */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <Droplets size={13} color="#06B6D4" />
                    <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-wider ml-1.5">
                      Daily Water Goal
                    </Text>
                  </View>
                  <View className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                    <Text className="text-cyan-400 text-[10px] font-mono font-bold">
                      {(modalWaterMl / 1000).toFixed(1)}L / DAY ({modalWaterMl} ML)
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1.5 mb-2">
                  {[
                    { ml: 2500, label: '2.5L' },
                    { ml: 3000, label: '3.0L' },
                    { ml: 3500, label: '3.5L', badge: 'Athlete' },
                    { ml: 4000, label: '4.0L' },
                    { ml: 4500, label: '4.5L' },
                  ].map((item) => {
                    const isSelected = modalWaterMl === item.ml;
                    return (
                      <Pressable
                        key={item.ml}
                        onPress={() => setModalWaterMl(item.ml)}
                        className={`flex-1 py-2 rounded-xl border items-center ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/60'
                            : 'bg-[#0A0A0C] border-white/[0.08]'
                        }`}
                      >
                        <Text
                          className={`text-xs font-mono font-bold ${
                            isSelected ? 'text-cyan-300' : 'text-[#71717A]'
                          }`}
                        >
                          {item.label}
                        </Text>
                        {item.badge && (
                          <Text className="text-[7.5px] font-mono text-cyan-400 uppercase mt-0.5">
                            {item.badge}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Fine Increment Control */}
                <View className="flex-row items-center justify-between p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.06]">
                  <Pressable
                    onPress={() => setModalWaterMl(Math.max(1500, modalWaterMl - 250))}
                    className="py-1 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] active:opacity-75"
                  >
                    <Text className="text-[#F4F4F5] text-xs font-mono font-bold">-250 ml</Text>
                  </Pressable>

                  <Text className="text-[#71717A] text-[9.5px] font-mono uppercase">
                    ~45ml/kg athlete baseline
                  </Text>

                  <Pressable
                    onPress={() => setModalWaterMl(Math.min(6000, modalWaterMl + 250))}
                    className="py-1 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] active:opacity-75"
                  >
                    <Text className="text-[#F4F4F5] text-xs font-mono font-bold">+250 ml</Text>
                  </Pressable>
                </View>
              </View>

              {/* 4. Daily Protein Anchor (2.2g/kg) */}
              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.08] flex-row items-center justify-between mb-3.5">
                <View>
                  <Text className="text-[#71717A] text-[9.5px] font-mono uppercase tracking-widest">
                    DAILY PROTEIN (2.2G/KG)
                  </Text>
                  <Text className="text-blood-red font-mono font-black text-sm">
                    {Math.round(weightKg * 2.2)}g Protein / day
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded bg-blood-red/20 border border-blood-red/40">
                  <Text className="text-blood-red text-[9px] font-black uppercase">HYPERTROPHY</Text>
                </View>
              </View>

              {/* 5. Body Mass Calibration */}
              <View className="mb-4">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-widest mb-1.5">
                  Current Body Weight: {weightKg} kg
                </Text>
                <View className="flex-row items-center gap-1.5">
                  {[70, 75, 78, 82, 85].map((w) => (
                    <Pressable
                      key={w}
                      onPress={() => setWeightKg(w)}
                      className={`flex-1 py-1.5 rounded-xl border items-center ${
                        weightKg === w
                          ? 'bg-blood-red/20 border-red-600/50'
                          : 'bg-[#0A0A0C] border-white/[0.08]'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${weightKg === w ? 'text-blood-red' : 'text-[#71717A]'}`}>
                        {w}kg
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <Pressable
                onPress={() => {
                  const kcalNum = parseInt(modalKcalInput, 10) || 2580;
                  handleApplyNewGoal(selectedGoal, weightKg, kcalNum, modalKgPerMonth, modalWaterMl);
                }}
                className="py-3.5 rounded-xl bg-blood-red border border-red-500/60 shadow-lg shadow-red-600/30 items-center justify-center active:opacity-85 mb-2"
              >
                <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-widest text-center">
                  APPLY GOAL ({modalKcalInput} KCAL • {modalKgPerMonth >= 0 ? '+' : ''}{modalKgPerMonth} KG/MO • {(modalWaterMl / 1000).toFixed(1)}L WATER)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowGoalModal(false)}
                className="py-2.5 rounded-xl bg-transparent border border-white/[0.08] items-center mb-1"
              >
                <Text className="text-[#71717A] text-xs font-bold uppercase">Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
