import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus,
  Dumbbell,
  Droplets,
  HeartPulse,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getUserProfile, UserProfile } from '../../services/userMetrics';
import { getDailyLog, logWaterIntake, DietLogData } from '../../services/dietService';
import {
  getScheduledWorkoutForDay,
  TrainingProgram,
} from '../../data/workoutCatalog';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CommandDeckScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dietLog, setDietLog] = useState<DietLogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    async function initScreen() {
      try {
        const userProf = await getUserProfile();
        if (!userProf || !userProf.weightKg) {
          router.replace('/onboarding');
          return;
        }
        setProfile(userProf);

        const log = await getDailyLog();
        setDietLog(log);
      } catch (err) {
        console.warn('[CommandDeck] Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    initScreen();
  }, []);

  const today = new Date();
  const dayOfWeekIndex = today.getDay(); // 0 is Sunday
  const todayKey = DAY_KEYS[dayOfWeekIndex]; // 'Mon', 'Tue', etc.
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  // Determine scheduled workout for today
  const scheduledProgram: TrainingProgram | null = profile
    ? getScheduledWorkoutForDay(profile.splitPreference, profile.trainingDays, todayKey)
    : null;

  const handleQuickAddWater = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await logWaterIntake(250);
      setDietLog(updated);
    } catch (err) {
      console.warn('[handleQuickAddWater] Error logging water:', err);
    }
  };

  const calorieConsumed = dietLog?.consumedCalories || 1840;
  const calorieTarget = profile?.targetCalories || dietLog?.targetCalories || 2580;
  const proteinConsumed = dietLog?.consumedProtein || 142;
  const proteinTarget = profile?.targetProtein || dietLog?.targetProtein || 172;

  const caloriePercent = Math.min(100, Math.round((calorieConsumed / calorieTarget) * 100));
  const proteinPercent = Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100));

  const waterConsumed = dietLog?.consumedWaterMl || 1250;
  const waterTarget = profile?.targetWaterMl || dietLog?.targetWaterMl || 3500;
  const waterPercent = Math.min(100, Math.round((waterConsumed / waterTarget) * 100));

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* 1. Header: Minimal clean brand with new logo + today's date */}
      <View className="flex-row items-center justify-between px-6 py-5 border-b border-white/[0.08]">
        <View className="flex-row items-center gap-2.5">
          <Image
            source={require('../../assets/generated/logo.jpg')}
            className="w-7 h-7 rounded-lg"
            resizeMode="cover"
          />
          <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
            YHARNAM FORGE
          </Text>
        </View>
        <Text className="text-[#71717A] text-xs font-medium tracking-wider">
          {formattedDate}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Today's Scheduled Workout Card OR Rest Day Card */}
        {scheduledProgram ? (
          <View className="rounded-3xl overflow-hidden bg-[#121216] border border-white/[0.08] mb-6">
            <View className="w-full aspect-[16/9] relative">
              <Image
                source={require('../../assets/generated/hero-workout.jpg')}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/40 to-transparent" />
            </View>

            <View className="p-5 gap-4">
              <View>
                <Text className="text-white text-3xl font-black tracking-tight mb-1 uppercase">
                  {scheduledProgram.splitName}
                </Text>
                <Text className="text-[#71717A] text-xs font-normal" numberOfLines={1}>
                  {scheduledProgram.subtitle} • {scheduledProgram.exercises.length} Exercises
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/workout');
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                className="w-full py-3.5 rounded-full bg-white items-center justify-center"
              >
                <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                  Start Session
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl p-6 bg-[#121216] border border-white/[0.08] mb-6 gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <HeartPulse size={16} color="#71717A" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Active Recovery
                </Text>
              </View>
              <Text className="text-[#71717A] text-xs font-mono">
                REST DAY
              </Text>
            </View>

            <View>
              <Text className="text-white text-2xl font-black tracking-tight mb-1">
                Rest & Tissue Repair
              </Text>
              <Text className="text-[#71717A] text-xs leading-5">
                Today is a designated growth day. Prioritize hydration, sleep quality, and protein synthesis.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/recovery');
              }}
              className="w-full py-3.5 rounded-full bg-[#18181D] border border-white/[0.08] items-center justify-center"
            >
              <Text className="text-white font-bold text-xs uppercase tracking-wider">
                View Recovery Protocol
              </Text>
            </Pressable>
          </View>
        )}

        {/* 3. Daily Water Quick-Gauge (+250ml quick-add button) */}
        <View className="rounded-3xl p-5 bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Droplets size={14} color="#71717A" />
              <Text className="text-white text-sm font-bold tracking-tight">
                Daily Hydration
              </Text>
            </View>
            <Text className="text-[#71717A] text-xs font-mono">
              {waterConsumed} / {waterTarget} ml
            </Text>
          </View>

          {/* Water Progress Bar */}
          <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${waterPercent}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between pt-1 border-t border-white/[0.06]">
            <Text className="text-[#71717A] text-xs">
              {waterPercent}% of target reached
            </Text>
            <Pressable
              onPress={handleQuickAddWater}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="py-1.5 px-3 rounded-full bg-[#18181D] border border-white/[0.08] flex-row items-center gap-1.5"
            >
              <Plus size={12} color="#FFFFFF" />
              <Text className="text-white font-mono text-xs font-bold">
                +250ml
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Macro Fuel Summary Bar */}
        <View className="rounded-3xl p-5 bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-sm font-bold tracking-tight">
              Fuel Snapshot
            </Text>
            <Text className="text-[#71717A] text-xs font-mono">
              {profile?.goal || 'Intake'}
            </Text>
          </View>

          {/* Calories Bar */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-xs">Calories</Text>
              <Text className="text-white font-mono text-xs font-semibold">
                {calorieConsumed} / {calorieTarget} kcal
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${caloriePercent}%` }}
              />
            </View>
          </View>

          {/* Protein Bar */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-xs">Protein</Text>
              <Text className="text-white font-mono text-xs font-semibold">
                {proteinConsumed} / {proteinTarget}g
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${proteinPercent}%` }}
              />
            </View>
          </View>
        </View>

        {/* 5. Minimalist Quick Links */}
        <View className="flex-row gap-4">
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/pantry');
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            className="flex-1 p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-1"
          >
            <Text className="text-white font-bold text-sm">Smart Pantry</Text>
            <Text className="text-[#71717A] text-xs">Recipe generator</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/trajectory');
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            className="flex-1 p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-1"
          >
            <Text className="text-white font-bold text-sm">Trajectory</Text>
            <Text className="text-[#71717A] text-xs">Weight timeline</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
