import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  UserProfile,
  calculateFullProfile,
  saveUserProfile,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../services/userMetrics';
import { updateDailyTargets, clearDailyMeals } from '../services/dietService';
import { aegisState } from '../services/useAegisStore';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GOAL_OPTIONS: {
  id: 'cut' | 'bulk' | 'recomp';
  label: string;
  badge: string;
  desc: string;
  defaultPace: number;
}[] = [
  {
    id: 'cut',
    label: 'AGGRESSIVE CUT',
    badge: 'DEFICIT',
    desc: 'Accelerated adipose reduction with lean muscle sparing',
    defaultPace: 2.0,
  },
  {
    id: 'bulk',
    label: 'LEAN BULK',
    badge: 'SURPLUS',
    desc: 'Hypertrophic caloric surplus for myofibrillar accretion',
    defaultPace: 1.5,
  },
  {
    id: 'recomp',
    label: 'RECOMPOSITION',
    badge: 'HOMEOSTASIS',
    desc: 'Maintain mass equilibrium while trimming body fat',
    defaultPace: 0.5,
  },
];

const SPLIT_OPTIONS: {
  id: 'ppl' | 'upper_lower' | 'bro_split';
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'ppl',
    label: 'PUSH / PULL / LEGS',
    subtitle: 'Optimal hypertrophy frequency (3–6 days)',
  },
  {
    id: 'upper_lower',
    label: 'UPPER / LOWER',
    subtitle: 'High recovery balance & strength focus (4 days)',
  },
  {
    id: 'bro_split',
    label: 'BRO SPLIT',
    subtitle: 'Classic single-muscle destruction (4–5 days)',
  },
];

interface AegisConfigModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onProfileUpdated: (newProfile: UserProfile) => void;
  onMealsCleared?: () => void;
}

export default function AegisConfigModal({
  visible,
  onClose,
  profile,
  onProfileUpdated,
  onMealsCleared,
}: AegisConfigModalProps) {
  // Active form states
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weightInput, setWeightInput] = useState<string>('75');
  const [heightInput, setHeightInput] = useState<string>('178');
  const [ageInput, setAgeInput] = useState<string>('22');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'cut' | 'bulk' | 'recomp'>('cut');
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2.0);
  const [splitPreference, setSplitPreference] = useState<'ppl' | 'upper_lower' | 'bro_split'>('ppl');
  const [trainingDays, setTrainingDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize or re-sync form whenever modal becomes visible or profile changes
  useEffect(() => {
    if (!profile) return;

    const unit = profile.unitSystem ?? 'metric';
    setUnitSystem(unit);

    if (unit === 'imperial') {
      setWeightInput(String(kgToLbs(profile.weightKg)));
      setHeightInput(String(cmToInches(profile.heightCm)));
    } else {
      setWeightInput(String(profile.weightKg));
      setHeightInput(String(profile.heightCm));
    }

    setAgeInput(String(profile.age ?? 22));
    setSex(profile.sex ?? 'male');
    setGoal(profile.goal ?? 'cut');
    setMonthlyTarget(profile.monthlyKgTarget ?? 2.0);
    setSplitPreference(profile.splitPreference ?? 'ppl');
    setTrainingDays(profile.trainingDays?.length ? profile.trainingDays : ['Mon', 'Wed', 'Fri']);
  }, [profile, visible]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  // Unit Switcher Handler with mathematical conversions
  const handleToggleUnit = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unitSystem) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const rawWeight = parseFloat(weightInput);
    const rawHeight = parseFloat(heightInput);

    if (newUnit === 'imperial') {
      // Metric -> Imperial
      if (!isNaN(rawWeight) && rawWeight > 0) {
        setWeightInput(String(kgToLbs(rawWeight)));
      }
      if (!isNaN(rawHeight) && rawHeight > 0) {
        setHeightInput(String(cmToInches(rawHeight)));
      }
    } else {
      // Imperial -> Metric
      if (!isNaN(rawWeight) && rawWeight > 0) {
        setWeightInput(String(lbsToKg(rawWeight)));
      }
      if (!isNaN(rawHeight) && rawHeight > 0) {
        setHeightInput(String(inchesToCm(rawHeight)));
      }
    }

    setUnitSystem(newUnit);
  };

  // Day toggle handler
  const handleToggleDay = (day: string) => {
    triggerHaptic();
    if (trainingDays.includes(day)) {
      if (trainingDays.length <= 1) {
        Alert.alert('Protocol Rule', 'At least 1 active training session must remain scheduled.');
        return;
      }
      setTrainingDays(trainingDays.filter((d) => d !== day));
    } else {
      // Keep order aligned with ALL_DAYS
      const nextDays = [...trainingDays, day].sort(
        (a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
      );
      setTrainingDays(nextDays);
    }
  };

  // Live Telemetry Preview calculation
  const previewTelemetry = useMemo(() => {
    const rawW = parseFloat(weightInput);
    const rawH = parseFloat(heightInput);
    const rawA = parseInt(ageInput, 10);

    let normWeight = isNaN(rawW) ? 75 : rawW;
    let normHeight = isNaN(rawH) ? 178 : rawH;

    if (unitSystem === 'imperial') {
      normWeight = lbsToKg(normWeight);
      normHeight = inchesToCm(normHeight);
    }

    normWeight = Math.min(250, Math.max(35, normWeight));
    normHeight = Math.min(240, Math.max(120, normHeight));
    const safeAge = Math.min(99, Math.max(14, isNaN(rawA) ? 22 : rawA));

    return calculateFullProfile({
      heightCm: normHeight,
      weightKg: normWeight,
      age: safeAge,
      sex,
      goal,
      monthlyKgTarget: monthlyTarget,
      trainingDaysPerWeek: trainingDays.length,
      trainingDays,
      splitPreference,
      unitSystem,
    });
  }, [
    weightInput,
    heightInput,
    ageInput,
    sex,
    goal,
    monthlyTarget,
    trainingDays,
    splitPreference,
    unitSystem,
  ]);

  // Save Configuration Handler
  const handleSave = async () => {
    const rawW = parseFloat(weightInput);
    const rawH = parseFloat(heightInput);
    const rawA = parseInt(ageInput, 10);

    // Validate inputs based on unit system
    if (unitSystem === 'metric') {
      if (isNaN(rawW) || rawW < 35 || rawW > 250) {
        Alert.alert('Invalid Weight', 'Weight must be between 35 kg and 250 kg.');
        return;
      }
      if (isNaN(rawH) || rawH < 120 || rawH > 240) {
        Alert.alert('Invalid Height', 'Height must be between 120 cm and 240 cm.');
        return;
      }
    } else {
      if (isNaN(rawW) || rawW < 77 || rawW > 550) {
        Alert.alert('Invalid Weight', 'Weight must be between 77 lbs and 550 lbs.');
        return;
      }
      if (isNaN(rawH) || rawH < 47 || rawH > 95) {
        Alert.alert('Invalid Height', 'Height must be between 47 in and 95 in.');
        return;
      }
    }

    if (isNaN(rawA) || rawA < 14 || rawA > 99) {
      Alert.alert('Invalid Age', 'Age must be between 14 and 99 years.');
      return;
    }

    if (trainingDays.length === 0) {
      Alert.alert('Training Days', 'Please select at least 1 training day.');
      return;
    }

    setIsSaving(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      let finalWeightKg = rawW;
      let finalHeightCm = rawH;

      if (unitSystem === 'imperial') {
        finalWeightKg = lbsToKg(rawW);
        finalHeightCm = inchesToCm(rawH);
      }

      finalWeightKg = Math.min(250, Math.max(35, finalWeightKg));
      finalHeightCm = Math.min(240, Math.max(120, finalHeightCm));

      const updatedProfile = calculateFullProfile({
        heightCm: finalHeightCm,
        weightKg: finalWeightKg,
        age: rawA,
        sex,
        goal,
        monthlyKgTarget: monthlyTarget,
        trainingDaysPerWeek: trainingDays.length,
        trainingDays,
        splitPreference,
        unitSystem,
      });

      // Persist to user profile storage
      await saveUserProfile(updatedProfile);

      // Sync daily diet targets
      await updateDailyTargets({
        targetCalories: updatedProfile.targetCalories,
        targetProteinGrams: updatedProfile.targetProteinG,
        targetCarbsGrams: updatedProfile.targetCarbsG,
        targetFatsGrams: updatedProfile.targetFatsG,
        maintenanceCalories: updatedProfile.tdee,
        goal: goal === 'cut' ? 'Aggressive Cut' : goal === 'bulk' ? 'Lean Bulk' : 'Recomposition',
        targetKgPerMonth: updatedProfile.monthlyKgTarget,
        targetWaterMl: updatedProfile.dailyWaterMl,
      });

      // Synchronize reactive state store
      aegisState.setNutritionTargets({
        calories: updatedProfile.targetCalories,
        protein: updatedProfile.targetProteinG,
        carbs: updatedProfile.targetCarbsG,
        fats: updatedProfile.targetFatsG,
        water: updatedProfile.dailyWaterMl,
      });

      onProfileUpdated(updatedProfile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch (err) {
      console.warn('[AegisConfig] Error saving configuration:', err);
      Alert.alert('Save Error', 'Could not save profile settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Re-run Onboarding with prompt
  const handleRerunOnboarding = () => {
    Alert.alert(
      'Restart Onboarding Protocol?',
      'This will guide you step-by-step through the initial setup wizard. Your previous training and diet records will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: () => {
            onClose();
            router.push('/onboarding');
          },
        },
      ]
    );
  };

  // Reset today's intake
  const handleClearTodayMeals = () => {
    Alert.alert(
      'Reset Today’s Intake?',
      'This will reset your logged calories and protein for today to 0. Use this if you want to re-log today’s intake.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Fuel',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            await clearDailyMeals();
            onMealsCleared?.();
            Alert.alert('Fuel Reset', 'Today’s food log has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-[#09090B]"
      >
        {/* Modal Top Header Bar */}
        <View className="px-6 pt-5 pb-4 border-b border-white/10 flex-row items-center justify-between bg-[#0E0E11]">
          <View className="gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-sm font-bold tracking-[2.5px] uppercase">
                AEGIS CONFIG
              </Text>
              <View className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            </View>
            <Text className="text-[#71717A] text-[11px]">
              Physiological baselines & training architecture
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center active:opacity-70"
          >
            <Ionicons name="close" size={18} color="#A1A1AA" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, gap: 24 }}
          className="flex-1"
        >
          {/* Section 1: Unit Preference Selector */}
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
                MEASUREMENT SYSTEM
              </Text>
              <View className="py-0.5 px-2 rounded bg-white/[0.05]">
                <Text className="text-white text-[10px] font-mono uppercase">
                  {unitSystem === 'metric' ? 'METRIC (KG/CM)' : 'IMPERIAL (LBS/IN)'}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleToggleUnit('metric')}
                className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                  unitSystem === 'metric'
                    ? 'bg-[#DC2626] border-[#DC2626]'
                    : 'bg-[#18181D] border-white/10'
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wider ${
                    unitSystem === 'metric' ? 'text-white' : 'text-[#71717A]'
                  }`}
                >
                  Metric (KG / CM)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleToggleUnit('imperial')}
                className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                  unitSystem === 'imperial'
                    ? 'bg-[#DC2626] border-[#DC2626]'
                    : 'bg-[#18181D] border-white/10'
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wider ${
                    unitSystem === 'imperial' ? 'text-white' : 'text-[#71717A]'
                  }`}
                >
                  Imperial (LBS / IN)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Section 2: Physiological Baselines */}
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5">
            <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
              BIOMETRIC CONSTANTS
            </Text>

            <View className="flex-row gap-3">
              {/* Weight */}
              <View className="flex-1 gap-1.5">
                <Text className="text-[#A1A1AA] text-[11px] font-mono">
                  Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </Text>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181D] border border-white/10 text-white font-mono text-base text-center"
                />
              </View>

              {/* Height */}
              <View className="flex-1 gap-1.5">
                <Text className="text-[#A1A1AA] text-[11px] font-mono">
                  Height ({unitSystem === 'metric' ? 'cm' : 'in'})
                </Text>
                <TextInput
                  value={heightInput}
                  onChangeText={setHeightInput}
                  keyboardType="numeric"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181D] border border-white/10 text-white font-mono text-base text-center"
                />
              </View>

              {/* Age */}
              <View className="w-20 gap-1.5">
                <Text className="text-[#A1A1AA] text-[11px] font-mono">Age (yrs)</Text>
                <TextInput
                  value={ageInput}
                  onChangeText={setAgeInput}
                  keyboardType="numeric"
                  maxLength={2}
                  className="w-full px-2 py-2.5 rounded-xl bg-[#18181D] border border-white/10 text-white font-mono text-base text-center"
                />
              </View>
            </View>

            {/* Sex Toggle */}
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-[#A1A1AA] text-xs font-medium">Biological Sex</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setSex('male');
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    sex === 'male'
                      ? 'bg-white border-white'
                      : 'bg-[#18181D] border-white/10'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase ${
                      sex === 'male' ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    Male
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setSex('female');
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    sex === 'female'
                      ? 'bg-white border-white'
                      : 'bg-[#18181D] border-white/10'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase ${
                      sex === 'female' ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    Female
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Section 3: Goal & Pace Strategy */}
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5">
            <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
              TRAINING GOAL & VELOCITY
            </Text>

            {/* Goal Selector Cards */}
            <View className="gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      triggerHaptic();
                      setGoal(opt.id);
                      setMonthlyTarget(opt.defaultPace);
                    }}
                    className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? 'bg-[#18181D] border-[#DC2626]'
                        : 'bg-[#141418] border-white/5 active:opacity-75'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`text-xs font-bold tracking-wider uppercase ${
                            isSelected ? 'text-white' : 'text-[#A1A1AA]'
                          }`}
                        >
                          {opt.label}
                        </Text>
                        <View className="py-0.5 px-1.5 rounded bg-white/[0.05]">
                          <Text className="text-[#DC2626] text-[9px] font-mono font-bold">
                            {opt.badge}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[#71717A] text-[11px] mt-1 leading-4">
                        {opt.desc}
                      </Text>
                    </View>
                    <View
                      className={`w-4 h-4 rounded-full border items-center justify-center ${
                        isSelected ? 'border-[#DC2626]' : 'border-[#52525B]'
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2 h-2 rounded-full bg-[#DC2626]" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Monthly Velocity Stepper */}
            <View className="mt-2 bg-[#18181D] border border-white/10 rounded-xl p-3 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#A1A1AA] text-xs font-medium">Monthly Velocity Target</Text>
                <Text className="text-white text-xs font-mono font-bold">
                  {goal === 'bulk' ? '+' : goal === 'recomp' ? '±' : '-'}
                  {unitSystem === 'metric'
                    ? `${monthlyTarget.toFixed(1)} kg / month`
                    : `${kgToLbs(monthlyTarget).toFixed(1)} lbs / month`}
                </Text>
              </View>

              <View className="flex-row gap-2 mt-1">
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((pace) => {
                  const isCur = Math.abs(monthlyTarget - pace) < 0.05;
                  return (
                    <Pressable
                      key={pace}
                      onPress={() => {
                        triggerHaptic();
                        setMonthlyTarget(pace);
                      }}
                      className={`flex-1 py-1.5 rounded-lg border items-center ${
                        isCur
                          ? 'bg-[#DC2626] border-[#DC2626]'
                          : 'bg-white/[0.04] border-white/5 active:opacity-75'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-mono font-bold ${
                          isCur ? 'text-white' : 'text-[#71717A]'
                        }`}
                      >
                        {pace.toFixed(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 4: Split Architecture & Active Days */}
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5">
            <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
              TRAINING SPLIT & SCHEDULE
            </Text>

            {/* Split Selection */}
            <View className="gap-2">
              {SPLIT_OPTIONS.map((s) => {
                const isSelected = splitPreference === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      triggerHaptic();
                      setSplitPreference(s.id);
                    }}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? 'bg-[#18181D] border-[#DC2626]'
                        : 'bg-[#141418] border-white/5 active:opacity-75'
                    }`}
                  >
                    <View>
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? 'text-white' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {s.label}
                      </Text>
                      <Text className="text-[#71717A] text-[11px] mt-0.5">
                        {s.subtitle}
                      </Text>
                    </View>
                    <View
                      className={`w-4 h-4 rounded-full border items-center justify-center ${
                        isSelected ? 'border-[#DC2626]' : 'border-[#52525B]'
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2 h-2 rounded-full bg-[#DC2626]" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Active Training Days Chips */}
            <View className="mt-1 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#A1A1AA] text-xs font-medium">Active Training Days</Text>
                <Text className="text-[#DC2626] text-[11px] font-mono font-bold">
                  {trainingDays.length} SESSIONS / WEEK
                </Text>
              </View>

              <View className="flex-row gap-1.5 justify-between">
                {ALL_DAYS.map((day) => {
                  const isActive = trainingDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => handleToggleDay(day)}
                      className={`flex-1 py-2 rounded-lg border items-center ${
                        isActive
                          ? 'bg-[#DC2626] border-[#DC2626]'
                          : 'bg-[#18181D] border-white/10 active:opacity-75'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-mono font-bold uppercase ${
                          isActive ? 'text-white' : 'text-[#71717A]'
                        }`}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 5: Real-time Telemetry Recalculation Preview */}
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
                CALCULATED METRIC ENGINE
              </Text>
              <View className="py-0.5 px-2 rounded bg-[#DC2626]/20">
                <Text className="text-[#DC2626] text-[10px] font-mono font-bold">
                  LIVE FORMULA
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <View className="flex-1 min-w-[45%] bg-[#18181D] p-3 rounded-xl border border-white/5">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                  Daily Calorie Target
                </Text>
                <Text className="text-white text-base font-mono font-bold mt-1">
                  {previewTelemetry.targetCalories}{' '}
                  <Text className="text-xs text-[#71717A] font-normal">kcal</Text>
                </Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#18181D] p-3 rounded-xl border border-white/5">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                  Protein Synthesis
                </Text>
                <Text className="text-white text-base font-mono font-bold mt-1">
                  {previewTelemetry.targetProteinG}{' '}
                  <Text className="text-xs text-[#71717A] font-normal">g / day</Text>
                </Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#18181D] p-3 rounded-xl border border-white/5">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                  Metabolic TDEE / BMR
                </Text>
                <Text className="text-[#A1A1AA] text-xs font-mono font-bold mt-1">
                  {previewTelemetry.tdee} / {previewTelemetry.bmr} kcal
                </Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-[#18181D] p-3 rounded-xl border border-white/5">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                  Hydration Fluid Target
                </Text>
                <Text className="text-[#A1A1AA] text-xs font-mono font-bold mt-1">
                  {previewTelemetry.dailyWaterMl} mL
                </Text>
              </View>
            </View>
          </View>

          {/* Section 6: Commit Action Button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-xl bg-[#DC2626] items-center justify-center active:opacity-85 shadow-lg"
          >
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {isSaving ? 'Recalculating & Committing...' : 'Save Configuration & Apply Targets'}
            </Text>
          </Pressable>

          {/* Section 7: Maintenance / Advanced Actions */}
          <View className="gap-2.5 pt-2 pb-8">
            <Pressable
              onPress={handleClearTodayMeals}
              className="py-3 px-4 rounded-xl bg-[#141418] border border-white/5 flex-row items-center justify-between active:opacity-75"
            >
              <Text className="text-[#A1A1AA] text-xs font-medium">
                Reset Today’s Active Macro Intake
              </Text>
              <Ionicons name="trash-outline" size={15} color="#71717A" />
            </Pressable>

            <Pressable
              onPress={handleRerunOnboarding}
              className="py-3 px-4 rounded-xl bg-[#141418] border border-white/5 flex-row items-center justify-between active:opacity-75"
            >
              <Text className="text-[#71717A] text-xs font-medium">
                Re-run Full Onboarding Setup Wizard
              </Text>
              <Ionicons name="arrow-forward" size={15} color="#52525B" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
