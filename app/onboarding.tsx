import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { calculateFullProfile, UserProfile } from '../services/userMetrics';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const GOAL_OPTIONS: { id: 'cut' | 'bulk' | 'recomp'; label: string; desc: string; defaultPace: number }[] = [
  { id: 'cut', label: 'Aggressive Cut', desc: 'Accelerated fat loss and definition', defaultPace: 2.0 },
  { id: 'bulk', label: 'Lean Bulk', desc: 'Caloric surplus for muscle hypertrophy', defaultPace: 1.5 },
  { id: 'recomp', label: 'Body Recomposition', desc: 'Maintain mass while trimming fat', defaultPace: 0.5 },
];

const SPLIT_OPTIONS: { id: 'ppl' | 'upper_lower' | 'bro_split'; label: string; desc: string }[] = [
  { id: 'ppl', label: 'Push / Pull / Legs', desc: 'Hypertrophy focus' },
  { id: 'upper_lower', label: 'Upper / Lower', desc: 'Strength & frequency' },
  { id: 'bro_split', label: 'Bro Split', desc: 'Chest, Back, Legs, Shoulders/Arms' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form states as requested
  const [height, setHeight] = useState<string>('178');
  const [weight, setWeight] = useState<string>('75');
  const [age, setAge] = useState<string>('22');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'cut' | 'bulk' | 'recomp'>('cut');
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [splitPreference, setSplitPreference] = useState<'ppl' | 'upper_lower' | 'bro_split'>('ppl');

  const toggleDay = (day: string) => {
    // Map uppercase display tag to formatted day string
    const formatted = day.charAt(0) + day.slice(1).toLowerCase();
    if (selectedDays.includes(formatted)) {
      if (selectedDays.length <= 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== formatted));
    } else {
      setSelectedDays([...selectedDays, formatted]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      const a = parseInt(age, 10);
      if (isNaN(h) || h < 120 || h > 240) {
        Alert.alert('Invalid Height', 'Height must be between 120 cm and 240 cm.');
        return;
      }
      if (isNaN(w) || w < 35 || w > 250) {
        Alert.alert('Invalid Weight', 'Weight must be between 35 kg and 250 kg.');
        return;
      }
      if (isNaN(a) || a < 14 || a > 99) {
        Alert.alert('Invalid Age', 'Age must be between 14 and 99 years.');
        return;
      }
    }
    if (step === 3 && (selectedDays.length === 0 || selectedDays.length > 7)) {
      Alert.alert('Training Days', 'Please select between 1 and 7 active training days.');
      return;
    }
    setStep((prev) => Math.min(4, Math.max(1, prev + 1)));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.min(4, Math.max(1, prev - 1)));
  };

  const handleCompleteSetup = async () => {
    const rawH = parseFloat(height);
    const rawW = parseFloat(weight);
    const rawA = parseInt(age, 10);

    const heightCm = Math.min(240, Math.max(120, isNaN(rawH) ? 178 : rawH));
    const weightKg = Math.min(250, Math.max(35, isNaN(rawW) ? 75 : rawW));
    const userAge = Math.min(99, Math.max(14, isNaN(rawA) ? 22 : rawA));
    const safeMonthlyTarget = Math.min(4.0, Math.max(0.2, monthlyTarget || 1.0));
    const safeDays = selectedDays.length > 0 ? selectedDays : ['Mon', 'Wed', 'Fri'];

    const profile: UserProfile = calculateFullProfile({
      heightCm,
      weightKg,
      age: userAge,
      sex,
      goal,
      monthlyKgTarget: safeMonthlyTarget,
      trainingDaysPerWeek: safeDays.length,
      trainingDays: safeDays,
      splitPreference,
    });

    try {
      await AsyncStorage.setItem('@ironforge_user_profile', JSON.stringify(profile));
      router.replace('/(tabs)');
    } catch (err) {
      console.warn('[Onboarding] Error saving profile:', err);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Header & Step Indicator */}
      <View className="px-6 py-6 border-b border-white/[0.08] flex-row items-center justify-between">
        <View>
          <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
            CALIBRATION
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono mt-0.5">
            STEP {step} OF 4
          </Text>
        </View>

        {/* Step Progress Pills */}
        <View className="flex-row gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              className={`h-1.5 rounded-full ${
                s === step
                  ? 'w-6 bg-[#DC2626]'
                  : s < step
                  ? 'w-3 bg-white'
                  : 'w-3 bg-white/[0.15]'
              }`}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        className="flex-1"
      >
        {/* STEP 1: PHYSICAL METRICS */}
        {step === 1 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Physical Metrics
              </Text>
              <Text className="text-[#71717A] text-xs">
                Essential baseline for metabolic expenditure calculations.
              </Text>
            </View>

            {/* Sex Segmented Toggle */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Biological Sex
              </Text>
              <View className="flex-row gap-3">
                {(['male', 'female'] as const).map((s) => {
                  const isSelected = sex === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setSex(s)}
                      className={`flex-1 py-3.5 rounded-2xl items-center justify-center border ${
                        isSelected
                          ? 'bg-[#DC2626] border-[#DC2626]'
                          : 'bg-[#121216] border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? 'text-white' : 'text-[#71717A]'
                        }`}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Height Input */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Height (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="178"
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-white text-base font-mono"
              />
            </View>

            {/* Weight Input */}
            <View className="gap-2">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Weight (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="75"
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
                placeholder="22"
                placeholderTextColor="#71717A"
                className="w-full px-5 py-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-white text-base font-mono"
              />
            </View>
          </View>
        )}

        {/* STEP 2: GOAL & PACE */}
        {step === 2 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Goal & Pace
              </Text>
              <Text className="text-[#71717A] text-xs">
                Select your physique objective and monthly rate of progression.
              </Text>
            </View>

            {/* Goal Cards */}
            <View className="gap-3">
              {GOAL_OPTIONS.map((item) => {
                const isSelected = goal === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setGoal(item.id);
                      setMonthlyTarget(item.defaultPace);
                    }}
                    className={`p-5 rounded-3xl border ${
                      isSelected
                        ? 'bg-[#18181D] border-[#DC2626]'
                        : 'bg-[#121216] border-white/[0.08]'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white font-bold text-base">
                        {item.label}
                      </Text>
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                      )}
                    </View>
                    <Text className="text-[#71717A] text-xs">
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Monthly Target Rate Card */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                  Target Rate
                </Text>
                <Text className="text-white font-mono text-base font-bold">
                  {monthlyTarget} kg / month
                </Text>
              </View>

              <View className="flex-row gap-2 mt-1">
                {[0.5, 1.0, 1.5, 2.0, 2.5].map((val) => {
                  const isValSelected = monthlyTarget === val;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => setMonthlyTarget(val)}
                      className={`flex-1 py-2.5 rounded-xl items-center justify-center border ${
                        isValSelected
                          ? 'bg-[#DC2626] border-[#DC2626]'
                          : 'bg-[#18181D] border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-mono font-bold ${
                          isValSelected ? 'text-white' : 'text-[#71717A]'
                        }`}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: TRAINING DAYS & SCHEDULE */}
        {step === 3 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Training Days & Schedule
              </Text>
              <Text className="text-[#71717A] text-xs">
                Tap the days of the week you dedicate to resistance training.
              </Text>
            </View>

            {/* Day Chips */}
            <View className="gap-3">
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                Active Workout Days ({selectedDays.length} Days)
              </Text>

              <View className="flex-row flex-wrap gap-2.5">
                {DAYS_OF_WEEK.map((dayTag) => {
                  const formatted = dayTag.charAt(0) + dayTag.slice(1).toLowerCase();
                  const isActive = selectedDays.includes(formatted);
                  return (
                    <Pressable
                      key={dayTag}
                      onPress={() => toggleDay(dayTag)}
                      className={`py-3 px-4 rounded-2xl border ${
                        isActive
                          ? 'bg-[#DC2626] border-[#DC2626]'
                          : 'bg-[#121216] border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold tracking-wider ${
                          isActive ? 'text-white' : 'text-[#71717A]'
                        }`}
                      >
                        {dayTag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Frequency Card */}
            <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-2">
              <Text className="text-white text-sm font-bold">
                Weekly Volume
              </Text>
              <Text className="text-[#71717A] text-xs leading-5">
                {selectedDays.length} days active per week. Your rest days will automatically configure recovery and hydration protocols.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 4: WORKOUT ARCHITECTURE */}
        {step === 4 && (
          <View className="gap-6">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight mb-1">
                Workout Architecture
              </Text>
              <Text className="text-[#71717A] text-xs">
                Select the training split aligned with your recovery and goals.
              </Text>
            </View>

            {/* Split Options */}
            <View className="gap-3">
              {SPLIT_OPTIONS.map((item) => {
                const isSelected = splitPreference === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSplitPreference(item.id)}
                    className={`p-5 rounded-3xl border ${
                      isSelected
                        ? 'bg-[#18181D] border-[#DC2626]'
                        : 'bg-[#121216] border-white/[0.08]'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white font-bold text-base">
                        {item.label}
                      </Text>
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
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

        {/* Navigation Actions */}
        <View className="mt-8 gap-3">
          {step < 4 ? (
            <View className="flex-row gap-3">
              {step > 1 && (
                <Pressable
                  onPress={handlePrevStep}
                  className="flex-1 py-4 rounded-full bg-[#18181D] border border-white/[0.08] items-center justify-center"
                >
                  <Text className="text-white font-bold text-xs uppercase tracking-wider">
                    Back
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleNextStep}
                className="flex-1 py-4 rounded-full bg-white items-center justify-center"
              >
                <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                  Continue
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <Pressable
                onPress={handleCompleteSetup}
                className="w-full py-4 rounded-full bg-[#DC2626] items-center justify-center"
              >
                <Text className="text-white font-bold text-xs uppercase tracking-wider">
                  Complete Setup
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePrevStep}
                className="w-full py-3 items-center justify-center"
              >
                <Text className="text-[#71717A] text-xs font-medium">
                  Back to Schedule
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
