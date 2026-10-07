import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  X,
  Trash2,
  Calendar,
  Scale,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getUserProfile, UserProfile } from '../../services/userMetrics';

interface WeightCheckIn {
  id: string;
  date: string; // ISO date string
  weightKg: number;
}

const STORAGE_KEY_CHECKINS = '@ironforge_weight_checkins';

export default function TrajectoryScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkIns, setCheckIns] = useState<WeightCheckIn[]>([]);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [newWeightInput, setNewWeightInput] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    async function loadData() {
      const userProf = await getUserProfile();
      setProfile(userProf);

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_CHECKINS);
        if (raw) {
          setCheckIns(JSON.parse(raw));
        } else if (userProf?.weightKg) {
          // Initialize with baseline checkin
          const initial: WeightCheckIn[] = [
            {
              id: 'baseline',
              date: new Date().toISOString(),
              weightKg: userProf.weightKg,
            },
          ];
          setCheckIns(initial);
          await AsyncStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(initial));
        }
      } catch (err) {
        console.warn('[Trajectory] Error loading checkins:', err);
      }
    }
    loadData();
  }, []);

  const saveCheckIns = async (updated: WeightCheckIn[]) => {
    setCheckIns(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(updated));
    } catch (err) {
      console.warn('[Trajectory] Error saving checkins:', err);
    }
  };

  const handleAddCheckIn = async () => {
    const val = parseFloat(newWeightInput);
    if (!val || val <= 30 || val >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid bodyweight in kg.');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const newEntry: WeightCheckIn = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      weightKg: Math.round(val * 10) / 10,
    };

    const updated = [newEntry, ...checkIns];
    await saveCheckIns(updated);
    setShowLogModal(false);
    setNewWeightInput('');
  };

  const handleDeleteCheckIn = async (id: string) => {
    triggerHaptic();
    const updated = checkIns.filter((c) => c.id !== id);
    await saveCheckIns(updated);
  };

  const startWeight = profile?.weightKg || (checkIns[checkIns.length - 1]?.weightKg ?? 78);
  const latestWeight = checkIns[0]?.weightKg ?? startWeight;
  const monthlyDelta = profile?.monthlyKgDelta ?? 1.0;
  const weeklyTargetDelta = Math.round((monthlyDelta / 4.33) * 100) / 100;

  // Calculate actual weekly rate of change from the most recent 2 check-ins
  let actualWeeklyDelta = 0;
  if (checkIns.length >= 2) {
    const latest = checkIns[0];
    const prev = checkIns[1];
    const msDiff = new Date(latest.date).getTime() - new Date(prev.date).getTime();
    const daysDiff = Math.max(1, msDiff / (1000 * 60 * 60 * 24));
    actualWeeklyDelta = Math.round(((latest.weightKg - prev.weightKg) / daysDiff) * 7 * 100) / 100;
  }

  // Generate 8-week target trajectory data points
  const timelineWeeks = [0, 1, 2, 3, 4, 6, 8];
  const targetCurvePoints = timelineWeeks.map((week) => {
    const targetW = startWeight + (monthlyDelta / 4.33) * week;
    return { week, targetWeight: Math.round(targetW * 10) / 10 };
  });

  // SVG Curve Dimensions
  const chartWidth = 310;
  const chartHeight = 130;
  const paddingX = 24;
  const paddingY = 20;

  const minW = Math.min(...targetCurvePoints.map((p) => p.targetWeight), latestWeight) - 1.5;
  const maxW = Math.max(...targetCurvePoints.map((p) => p.targetWeight), latestWeight) + 1.5;
  const weightRange = Math.max(1, maxW - minW);

  const getX = (week: number) => paddingX + (week / 8) * (chartWidth - 2 * paddingX);
  const getY = (w: number) => chartHeight - paddingY - ((w - minW) / weightRange) * (chartHeight - 2 * paddingY);

  // Build target line SVG path
  const targetPathString = targetCurvePoints.reduce((acc, curr, idx) => {
    const x = getX(curr.week);
    const y = getY(curr.targetWeight);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-5 border-b border-white/[0.08] flex-row items-center justify-between">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          TRAJECTORY
        </Text>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setShowLogModal(true);
          }}
          className="py-1.5 px-3.5 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
            + Check-In
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Weight Target & Velocity Summary Card */}
        <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[#71717A] text-xs font-mono uppercase tracking-wider">
                Current Weight
              </Text>
              <Text className="text-white text-3xl font-black font-mono tracking-tight mt-0.5">
                {latestWeight} kg
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[#71717A] text-xs font-mono uppercase tracking-wider">
                Target Velocity
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                {monthlyDelta >= 0 ? (
                  <TrendingUp size={16} color="#FFFFFF" />
                ) : (
                  <TrendingDown size={16} color="#FFFFFF" />
                )}
                <Text className="text-white font-mono text-base font-bold">
                  {monthlyDelta >= 0 ? `+${monthlyDelta}` : monthlyDelta} kg / mo
                </Text>
              </View>
            </View>
          </View>

          {/* Rate of Change Row */}
          <View className="flex-row justify-between pt-3 border-t border-white/[0.06]">
            <View>
              <Text className="text-[#71717A] text-xs">Baseline</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {startWeight} kg
              </Text>
            </View>
            <View>
              <Text className="text-[#71717A] text-xs">Target Weekly Rate</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {weeklyTargetDelta >= 0 ? `+${weeklyTargetDelta}` : weeklyTargetDelta} kg/wk
              </Text>
            </View>
            <View>
              <Text className="text-[#71717A] text-xs">Actual Rate</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {actualWeeklyDelta >= 0 ? `+${actualWeeklyDelta}` : actualWeeklyDelta} kg/wk
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Monthly Progression Curve Graph */}
        <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] mb-6 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-sm font-bold tracking-tight">
              Progression Curve (8 Weeks)
            </Text>
            <Text className="text-[#71717A] text-xs font-mono">
              PROJECTED VS ACTUAL
            </Text>
          </View>

          {/* SVG Progression Chart */}
          <View className="w-full items-center py-2">
            <Svg width={chartWidth} height={chartHeight}>
              {/* Baseline Horizontal Grid Line */}
              <Line
                x1={paddingX}
                y1={getY(startWeight)}
                x2={chartWidth - paddingX}
                y2={getY(startWeight)}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4, 4"
                strokeWidth={1}
              />

              {/* Target Progression Curve Path */}
              <Path
                d={targetPathString}
                stroke="#FFFFFF"
                strokeWidth={2}
                fill="none"
              />

              {/* Target Curve End Node */}
              <Circle
                cx={getX(8)}
                cy={getY(targetCurvePoints[targetCurvePoints.length - 1].targetWeight)}
                r={4}
                fill="#FFFFFF"
              />

              {/* Actual Logged Check-in Node (Latest) */}
              <Circle
                cx={getX(0)}
                cy={getY(latestWeight)}
                r={5}
                fill="#FFFFFF"
                stroke="#09090B"
                strokeWidth={2}
              />
            </Svg>

            {/* Timeline X-Axis Labels */}
            <View className="w-full flex-row justify-between px-2 pt-1 border-t border-white/[0.06]">
              <Text className="text-[#71717A] text-[10px] font-mono">Week 0</Text>
              <Text className="text-[#71717A] text-[10px] font-mono">Week 2</Text>
              <Text className="text-[#71717A] text-[10px] font-mono">Week 4</Text>
              <Text className="text-[#71717A] text-[10px] font-mono">Week 8</Text>
            </View>
          </View>
        </View>

        {/* 3. Weekly Check-In Log */}
        <View className="gap-3">
          <Text className="text-white text-sm font-bold tracking-tight mb-1">
            Check-In History ({checkIns.length})
          </Text>

          {checkIns.map((item, idx) => {
            const checkDate = new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const prevItem = checkIns[idx + 1];
            const delta = prevItem ? Math.round((item.weightKg - prevItem.weightKg) * 10) / 10 : 0;

            return (
              <View
                key={item.id}
                className="p-4 rounded-2xl bg-[#121216] border border-white/[0.08] flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-[#18181D] items-center justify-center">
                    <Scale size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-white font-bold font-mono text-base">
                      {item.weightKg} kg
                    </Text>
                    <Text className="text-[#71717A] text-xs">
                      {checkDate}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  {idx < checkIns.length - 1 ? (
                    <Text
                      className={`font-mono text-xs font-semibold ${
                        delta > 0
                          ? 'text-white'
                          : delta < 0
                          ? 'text-[#71717A]'
                          : 'text-[#71717A]'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta} kg
                    </Text>
                  ) : (
                    <Text className="text-[#71717A] text-xs font-mono">Baseline</Text>
                  )}

                  {checkIns.length > 1 && (
                    <Pressable
                      onPress={() => handleDeleteCheckIn(item.id)}
                      className="w-7 h-7 rounded-full bg-[#18181D] items-center justify-center"
                    >
                      <Trash2 size={12} color="#71717A" />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Check-In Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#121216] border-t border-white/[0.08] rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <Text className="text-white font-bold text-lg tracking-tight">
                Log Bodyweight Check-In
              </Text>
              <Pressable
                onPress={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-[#18181D] items-center justify-center"
              >
                <X size={16} color="#71717A" />
              </Pressable>
            </View>

            <View className="gap-4 mb-6">
              <Text className="text-[#71717A] text-xs">
                Enter your morning fasted weight to calculate weekly velocity.
              </Text>

              <TextInput
                value={newWeightInput}
                onChangeText={setNewWeightInput}
                keyboardType="numeric"
                placeholder={`Current: ${latestWeight} kg`}
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#18181D] border border-white/[0.08] text-white text-lg font-mono"
              />
            </View>

            <Pressable
              onPress={handleAddCheckIn}
              className="w-full py-4 rounded-full bg-white items-center justify-center"
            >
              <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                Save Check-In
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
