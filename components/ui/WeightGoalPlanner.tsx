import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  useAegisStore,
  aegisState,
  GoalPhase,
} from '../../services/useAegisStore';
import {
  GOAL_PHASE_CONFIGS,
  calculateGoalMilestone,
  calculateFullProfile,
  saveUserProfile,
  getUserProfile,
  UserProfile,
  kgToLbs,
  lbsToKg,
} from '../../services/userMetrics';

interface WeightGoalPlannerProps {
  onSaved?: () => void;
  className?: string;
}

export default function WeightGoalPlanner({ onSaved, className = '' }: WeightGoalPlannerProps) {
  const aegis = useAegisStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    getUserProfile().then((p) => {
      if (p) setProfile(p);
    });
  }, []);

  const isImperial = profile?.unitSystem === 'imperial';
  const unitLabel = isImperial ? 'lbs' : 'kg';

  // Current weight from store
  const currentWeightKg = aegis.weightGoal?.currentWeightKg || aegis.weightCheckIns[0]?.weightKg || profile?.weightKg || 79.0;
  
  // Selected Phase
  const [selectedPhase, setSelectedPhase] = useState<GoalPhase>(
    aegis.weightGoal?.phase || 'lean_bulk'
  );

  // Target Weight Input
  const initialTargetKg = aegis.weightGoal?.targetWeightKg || (currentWeightKg + 3.5);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(initialTargetKg);
  const [targetInputStr, setTargetInputStr] = useState<string>(
    isImperial ? kgToLbs(initialTargetKg).toString() : initialTargetKg.toString()
  );

  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handlePhaseChange = (phase: GoalPhase) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPhase(phase);
    setIsCommitted(false);

    // Provide sensible default target based on phase
    if (phase.includes('cut') && targetWeightKg >= currentWeightKg) {
      const newTarget = Math.max(35, currentWeightKg - 4.0);
      setTargetWeightKg(newTarget);
      setTargetInputStr(isImperial ? kgToLbs(newTarget).toString() : newTarget.toString());
    } else if (phase.includes('bulk') && targetWeightKg <= currentWeightKg) {
      const newTarget = Math.min(250, currentWeightKg + 4.5);
      setTargetWeightKg(newTarget);
      setTargetInputStr(isImperial ? kgToLbs(newTarget).toString() : newTarget.toString());
    } else if (phase === 'recomp') {
      setTargetWeightKg(currentWeightKg);
      setTargetInputStr(isImperial ? kgToLbs(currentWeightKg).toString() : currentWeightKg.toString());
    }
  };

  const adjustTargetWeight = (deltaKg: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setIsCommitted(false);
    const newKg = Math.min(250, Math.max(35, Math.round((targetWeightKg + deltaKg) * 10) / 10));
    setTargetWeightKg(newKg);
    setTargetInputStr(isImperial ? kgToLbs(newKg).toString() : newKg.toString());
  };

  const handleInputChange = (text: string) => {
    setTargetInputStr(text);
    setIsCommitted(false);
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      const inKg = isImperial ? lbsToKg(num) : num;
      if (inKg >= 35 && inKg <= 250) {
        setTargetWeightKg(Math.round(inKg * 10) / 10);
      }
    }
  };

  // Milestone Calculations
  const milestone = useMemo(() => {
    return calculateGoalMilestone({
      currentWeightKg,
      targetWeightKg,
      phase: selectedPhase,
      heightCm: profile?.heightCm || 178,
      age: profile?.age || 24,
      sex: profile?.sex || 'male',
      trainingDaysPerWeek: profile?.trainingDaysPerWeek || 4,
    });
  }, [currentWeightKg, targetWeightKg, selectedPhase, profile]);

  // Visual Progress Calculation
  const startWeightKg = aegis.weightCheckIns[aegis.weightCheckIns.length - 1]?.weightKg || currentWeightKg;
  const progressPct = useMemo(() => {
    if (selectedPhase === 'recomp') return 50;
    const totalDist = Math.abs(targetWeightKg - startWeightKg);
    if (totalDist <= 0.2) return 100;
    const traversed = Math.abs(currentWeightKg - startWeightKg);
    return Math.min(100, Math.max(5, Math.round((traversed / totalDist) * 100)));
  }, [selectedPhase, currentWeightKg, targetWeightKg, startWeightKg]);

  const activePhaseCfg = GOAL_PHASE_CONFIGS[selectedPhase];

  const handleCommitGoal = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    // 1. Update State Store
    aegisState.setWeightGoal({
      phase: selectedPhase,
      currentWeightKg,
      targetWeightKg,
      weeklyPaceKg: activePhaseCfg.weeklyPaceKg,
      targetDate: milestone.projectedIsoDate,
      dailyCaloricDelta: activePhaseCfg.caloricDelta,
    });

    // 2. Update Nutrition Targets in Store
    aegisState.setNutritionTargets({
      calories: milestone.newCalories,
      protein: milestone.newProteinG,
      carbs: milestone.newCarbsG,
      fats: milestone.newFatsG,
    });

    // 3. Persist into User Profile
    if (profile) {
      const goalType = selectedPhase.includes('cut') ? 'cut' : selectedPhase.includes('bulk') ? 'bulk' : 'recomp';
      const updatedProfile = calculateFullProfile({
        ...profile,
        goal: goalType,
        goalPhase: selectedPhase,
        targetWeightKg,
        monthlyKgTarget: Math.abs(activePhaseCfg.weeklyPaceKg * 4),
        weightKg: currentWeightKg,
      });
      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    }

    setIsCommitted(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onSaved?.();
  };

  const displayCurrentWeight = isImperial ? kgToLbs(currentWeightKg) : currentWeightKg;
  const displayTargetWeight = isImperial ? kgToLbs(targetWeightKg) : targetWeightKg;

  return (
    <View className={`bg-[#12131A] border border-white/[0.05] rounded-3xl overflow-hidden ${className}`}>
      {/* Top Photographic Hero Banner */}
      <View className="w-full h-36 relative bg-[#08090C]">
        <ExpoImage
          source={require('../../assets/generated/progress_hero.jpg')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={250}
        />
        <View className="absolute inset-0 bg-black/40" />
        <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#12131A] to-transparent" />

        <View className="absolute bottom-3 left-5 right-5 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold tracking-tight">
              Physique & Weight Goal
            </Text>
            <Text className="text-[#A1A1AA] text-xs mt-0.5">
              Personalized metabolic targets & timeline
            </Text>
          </View>

          <View className="px-3 py-1 rounded-full bg-[#FF5A1F] border border-[#FF5A1F]/30">
            <Text className="text-black text-[10px] font-bold uppercase tracking-wider">
              {activePhaseCfg.badge}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-5 pt-3">
        {/* PHASE SELECTOR CHIPS */}
        <Text className="text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-2.5">
          Choose Goal Phase
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(Object.keys(GOAL_PHASE_CONFIGS) as GoalPhase[]).map((phaseKey) => {
            const cfg = GOAL_PHASE_CONFIGS[phaseKey];
            const isSelected = selectedPhase === phaseKey;

            return (
              <Pressable
                key={phaseKey}
                onPress={() => handlePhaseChange(phaseKey)}
                className={`px-3.5 py-2 rounded-2xl border flex-row items-center gap-2 ${
                  isSelected
                    ? 'bg-[#FF5A1F]/20 border-[#FF5A1F]'
                    : 'bg-[#181922] border-white/[0.04]'
                }`}
              >
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#FF5A1F' : cfg.accentColor }}
                />
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white font-bold' : 'text-[#A1A1AA]'
                  }`}
                >
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Phase Description Tagline */}
        <View className="bg-[#181922] p-3 rounded-2xl border border-white/[0.04] mb-4">
          <Text className="text-[#D4D4D8] text-xs leading-5">
            {activePhaseCfg.tagline}
          </Text>
        </View>

        {/* CURRENT WEIGHT VS TARGET WEIGHT CARDS */}
        <View className="flex-row gap-3 mb-4">
          {/* Current Weight */}
          <View className="flex-1 bg-[#181922] p-4 rounded-2xl border border-white/[0.04]">
            <Text className="text-[#71717A] text-xs font-medium mb-1">
              Current Weight
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-white text-2xl font-bold">
                {displayCurrentWeight.toFixed(1)}
              </Text>
              <Text className="text-[#71717A] text-xs font-medium">{unitLabel}</Text>
            </View>
            <Text className="text-[#52525B] text-[10px] mt-1">From latest check-in</Text>
          </View>

          {/* Target Weight with Stepper */}
          <View className="flex-1 bg-[#181922] p-4 rounded-2xl border border-white/[0.04]">
            <Text className="text-[#71717A] text-xs font-medium mb-1">
              Target Weight
            </Text>
            <View className="flex-row items-center justify-between">
              <TextInput
                value={targetInputStr}
                onChangeText={handleInputChange}
                keyboardType="decimal-pad"
                className="text-white text-2xl font-bold p-0 m-0"
                placeholderTextColor="#71717A"
              />
              <Text className="text-[#71717A] text-xs font-medium">{unitLabel}</Text>
            </View>

            {/* Stepper Buttons */}
            <View className="flex-row items-center gap-2 mt-2">
              <Pressable
                onPress={() => adjustTargetWeight(-0.5)}
                className="flex-1 py-1.5 bg-white/[0.06] rounded-xl items-center active:bg-white/[0.12]"
              >
                <Text className="text-white text-xs font-bold">-0.5</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustTargetWeight(0.5)}
                className="flex-1 py-1.5 bg-white/[0.06] rounded-xl items-center active:bg-white/[0.12]"
              >
                <Text className="text-white text-xs font-bold">+0.5</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* PROGRESS TRACKER BAR */}
        <View className="bg-[#181922] p-4 rounded-2xl border border-white/[0.04] mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#71717A] text-xs font-medium">
              Progress to Goal
            </Text>
            <Text className="text-[#FF5A1F] text-xs font-bold">
              {progressPct}% Complete
            </Text>
          </View>

          <View className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-2">
            <View
              className="h-full rounded-full bg-[#FF5A1F]"
              style={{ width: `${progressPct}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[#71717A] text-[10px]">
              Start: {startWeightKg.toFixed(1)} {unitLabel}
            </Text>
            <Text className="text-[#A1A1AA] text-[10px] font-semibold">
              Delta: {milestone.weightDeltaKg.toFixed(1)} kg {selectedPhase.includes('cut') ? 'loss' : selectedPhase.includes('bulk') ? 'gain' : ''}
            </Text>
            <Text className="text-[#71717A] text-[10px]">
              Target: {displayTargetWeight.toFixed(1)} {unitLabel}
            </Text>
          </View>
        </View>

        {/* MILESTONE & TIME PREDICTION CARD */}
        <View className="bg-[#181922] p-4 rounded-2xl border border-white/[0.04] mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={15} color="#FF5A1F" />
              <Text className="text-white text-xs font-bold tracking-tight">
                Estimated Completion
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-white/[0.06]">
              <Text className="text-[#A1A1AA] text-[10px] font-bold">
                {milestone.weeksRemaining.toFixed(1)} WEEKS
              </Text>
            </View>
          </View>

          <View className="flex-row items-baseline gap-2 mb-1.5">
            <Text className="text-white text-xl font-bold">
              {milestone.projectedDate}
            </Text>
            <Text className="text-[#71717A] text-xs">
              ({milestone.daysRemaining} days away)
            </Text>
          </View>

          <Text className="text-[#71717A] text-[11px]">
            Based on a healthy pace of{' '}
            <Text className="text-white font-semibold">
              {activePhaseCfg.weeklyPaceKg > 0 ? `+${activePhaseCfg.weeklyPaceKg}` : activePhaseCfg.weeklyPaceKg} kg/wk
            </Text>
          </Text>
        </View>

        {/* NEW NUTRITION PRESCRIPTION PREVIEW */}
        <View className="bg-[#181922] p-4 rounded-2xl border border-white/[0.04] mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-xs font-bold tracking-tight">
              Target Daily Nutrition
            </Text>
            <Text className="text-[#71717A] text-[10px] font-medium">
              Auto-Adjusted
            </Text>
          </View>

          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-[#71717A] text-[10px] font-medium uppercase">Calories</Text>
              <Text className="text-white text-base font-bold mt-0.5">
                {milestone.newCalories}
              </Text>
              <Text className="text-[#52525B] text-[9px]">kcal</Text>
            </View>

            <View className="items-center flex-1 border-l border-white/[0.06]">
              <Text className="text-[#71717A] text-[10px] font-medium uppercase">Protein</Text>
              <Text className="text-[#FF5A1F] text-base font-bold mt-0.5">
                {milestone.newProteinG}g
              </Text>
              <Text className="text-[#52525B] text-[9px]">{activePhaseCfg.proteinPerKg}g/kg</Text>
            </View>

            <View className="items-center flex-1 border-l border-white/[0.06]">
              <Text className="text-[#71717A] text-[10px] font-medium uppercase">Carbs</Text>
              <Text className="text-white text-base font-bold mt-0.5">
                {milestone.newCarbsG}g
              </Text>
              <Text className="text-[#52525B] text-[9px]">Fuel</Text>
            </View>

            <View className="items-center flex-1 border-l border-white/[0.06]">
              <Text className="text-[#71717A] text-[10px] font-medium uppercase">Fats</Text>
              <Text className="text-white text-base font-bold mt-0.5">
                {milestone.newFatsG}g
              </Text>
              <Text className="text-[#52525B] text-[9px]">Hormonal</Text>
            </View>
          </View>
        </View>

        {/* COMMIT ACTION BUTTON */}
        <Pressable
          onPress={handleCommitGoal}
          className={`w-full py-3.5 rounded-2xl items-center justify-center flex-row gap-2 active:opacity-90 ${
            isCommitted
              ? 'bg-[#10B981]/20 border border-[#10B981]/40'
              : 'bg-[#FF5A1F]'
          }`}
        >
          <Ionicons
            name={isCommitted ? 'checkmark-circle' : 'checkmark'}
            size={18}
            color={isCommitted ? '#10B981' : '#000000'}
          />
          <Text
            className={`font-bold text-xs uppercase tracking-wider ${
              isCommitted ? 'text-[#10B981]' : 'text-black'
            }`}
          >
            {isCommitted ? 'GOAL & TARGETS SAVED' : 'APPLY THIS GOAL'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
