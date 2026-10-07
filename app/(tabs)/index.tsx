import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UserProfile } from '../../services/userMetrics';
import { getDailyLog, addMealToDailyLog, DietLogData } from '../../services/dietService';
import {
  getScheduledWorkoutForDay,
  TrainingProgram,
} from '../../data/workoutCatalog';
import AegisConfigModal from '../../components/AegisConfigModal';
import AegisLogbookModal from '../../components/AegisLogbookModal';

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CommandDeckScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dietLog, setDietLog] = useState<DietLogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Aegis Protocol Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Historical Logbook & PR Vault Modal State
  const [showLogbookModal, setShowLogbookModal] = useState<boolean>(false);

  // Quick Macro Logging Modal State
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickMealName, setQuickMealName] = useState<string>('');
  const [quickCalories, setQuickCalories] = useState<string>('');
  const [quickProtein, setQuickProtein] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handleCommitQuickMeal = async () => {
    const cals = parseInt(quickCalories, 10);
    const prot = parseInt(quickProtein, 10);
    if (!cals || isNaN(cals) || cals < 10 || cals > 5000) {
      Alert.alert('Invalid Calories', 'Please enter a realistic caloric amount between 10 and 5,000 kcal.');
      return;
    }
    const safeProtein = Math.min(300, Math.max(0, isNaN(prot) ? 0 : prot));
    const name = quickMealName.trim() || 'Quick Macro Intake';

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await addMealToDailyLog({
        name,
        calories: cals,
        protein_grams: safeProtein,
        carbs_grams: Math.round(Math.max(0, (cals - (safeProtein * 4 + 10 * 9)) / 4)),
        fats_grams: 10,
        source: 'Manual',
      });
      setDietLog(updated);
      setShowQuickAddModal(false);
      setQuickMealName('');
      setQuickCalories('');
      setQuickProtein('');
    } catch (err) {
      console.warn('[QuickAdd] Error logging meal:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const rawProfile = await AsyncStorage.getItem('@ironforge_user_profile');
        if (rawProfile) {
          const parsed: UserProfile = JSON.parse(rawProfile);
          setProfile(parsed);
        } else {
          // Graceful fallback baseline or direct to onboarding if preferred
          setProfile({
            heightCm: 178,
            weightKg: 75,
            age: 22,
            sex: 'male',
            goal: 'cut',
            monthlyKgTarget: 2.0,
            trainingDaysPerWeek: 4,
            trainingDays: ['Mon', 'Tue', 'Thu', 'Fri'],
            splitPreference: 'ppl',
            bmr: 1720,
            tdee: 2500,
            targetCalories: 1987,
            targetProteinG: 165,
            targetCarbsG: 190,
            targetFatsG: 67,
            dailyWaterMl: 3125,
          });
        }

        const log = await getDailyLog();
        setDietLog(log);
      } catch (err) {
        console.warn('[CommandDeck] Failed loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDayKey = DAY_ABBRS[currentDayIndex]; // e.g. "Mon"
  const formattedDate = now
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  // Dynamic Day Checker: Verify if today is an active training day
  const isTrainingDay = profile?.trainingDays
    ? profile.trainingDays.some(
        (day) => day.toLowerCase().slice(0, 3) === currentDayKey.toLowerCase()
      )
    : true;

  // Retrieve programmed split for today
  const scheduledProgram: TrainingProgram | null =
    profile && isTrainingDay
      ? getScheduledWorkoutForDay(
          profile.splitPreference,
          profile.trainingDays,
          currentDayKey
        )
      : null;

  // Formatting goal badge text
  const goalTitle =
    profile?.goal === 'bulk'
      ? 'LEAN BULK'
      : profile?.goal === 'recomp'
      ? 'RECOMPOSITION'
      : 'AGGRESSIVE CUT';

  const deltaSign =
    profile?.goal === 'bulk' ? '+' : profile?.goal === 'recomp' ? '±' : '-';
  const isImperial = profile?.unitSystem === 'imperial';
  const paceVal = profile?.monthlyKgTarget ?? 2.0;
  const targetDeltaDisplay = isImperial
    ? `${(Math.round(paceVal * 2.20462 * 10) / 10).toFixed(1)} LBS/MO`
    : `${paceVal.toFixed(1)} KG/MO`;
  const goalBadge = `${goalTitle} • ${deltaSign}${targetDeltaDisplay}`;

  // Telemetry metrics with strict boundary checks
  const targetCalories = Math.max(1000, profile?.targetCalories ?? 2200);
  const consumedCalories = Math.max(0, dietLog?.consumedCalories ?? 0);
  const remainingCalories = targetCalories - consumedCalories;
  const isOverCalorieBudget = remainingCalories < 0;
  const calPercent = Math.min(
    100,
    Math.max(0, Math.round((consumedCalories / targetCalories) * 100))
  );

  const targetProtein = Math.max(50, profile?.targetProteinG ?? 160);
  const consumedProtein = Math.max(0, dietLog?.consumedProtein ?? 0);
  const proteinPercent = Math.min(
    100,
    Math.max(0, Math.round((consumedProtein / targetProtein) * 100))
  );

  const targetWater = Math.min(6000, Math.max(1500, profile?.dailyWaterMl ?? 3200));

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, gap: 24 }}
        className="flex-1"
      >
        {/* 1. Minimalist Header */}
        <View className="gap-2">
          {/* Top Row: Concept 1 Logo + Tracked Title + Subtle Live Dot */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <Image
                source={require('../../assets/generated/logo.jpg')}
                className="w-6 h-6 rounded-md"
                resizeMode="cover"
              />
              <Text className="text-white text-xs font-bold tracking-[3.5px] uppercase">
                AEGIS
              </Text>
              <View className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowConfigModal(true);
              }}
              className="py-1 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] active:opacity-70"
            >
              <Text className="text-[#71717A] text-[10px] font-semibold tracking-wider uppercase">
                CONFIG
              </Text>
            </Pressable>
          </View>

          {/* Subtitle: Date & Goal Badge */}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[#71717A] text-xs font-medium tracking-wide">
              {formattedDate}
            </Text>
            <View className="py-1 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
              <Text className="text-[#A1A1AA] text-[10px] font-mono tracking-wider">
                {goalBadge}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Today's Session Hero Card */}
        <View className="bg-[#121215] border border-white/10 rounded-2xl p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
              {isTrainingDay ? 'TODAY’S FOCUS' : 'RECOVERY PROTOCOL'}
            </Text>
            <View className="py-0.5 px-2 rounded-full bg-white/[0.05]">
              <Text className="text-white text-[10px] font-mono">
                {currentDayKey.toUpperCase()}
              </Text>
            </View>
          </View>

          {isTrainingDay ? (
            <>
              <View className="gap-1.5">
                <Text className="text-white text-xl font-bold tracking-tight">
                  {scheduledProgram?.splitName.toUpperCase() ?? 'PUSH DAY'}
                </Text>
                <Text className="text-[#71717A] text-xs leading-5">
                  {scheduledProgram?.subtitle ?? 'Anterior Chain Hypertrophy // Chest, Delts & Triceps Overload'}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/workout');
                }}
                className="bg-[#DC2626] py-3 rounded-xl items-center justify-center active:opacity-85 shadow-sm"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Start Session
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className="gap-1.5">
                <Text className="text-white text-xl font-bold tracking-tight">
                  ACTIVE RECOVERY // Mobilize & Rest
                </Text>
                <Text className="text-[#71717A] text-xs leading-5">
                  Prioritize 8+ hours of sleep, light joint mobility, and sustained protein synthesis to prepare for tomorrow’s strain.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/recovery');
                }}
                className="bg-white/[0.08] border border-white/[0.1] py-3 rounded-xl items-center justify-center active:opacity-85"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  View Recovery Metrics
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* 3. Telemetry Row: Calories & Protein */}
        <View className="bg-[#121215] border border-white/10 rounded-2xl p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[#71717A] text-[11px] font-mono uppercase tracking-[2px]">
              METABOLIC TELEMETRY
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowQuickAddModal(true);
              }}
              className="py-1 px-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] active:opacity-75"
            >
              <Text className="text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                + LOG FUEL
              </Text>
            </Pressable>
          </View>

          {/* Calories Meter */}
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-white text-xs font-medium uppercase tracking-wider">
                Calories
              </Text>
              <Text className="text-[#A1A1AA] text-xs font-mono">
                {isOverCalorieBudget ? (
                  <Text className="text-[#DC2626] font-bold">
                    +{Math.abs(remainingCalories)} kcal over budget
                  </Text>
                ) : (
                  <>
                    <Text className="text-white font-bold">{remainingCalories}</Text> remaining / {targetCalories} kcal
                  </>
                )}
              </Text>
            </View>
            <View className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <View
                style={{ width: `${Math.min(100, Math.max(2, calPercent))}%` }}
                className={`h-full rounded-full ${
                  isOverCalorieBudget ? 'bg-[#DC2626]' : 'bg-white'
                }`}
              />
            </View>
          </View>

          {/* Protein Meter */}
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-white text-xs font-medium uppercase tracking-wider">
                Protein
              </Text>
              <Text className="text-[#A1A1AA] text-xs font-mono">
                <Text className="text-white font-bold">{consumedProtein}g</Text> / {targetProtein}g
              </Text>
            </View>
            <View className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <View
                style={{ width: `${Math.min(100, Math.max(2, proteinPercent))}%` }}
                className="h-full bg-[#DC2626] rounded-full"
              />
            </View>
          </View>
        </View>

        {/* 4. Quick Portals (2 Columns) */}
        <View className="flex-row gap-3.5">
          {/* Card 1: Pantry & Meals */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/pantry');
            }}
            className="flex-1 bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3 active:opacity-80"
          >
            <View className="w-8 h-8 rounded-xl bg-white/[0.06] items-center justify-center">
              <Ionicons name="restaurant-outline" size={17} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                PANTRY & MEALS
              </Text>
              <Text className="text-[#71717A] text-[11px] mt-0.5">
                Macro Kitchen
              </Text>
            </View>
          </Pressable>

          {/* Card 2: Hydration & Weather */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/recovery');
            }}
            className="flex-1 bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3 active:opacity-80"
          >
            <View className="w-8 h-8 rounded-xl bg-white/[0.06] items-center justify-center">
              <Ionicons name="water-outline" size={17} color="#DC2626" />
            </View>
            <View>
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                HYDRATION
              </Text>
              <Text className="text-[#71717A] text-[11px] font-mono mt-0.5">
                {targetWater} mL Target
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5. Historical Logbook & PR Vault Portal */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            setShowLogbookModal(true);
          }}
          className="bg-[#121215] border border-white/10 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 items-center justify-center">
              <Ionicons name="trophy-outline" size={17} color="#DC2626" />
            </View>
            <View>
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                LOGBOOK & PR VAULT
              </Text>
              <Text className="text-[#71717A] text-[11px] mt-0.5">
                Session volume & 1RM trophy archive
              </Text>
            </View>
          </View>
          <View className="py-1 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <Text className="text-[#A1A1AA] text-[10px] font-mono uppercase">
              ARCHIVE →
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Quick Macro Intake Modal */}
      <Modal
        visible={showQuickAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickAddModal(false)}
      >
        <View className="flex-1 bg-black/85 justify-center px-6">
          <View className="bg-[#121215] border border-white/10 rounded-3xl p-6 gap-5 shadow-2xl">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-base font-bold uppercase tracking-wider">
                  QUICK MACRO INTAKE
                </Text>
                <Text className="text-[#71717A] text-xs mt-0.5">
                  Record calories and protein in seconds
                </Text>
              </View>
              <Pressable
                onPress={() => setShowQuickAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={18} color="#A1A1AA" />
              </Pressable>
            </View>

            {/* Form Inputs */}
            <View className="gap-3">
              <View className="gap-1.5">
                <Text className="text-[#71717A] text-[11px] font-mono uppercase">
                  Meal Name (Optional)
                </Text>
                <TextInput
                  value={quickMealName}
                  onChangeText={setQuickMealName}
                  placeholder="e.g. Steak & Jasmine Rice"
                  placeholderTextColor="#52525B"
                  className="w-full px-4 py-3 rounded-xl bg-[#18181D] border border-white/10 text-white font-medium text-sm"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1.5">
                  <Text className="text-[#71717A] text-[11px] font-mono uppercase">
                    Calories (kcal) *
                  </Text>
                  <TextInput
                    value={quickCalories}
                    onChangeText={setQuickCalories}
                    placeholder="650"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl bg-[#18181D] border border-white/10 text-white font-mono text-sm text-center"
                  />
                </View>

                <View className="flex-1 gap-1.5">
                  <Text className="text-[#71717A] text-[11px] font-mono uppercase">
                    Protein (g) *
                  </Text>
                  <TextInput
                    value={quickProtein}
                    onChangeText={setQuickProtein}
                    placeholder="45"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    maxLength={3}
                    className="w-full px-4 py-3 rounded-xl bg-[#18181D] border border-white/10 text-white font-mono text-sm text-center"
                  />
                </View>
              </View>
            </View>

            {/* Commit Action Button */}
            <Pressable
              onPress={handleCommitQuickMeal}
              className="w-full py-3.5 rounded-xl bg-[#DC2626] items-center justify-center active:opacity-85 mt-1"
            >
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Add to Daily Intake
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Aegis Protocol Configuration Modal */}
      <AegisConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        profile={profile}
        onProfileUpdated={async (updatedProfile) => {
          setProfile(updatedProfile);
          try {
            const freshLog = await getDailyLog();
            setDietLog(freshLog);
          } catch {}
        }}
        onMealsCleared={async () => {
          try {
            const freshLog = await getDailyLog();
            setDietLog(freshLog);
          } catch {}
        }}
      />

      {/* Historical Workout Logbook & PR Vault Modal */}
      <AegisLogbookModal
        visible={showLogbookModal}
        onClose={() => setShowLogbookModal(false)}
        unitSystem={profile?.unitSystem}
      />
    </SafeAreaView>
  );
}
