import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  getUserProfile,
  UserProfile,
  kgToLbs,
  lbsToKg,
} from '../../services/userMetrics';
import { useAegisStore, aegisState } from '../../services/useAegisStore';
import WeightGoalPlanner from '../../components/ui/WeightGoalPlanner';

interface LiftStandard {
  id: string;
  name: string;
  muscle: string;
  weightKg: number;
  ratioBw: number;
  tier: 'Elite' | 'Advanced' | 'Intermediate' | 'Novice';
  tierColor: string;
}

export default function TrajectoryScreen() {
  const aegis = useAegisStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [newBfInput, setNewBfInput] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const loadData = async () => {
    try {
      const userProf = await getUserProfile();
      if (userProf) setProfile(userProf);
    } catch (err) {
      console.warn('[Trajectory] Error loading profile:', err);
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

  const isImperial = profile?.unitSystem === 'imperial';
  const unitLabel = isImperial ? 'lbs' : 'kg';

  const formatW = (kg: number) => {
    if (isNaN(kg)) return '0.0';
    const val = isImperial ? kgToLbs(kg) : kg;
    return val.toFixed(1);
  };

  const checkIns = aegis.weightCheckIns;
  const latestWeight = checkIns[0]?.weightKg ?? profile?.weightKg ?? 75;
  const startWeight = checkIns[checkIns.length - 1]?.weightKg ?? latestWeight;

  const handleSaveCheckIn = () => {
    const rawNum = parseFloat(newWeightInput);
    if (!rawNum || isNaN(rawNum)) {
      Alert.alert('Invalid Entry', 'Please enter a valid weight number.');
      return;
    }

    const weightKg = isImperial ? lbsToKg(rawNum) : rawNum;
    if (weightKg < 35 || weightKg > 250) {
      Alert.alert('Range Limit', 'Weight must be between 35 kg and 250 kg.');
      return;
    }

    const bf = parseFloat(newBfInput);
    const safeBf = !isNaN(bf) && bf >= 3 && bf <= 60 ? bf : undefined;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.logWeightCheckIn(weightKg, safeBf);
    setNewWeightInput('');
    setNewBfInput('');
    setShowLogModal(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // Calculate 1RM standards relative to bodyweight
  const s = aegis.strength1Rm;
  const bw = Math.max(45, latestWeight);

  const getTier = (ratio: number, eliteThr: number, advThr: number, intThr: number): { tier: LiftStandard['tier']; color: string } => {
    if (ratio >= eliteThr) return { tier: 'Elite', color: '#10E760' };
    if (ratio >= advThr) return { tier: 'Advanced', color: '#00D2FF' };
    if (ratio >= intThr) return { tier: 'Intermediate', color: '#FF9F0A' };
    return { tier: 'Novice', color: '#94A3B8' };
  };

  const strengthLifts: LiftStandard[] = useMemo(() => {
    const bpRatio = Math.round((s.benchPress / bw) * 100) / 100;
    const sqRatio = Math.round((s.squat / bw) * 100) / 100;
    const dlRatio = Math.round((s.deadlift / bw) * 100) / 100;
    const ohpRatio = Math.round((s.overheadPress / bw) * 100) / 100;
    const rowRatio = Math.round((s.barbellRow / bw) * 100) / 100;
    const pullRatio = Math.round((s.weightedPullUp / bw) * 100) / 100;

    const bpTier = getTier(bpRatio, 1.5, 1.25, 1.0);
    const sqTier = getTier(sqRatio, 2.0, 1.75, 1.25);
    const dlTier = getTier(dlRatio, 2.5, 2.0, 1.5);
    const ohpTier = getTier(ohpRatio, 0.9, 0.75, 0.6);
    const rowTier = getTier(rowRatio, 1.2, 1.0, 0.8);
    const pullTier = getTier(pullRatio, 0.45, 0.3, 0.15);

    return [
      { id: 'bp', name: 'Barbell Bench Press', muscle: 'Chest', weightKg: s.benchPress, ratioBw: bpRatio, tier: bpTier.tier, tierColor: bpTier.color },
      { id: 'sq', name: 'Barbell Back Squat', muscle: 'Legs', weightKg: s.squat, ratioBw: sqRatio, tier: sqTier.tier, tierColor: sqTier.color },
      { id: 'dl', name: 'Conventional Deadlift', muscle: 'Back & Hips', weightKg: s.deadlift, ratioBw: dlRatio, tier: dlTier.tier, tierColor: dlTier.color },
      { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', weightKg: s.overheadPress, ratioBw: ohpRatio, tier: ohpTier.tier, tierColor: ohpTier.color },
      { id: 'row', name: 'Pendlay Barbell Row', muscle: 'Upper Back', weightKg: s.barbellRow, ratioBw: rowRatio, tier: rowTier.tier, tierColor: rowTier.color },
      { id: 'pull', name: 'Weighted Pull-Up', muscle: 'Lats & Biceps', weightKg: s.weightedPullUp, ratioBw: pullRatio, tier: pullTier.tier, tierColor: pullTier.color },
    ];
  }, [s, bw]);

  // Compute DOTS Strength Coefficient (official IPF powerlifting coefficient)
  const bigThreeTotalKg = s.benchPress + s.squat + s.deadlift;
  const dotsScore = useMemo(() => {
    const c = [-307.272, 24.3724, -0.191875, 0.000739073, -0.000001093];
    const denom = c[0] + c[1] * bw + c[2] * Math.pow(bw, 2) + c[3] * Math.pow(bw, 3) + c[4] * Math.pow(bw, 4);
    if (denom <= 0) return 0;
    return Math.round((500 / denom) * bigThreeTotalKg * 10) / 10;
  }, [bigThreeTotalKg, bw]);

  // Active Goal & Velocity Synchronization
  const weightGoal = aegis.weightGoal;
  const activePhase = weightGoal?.phase || 'lean_bulk';
  const isLoss = activePhase.includes('cut');
  const isGain = activePhase.includes('bulk');
  const pacePerWeek = weightGoal?.weeklyPaceKg
    ? (isLoss ? -Math.abs(weightGoal.weeklyPaceKg) : Math.abs(weightGoal.weeklyPaceKg))
    : (isLoss ? -0.4 : isGain ? 0.3 : 0);
  const effectiveMonthlyDelta = Math.round(pacePerWeek * 4 * 10) / 10;
  const weeklyTargetDelta = pacePerWeek;

  const chartPoints = [
    { week: 0, label: 'W0', targetWeight: startWeight },
    { week: 2, label: 'W2', targetWeight: Math.round((startWeight + weeklyTargetDelta * 2) * 10) / 10 },
    { week: 4, label: 'W4', targetWeight: Math.round((startWeight + weeklyTargetDelta * 4) * 10) / 10 },
    { week: 6, label: 'W6', targetWeight: Math.round((startWeight + weeklyTargetDelta * 6) * 10) / 10 },
    { week: 8, label: 'W8', targetWeight: Math.round((startWeight + weeklyTargetDelta * 8) * 10) / 10 },
  ];

  const allWeights = [
    ...chartPoints.map((p) => p.targetWeight),
    latestWeight,
    startWeight,
    ...checkIns.slice(0, 5).map((c) => c.weightKg),
  ];
  const minW = Math.floor(Math.min(...allWeights) - 1.2);
  const maxW = Math.ceil(Math.max(...allWeights) + 1.2);
  const rangeW = Math.max(1, maxW - minW);

  const chartWidth = 330;
  const chartHeight = 140;
  const paddingX = 24;
  const paddingY = 18;

  const getX = (week: number) => paddingX + (week / 8) * (chartWidth - paddingX * 2);
  const getY = (w: number) => chartHeight - paddingY - ((w - minW) / rangeW) * (chartHeight - paddingY * 2);

  const projectedPath = chartPoints.reduce((acc, curr, idx) => {
    const x = getX(curr.week);
    const y = getY(curr.targetWeight);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaPath = `${projectedPath} L ${getX(8)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Sleek Minimalist Header */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            PROGRESS & RECORDS
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
            STRENGTH VAULT & COMPOSITION
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            setShowLogModal(true);
          }}
          className="py-2 px-4 rounded-full bg-[#FF5A1F] active:opacity-85 shadow-md shadow-[#FF5A1F]/20"
        >
          <Text className="text-black font-bold text-xs uppercase tracking-wider">
            + Check-In
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Athletic Strength Rating Banner */}
        <View className="p-5 rounded-3xl bg-[#12131A] border border-white/[0.05] mb-5 flex-row items-center justify-between shadow-xl">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="trophy-outline" size={14} color="#FF5A1F" />
              <Text className="text-[#71717A] text-xs font-semibold uppercase tracking-wider">
                STRENGTH RATING
              </Text>
            </View>
            <Text className="text-white text-2xl font-black tracking-tight">
              {dotsScore} <Text className="text-[#FF5A1F] text-sm font-bold">DOTS</Text>
            </Text>
            <Text className="text-[#71717A] text-xs mt-0.5 font-mono">
              Total: {formatW(bigThreeTotalKg)} {unitLabel} across Big 3 Lifts
            </Text>
          </View>

          <View className="py-1.5 px-3.5 rounded-full bg-white/[0.06] border border-white/10 items-center">
            <Text className="text-white text-xs font-bold uppercase">
              {dotsScore >= 400 ? 'ELITE' : dotsScore >= 320 ? 'ADVANCED' : 'INTERMEDIATE'}
            </Text>
          </View>
        </View>

        {/* 2.5. Precision Weight Goal & Milestone Planner */}
        <WeightGoalPlanner onSaved={loadData} className="mb-5" />

        {/* 3. Weight Target & Velocity Summary Card */}
        <View className="p-5 rounded-3xl bg-[#12131A] border border-white/[0.05] mb-5 gap-4 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[#71717A] text-xs font-mono uppercase tracking-wider">
                Current Weight
              </Text>
              <Text className="text-white text-3xl font-black font-mono tracking-tight mt-0.5">
                {formatW(latestWeight)} {unitLabel}
              </Text>
              {checkIns[0]?.bodyFatPct && (
                <Text className="text-[#38BDF8] text-xs font-mono mt-0.5">
                  {checkIns[0].bodyFatPct}% Body Fat
                </Text>
              )}
            </View>

            <View className="items-end">
              <Text className="text-[#71717A] text-xs font-mono uppercase tracking-wider">
                Target Velocity
              </Text>
              <Text className={`font-mono text-base font-bold mt-0.5 ${effectiveMonthlyDelta >= 0 ? 'text-[#FF5A1F]' : 'text-[#10B981]'}`}>
                {effectiveMonthlyDelta >= 0 ? `+${formatW(effectiveMonthlyDelta)}` : formatW(effectiveMonthlyDelta)} {unitLabel}/mo
              </Text>
              <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                ({weeklyTargetDelta >= 0 ? `+${formatW(weeklyTargetDelta)}` : formatW(weeklyTargetDelta)} {unitLabel}/wk)
              </Text>
            </View>
          </View>

          {/* Rate of Change Row */}
          <View className="flex-row justify-between pt-3 border-t border-white/[0.05]">
            <View>
              <Text className="text-[#71717A] text-xs font-mono">Baseline</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {formatW(startWeight)} {unitLabel}
              </Text>
            </View>
            <View>
              <Text className="text-[#71717A] text-xs font-mono">Target</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {formatW(weightGoal?.targetWeightKg ?? (isGain ? startWeight + 4 : startWeight - 4))} {unitLabel}
              </Text>
            </View>
            <View>
              <Text className="text-[#71717A] text-xs font-mono">Total Delta</Text>
              <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                {latestWeight - startWeight >= 0 ? `+${formatW(latestWeight - startWeight)}` : formatW(latestWeight - startWeight)} {unitLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Enhanced Progression Curve Graph */}
        <View className="p-5 rounded-3xl bg-[#12131A] border border-white/[0.05] mb-5 gap-3 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                8-Week Projection Curve
              </Text>
              <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                {activePhase.replace('_', ' ').toUpperCase()} • {weeklyTargetDelta >= 0 ? `+${weeklyTargetDelta}` : weeklyTargetDelta} KG/WK
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
                <Text className="text-[#71717A] text-[10px] font-mono">Plan</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <Text className="text-[#71717A] text-[10px] font-mono">Actual</Text>
              </View>
            </View>
          </View>

          {/* SVG Progression Chart */}
          <View className="w-full items-center py-2">
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Baseline Horizontal Reference */}
              <Line
                x1={paddingX}
                y1={getY(startWeight)}
                x2={chartWidth - paddingX}
                y2={getY(startWeight)}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray="4, 4"
              />

              {/* Target Horizontal Reference */}
              <Line
                x1={paddingX}
                y1={getY(chartPoints[4].targetWeight)}
                x2={chartWidth - paddingX}
                y2={getY(chartPoints[4].targetWeight)}
                stroke="rgba(255, 90, 31, 0.15)"
                strokeWidth="1"
                strokeDasharray="2, 2"
              />

              {/* Area Gradient Fill */}
              <Path d={areaPath} fill="url(#curveGradient)" />

              {/* Projected Progression Curve */}
              <Path
                d={projectedPath}
                fill="none"
                stroke="#FF5A1F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Milestone Dots along Target Curve */}
              {chartPoints.map((pt, pIdx) => (
                <Circle
                  key={pIdx}
                  cx={getX(pt.week)}
                  cy={getY(pt.targetWeight)}
                  r={pIdx === 0 || pIdx === 4 ? 4.5 : 3}
                  fill={pIdx === 0 ? '#FFFFFF' : '#FF5A1F'}
                  stroke="#12131A"
                  strokeWidth="1.5"
                />
              ))}

              {/* Actual Logged Weigh-In Marker (Latest) */}
              <Circle
                cx={getX(0.4)}
                cy={getY(latestWeight)}
                r="5"
                fill="#38BDF8"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </Svg>
          </View>

          {/* Week Milestone Annotations */}
          <View className="flex-row justify-between px-3 pt-1 border-t border-white/[0.04]">
            {chartPoints.map((pt, pIdx) => (
              <View key={pIdx} className="items-center">
                <Text className="text-[#52525B] text-[10px] font-mono">{pt.label}</Text>
                <Text className="text-white text-[10px] font-mono font-bold mt-0.5">
                  {pt.targetWeight}k
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5. 1RM Strength Trophy Vault (Big 6 Compound Movements) */}
        <View className="p-5 rounded-3xl bg-[#12131A] border border-white/[0.05] mb-5 gap-3 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="trophy" size={16} color="#FF9F0A" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                1RM Strength Trophy Vault
              </Text>
            </View>
            <Text className="text-[#FF9F0A] text-[10px] font-mono font-bold">
              BIG 6 RECORDS
            </Text>
          </View>

          <View className="gap-2.5 pt-1">
            {strengthLifts.map((lift) => (
              <View
                key={lift.id}
                className="py-3 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.04] flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white text-xs font-bold" numberOfLines={1}>
                      {lift.name}
                    </Text>
                    <View
                      className="py-0.5 px-2 rounded-md"
                      style={{ backgroundColor: `${lift.tierColor}15` }}
                    >
                      <Text
                        className="text-[9px] font-mono font-bold"
                        style={{ color: lift.tierColor }}
                      >
                        {lift.tier} ({lift.ratioBw}x BW)
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                    {lift.muscle} • Est. 1RM
                  </Text>
                </View>

                <View className="py-1 px-3 rounded-xl bg-white/[0.06] border border-white/10 items-end">
                  <Text className="text-[#FF5A1F] font-mono text-xs font-black">
                    {formatW(lift.weightKg)} {unitLabel}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Weigh-in History List */}
        <View className="gap-3">
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            Check-In History ({checkIns.length})
          </Text>

          {checkIns.map((ci) => (
            <View
              key={ci.id}
              className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.05] flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-2xl bg-white/[0.05] items-center justify-center">
                  <Ionicons name="scale-outline" size={17} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white font-mono text-sm font-bold">
                    {formatW(ci.weightKg)} {unitLabel}
                  </Text>
                  <Text className="text-[#71717A] text-xs font-mono">
                    {ci.date} {ci.bodyFatPct ? `• ${ci.bodyFatPct}% BF` : ''}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Weigh-in Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View className="flex-1 bg-black/85 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/10 p-6 gap-4 shadow-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base font-bold">Record Morning Weigh-In</Text>
              <Pressable
                onPress={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="gap-2">
              <Text className="text-[#71717A] text-xs font-mono uppercase">
                Weight ({unitLabel.toUpperCase()})
              </Text>
              <TextInput
                value={newWeightInput}
                onChangeText={setNewWeightInput}
                placeholder={formatW(latestWeight)}
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                className="h-12 px-4 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-lg font-bold"
              />
            </View>

            <View className="gap-2">
              <Text className="text-[#71717A] text-xs font-mono uppercase">
                Estimated Body Fat % (Optional)
              </Text>
              <TextInput
                value={newBfInput}
                onChangeText={setNewBfInput}
                placeholder="e.g. 13.5"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                className="h-12 px-4 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-sm"
              />
            </View>

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setShowLogModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#181922] border border-white/10 items-center justify-center"
              >
                <Text className="text-[#71717A] text-xs font-bold uppercase">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveCheckIn}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center active:opacity-85"
              >
                <Text className="text-black text-xs font-bold uppercase tracking-wider">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
