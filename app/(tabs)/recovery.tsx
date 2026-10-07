import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Droplets,
  CloudSun,
  AlertTriangle,
  Plus,
  RotateCcw,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getUserProfile, UserProfile, calculateHydrationTarget } from '../../services/userMetrics';
import { fetchWeather, WeatherData } from '../../services/weatherService';
import { getDailyLog, logWaterIntake, resetWaterIntake, DietLogData } from '../../services/dietService';

export default function RecoveryScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dietLog, setDietLog] = useState<DietLogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const loadRecoveryData = async () => {
    try {
      const [userProf, weatherData, log] = await Promise.all([
        getUserProfile(),
        fetchWeather(),
        getDailyLog(),
      ]);
      setProfile(userProf);
      setWeather(weatherData);
      setDietLog(log);
    } catch (err) {
      console.warn('[RecoveryScreen] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecoveryData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecoveryData();
    }, [])
  );

  const handleAddWater = async (amountMl: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const current = dietLog?.consumedWaterMl || 0;
    // Physical human boundary: max 7,000 mL daily
    if (current >= 7000) {
      Alert.alert('Hydration Limit', 'Daily safe hydration ceiling (7,000 mL) reached.');
      return;
    }
    const safeAmount = Math.min(1000, Math.max(50, amountMl));
    try {
      const updated = await logWaterIntake(safeAmount);
      setDietLog(updated);
    } catch (err) {
      console.warn('[handleAddWater] Error logging water:', err);
    }
  };

  const handleResetWater = async () => {
    triggerHaptic();
    try {
      const updated = await resetWaterIntake();
      setDietLog(updated);
    } catch (err) {
      console.warn('[handleResetWater] Error resetting water:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="small" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  // Calculate dynamic hydration target using ambient temperature
  const weight = profile?.weightKg || 78;
  const trainingDays = profile?.trainingDaysPerWeek || 4;
  const currentTemp = weather?.temperature ?? 22;
  const dynamicHydrationTarget = calculateHydrationTarget(weight, trainingDays, currentTemp);

  const consumedWater = Math.max(0, dietLog?.consumedWaterMl || 0);
  const waterProgress = Math.max(0, Math.min(100, Math.round((consumedWater / Math.max(1000, dynamicHydrationTarget)) * 100)));
  const isHeatAlert = currentTemp > 25;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-5 border-b border-white/[0.08] flex-row items-center justify-between">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          RECOVERY // HYDRATION
        </Text>
        <Pressable onPress={handleResetWater}>
          <Text className="text-[#71717A] text-xs font-medium">Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hydration Target & Quick-Log Gauge */}
        <View className="p-6 rounded-3xl bg-[#121216] border border-white/[0.08] mb-6 items-center">
          <Text className="text-[#71717A] text-xs font-mono uppercase tracking-widest mb-1">
            Current Water Intake
          </Text>
          <Text className="text-white text-5xl font-black font-mono tracking-tight my-2">
            {(consumedWater / 1000).toFixed(2)}L
          </Text>
          <Text className="text-[#71717A] text-xs font-mono mb-4">
            of {(dynamicHydrationTarget / 1000).toFixed(1)}L Daily Target ({waterProgress}%)
          </Text>

          {/* Progress Bar */}
          <View className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-5">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${waterProgress}%` }}
            />
          </View>

          {/* Quick-Log Buttons (+250ml, +500ml, +1000ml) */}
          <View className="flex-row gap-3 w-full">
            {[250, 500, 1000].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleAddWater(amount)}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                className="flex-1 py-3 rounded-2xl bg-[#18181D] border border-white/[0.08] items-center justify-center flex-row gap-1"
              >
                <Plus size={12} color="#FFFFFF" />
                <Text className="text-white font-mono text-xs font-bold">
                  {amount >= 1000 ? '1L' : `${amount}ml`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 2. Heat Alert Indicator (if temperature > 25°C) */}
        {isHeatAlert && (
          <View className="p-4 rounded-3xl bg-[#18181D] border border-white/[0.15] flex-row items-center gap-3 mb-6">
            <AlertTriangle size={18} color="#FFFFFF" />
            <View className="flex-1">
              <Text className="text-white font-bold text-xs">
                Ambient Heat Adjustment Active
              </Text>
              <Text className="text-[#71717A] text-[11px] leading-4 mt-0.5">
                Current temperature ({currentTemp}°C) elevates perspiration. Daily hydration goal raised by +500ml.
              </Text>
            </View>
          </View>
        )}

        {/* 3. Open-Meteo Athlete Climate Card */}
        <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <CloudSun size={16} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold tracking-tight">
                Athlete Training Weather
              </Text>
            </View>
            <Text className="text-[#71717A] text-xs font-mono">
              {weather?.location.name || 'Local Station'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View>
              <Text className="text-white text-3xl font-black font-mono">
                {currentTemp}°C
              </Text>
              <Text className="text-[#71717A] text-xs font-medium mt-0.5">
                {weather?.weatherLabel || 'Clear Sky'}
              </Text>
            </View>

            <View className="items-end gap-1">
              <View className="flex-row items-center gap-1.5">
                <Thermometer size={12} color="#71717A" />
                <Text className="text-[#71717A] text-xs font-mono">
                  Feels like {weather?.apparentTemperature ?? currentTemp}°C
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Droplets size={12} color="#71717A" />
                <Text className="text-[#71717A] text-xs font-mono">
                  Humidity: {weather?.humidity ?? 45}%
                </Text>
              </View>
            </View>
          </View>

          <View className="pt-3 border-t border-white/[0.06]">
            <Text className="text-[#71717A] text-xs leading-5">
              {weather?.trainingAdvice ||
                'Ideal ambient conditions for intense resistance training and cellular recovery.'}
            </Text>
          </View>
        </View>

        {/* 4. Recovery Protocols Checklist */}
        <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3">
          <Text className="text-white text-sm font-bold tracking-tight mb-1">
            Restoration Pillars
          </Text>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-[#71717A] text-xs">Sleep Quality Focus</Text>
            <Text className="text-white font-mono text-xs font-semibold">7.5 - 9.0 hrs</Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-[#71717A] text-xs">Daily Water Intake</Text>
            <Text className="text-white font-mono text-xs font-semibold">
              {(dynamicHydrationTarget / 1000).toFixed(1)} L
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-[#71717A] text-xs">Electrolyte Baseline</Text>
            <Text className="text-white font-mono text-xs font-semibold">Sodium & Potassium</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
