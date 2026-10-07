import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dumbbell,
  Utensils,
  Flame,
  ChevronRight,
  Zap,
  Target,
  Clock,
  Droplets,
  Plus,
  Bell,
  ArrowUpRight,
  User,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  GlassCard,
  BrandHeader,
  WeatherCard,
} from '../components/ui';
import { getDailyLog, logWaterIntake, DietLogData } from '../services/dietService';

export interface DashboardScreenProps {
  onNavigate: (screen: 'workout' | 'diet' | 'scan-fridge' | 'profile' | 'scan-body') => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  // Focus Muscle Groups for Training (No rankings or tiers)
  const [focusMuscles] = useState<string[]>(['Upper Chest', 'Lateral Delts', 'Triceps']);

  // Daily Fuel / Diet Telemetry State
  const [dietLog, setDietLog] = useState<DietLogData | null>(null);

  const handleNavigate = (screen: 'workout' | 'diet' | 'scan-fridge' | 'profile' | 'scan-body') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onNavigate(screen);
  };

  const handleQuickWater = async (amountMl: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    const updated = await logWaterIntake(amountMl);
    setDietLog(updated);
  };

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const log = await getDailyLog();
        setDietLog(log);
      } catch (err) {
        console.warn('[DashboardScreen] Telemetry load error:', err);
      }
    }

    loadTelemetry();
  }, []);

  const calorieConsumed = dietLog?.consumedCalories || 1840;
  const calorieTarget = dietLog?.targetCalories || 2580;
  const proteinConsumed = dietLog?.consumedProtein || 142;
  const proteinTarget = dietLog?.targetProtein || 172;
  const targetKgPerMonth = dietLog?.targetKgPerMonth ?? 1.0;
  const caloriePercent = Math.min(100, Math.round((calorieConsumed / calorieTarget) * 100));
  const proteinPercent = Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100));

  // Water Hydration Telemetry
  const waterTarget = dietLog?.targetWaterMl || 3500;
  const waterConsumed = dietLog?.consumedWaterMl || 0;
  const waterPercent = Math.min(100, Math.round((waterConsumed / waterTarget) * 100));
  const waterConsumedL = (waterConsumed / 1000).toFixed(2);
  const waterTargetL = (waterTarget / 1000).toFixed(1);
  const reminderActive = dietLog?.waterReminderEnabled ?? true;
  const reminderInterval = dietLog?.waterReminderIntervalMinutes ?? 90;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* Brand Header */}
      <BrandHeader
        title="IRONFORGE"
        subtitle="ATHLETE COMMAND"
        onProfilePress={() => handleNavigate('profile')}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase Eyebrow */}
        <View className="flex-row items-center justify-between mb-3.5 px-0.5">
          <View>
            <Text className="text-[#71717A] text-[9.5px] font-mono tracking-widest uppercase">
              BIOMECHANICS COMMAND
            </Text>
            <Text className="text-[#F4F4F5] font-black text-xl tracking-tight mt-0.5">
              Daily Overview
            </Text>
          </View>

          <View className="flex-row items-center px-3 py-1.5 rounded-full bg-[#121215] border border-white/10 shadow-sm">
            <Zap size={11} color="#DC2626" />
            <Text className="text-[#F4F4F5] text-[9.5px] font-black tracking-widest uppercase ml-1">
              HYPERTROPHY PHASE
            </Text>
          </View>
        </View>

        {/* 1. TODAY'S TRAINING PROTOCOL HERO CARD */}
        <View className="mb-3.5 rounded-2xl p-4 bg-[#0E0E13] border border-red-600/35 shadow-xl shadow-red-950/20">
          <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/[0.08]">
            <View className="flex-row items-center">
              <Dumbbell size={15} color="#DC2626" />
              <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-widest ml-2">
                Today's Training Session
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-blood-red/20 border border-blood-red/50">
              <Text className="text-blood-red text-[9px] font-black uppercase tracking-widest">
                PUSH // OVERLOAD
              </Text>
            </View>
          </View>

          <Text className="text-[#F4F4F5] font-black text-lg tracking-tight mb-1">
            Overload Hypertrophy Split
          </Text>
          <Text className="text-[#9CA3AF] text-xs font-medium leading-relaxed mb-3">
            Aggressive progressive overload with targeted isolation volume for your key focus muscle groups.
          </Text>

          {/* Focus Muscle Pills */}
          <View className="flex-row flex-wrap gap-1.5 mb-3.5">
            {focusMuscles.map((muscle) => (
              <View
                key={muscle}
                className="px-2.5 py-1 rounded-lg bg-blood-red/15 border border-red-600/30 flex-row items-center"
              >
                <Target size={11} color="#DC2626" />
                <Text className="text-[#F4F4F5] text-[11px] font-bold ml-1.5">
                  {muscle}
                </Text>
              </View>
            ))}
          </View>

          {/* Specs Bar */}
          <View className="flex-row items-center justify-between py-2.5 px-3 rounded-xl bg-[#09090B] border border-white/[0.06] mb-3.5">
            <View className="items-center">
              <Text className="text-[#71717A] text-[9px] font-mono uppercase tracking-widest">DURATION</Text>
              <Text className="text-[#F4F4F5] text-xs font-mono font-bold mt-0.5">60 MIN</Text>
            </View>
            <View className="w-[1px] h-6 bg-white/[0.08]" />
            <View className="items-center">
              <Text className="text-[#71717A] text-[9px] font-mono uppercase tracking-widest">INTENSITY</Text>
              <Text className="text-amber-400 text-xs font-mono font-bold mt-0.5">RPE 8-9</Text>
            </View>
            <View className="w-[1px] h-6 bg-white/[0.08]" />
            <View className="items-center">
              <Text className="text-[#71717A] text-[9px] font-mono uppercase tracking-widest">VOLUME</Text>
              <Text className="text-blood-red text-xs font-mono font-bold mt-0.5">18 SETS</Text>
            </View>
          </View>

          {/* Primary Action Button (Direct, 100% Guaranteed Press) */}
          <Pressable
            onPress={() => handleNavigate('workout')}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="w-full py-3.5 px-4 rounded-xl bg-blood-red border border-red-500/60 shadow-lg shadow-red-600/30 flex-row items-center justify-center active:opacity-80"
          >
            <Dumbbell size={16} color="#F4F4F5" />
            <Text className="text-[#F4F4F5] font-black text-xs uppercase tracking-widest ml-2">
              START WORKOUT FORGE
            </Text>
          </Pressable>
        </View>

        {/* 2. DUAL TELEMETRY CARDS (VOLUME & DAILY FUEL) */}
        <View className="flex-row gap-3 mb-3.5">
          {/* Tile 1: Workout Volume */}
          <Pressable
            onPress={() => handleNavigate('workout')}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="flex-1 rounded-2xl p-3.5 bg-[#0E0E13] border border-white/[0.08] active:border-red-600/40 shadow-xl justify-between"
          >
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center">
                  <Dumbbell size={12} color="#F59E0B" />
                  <Text className="text-[#71717A] text-[9px] font-black uppercase tracking-widest ml-1">
                    Volume Load
                  </Text>
                </View>
                <ArrowUpRight size={13} color="#71717A" />
              </View>

              <Text className="text-[#F4F4F5] font-mono font-black text-2xl tabular-nums tracking-tight">
                14.2k <Text className="text-[#71717A] text-xs font-semibold">lbs</Text>
              </Text>
              <Text className="text-amber-400 text-[9.5px] font-bold mt-0.5">
                +8.4% weekly overload
              </Text>
            </View>

            <View className="mt-3 pt-2 border-t border-white/[0.05] flex-row items-center justify-between">
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase tracking-widest">WGER TRACKING</Text>
              <Text className="text-amber-400 text-[9px] font-bold">VIEW &gt;</Text>
            </View>
          </Pressable>

          {/* Tile 2: Daily Fuel Target */}
          <Pressable
            onPress={() => handleNavigate('diet')}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="flex-1 rounded-2xl p-3.5 bg-[#0E0E13] border border-white/[0.08] active:border-red-600/40 shadow-xl justify-between"
          >
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center">
                  <Flame size={12} color="#DC2626" />
                  <Text className="text-[#71717A] text-[9px] font-black uppercase tracking-widest ml-1">
                    Goal: {calorieTarget} kcal
                  </Text>
                </View>
                <ArrowUpRight size={13} color="#71717A" />
              </View>

              <Text className="text-[#F4F4F5] font-mono font-black text-2xl tabular-nums tracking-tight">
                {calorieConsumed} <Text className="text-[#71717A] text-xs font-semibold">/ {calorieTarget}</Text>
              </Text>
              <Text className="text-blood-red text-[9.5px] font-bold mt-0.5">
                {targetKgPerMonth >= 0 ? '+' : ''}{targetKgPerMonth} kg/mo • {proteinConsumed}g Prot
              </Text>
            </View>

            <View className="mt-3 pt-2 border-t border-white/[0.05]">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[#71717A] text-[8.5px] font-mono uppercase">CALORIES</Text>
                <Text className="text-[#F4F4F5] text-[8.5px] font-mono font-bold">{caloriePercent}%</Text>
              </View>
              <View className="w-full h-1.5 rounded-full bg-[#09090B] overflow-hidden">
                <View
                  className="h-full bg-blood-red rounded-full"
                  style={{ width: `${caloriePercent}%` }}
                />
              </View>
            </View>
          </Pressable>
        </View>

        {/* 3. HYDRATION TARGET COMMAND CARD */}
        <View className="mb-3.5 rounded-2xl p-4 bg-[#0E0E13] border border-cyan-500/30 shadow-xl">
          <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-white/[0.06]">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 items-center justify-center mr-2">
                <Droplets size={13} color="#06B6D4" />
              </View>
              <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-widest">
                Daily Hydration Target
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <View className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex-row items-center">
                <Bell size={9} color={reminderActive ? '#06B6D4' : '#71717A'} />
                <Text className={`text-[8.5px] font-mono font-bold uppercase ml-1 ${reminderActive ? 'text-cyan-400' : 'text-[#71717A]'}`}>
                  {reminderActive ? `${reminderInterval}M ALERTS` : 'MUTED'}
                </Text>
              </View>
              <Pressable
                onPress={() => handleNavigate('diet')}
                className="px-2 py-0.5 rounded bg-white/[0.06] active:opacity-75"
              >
                <Text className="text-cyan-400 text-[9px] font-mono font-bold">MANAGE &gt;</Text>
              </Pressable>
            </View>
          </View>

          {/* Value Display */}
          <View className="flex-row items-baseline justify-between mb-2">
            <View className="flex-row items-baseline">
              <Text className="text-[#F4F4F5] font-mono font-black text-2xl tabular-nums tracking-tight">
                {waterConsumedL}
              </Text>
              <Text className="text-[#71717A] font-mono font-bold text-xs ml-1.5">
                / {waterTargetL} L GOAL
              </Text>
            </View>

            <Text className="text-cyan-400 font-mono font-bold text-xs">
              {waterPercent}% Logged
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-2 rounded-full bg-[#09090B] border border-white/[0.04] overflow-hidden mb-3">
            <View
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${waterPercent}%` }}
            />
          </View>

          {/* Independent Quick Log Buttons (No Nesting) */}
          <View className="flex-row items-center gap-2 pt-2 border-t border-white/[0.05]">
            <Text className="text-[#71717A] text-[9px] font-mono uppercase tracking-wider mr-1">
              QUICK LOG:
            </Text>

            <Pressable
              onPress={() => handleQuickWater(250)}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex-row items-center"
            >
              <Plus size={10} color="#06B6D4" />
              <Text className="text-cyan-300 font-mono font-bold text-[10px] ml-1">
                +250ml
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickWater(500)}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex-row items-center"
            >
              <Plus size={10} color="#06B6D4" />
              <Text className="text-cyan-300 font-mono font-bold text-[10px] ml-1">
                +500ml
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickWater(750)}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex-row items-center"
            >
              <Plus size={10} color="#06B6D4" />
              <Text className="text-cyan-300 font-mono font-bold text-[10px] ml-1">
                +750ml
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. ATHLETE CLIMATE & WEATHER (OPEN-METEO PUBLIC API) */}
        <WeatherCard className="mb-3.5" />

        {/* 5. CORE ATHLETIC MODULES (4 HIGH-IMPACT TILES) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2.5 px-0.5">
            <Text className="text-[#F4F4F5] font-black text-xs uppercase tracking-widest">
              Core Athletic Modules
            </Text>
            <Text className="text-[#71717A] text-[9.5px] font-mono tracking-widest uppercase">
              ONE-TAP LAUNCH
            </Text>
          </View>

          {/* Module 1: Workout Forge */}
          <Pressable
            onPress={() => handleNavigate('workout')}
            style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
            className="rounded-2xl p-4 bg-[#0E0E13] border border-white/[0.08] active:border-red-600/40 shadow-xl mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 items-center justify-center mr-3.5">
                <Dumbbell size={22} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                  <Text className="text-[#F4F4F5] font-black text-sm tracking-tight mr-2">
                    Workout Forge
                  </Text>
                  <View className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                    <Text className="text-amber-400 text-[8px] font-black uppercase tracking-widest">
                      OVERLOAD
                    </Text>
                  </View>
                </View>
                <Text className="text-[#9CA3AF] text-[11px] font-medium leading-tight">
                  Dynamic routines with focus muscle volume & live Wger set logger
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center">
              <ChevronRight size={16} color="#F4F4F5" />
            </View>
          </Pressable>

          {/* Module 2: Diet & Macro Hub */}
          <Pressable
            onPress={() => handleNavigate('diet')}
            style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
            className="rounded-2xl p-4 bg-[#0E0E13] border border-white/[0.08] active:border-red-600/40 shadow-xl mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-600/40 items-center justify-center mr-3.5">
                <Flame size={22} color="#EF4444" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                  <Text className="text-[#F4F4F5] font-black text-sm tracking-tight mr-2">
                    Diet & Macro Hub
                  </Text>
                  <View className="px-1.5 py-0.5 rounded bg-red-600/20 border border-red-600/30">
                    <Text className="text-red-400 text-[8px] font-black uppercase tracking-widest">
                      NUTRITION
                    </Text>
                  </View>
                </View>
                <Text className="text-[#9CA3AF] text-[11px] font-medium leading-tight">
                  {calorieTarget} kcal/day &bull; {targetKgPerMonth >= 0 ? '+' : ''}{targetKgPerMonth} kg/mo &bull; 2.2g/kg protein targets
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center">
              <ChevronRight size={16} color="#F4F4F5" />
            </View>
          </Pressable>

          {/* Module 3: Smart Pantry Chef */}
          <Pressable
            onPress={() => handleNavigate('scan-fridge')}
            style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
            className="rounded-2xl p-4 bg-[#0E0E13] border border-white/[0.08] active:border-cyan-500/40 shadow-xl mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 items-center justify-center mr-3.5">
                <Utensils size={22} color="#06B6D4" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                  <Text className="text-[#F4F4F5] font-black text-sm tracking-tight mr-2">
                    Pantry Chef
                  </Text>
                  <View className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                    <Text className="text-cyan-400 text-[8px] font-black uppercase tracking-widest">
                      RECIPES
                    </Text>
                  </View>
                </View>
                <Text className="text-[#9CA3AF] text-[11px] font-medium leading-tight">
                  Ingredient inventory, verified macros & instant high-protein chef recipes
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center">
              <ChevronRight size={16} color="#F4F4F5" />
            </View>
          </Pressable>

          {/* Module 4: Biometric Profile */}
          <Pressable
            onPress={() => handleNavigate('profile')}
            style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
            className="rounded-2xl p-4 bg-[#0E0E13] border border-white/[0.08] active:border-red-600/40 shadow-xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/40 items-center justify-center mr-3.5">
                <User size={22} color="#A855F7" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                  <Text className="text-[#F4F4F5] font-black text-sm tracking-tight mr-2">
                    Biometric Profile
                  </Text>
                  <View className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    <Text className="text-purple-400 text-[8px] font-black uppercase tracking-widest">
                      ATHLETE
                    </Text>
                  </View>
                </View>
                <Text className="text-[#9CA3AF] text-[11px] font-medium leading-tight">
                  Body mass, FFMI index, split preferences & system controls
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center">
              <ChevronRight size={16} color="#F4F4F5" />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
