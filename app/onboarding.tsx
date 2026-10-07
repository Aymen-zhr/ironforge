import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flame,
  Activity,
  Dumbbell,
  Target,
  Droplets,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateHydrationTarget,
  saveUserProfile,
  UserProfile,
  FitnessGoal,
  SplitPreference,
} from '../services/userMetrics';

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
  { key: 'Sun', label: 'Sun' },
];

const GOAL_OPTIONS: { goal: FitnessGoal; defaultDelta: number; desc: string }[] = [
  { goal: 'Aggressive Cut', defaultDelta: -2.0, desc: 'Fast fat loss (-2.0 kg/mo)' },
  { goal: 'Moderate Cut', defaultDelta: -1.0, desc: 'Sustainable fat loss (-1.0 kg/mo)' },
  { goal: 'Recomp', defaultDelta: 0.0, desc: 'Maintain mass & recomposition (0 kg/mo)' },
  { goal: 'Lean Bulk', defaultDelta: 1.0, desc: 'Hypertrophy muscle gain (+1.0 kg/mo)' },
];

const SPLIT_OPTIONS: { split: SplitPreference; desc: string }[] = [
  { split: 'Push / Pull / Legs', desc: 'Push, Pull, Legs hypertrophy rotation' },
  { split: 'Upper / Lower', desc: 'Upper body and lower body frequency' },
  { split: 'Bro Split', desc: 'Chest, Back, Legs, Shoulders & Arms overload' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(1);

  // Step 1: Biometrics
  const [heightCm, setHeightCm] = useState<string>('180');
  const [weightKg, setWeightKg] = useState<string>('78');
  const [age, setAge] = useState<string>('24');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');

  // Step 2: Goal & Target Monthly Delta
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>('Lean Bulk');
  const [monthlyDelta, setMonthlyDelta] = useState<number>(1.0);

  // Step 3: Days per week & selected days
  const [trainingDaysCount, setTrainingDaysCount] = useState<number>(4);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Thu', 'Fri']);

  // Step 4: Split Preference
  const [splitPreference, setSplitPreference] = useState<SplitPreference>('Push / Pull / Legs');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handleToggleDay = (dayKey: string) => {
    triggerHaptic();
    if (selectedDays.includes(dayKey)) {
      if (selectedDays.length <= 1) return;
      const filtered = selectedDays.filter((d) => d !== dayKey);
      setSelectedDays(filtered);
      setTrainingDaysCount(filtered.length);
    } else {
      if (selectedDays.length >= 7) return;
      const updated = [...selectedDays, dayKey];
      setSelectedDays(updated);
      setTrainingDaysCount(updated.length);
    }
  };

  const handleNextStep = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 1) {
      const h = parseFloat(heightCm);
      const w = parseFloat(weightKg);
      const a = parseInt(age, 10);
      if (!h || !w || !a || h <= 50 || w <= 30 || a <= 10) {
        Alert.alert('Invalid Entry', 'Please enter valid values for height, weight, and age.');
        return;
      }
    }
    if (step === 3 && selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least 1 active training day.');
      return;
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    triggerHaptic();
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Calculations for Step 5
  const parsedWeight = parseFloat(weightKg) || 78;
  const parsedHeight = parseFloat(heightCm) || 180;
  const parsedAge = parseInt(age, 10) || 24;

  const bmr = calculateBMR(parsedWeight, parsedHeight, parsedAge, sex);
  const tdee = calculateTDEE(bmr, selectedDays.length);
  const macros = calculateMacros(tdee, selectedGoal, monthlyDelta, parsedWeight);
  const hydrationTarget = calculateHydrationTarget(parsedWeight, selectedDays.length);

  const handleFinishOnboarding = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const profile: UserProfile = {
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      age: parsedAge,
      sex,
      goal: selectedGoal,
      monthlyKgDelta: monthlyDelta,
      trainingDaysCount: selectedDays.length,
      trainingDays: selectedDays,
      splitPreference,
      bmr,
      tdee,
      targetCalories: macros.targetCalories,
      targetProtein: macros.targetProtein,
      targetCarbs: macros.targetCarbs,
      targetFats: macros.targetFats,
      targetWaterMl: hydrationTarget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfile(profile);
      router.replace('/(tabs)');
    } catch (err) {
      console.warn('[Onboarding] Error saving profile:', err);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header with step progress indicator */}
      <View className="px-6 py-5 border-b border-white/[0.08] flex-row items-center justify-between">
        <View className="flex-row items-center">
          {step > 1 ? (
            <Pressable
              onPress={handlePrevStep}
              className="w-8 h-8 rounded-full bg-[#18181D] items-center justify-center mr-3"
            >
              <ChevronLeft size={16} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
            CALIBRATION // STEP {step} OF 5
          </Text>
        </View>

        <Text className="text-[#71717A] text-xs font-mono">
          {Math.round((step / 5) * 100)}%
        </Text>
      </View>

      {/* Progress Line */}
      <View className="w-full h-1 bg-[#18181D]">
        <View
          className="h-full bg-white transition-all"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: BIOMETRICS */}
        {step === 1 && (
          <View className="gap-6">
            <View className="items-center mb-1">
              <Image
                source={require('../assets/generated/logo.jpg')}
                className="w-16 h-16 rounded-2xl mb-2.5"
                resizeMode="cover"
              />
              <Text className="text-white text-[11px] font-bold tracking-[3px] uppercase">
                YHARNAM FORGE
              </Text>
            </View>

            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Biometric Baseline
              </Text>
              <Text className="text-[#71717A] text-xs">
                Essential inputs for Mifflin-St Jeor metabolic calculations.
              </Text>
            </View>

            {/* Sex Toggle */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Biological Sex
              </Text>
              <View className="flex-row gap-3">
                {(['Male', 'Female'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      triggerHaptic();
                      setSex(s);
                    }}
                    className={`flex-1 py-3.5 rounded-2xl items-center justify-center border ${
                      sex === s
                        ? 'bg-white border-white'
                        : 'bg-[#121216] border-white/[0.08]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase tracking-wider ${
                        sex === s ? 'text-[#09090B]' : 'text-[#71717A]'
                      }`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Weight Input */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Current Weight (kg)
              </Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                placeholder="78"
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-white text-base font-mono"
              />
            </View>

            {/* Height Input */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Height (cm)
              </Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                placeholder="180"
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-white text-base font-mono"
              />
            </View>

            {/* Age Input */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Age
              </Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="24"
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-white text-base font-mono"
              />
            </View>
          </View>
        )}

        {/* STEP 2: GOAL & MONTHLY DELTA */}
        {step === 2 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Body Composition Goal
              </Text>
              <Text className="text-[#71717A] text-xs">
                Defines target energy surplus or deficit velocity.
              </Text>
            </View>

            <View className="gap-3">
              {GOAL_OPTIONS.map((item) => {
                const isSelected = selectedGoal === item.goal;
                return (
                  <Pressable
                    key={item.goal}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedGoal(item.goal);
                      setMonthlyDelta(item.defaultDelta);
                    }}
                    className={`p-5 rounded-3xl border ${
                      isSelected
                        ? 'bg-[#18181D] border-white'
                        : 'bg-[#121216] border-white/[0.08]'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white font-bold text-base">
                        {item.goal}
                      </Text>
                      {isSelected && (
                        <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                          <Check size={12} color="#09090B" />
                        </View>
                      )}
                    </View>
                    <Text className="text-[#71717A] text-xs">
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target Monthly Delta Adjuster */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Monthly Target Rate of Change
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-mono text-xl font-bold">
                  {monthlyDelta > 0 ? `+${monthlyDelta}` : monthlyDelta} kg / month
                </Text>
                <Text className="text-[#71717A] text-xs">
                  {monthlyDelta > 0
                    ? `+${Math.round((monthlyDelta * 7700) / 30)} kcal/day`
                    : monthlyDelta < 0
                    ? `${Math.round((monthlyDelta * 7700) / 30)} kcal/day`
                    : 'Maintenance'}
                </Text>
              </View>

              <View className="flex-row gap-2 mt-1">
                {[-2.0, -1.0, 0.0, 0.5, 1.0].map((deltaVal) => (
                  <Pressable
                    key={deltaVal}
                    onPress={() => {
                      triggerHaptic();
                      setMonthlyDelta(deltaVal);
                    }}
                    className={`flex-1 py-2 rounded-xl items-center justify-center border ${
                      monthlyDelta === deltaVal
                        ? 'bg-white border-white'
                        : 'bg-[#18181D] border-white/[0.08]'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-mono font-bold ${
                        monthlyDelta === deltaVal ? 'text-[#09090B]' : 'text-[#71717A]'
                      }`}
                    >
                      {deltaVal > 0 ? `+${deltaVal}` : deltaVal}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: DAYS PER WEEK & SCHEDULE */}
        {step === 3 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Training Days Schedule
              </Text>
              <Text className="text-[#71717A] text-xs">
                Select the specific days of the week you train.
              </Text>
            </View>

            {/* Active Day Pills */}
            <View className="gap-2.5">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Weekly Days ({selectedDays.length} Days Active)
              </Text>
              <View className="flex-row gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isDayActive = selectedDays.includes(day.key);
                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => handleToggleDay(day.key)}
                      className={`flex-1 py-3.5 rounded-2xl items-center justify-center border ${
                        isDayActive
                          ? 'bg-white border-white'
                          : 'bg-[#121216] border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isDayActive ? 'text-[#09090B]' : 'text-[#71717A]'
                        }`}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-2">
              <Text className="text-white text-sm font-bold">
                Frequency Impact
              </Text>
              <Text className="text-[#71717A] text-xs leading-5">
                {selectedDays.length} sessions per week generates an activity multiplier of{' '}
                {selectedDays.length >= 6
                  ? '1.725x (Very Active)'
                  : selectedDays.length >= 5
                  ? '1.55x (Moderately Active)'
                  : selectedDays.length >= 4
                  ? '1.465x (Moderate)'
                  : '1.375x (Light)'}
                . Rest days will display active recovery protocols.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 4: SPLIT PREFERENCE */}
        {step === 4 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Hypertrophy Split
              </Text>
              <Text className="text-[#71717A] text-xs">
                Select your preferred periodization split.
              </Text>
            </View>

            <View className="gap-3">
              {SPLIT_OPTIONS.map((item) => {
                const isSelected = splitPreference === item.split;
                return (
                  <Pressable
                    key={item.split}
                    onPress={() => {
                      triggerHaptic();
                      setSplitPreference(item.split);
                    }}
                    className={`p-5 rounded-3xl border ${
                      isSelected
                        ? 'bg-[#18181D] border-white'
                        : 'bg-[#121216] border-white/[0.08]'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white font-bold text-base">
                        {item.split}
                      </Text>
                      {isSelected && (
                        <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                          <Check size={12} color="#09090B" />
                        </View>
                      )}
                    </View>
                    <Text className="text-[#71717A] text-xs">
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 5: CALCULATION SUMMARY */}
        {step === 5 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Engine Calibration
              </Text>
              <Text className="text-[#71717A] text-xs">
                Calculated metabolic profile and prescription.
              </Text>
            </View>

            {/* Target Energy & TDEE */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs uppercase tracking-wider">
                  Target Daily Intake
                </Text>
                <Text className="text-white font-mono text-2xl font-black">
                  {macros.targetCalories} kcal
                </Text>
              </View>

              <View className="flex-row justify-between pt-3 border-t border-white/[0.06]">
                <View>
                  <Text className="text-[#71717A] text-[11px]">BMR</Text>
                  <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                    {bmr} kcal
                  </Text>
                </View>
                <View>
                  <Text className="text-[#71717A] text-[11px]">TDEE</Text>
                  <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                    {tdee} kcal
                  </Text>
                </View>
                <View>
                  <Text className="text-[#71717A] text-[11px]">Velocity</Text>
                  <Text className="text-white font-mono text-sm font-semibold mt-0.5">
                    {monthlyDelta >= 0 ? `+${monthlyDelta}` : monthlyDelta} kg/mo
                  </Text>
                </View>
              </View>
            </View>

            {/* Target Macros Breakdown */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider mb-1">
                Macronutrient Prescription
              </Text>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-[#71717A] text-xs">Protein (2.2g/kg)</Text>
                <Text className="text-white font-mono text-sm font-bold">
                  {macros.targetProtein}g
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-[#71717A] text-xs">Fats (0.9g/kg)</Text>
                <Text className="text-white font-mono text-sm font-bold">
                  {macros.targetFats}g
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-[#71717A] text-xs">Carbohydrates</Text>
                <Text className="text-white font-mono text-sm font-bold">
                  {macros.targetCarbs}g
                </Text>
              </View>
            </View>

            {/* Hydration & Split */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs">Daily Hydration Target</Text>
                <Text className="text-white font-mono text-sm font-bold">
                  {hydrationTarget} ml
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs">Chosen Routine Split</Text>
                <Text className="text-white font-semibold text-xs">
                  {splitPreference}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CTA Button */}
        <View className="mt-8">
          {step < 5 ? (
            <Pressable
              onPress={handleNextStep}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              className="w-full py-4 rounded-full bg-white items-center justify-center flex-row"
            >
              <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider mr-1">
                Continue
              </Text>
              <ChevronRight size={14} color="#09090B" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFinishOnboarding}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              className="w-full py-4 rounded-full bg-white items-center justify-center"
            >
              <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                Begin Yharnam Forge
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
