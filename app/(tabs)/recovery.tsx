import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserProfile, UserProfile, calculateHydrationTarget } from '../../services/userMetrics';
import { fetchWeather, WeatherData } from '../../services/weatherService';
import { useAegisStore, aegisState } from '../../services/useAegisStore';
import PhotoCard from '../../components/ui/PhotoCard';
import CircularDial from '../../components/ui/CircularDial';

interface MuscleGroupItem {
  id: string;
  name: string;
  side: 'front' | 'back';
  readinessPct: number;
  hoursRested: number;
}

export default function RecoveryScreen() {
  const aegis = useAegisStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');

  // Sleep Logger Modal
  const [showSleepModal, setShowSleepModal] = useState<boolean>(false);
  const [selectedSleepHours, setSelectedSleepHours] = useState<number>(aegis.sleepHours || 7.5);
  const [selectedSleepQuality, setSelectedSleepQuality] = useState<number>(aegis.sleepQualityPct || 85);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const loadData = async () => {
    try {
      const [userProf, weatherData] = await Promise.all([
        getUserProfile(),
        fetchWeather(),
      ]);
      if (userProf) setProfile(userProf);
      if (weatherData) setWeather(weatherData);
    } catch (err) {
      console.warn('[RecoveryScreen] Load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const currentWeight = profile?.weightKg || 75;
  const currentTemp = weather?.temperature || 24;
  const dynamicHydrationTarget = calculateHydrationTarget(
    currentWeight,
    profile?.trainingDays?.length || 4,
    currentTemp
  );

  // Strictly clamp hydration between 0 and dynamicHydrationTarget (cannot exceed upper limit)
  const consumedWater = Math.min(dynamicHydrationTarget, aegis.consumedWaterMl || 0);
  const isTargetMet = consumedWater >= dynamicHydrationTarget;
  const waterProgress = Math.min(100, Math.round((consumedWater / Math.max(1000, dynamicHydrationTarget)) * 100));
  const isHeatAlert = currentTemp > 25;

  const handleAddWater = (amountMl: number) => {
    if (isTargetMet) {
      Alert.alert(
        'Hydration Limit Reached',
        `You have already reached your daily limit of ${(dynamicHydrationTarget / 1000).toFixed(1)}L. Healthy hydration balance is complete.`
      );
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const nextAmount = Math.min(dynamicHydrationTarget, consumedWater + amountMl);
    aegisState.setWater(nextAmount, dynamicHydrationTarget);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleResetWater = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.resetWater();
  };

  const handleSaveSleep = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.logSleep(selectedSleepHours, selectedSleepQuality);
    setShowSleepModal(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // Real muscle states derived from global state
  const m = aegis.muscleRecovery;
  const allMuscles: MuscleGroupItem[] = [
    // Front View
    { id: 'chest', name: 'Pectorals (Chest)', side: 'front', readinessPct: m.chest, hoursRested: m.chest < 50 ? 12 : 48 },
    { id: 'delts_ant', name: 'Anterior Deltoids', side: 'front', readinessPct: m.shoulders, hoursRested: m.shoulders < 50 ? 14 : 36 },
    { id: 'biceps', name: 'Biceps Brachii', side: 'front', readinessPct: m.arms, hoursRested: m.arms < 50 ? 16 : 48 },
    { id: 'core', name: 'Abdominals & Core', side: 'front', readinessPct: m.core, hoursRested: m.core < 50 ? 20 : 60 },
    { id: 'quads', name: 'Quadriceps (Thighs)', side: 'front', readinessPct: m.legs, hoursRested: m.legs < 50 ? 10 : 72 },

    // Back View
    { id: 'lats', name: 'Latissimus Dorsi (Back)', side: 'back', readinessPct: m.back, hoursRested: m.back < 50 ? 14 : 64 },
    { id: 'traps', name: 'Trapezius & Upper Back', side: 'back', readinessPct: Math.round((m.back + m.shoulders) / 2), hoursRested: 40 },
    { id: 'delts_post', name: 'Posterior Deltoids', side: 'back', readinessPct: m.shoulders, hoursRested: 36 },
    { id: 'triceps', name: 'Triceps Brachii', side: 'back', readinessPct: m.arms, hoursRested: m.arms < 50 ? 14 : 48 },
    { id: 'posterior_chain', name: 'Hamstrings & Glutes', side: 'back', readinessPct: m.legs, hoursRested: m.legs < 50 ? 8 : 72 },
  ];

  const displayedMuscles = allMuscles.filter((item) => item.side === bodySide);

  // Computed Whoop-Style Composite Recovery Score
  const compositeRecoveryScore = useMemo(() => {
    const cns = aegis.cnsReadinessPct || 80;
    const sleep = aegis.sleepQualityPct || 85;
    const water = Math.min(100, waterProgress);
    return Math.min(99, Math.max(20, Math.round(cns * 0.45 + sleep * 0.35 + water * 0.2)));
  }, [aegis.cnsReadinessPct, aegis.sleepQualityPct, waterProgress]);

  const recoveryColor =
    compositeRecoveryScore >= 67
      ? '#10B981'
      : compositeRecoveryScore >= 34
      ? '#F59E0B'
      : '#EF4444';

  const recoveryStatusLabel =
    compositeRecoveryScore >= 67
      ? 'OPTIMAL RECOVERY'
      : compositeRecoveryScore >= 34
      ? 'RESTORING'
      : 'STRAINED RECOVERY';

  const recoveryInsight =
    compositeRecoveryScore >= 67
      ? 'Central nervous system & motor pathways are primed for high-intensity power and progressive overload.'
      : compositeRecoveryScore >= 34
      ? 'Cardiovascular and muscular tissue is recovering adequately. Focus on hydration and warm-up sets.'
      : 'High systemic fatigue detected. Prioritize water balance and sleep hygiene.';

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Header with Rest Summary */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            RECOVERY & REST
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
            NEURO-MUSCULAR REGENERATION
          </Text>
        </View>

        <Pressable
          onPress={() => setShowSleepModal(true)}
          className="py-2 px-3.5 rounded-2xl bg-[#14151C] border border-white/[0.06] flex-row items-center gap-2 active:opacity-75"
        >
          <Ionicons name="moon" size={13} color="#FF5A1F" />
          <Text className="text-white text-xs font-bold font-mono">
            {aegis.sleepHours}h Sleep
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Signature Whoop Recovery Dial Card */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-6 mb-5 shadow-xl items-center">
          <View className="w-full flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: recoveryColor }} />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                DAILY RECOVERY SCORE
              </Text>
            </View>
            <View
              className="py-1 px-3 rounded-full border"
              style={{
                backgroundColor: `${recoveryColor}15`,
                borderColor: `${recoveryColor}30`,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: recoveryColor }}>
                {recoveryStatusLabel}
              </Text>
            </View>
          </View>

          {/* Glowing Circular Whoop Dial */}
          <View className="my-3 items-center justify-center">
            <CircularDial
              size={154}
              strokeWidth={13}
              progress={compositeRecoveryScore}
              color={recoveryColor}
              valueText={`${compositeRecoveryScore}%`}
              labelText="RECOVERED"
            />
          </View>

          {/* Coaching Insight Tagline */}
          <Text className="text-[#A1A1AA] text-xs text-center leading-5 px-3 mt-2 mb-5">
            {recoveryInsight}
          </Text>

          {/* Biometrics 3-Column Telemetry Row (Fixed Columns) */}
          <View className="w-full pt-4 border-t border-white/[0.05] flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-[#71717A] text-[10px] font-mono uppercase">HRV Status</Text>
              <Text className="text-white text-base font-mono font-bold mt-1">68 ms</Text>
              <Text className="text-[#10B981] text-[10px] font-mono mt-0.5">+4 vs base</Text>
            </View>

            <View className="w-[1px] h-8 bg-white/[0.06]" />

            <View className="items-center flex-1">
              <Text className="text-[#71717A] text-[10px] font-mono uppercase">Resting HR</Text>
              <Text className="text-white text-base font-mono font-bold mt-1">52 bpm</Text>
              <Text className="text-[#10B981] text-[10px] font-mono mt-0.5">Optimal</Text>
            </View>

            <View className="w-[1px] h-8 bg-white/[0.06]" />

            <View className="items-center flex-1">
              <Text className="text-[#71717A] text-[10px] font-mono uppercase">Sleep Quality</Text>
              <Text className="text-white text-base font-mono font-bold mt-1">
                {aegis.sleepQualityPct}%
              </Text>
              <Text className="text-[#10B981] text-[10px] font-mono mt-0.5">
                {aegis.sleepHours}h Logged
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Athleisure Photography Card */}
        <PhotoCard
          imageSource={require('../../assets/generated/recovery_hero.jpg')}
          tag="REST & RECHARGE"
          tagColor="#FF5A1F"
          title="Regeneration Protocol"
          subtitle="Rebuild muscle fibers, rehydrate cellular tissue, and lower sympathetic drive."
          meta={[
            { icon: 'moon-outline', text: `${aegis.sleepHours}h Sleep Logged` },
            { icon: 'water-outline', text: `${(consumedWater / 1000).toFixed(1)}L Hydration` },
          ]}
          className="mb-5"
        />

        {/* 4. Tactile Muscle Readiness Card (Aligned Column Numbers) */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 shadow-xl">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Muscle Readiness
              </Text>
            </View>

            {/* Front / Back Toggle Pills */}
            <View className="flex-row p-1 rounded-2xl bg-[#181922] border border-white/[0.05]">
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setBodySide('front');
                }}
                className={`py-1.5 px-3 rounded-xl ${bodySide === 'front' ? 'bg-[#FF5A1F]' : 'bg-transparent'}`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    bodySide === 'front' ? 'text-black' : 'text-[#71717A]'
                  }`}
                >
                  Front
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setBodySide('back');
                }}
                className={`py-1.5 px-3 rounded-xl ${bodySide === 'back' ? 'bg-[#FF5A1F]' : 'bg-transparent'}`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    bodySide === 'back' ? 'text-black' : 'text-[#71717A]'
                  }`}
                >
                  Back
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Tactile Muscle Cards with Aligned Numbers */}
          <View className="gap-2.5">
            {displayedMuscles.map((item) => {
              const isReady = item.readinessPct >= 85;
              const isRestoring = item.readinessPct >= 60 && item.readinessPct < 85;
              const badgeColor = isReady ? '#10B981' : isRestoring ? '#FF5A1F' : '#F59E0B';
              const badgeLabel = isReady ? 'READY' : isRestoring ? 'RESTORING' : 'FATIGUED';

              return (
                <View
                  key={item.id}
                  className="py-3 px-4 rounded-2xl bg-[#181922] border border-white/[0.04] flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-white text-xs font-bold tracking-tight">
                      {item.name}
                    </Text>
                    <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                      {item.hoursRested}h Rest Period
                    </Text>
                  </View>

                  {/* Aligned Right Column */}
                  <View className="flex-row items-center gap-2.5">
                    <Text className="w-11 text-right text-white text-xs font-mono font-bold">
                      {item.readinessPct}%
                    </Text>
                    <View
                      className="w-22 items-center py-1 px-2.5 rounded-full border"
                      style={{
                        backgroundColor: `${badgeColor}15`,
                        borderColor: `${badgeColor}30`,
                      }}
                    >
                      <Text
                        className="text-[10px] font-mono font-bold"
                        style={{ color: badgeColor }}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Hydration Balance Card (Strict Limit Cap) */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 shadow-xl">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="water" size={16} color="#38BDF8" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Hydration Balance
              </Text>
            </View>

            {isTargetMet ? (
              <View className="py-1 px-2.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30">
                <Text className="text-[#10B981] text-[10px] font-mono font-bold">
                  ✓ TARGET REACHED
                </Text>
              </View>
            ) : (
              <Text className="text-[#38BDF8] text-xs font-mono font-bold">
                {waterProgress}% LOGGED
              </Text>
            )}
          </View>

          <View className="items-center py-2">
            <Text className="text-white text-4xl font-black font-mono tracking-tight">
              {(consumedWater / 1000).toFixed(2)}L
            </Text>
            <Text className="text-[#71717A] text-xs font-mono mt-1">
              Daily Target Cap: {(dynamicHydrationTarget / 1000).toFixed(1)}L
              {isHeatAlert && ' (Includes +500ml Heat Buffer)'}
            </Text>
          </View>

          {/* Cyan Glow Bar */}
          <View className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden my-4 border border-white/[0.05]">
            <View
              className="h-full bg-[#38BDF8] rounded-full"
              style={{ width: `${waterProgress}%` }}
            />
          </View>

          {/* Quick-Log Buttons with Cap Enforcement */}
          <View className="flex-row gap-2 w-full">
            {[250, 500, 1000].map((amount) => {
              const disabled = isTargetMet;
              return (
                <Pressable
                  key={amount}
                  onPress={() => handleAddWater(amount)}
                  disabled={disabled}
                  className={`flex-1 py-3 rounded-2xl border items-center justify-center flex-row gap-1 active:opacity-75 ${
                    disabled
                      ? 'bg-[#181922]/50 border-white/[0.02] opacity-40'
                      : 'bg-[#181922] border-white/[0.06]'
                  }`}
                >
                  <Ionicons name="add" size={14} color="#38BDF8" />
                  <Text className="text-white font-mono text-xs font-bold">
                    {amount >= 1000 ? '1L' : `${amount}ml`}
                  </Text>
                </Pressable>
              );
            })}

            {/* Quick Reset Action */}
            <Pressable
              onPress={handleResetWater}
              className="w-12 py-3 rounded-2xl bg-[#181922] border border-white/[0.06] items-center justify-center active:bg-white/10"
            >
              <Ionicons name="refresh-outline" size={15} color="#71717A" />
            </Pressable>
          </View>
        </View>

        {/* 6. Local Atmospheric Climate Card */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 shadow-xl">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="partly-sunny-outline" size={16} color="#FF5A1F" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Training Climate
              </Text>
            </View>
            <Text className="text-[#71717A] text-xs font-mono">
              {weather?.location.name || 'Local Station'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <View>
              <Text className="text-white text-3xl font-black font-mono">
                {currentTemp}°C
              </Text>
              <Text className="text-[#71717A] text-xs font-medium mt-0.5">
                {weather?.weatherLabel || 'Clear Sky'}
              </Text>
            </View>

            <View className="items-end gap-1">
              <Text className="text-[#71717A] text-xs font-mono">
                Feels like {weather?.apparentTemperature ?? currentTemp}°C
              </Text>
              <Text className="text-[#71717A] text-xs font-mono">
                Humidity: {weather?.humidity ?? 50}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sleep Logger Modal */}
      <Modal
        visible={showSleepModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSleepModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/[0.08] p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-base font-bold">Sleep & Recovery Log</Text>
                <Text className="text-[#71717A] text-xs mt-0.5">Influences your overall recovery score</Text>
              </View>
              <Pressable
                onPress={() => setShowSleepModal(false)}
                className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Sleep Hours Stepper */}
            <View className="gap-2">
              <Text className="text-[#71717A] text-xs font-mono uppercase">Duration (Hours)</Text>
              <View className="flex-row justify-between gap-1.5">
                {[6.0, 7.0, 7.5, 8.0, 8.5, 9.0].map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setSelectedSleepHours(h)}
                    className={`flex-1 py-2.5 rounded-2xl items-center border ${
                      selectedSleepHours === h ? 'bg-[#FF5A1F] border-[#FF5A1F]' : 'bg-[#181922] border-white/[0.06]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-mono font-bold ${
                        selectedSleepHours === h ? 'text-black' : 'text-[#71717A]'
                      }`}
                    >
                      {h}h
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sleep Quality */}
            <View className="gap-2">
              <Text className="text-[#71717A] text-xs font-mono uppercase">Quality / Restfulness</Text>
              <View className="flex-row justify-between gap-2">
                {[
                  { label: 'Fair (70%)', val: 70 },
                  { label: 'Good (85%)', val: 85 },
                  { label: 'Deep (95%)', val: 95 },
                ].map((q) => (
                  <Pressable
                    key={q.val}
                    onPress={() => setSelectedSleepQuality(q.val)}
                    className={`flex-1 py-2.5 rounded-2xl items-center border ${
                      selectedSleepQuality === q.val ? 'bg-[#FF5A1F] border-[#FF5A1F]' : 'bg-[#181922] border-white/[0.06]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedSleepQuality === q.val ? 'text-black' : 'text-[#71717A]'
                      }`}
                    >
                      {q.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleSaveSleep}
              className="w-full py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center mt-1 active:opacity-85"
            >
              <Text className="text-black text-xs font-bold uppercase tracking-wider">
                Save Sleep Record
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
