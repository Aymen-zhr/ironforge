import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UserProfile, getUserProfile } from '../../services/userMetrics';
import {
  getScheduledWorkoutForDay,
  TrainingProgram,
} from '../../data/workoutCatalog';
import { useAegisStore, aegisState } from '../../services/useAegisStore';
import AegisConfigModal from '../../components/AegisConfigModal';
import AegisLogbookModal from '../../components/AegisLogbookModal';
import MacroRingGauge from '../../components/ui/MacroRingGauge';
import CalendarTracker from '../../components/ui/CalendarTracker';
import PhotoCard from '../../components/ui/PhotoCard';
import CircularDial from '../../components/ui/CircularDial';

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CommandDeckScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const aegis = useAegisStore();

  // Modals
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showLogbookModal, setShowLogbookModal] = useState<boolean>(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Quick Macro Form
  const [quickMealName, setQuickMealName] = useState<string>('');
  const [quickCalories, setQuickCalories] = useState<string>('');
  const [quickProtein, setQuickProtein] = useState<string>('');

  // Daily Athlete Checklist
  const [checkedTasks, setCheckedTasks] = useState<{ [key: string]: boolean }>({
    hydration: true,
    fuel: false,
    workout: false,
    recovery: false,
  });

  const toggleTask = (key: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCheckedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handleCommitQuickMeal = () => {
    const cals = parseInt(quickCalories, 10);
    const prot = parseInt(quickProtein, 10);
    if (!cals || isNaN(cals) || cals < 10 || cals > 5000) {
      Alert.alert('Invalid Calories', 'Please enter a realistic caloric amount between 10 and 5,000 kcal.');
      return;
    }
    const safeProtein = Math.min(300, Math.max(0, isNaN(prot) ? 0 : prot));
    const name = quickMealName.trim() || 'Quick Meal';

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.logMeal({
      name,
      calories: cals,
      protein: safeProtein,
      carbs: Math.max(0, Math.round((cals - safeProtein * 4) / 8)),
      fats: Math.max(0, Math.round((cals - safeProtein * 4) / 18)),
      source: 'quick-log',
    });

    setShowQuickAddModal(false);
    setQuickMealName('');
    setQuickCalories('');
    setQuickProtein('');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleInstantPresetLog = (name: string, cals: number, protein: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.logMeal({
      name,
      calories: cals,
      protein,
      carbs: Math.max(0, Math.round((cals - protein * 4) / 8)),
      fats: Math.max(0, Math.round((cals - protein * 4) / 18)),
      source: 'quick-log',
    });
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleQuickLogWater = (amountMl: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    aegisState.logWater(amountMl);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const stored = await getUserProfile();
        if (stored) setProfile(stored);
      } catch (err) {
        console.warn('[CommandDeck] Error reading profile:', err);
      }
    }
    loadProfile();
  }, []);

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDayKey = DAY_ABBRS[currentDayIndex];
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const activeDays = profile?.trainingDays || ['Mon', 'Tue', 'Thu', 'Fri'];
  const isTrainingDay = activeDays.includes(currentDayKey);
  const scheduledProgram: TrainingProgram | null = profile
    ? getScheduledWorkoutForDay(profile.splitPreference, activeDays, currentDayKey)
    : null;

  // Metabolic values from reactive store
  const targetCalories = aegis.targetCalories || 2600;
  const targetProtein = aegis.targetProtein || 180;
  const targetWaterMl = aegis.targetWaterMl || 3500;

  const consumedCalories = aegis.consumedCalories || 0;
  const consumedProtein = aegis.consumedProtein || 0;
  const consumedWaterMl = aegis.consumedWaterMl || 0;

  const calPercent = Math.min(100, Math.round((consumedCalories / Math.max(1, targetCalories)) * 100));
  const proteinPercent = Math.min(100, Math.round((consumedProtein / Math.max(1, targetProtein)) * 100));
  const waterPercent = Math.min(100, Math.round((consumedWaterMl / Math.max(1, targetWaterMl)) * 100));

  // Dynamic CNS Status
  const cnsScore = aegis.cnsReadinessPct;
  const cnsColor =
    cnsScore >= 85 ? '#10E760' : cnsScore >= 70 ? '#00D2FF' : cnsScore >= 50 ? '#FF9F0A' : '#FF3B30';
  const cnsLabel =
    cnsScore >= 85 ? 'OPTIMAL' : cnsScore >= 70 ? 'RESTORING' : cnsScore >= 50 ? 'STRAINED' : 'DEPLETED';

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Sleek Minimalist Header */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            IRONFORGE
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
            {formattedDate} • {profile?.goal ? profile.goal.toUpperCase() : 'BUILD'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => {
              triggerHaptic();
              setShowLogbookModal(true);
            }}
            className="w-10 h-10 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center active:opacity-75"
          >
            <Ionicons name="trophy-outline" size={17} color="#F8FAFC" />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              setShowConfigModal(true);
            }}
            className="w-10 h-10 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center active:opacity-75"
          >
            <Ionicons name="settings-outline" size={17} color="#F8FAFC" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
        className="flex-1"
      >
        {/* Active Session Sticky Banner (If Active) */}
        {aegis.activeSession.isActive && (
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/workout');
            }}
            className="bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 rounded-3xl p-4 mb-5 flex-row items-center justify-between active:opacity-85 shadow-lg shadow-[#FF5A1F]/10"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" />
              <View>
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Live Session Active
                </Text>
                <Text className="text-[#A1A1AA] text-xs mt-0.5">
                  {aegis.activeSession.splitName} • {aegis.activeSession.completedSetsCount} sets completed
                </Text>
              </View>
            </View>
            <View className="py-2 px-3.5 rounded-2xl bg-[#FF5A1F] flex-row items-center gap-1.5">
              <Text className="text-black text-xs font-bold uppercase tracking-wider">Resume</Text>
              <Ionicons name="arrow-forward" size={13} color="#000000" />
            </View>
          </Pressable>
        )}

        {/* 2. Whoop-Style Daily Readiness & Strain Widget */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 shadow-xl">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cnsColor }} />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Daily Readiness
              </Text>
            </View>
            <View
              className="py-1 px-3 rounded-full border"
              style={{
                backgroundColor: `${cnsColor}15`,
                borderColor: `${cnsColor}30`,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: cnsColor }}>
                {cnsLabel}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-2">
            {/* Circular Whoop Dial */}
            <View className="items-center justify-center">
              <CircularDial
                size={130}
                strokeWidth={11}
                progress={cnsScore}
                color={cnsColor}
                valueText={`${cnsScore}%`}
                labelText="PRIME"
              />
            </View>

            {/* Pillar Metrics */}
            <View className="flex-1 pl-6 gap-3">
              <View>
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-wider">
                  Today's Strain Target
                </Text>
                <Text className="text-white text-xl font-black mt-0.5">
                  14.5 <Text className="text-[#71717A] text-xs font-bold font-mono">/ 21.0</Text>
                </Text>
              </View>

              <View>
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-wider">
                  Sleep Recovery
                </Text>
                <Text className="text-white text-xl font-black mt-0.5">
                  {aegis.sleepHours}h <Text className="text-[#10B981] text-xs font-bold">Optimal</Text>
                </Text>
              </View>

              <View>
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-wider">
                  Hydration Level
                </Text>
                <Text className="text-white text-xl font-black mt-0.5">
                  {(consumedWaterMl / 1000).toFixed(1)}L <Text className="text-[#71717A] text-xs font-bold">of {(targetWaterMl / 1000).toFixed(1)}L</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Today's Scheduled Session Photographic Hero */}
        <PhotoCard
          imageSource={require('../../assets/generated/workout_hero.jpg')}
          tag={isTrainingDay ? "TODAY'S WORKOUT" : "ACTIVE RECOVERY"}
          tagColor="#FF5A1F"
          title={scheduledProgram?.splitName ?? 'Chest & Triceps Hypertrophy'}
          subtitle={scheduledProgram?.subtitle ?? 'Focused mechanical tension and clean muscle contraction.'}
          meta={[
            { icon: 'barbell-outline', text: '5 Exercises' },
            { icon: 'time-outline', text: '~50 Mins' },
            { icon: 'flame-outline', text: 'RPE 8.5' },
          ]}
          actionLabel={aegis.activeSession.isActive ? 'Resume Workout' : 'Start Workout'}
          onActionPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
            if (!aegis.activeSession.isActive) {
              aegisState.startWorkoutSession(scheduledProgram?.splitName || 'Chest Hypertrophy');
            }
            router.push('/workout');
          }}
          className="mb-5"
        />

        {/* 4. Interactive Activity Calendar & Streak Matrix */}
        <CalendarTracker initialMode="week" className="mb-5" />

        {/* 5. Daily Nutrition & Fuel */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 gap-4 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-base font-bold tracking-tight">
                Daily Nutrition
              </Text>
              <Text className="text-[#71717A] text-xs mt-0.5">
                Target: {targetCalories} kcal • {targetProtein}g Protein
              </Text>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowQuickAddModal(true);
              }}
              className="py-1.5 px-3.5 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 active:opacity-75"
            >
              <Text className="text-[#FF5A1F] text-xs font-bold">
                + Log Meal
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <MacroRingGauge
              size={135}
              caloriesCurrent={consumedCalories}
              caloriesTarget={targetCalories}
              proteinCurrent={consumedProtein}
              proteinTarget={targetProtein}
              waterCurrentMl={consumedWaterMl}
              waterTargetMl={targetWaterMl}
            />

            <View className="flex-1 pl-5 gap-3">
              {/* Calories */}
              <View>
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-white" />
                  <Text className="text-[#71717A] text-xs font-medium">Calories</Text>
                </View>
                <Text className="text-white text-sm font-bold">
                  {consumedCalories} <Text className="text-[#52525B] text-xs">/ {targetCalories} kcal</Text>
                </Text>
              </View>

              {/* Protein */}
              <View>
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
                  <Text className="text-[#71717A] text-xs font-medium">Protein</Text>
                </View>
                <Text className="text-[#FF5A1F] text-sm font-bold">
                  {consumedProtein}g <Text className="text-[#52525B] text-xs">/ {targetProtein}g ({proteinPercent}%)</Text>
                </Text>
              </View>

              {/* Water */}
              <View>
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <Text className="text-[#71717A] text-xs font-medium">Water</Text>
                </View>
                <Text className="text-[#38BDF8] text-sm font-bold">
                  {(consumedWaterMl / 1000).toFixed(1)}L <Text className="text-[#52525B] text-xs">/ {(targetWaterMl / 1000).toFixed(1)}L</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Quick-Log Actions Bar */}
          <View className="pt-3 border-t border-white/[0.05] flex-row gap-2">
            <Pressable
              onPress={() => handleInstantPresetLog('Whey Isolate', 140, 30)}
              className="flex-1 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.05] items-center active:opacity-75"
            >
              <Text className="text-white text-xs font-semibold">+30g Whey</Text>
              <Text className="text-[#71717A] text-[10px] mt-0.5">140 kcal</Text>
            </Pressable>

            <Pressable
              onPress={() => handleInstantPresetLog('High-Protein Meal', 550, 45)}
              className="flex-1 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.05] items-center active:opacity-75"
            >
              <Text className="text-white text-xs font-semibold">+45g Meal</Text>
              <Text className="text-[#71717A] text-[10px] mt-0.5">550 kcal</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickLogWater(500)}
              className="flex-1 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.05] items-center active:opacity-75"
            >
              <Text className="text-[#38BDF8] text-xs font-semibold">+500ml H₂O</Text>
              <Text className="text-[#71717A] text-[10px] mt-0.5">Hydration</Text>
            </Pressable>
          </View>
        </View>

        {/* 6. Daily Habits */}
        <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 gap-3 shadow-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-base font-bold tracking-tight">
              Daily Habits
            </Text>
            <Text className="text-[#71717A] text-xs font-medium">
              {Object.values(checkedTasks).filter(Boolean).length} of 4 Completed
            </Text>
          </View>

          <View className="gap-2.5 pt-1">
            {[
              { key: 'hydration', label: 'Hit 3.5L Daily Hydration', sub: 'Electrolytes & fluid balance' },
              { key: 'fuel', label: 'Reach 180g Protein Target', sub: 'Muscle protein synthesis & repair' },
              { key: 'workout', label: 'Complete Daily Workout', sub: 'Consistent training load' },
              { key: 'recovery', label: 'Prioritize 8h Restorative Sleep', sub: 'Recovery & hormone replenishment' },
            ].map((task) => {
              const isChecked = !!checkedTasks[task.key];
              return (
                <Pressable
                  key={task.key}
                  onPress={() => toggleTask(task.key)}
                  className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                    isChecked
                      ? 'bg-[#FF5A1F]/10 border-[#FF5A1F]/30'
                      : 'bg-[#181922] border-white/[0.04]'
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className={`text-xs font-semibold ${isChecked ? 'text-white line-through opacity-75' : 'text-slate-200'}`}
                    >
                      {task.label}
                    </Text>
                    <Text className="text-[#71717A] text-[11px] mt-0.5">
                      {task.sub}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-lg items-center justify-center border ${
                      isChecked ? 'bg-[#FF5A1F] border-[#FF5A1F]' : 'border-white/20 bg-transparent'
                    }`}
                  >
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Weekly Consistency & Streak Tracker */}
        <View className="bg-[#17181F] border border-white/[0.06] rounded-3xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-base font-bold tracking-tight">
                Weekly Schedule
              </Text>
              <View className="py-0.5 px-2.5 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30">
                <Text className="text-[#FF5A1F] text-[10px] font-bold">
                  {aegis.currentStreakDays} DAY STREAK
                </Text>
              </View>
            </View>
            <Text className="text-slate-400 text-xs font-medium">
              {activeDays.length} Days / Wk
            </Text>
          </View>

          <View className="flex-row justify-between pt-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
              const isScheduled = activeDays.includes(d);
              const isToday = currentDayKey.toLowerCase() === d.toLowerCase();
              return (
                <View key={d} className="items-center gap-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold">{d}</Text>
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center border ${
                      isToday
                        ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                        : isScheduled
                        ? 'bg-white/[0.08] border-white/10'
                        : 'bg-white/[0.02] border-white/[0.04]'
                    }`}
                  >
                    <Ionicons
                      name={isScheduled ? 'barbell' : 'ellipse'}
                      size={12}
                      color={isToday ? '#FFFFFF' : isScheduled ? '#F8FAFC' : '#475569'}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Quick Macro Intake Modal */}
      <Modal
        visible={showQuickAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickAddModal(false)}
      >
        <View className="flex-1 bg-black/85 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#141416] border border-white/10 p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base font-bold">
                Quick Macro Intake
              </Text>
              <Pressable
                onPress={() => setShowQuickAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-[#8E8E93] text-xs font-mono uppercase">Item / Meal Name</Text>
                <TextInput
                  value={quickMealName}
                  onChangeText={setQuickMealName}
                  placeholder="e.g. Post-Workout Shake"
                  placeholderTextColor="#636366"
                  className="h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-medium"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-[#8E8E93] text-xs font-mono uppercase">Calories (kcal)</Text>
                  <TextInput
                    value={quickCalories}
                    onChangeText={setQuickCalories}
                    placeholder="e.g. 350"
                    placeholderTextColor="#636366"
                    keyboardType="numeric"
                    className="h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs"
                  />
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-[#8E8E93] text-xs font-mono uppercase">Protein (g)</Text>
                  <TextInput
                    value={quickProtein}
                    onChangeText={setQuickProtein}
                    placeholder="e.g. 30"
                    placeholderTextColor="#636366"
                    keyboardType="numeric"
                    className="h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mt-1">
              <Pressable
                onPress={() => setShowQuickAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/10 items-center justify-center"
              >
                <Text className="text-[#8E8E93] text-xs font-bold uppercase">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCommitQuickMeal}
                className="flex-1 py-3 rounded-xl bg-white items-center justify-center"
              >
                <Text className="text-black text-xs font-bold uppercase">Save Meal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Config Modal */}
      <AegisConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
        onMealsCleared={() => {}}
      />

      {/* Vault Modal */}
      <AegisLogbookModal
        visible={showLogbookModal}
        onClose={() => setShowLogbookModal(false)}
      />
    </SafeAreaView>
  );
}
