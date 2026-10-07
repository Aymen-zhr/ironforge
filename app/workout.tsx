import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Dumbbell,
  Sparkles,
  Zap,
  Target,
  Flame,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BookmarkCheck,
  PlusCircle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Plus,
  Trash2,
  Check,
  ListChecks,
} from 'lucide-react-native';
import { GlassCard, GlowButton, MetricBadge, AmbientGlow } from '../components/ui';
import {
  generateTargetedWorkout,
  fetchExerciseTechnique,
  GeneratedWorkoutRoutine,
  WorkoutExercise,
  SplitType,
  EquipmentType,
  ExperienceLevel,
} from '../services/workoutGenerator';
import { supabase } from '../services/supabase';

export interface WorkoutScreenProps {
  onBack?: () => void;
}

export interface WgerSetLog {
  setNumber: number;
  weight: string;
  reps: string;
  rpe: string;
  completed: boolean;
  completedAt?: string;
}

const AVAILABLE_MUSCLE_GROUPS = [
  'Upper Chest',
  'Lateral Delts',
  'Rear Delts',
  'Lats',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Calves',
  'Abs',
];

export default function WorkoutScreen({ onBack }: WorkoutScreenProps) {
  // Configuration options
  const [splitType, setSplitType] = useState<SplitType>('Upper/Lower');
  const [equipment, setEquipment] = useState<EquipmentType>('Full Commercial Gym');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [selectedWeakPoints, setSelectedWeakPoints] = useState<string[]>([
    'Upper Chest',
    'Lateral Delts',
  ]);

  // Loading & Data State
  const [generating, setGenerating] = useState(false);
  const [savingLogs, setSavingLogs] = useState(false);
  const [routine, setRoutine] = useState<GeneratedWorkoutRoutine | null>(null);
  const [savedDbStatus, setSavedDbStatus] = useState<string | null>(null);
  const [savedRoutineStatus, setSavedRoutineStatus] = useState(false);

  // Live Wger-Style Set Logging State: map of exerciseId -> WgerSetLog[]
  const [sessionLogs, setSessionLogs] = useState<Record<string, WgerSetLog[]>>({});

  // Technique detail accordion toggle
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [techniqueNotes, setTechniqueNotes] = useState<Record<string, string>>({});
  const [loadingTechniqueId, setLoadingTechniqueId] = useState<string | null>(null);

  // Auto-fetch latest body scan weak points on mount
  useEffect(() => {
    async function loadScanWeakPoints() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          // Query latest body scan
          const { data: scans } = await supabase
            .from('body_scans')
            .select('id')
            .eq('user_id', user.id)
            .order('analyzed_at', { ascending: false })
            .limit(1);

          if (scans && scans.length > 0) {
            const scanId = scans[0].id;
            // Query muscle groups ranked C or B (lagging)
            const { data: rankings } = await supabase
              .from('muscle_rankings')
              .select('muscle_group, rank')
              .eq('scan_id', scanId)
              .in('rank', ['C', 'B']);

            if (rankings && rankings.length > 0) {
              const detectedWeak = rankings.map((r) => r.muscle_group);
              setSelectedWeakPoints(detectedWeak);
              setSavedDbStatus('Synced with latest BodyScan biometrics');
            }
          }
        }
      } catch (err) {
        console.warn('[WorkoutScreen] Weak point scan sync warning:', err);
      }
    }

    loadScanWeakPoints();
  }, []);

  const handleToggleWeakPoint = (muscle: string) => {
    setSelectedWeakPoints((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const initializeLogsForRoutine = (generatedRoutine: GeneratedWorkoutRoutine) => {
    const initialLogs: Record<string, WgerSetLog[]> = {};
    generatedRoutine.exercises.forEach((ex) => {
      const repMatch = ex.reps.match(/\d+/g);
      const defaultReps = repMatch ? repMatch[repMatch.length - 1] : '10';
      initialLogs[ex.id] = Array.from({ length: ex.sets }).map((_, idx) => ({
        setNumber: idx + 1,
        weight: '',
        reps: defaultReps,
        rpe: String(ex.rpe || 8.0),
        completed: false,
      }));
    });
    setSessionLogs(initialLogs);
  };

  const handleForgeRoutine = async () => {
    setGenerating(true);
    setSavedRoutineStatus(false);
    setSavedDbStatus(null);

    try {
      const generated = await generateTargetedWorkout({
        splitType,
        experienceLevel,
        equipment,
        weakPoints: selectedWeakPoints,
        sessionDurationMinutes: sessionDuration,
      });

      setRoutine(generated);
      initializeLogsForRoutine(generated);

      // Auto-save initial protocol into Supabase workout_routines
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          const { error: insertError } = await supabase.from('workout_routines').insert({
            user_id: user.id,
            split_name: generated.split,
            target_weak_points: generated.primaryFocus,
            schedule_json: generated,
            is_active: true,
          });

          if (!insertError) {
            setSavedDbStatus('Routine cached to Supabase Cloud');
          } else {
            setSavedDbStatus('Cached in local session');
          }
        } else {
          setSavedDbStatus('Cached in local session');
        }
      } catch (dbErr) {
        console.warn('[WorkoutScreen] Save error:', dbErr);
        setSavedDbStatus('Stored in local session');
      }
    } catch (err) {
      console.error('Workout generation failed:', err);
      Alert.alert('Generation Error', 'Failed to forge routine. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Wger Set Logging Handlers
  const handleUpdateSetField = (
    exerciseId: string,
    setIndex: number,
    field: 'weight' | 'reps' | 'rpe',
    value: string
  ) => {
    setSessionLogs((prev) => {
      const existingSets = prev[exerciseId] || [];
      const updated = [...existingSets];
      if (updated[setIndex]) {
        updated[setIndex] = { ...updated[setIndex], [field]: value };
      }
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleToggleSetCompleted = (exerciseId: string, setIndex: number) => {
    setSessionLogs((prev) => {
      const existingSets = prev[exerciseId] || [];
      const updated = [...existingSets];
      if (updated[setIndex]) {
        const willBeCompleted = !updated[setIndex].completed;
        updated[setIndex] = {
          ...updated[setIndex],
          completed: willBeCompleted,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
      }
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleAddExtraSet = (exerciseId: string) => {
    setSessionLogs((prev) => {
      const existingSets = prev[exerciseId] || [];
      const lastSet = existingSets[existingSets.length - 1];
      const newSet: WgerSetLog = {
        setNumber: existingSets.length + 1,
        weight: lastSet ? lastSet.weight : '',
        reps: lastSet ? lastSet.reps : '10',
        rpe: lastSet ? lastSet.rpe : '8.5',
        completed: false,
      };
      return { ...prev, [exerciseId]: [...existingSets, newSet] };
    });
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setSessionLogs((prev) => {
      const existingSets = prev[exerciseId] || [];
      if (existingSets.length <= 1) return prev;
      const filtered = existingSets
        .filter((_, idx) => idx !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return { ...prev, [exerciseId]: filtered };
    });
  };

  const handleInspectTechnique = async (exercise: WorkoutExercise) => {
    if (expandedExerciseId === exercise.id) {
      setExpandedExerciseId(null);
      return;
    }

    setExpandedExerciseId(exercise.id);

    if (!techniqueNotes[exercise.id]) {
      setLoadingTechniqueId(exercise.id);
      try {
        const cue = await fetchExerciseTechnique(exercise.name);
        if (cue) {
          setTechniqueNotes((prev) => ({ ...prev, [exercise.id]: cue }));
        }
      } catch {
        // Fallback to existing cue
      } finally {
        setLoadingTechniqueId(null);
      }
    }
  };

  // Calculate overall session telemetry stats
  const totalPrescribedSets = Object.values(sessionLogs).reduce(
    (acc, sets) => acc + sets.length,
    0
  );
  const totalCompletedSets = Object.values(sessionLogs).reduce(
    (acc, sets) => acc + sets.filter((s) => s.completed).length,
    0
  );
  const completionPercentage =
    totalPrescribedSets > 0
      ? Math.round((totalCompletedSets / totalPrescribedSets) * 100)
      : 0;

  // Persist live session logs (Weight x Reps x RPE completed) into Supabase
  const handleSaveSessionLogs = async () => {
    if (!routine) return;
    setSavingLogs(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      const payloadSchedule = {
        ...routine,
        sessionLogs,
        telemetry: {
          totalPrescribedSets,
          totalCompletedSets,
          completionPercentage,
          loggedAt: new Date().toISOString(),
        },
        isFinished: totalCompletedSets > 0,
      };

      if (user) {
        const { error: insertError } = await supabase.from('workout_routines').insert({
          user_id: user.id,
          split_name: routine.split,
          target_weak_points: routine.primaryFocus,
          schedule_json: payloadSchedule,
          is_active: true,
        });

        if (insertError) throw insertError;

        setSavedRoutineStatus(true);
        setSavedDbStatus(`Synced: ${totalCompletedSets} sets logged to Supabase`);
        Alert.alert(
          'Session Synced to Supabase Cloud',
          `Successfully logged ${totalCompletedSets} sets across ${routine.exercises.length} exercises into your Supabase training database!`
        );
      } else {
        setSavedRoutineStatus(true);
        setSavedDbStatus(`Offline: ${totalCompletedSets} sets recorded in session`);
        Alert.alert(
          'Session Logged Locally',
          `Logged ${totalCompletedSets} completed sets in active offline storage.`
        );
      }
    } catch (err: any) {
      console.warn('[WorkoutScreen] Save session error:', err);
      Alert.alert(
        'Session Cached Locally',
        'Session telemetry recorded in local session cache.'
      );
    } finally {
      setSavingLogs(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-obsidian" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border-dark bg-surface/70">
        <Pressable
          onPress={onBack}
          className="flex-row items-center py-1.5 px-2.5 rounded-lg bg-surface border border-border-dark active:opacity-75"
        >
          <ArrowLeft size={16} color="#94A3B8" />
          <Text className="text-text-dim text-xs font-bold uppercase ml-1.5">
            Back
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Dumbbell size={16} color="#DC2626" />
          <Text className="text-[#F4F4F5] text-sm font-black tracking-widest uppercase ml-1.5">
            Workout Generator
          </Text>
        </View>

        <View className="flex-row items-center px-2 py-1 rounded-full bg-blood-red/15 border border-blood-red/40">
          <Zap size={12} color="#DC2626" />
          <Text className="text-blood-red text-[10px] font-black tracking-widest uppercase ml-1">
            Grounded AI
          </Text>
        </View>
      </View>

      {/* Ambient Lighting Glow */}
      <AmbientGlow color="#F59E0B" size={280} opacity={0.16} top={-40} right={-60} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Visual Banner */}
        <View className="w-full h-36 rounded-xl overflow-hidden mb-5 border border-white/[0.07] relative">
          <Image
            source={require('../assets/generated/hero-workout.jpg')}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-forge-black/60" />
          <View className="absolute bottom-3 left-3 right-3 flex-row items-end justify-between">
            <View>
              <View className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 self-start mb-1">
                <Text className="text-amber-400 text-[9px] font-black uppercase tracking-widest">
                  HYPERTROPHY FORGE
                </Text>
              </View>
              <Text className="text-[#F4F4F5] font-black text-xl tracking-tight leading-tight">
                Grounded AI Workout Protocol
              </Text>
              <Text className="text-[#71717A] text-xs mt-0.5">
                Free Exercise DB catalog + live Wger set telemetry.
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-xl bg-forge-black/90 border border-white/[0.07]">
              <Text className="text-amber-400 text-[10px] font-mono tabular-nums font-bold">
                876 EXERCISES
              </Text>
            </View>
          </View>
        </View>

        {/* DYNAMIC PRIORITY FOCUS BANNER */}
        <GlassCard variant="glow" className="p-4 mb-5 border-amber-500/40">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Target size={16} color="#F59E0B" />
              <Text className="text-amber-400 font-extrabold text-xs uppercase tracking-widest ml-1.5">
                Priority Focus Muscles
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
              <Text className="text-amber-300 text-[10px] font-black tracking-widest uppercase">
                {selectedWeakPoints.length} Selected
              </Text>
            </View>
          </View>

          <Text className="text-[#71717A] text-[11px] leading-4 mb-3">
            Select muscle groups to receive +25% targeted overload isolation volume in today's routine:
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {AVAILABLE_MUSCLE_GROUPS.map((muscle) => {
              const isSelected = selectedWeakPoints.includes(muscle);
              return (
                <Pressable
                  key={muscle}
                  onPress={() => handleToggleWeakPoint(muscle)}
                  className={`px-3 py-1.5 rounded-xl border flex-row items-center active:opacity-75 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60'
                      : 'bg-[#0A0A0C] border-white/[0.07]'
                  }`}
                >
                  {isSelected && (
                    <Flame size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-amber-300' : 'text-[#71717A]'
                    }`}
                  >
                    {muscle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* WORKOUT CONFIGURATION PANEL */}
        <GlassCard variant="elevated" className="p-4 mb-6 border-white/[0.07]">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Sliders size={16} color="#DC2626" />
              <Text className="text-[#F4F4F5] font-extrabold text-xs uppercase tracking-widest ml-2">
                Protocol Configuration
              </Text>
            </View>
            <Text className="text-[#71717A] text-[10px] font-mono">Free Exercise DB Grounded</Text>
          </View>

          {/* SPLIT TYPE */}
          <View className="mb-4">
            <Text className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest mb-2">
              Training Split
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(['PPL', 'Upper/Lower', 'Arnold Split', 'Full Body'] as SplitType[]).map((split) => {
                const isSelected = splitType === split;
                return (
                  <Pressable
                    key={split}
                    onPress={() => setSplitType(split)}
                    className={`flex-1 min-w-[45%] py-2.5 px-3 rounded-xl border items-center ${
                      isSelected
                        ? 'bg-blood-red/20 border-blood-red/60'
                        : 'bg-[#0A0A0C] border-white/[0.07]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-black ${
                        isSelected ? 'text-blood-red' : 'text-[#71717A]'
                      }`}
                    >
                      {split}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* EQUIPMENT SELECTION */}
          <View className="mb-4">
            <Text className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest mb-2">
              Available Equipment
            </Text>
            <View className="gap-2">
              {(
                [
                  'Full Commercial Gym',
                  'Dumbbells & Bench',
                  'Bodyweight / Calisthenics',
                ] as EquipmentType[]
              ).map((eq) => {
                const isSelected = equipment === eq;
                return (
                  <Pressable
                    key={eq}
                    onPress={() => setEquipment(eq)}
                    className={`py-2 px-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? 'bg-blood-red/20 border-blood-red/60'
                        : 'bg-[#0A0A0C] border-white/[0.07]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-blood-red' : 'text-[#71717A]'
                      }`}
                    >
                      {eq}
                    </Text>
                    {isSelected && <ShieldCheck size={14} color="#DC2626" />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* DURATION & EXPERIENCE LEVEL */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest mb-2">
                Duration
              </Text>
              <View className="flex-row gap-1">
                {[45, 60, 90].map((mins) => {
                  const isSelected = sessionDuration === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => setSessionDuration(mins)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        isSelected
                          ? 'bg-blood-red/20 border-blood-red/60'
                          : 'bg-[#0A0A0C] border-white/[0.07]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-mono tabular-nums font-bold ${
                          isSelected ? 'text-blood-red' : 'text-[#71717A]'
                        }`}
                      >
                        {mins}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest mb-2">
                Experience
              </Text>
              <View className="flex-row gap-1">
                {(['Beginner', 'Intermediate', 'Advanced'] as ExperienceLevel[]).map((lvl) => {
                  const isSelected = experienceLevel === lvl;
                  const shortLvl = lvl === 'Intermediate' ? 'Inter' : lvl === 'Advanced' ? 'Adv' : 'Beg';
                  return (
                    <Pressable
                      key={lvl}
                      onPress={() => setExperienceLevel(lvl)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        isSelected
                          ? 'bg-blood-red/20 border-blood-red/60'
                          : 'bg-[#0A0A0C] border-white/[0.07]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? 'text-blood-red' : 'text-[#71717A]'
                        }`}
                      >
                        {shortLvl}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* FORGE ROUTINE ACTION CTA */}
          <GlowButton
            title={generating ? 'FORGING GROUNDED ROUTINE...' : 'FORGE TARGETED ROUTINE'}
            variant="blood"
            size="lg"
            icon={
              generating ? (
                <ActivityIndicator size="small" color="#F4F4F5" />
              ) : (
                <Sparkles size={18} color="#F4F4F5" />
              )
            }
            onPress={handleForgeRoutine}
            disabled={generating}
          />
        </GlassCard>

        {/* LOADING ANIMATION */}
        {generating && (
          <GlassCard variant="glow" className="p-6 mb-6 items-center">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="text-white font-extrabold text-base mt-4 text-center">
              Filtering Free Exercise DB Catalog & Synthesizing Overload...
            </Text>
            <Text className="text-text-dim text-xs text-center mt-2 max-w-[280px]">
              Grounding exercise pool in verified biomechanics. Allocating +25% volume surplus to {selectedWeakPoints.join(', ')}.
            </Text>
          </GlassCard>
        )}

        {/* GENERATED WORKOUT ROUTINE SECTION */}
        {routine && (
          <View className="gap-5">
            {/* Supabase Status Pill */}
            {savedDbStatus && (
              <View className="flex-row items-center justify-between px-3.5 py-2 rounded-xl bg-surface border border-accent/30">
                <View className="flex-row items-center">
                  <CheckCircle2 size={14} color="#DC2626" />
                  <Text className="text-accent text-xs font-bold ml-2">
                    {savedDbStatus}
                  </Text>
                </View>
                <Text className="text-text-dim text-[10px] font-mono">
                  SUPABASE LINKED
                </Text>
              </View>
            )}

            {/* ROUTINE HEADER & PROGRESS CARD */}
            <GlassCard variant="glow" className="p-5 border-white/[0.07] bg-[#0D0D11]/90">
              <View className="flex-row items-center justify-between mb-2">
                <View className="px-2.5 py-1 rounded bg-blood-red/20 border border-blood-red/50">
                  <Text className="text-blood-red text-[10px] font-black uppercase tracking-widest">
                    {routine.split} Protocol
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Clock size={12} color="#71717A" />
                  <Text className="text-[#71717A] text-xs font-semibold ml-1">
                    {routine.estimatedDuration}
                  </Text>
                </View>
              </View>

              <Text className="text-[#F4F4F5] font-black text-2xl tracking-tight leading-7 mb-2">
                {routine.routineTitle}
              </Text>

              {/* Coach Rationale */}
              <View className="p-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07] mb-3">
                <Text className="text-blood-red text-[10px] font-bold uppercase tracking-widest mb-1">
                  Coach Execution Directive:
                </Text>
                <Text className="text-[#71717A] text-xs leading-5">
                  {routine.coachNotes}
                </Text>
              </View>

              {/* Live Session Progress Bar */}
              <View className="p-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07] mb-3">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <ListChecks size={14} color="#DC2626" />
                    <Text className="text-[#F4F4F5] text-xs font-extrabold uppercase tracking-widest ml-1.5">
                      Session Progress (Wger Telemetry)
                    </Text>
                  </View>
                  <Text className="text-blood-red text-xs font-mono font-black tabular-nums">
                    {totalCompletedSets} / {totalPrescribedSets} Sets ({completionPercentage}%)
                  </Text>
                </View>

                {/* Visual Progress Bar */}
                <View className="w-full h-2 rounded-full bg-forge-black overflow-hidden">
                  <View
                    className="h-full bg-blood-red rounded-full"
                    style={{ width: `${Math.min(100, completionPercentage)}%` }}
                  />
                </View>
              </View>

              {/* Save / Sync Session Logs Button */}
              <GlowButton
                title={savingLogs ? 'SYNCING TO SUPABASE...' : 'SAVE SESSION LOGS TO SUPABASE'}
                variant="blood"
                size="md"
                icon={
                  savingLogs ? (
                    <ActivityIndicator size="small" color="#F4F4F5" />
                  ) : (
                    <BookmarkCheck size={16} color="#F4F4F5" />
                  )
                }
                onPress={handleSaveSessionLogs}
                disabled={savingLogs}
              />
            </GlassCard>

            {/* EXERCISES LIST WITH WGER SET LOGGING INTERFACE */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Flame size={18} color="#DC2626" />
                  <Text className="text-[#F4F4F5] text-base font-extrabold tracking-widest uppercase ml-2">
                    SESSION EXERCISES ({routine.exercises.length})
                  </Text>
                </View>
                <Text className="text-[#71717A] text-[11px] font-mono tracking-widest uppercase">
                  Weight x Reps x RPE
                </Text>
              </View>

              <View className="gap-4">
                {routine.exercises.map((exercise, index) => {
                  const setsForEx = sessionLogs[exercise.id] || [];
                  const completedCount = setsForEx.filter((s) => s.completed).length;
                  const isExpanded = expandedExerciseId === exercise.id;
                  const isTechniqueLoading = loadingTechniqueId === exercise.id;
                  const technique = techniqueNotes[exercise.id];

                  return (
                    <GlassCard
                      key={exercise.id}
                      variant={exercise.isWeakPointFocus ? 'glow' : 'default'}
                      className={`p-4 rounded-xl bg-[#0D0D11]/90 border ${
                        exercise.isWeakPointFocus ? 'border-red-600/30' : 'border-white/[0.07]'
                      }`}
                    >
                      {/* Exercise Header Badges */}
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          {/* Mechanic Tag: Compound vs Isolation */}
                          {exercise.mechanic === 'compound' ? (
                            <View className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex-row items-center">
                              <Zap size={10} color="#06B6D4" />
                              <Text className="text-cyan-400 text-[10px] font-black uppercase tracking-widest ml-1">
                                Compound
                              </Text>
                            </View>
                          ) : (
                            <View className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 flex-row items-center">
                              <Target size={10} color="#C084FC" />
                              <Text className="text-purple-300 text-[10px] font-black uppercase tracking-widest ml-1">
                                Isolation
                              </Text>
                            </View>
                          )}

                          {/* Weak Point Focus Badge */}
                          {exercise.isWeakPointFocus && (
                            <View className="px-2 py-0.5 rounded-full bg-blood-red/20 border border-blood-red/50 flex-row items-center">
                              <Flame size={10} color="#DC2626" />
                              <Text className="text-blood-red text-[10px] font-black tracking-widest uppercase ml-1">
                                ⚡ Weak Point Focus (+25% Vol)
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text className="text-[#71717A] text-[11px] font-mono tabular-nums font-bold">
                          #{index + 1}
                        </Text>
                      </View>

                      {/* Exercise Name & Target Muscles */}
                      <Text className="text-[#F4F4F5] font-black text-lg leading-6 mb-0.5">
                        {exercise.name}
                      </Text>
                      <View className="flex-row items-center flex-wrap gap-1.5 mb-2.5">
                        <Text className="text-blood-red text-xs font-bold">
                          Target: {exercise.targetMuscle}
                        </Text>
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                          <Text className="text-[#71717A] text-[11px]">
                            • Secondary: {exercise.secondaryMuscles.join(', ')}
                          </Text>
                        )}
                        {exercise.equipment && (
                          <Text className="text-[#71717A] text-[11px]">
                            • {exercise.equipment}
                          </Text>
                        )}
                      </View>

                      {/* Prescribed Telemetry Badges */}
                      <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                          <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">
                            Target Sets
                          </Text>
                          <Text className="text-[#F4F4F5] text-xs font-mono tabular-nums font-black mt-0.5">
                            {exercise.sets} Sets
                          </Text>
                        </View>

                        <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                          <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">
                            Rep Bracket
                          </Text>
                          <Text className="text-[#F4F4F5] text-xs font-mono tabular-nums font-black mt-0.5">
                            {exercise.reps}
                          </Text>
                        </View>

                        <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                          <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">
                            Prescribed RPE
                          </Text>
                          <Text className="text-amber-400 text-xs font-mono tabular-nums font-black mt-0.5">
                            RPE {exercise.rpe}
                          </Text>
                        </View>

                        <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                          <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">
                            Rest
                          </Text>
                          <Text className="text-cyan-400 text-xs font-mono tabular-nums font-black mt-0.5">
                            {exercise.restSeconds}s
                          </Text>
                        </View>
                      </View>

                      {/* LIVE SET-LOGGING INTERFACE (WGER FORMAT: WEIGHT x REPS x RPE) */}
                      <View className="mb-3 p-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07]">
                        <View className="flex-row items-center justify-between mb-2 pb-1.5 border-b border-white/[0.07]">
                          <Text className="text-[#F4F4F5] text-xs font-extrabold uppercase tracking-widest">
                            Set Telemetry Logger
                          </Text>
                          <Text className="text-blood-red text-[11px] font-mono tabular-nums font-bold">
                            {completedCount} / {setsForEx.length} Completed
                          </Text>
                        </View>

                        {/* Table Header */}
                        <View className="flex-row items-center mb-1.5 px-1">
                          <Text className="w-10 text-[9px] font-bold text-[#71717A] uppercase font-mono tracking-widest text-center">
                            Set
                          </Text>
                          <Text className="flex-1 text-[9px] font-bold text-[#71717A] uppercase font-mono tracking-widest text-center">
                            Weight (lbs)
                          </Text>
                          <Text className="flex-1 text-[9px] font-bold text-[#71717A] uppercase font-mono tracking-widest text-center">
                            Reps
                          </Text>
                          <Text className="w-14 text-[9px] font-bold text-[#71717A] uppercase font-mono tracking-widest text-center">
                            RPE
                          </Text>
                          <Text className="w-16 text-[9px] font-bold text-[#71717A] uppercase font-mono tracking-widest text-center">
                            Status
                          </Text>
                        </View>

                        {/* Set Rows */}
                        <View className="gap-1.5">
                          {setsForEx.map((setLog, setIdx) => {
                            const isDone = setLog.completed;
                            return (
                              <View
                                key={setIdx}
                                className={`flex-row items-center p-1.5 rounded-lg border ${
                                  isDone
                                    ? 'bg-blood-red/10 border-blood-red/40'
                                    : 'bg-[#0D0D11]/90 border-white/[0.07]'
                                }`}
                              >
                                {/* Set Label */}
                                <View className="w-10 items-center justify-center">
                                  <Text
                                    className={`text-xs font-mono font-black ${
                                      isDone ? 'text-blood-red' : 'text-[#71717A]'
                                    }`}
                                  >
                                    S{setLog.setNumber}
                                  </Text>
                                </View>

                                {/* Weight Input */}
                                <View className="flex-1 px-1">
                                  <TextInput
                                    value={setLog.weight}
                                    onChangeText={(txt) =>
                                      handleUpdateSetField(exercise.id, setIdx, 'weight', txt)
                                    }
                                    placeholder="lbs"
                                    placeholderTextColor="#52525B"
                                    keyboardType="numeric"
                                    className="py-1 px-2 rounded-md bg-[#0A0A0C] border border-white/[0.07] text-[#F4F4F5] font-mono tabular-nums text-xs font-bold text-center"
                                  />
                                </View>

                                {/* Reps Input */}
                                <View className="flex-1 px-1">
                                  <TextInput
                                    value={setLog.reps}
                                    onChangeText={(txt) =>
                                      handleUpdateSetField(exercise.id, setIdx, 'reps', txt)
                                    }
                                    placeholder="10"
                                    placeholderTextColor="#52525B"
                                    keyboardType="numeric"
                                    className="py-1 px-2 rounded-md bg-[#0A0A0C] border border-white/[0.07] text-[#F4F4F5] font-mono tabular-nums text-xs font-bold text-center"
                                  />
                                </View>

                                {/* RPE Input */}
                                <View className="w-14 px-1">
                                  <TextInput
                                    value={setLog.rpe}
                                    onChangeText={(txt) =>
                                      handleUpdateSetField(exercise.id, setIdx, 'rpe', txt)
                                    }
                                    placeholder="8.5"
                                    placeholderTextColor="#52525B"
                                    keyboardType="numeric"
                                    className="py-1 px-1.5 rounded-md bg-[#0A0A0C] border border-white/[0.07] text-amber-400 font-mono tabular-nums text-xs font-bold text-center"
                                  />
                                </View>

                                {/* Log Completion Button */}
                                <Pressable
                                  onPress={() => handleToggleSetCompleted(exercise.id, setIdx)}
                                  className={`w-16 py-1.5 rounded-md border items-center justify-center active:opacity-75 ${
                                    isDone
                                      ? 'bg-blood-red border-blood-red'
                                      : 'bg-[#0D0D11] border-white/[0.07] active:border-blood-red/50'
                                  }`}
                                >
                                  {isDone ? (
                                    <View className="flex-row items-center">
                                      <Check size={12} color="#0A0A0C" />
                                      <Text className="text-[#0A0A0C] text-[10px] font-black ml-0.5">
                                        DONE
                                      </Text>
                                    </View>
                                  ) : (
                                    <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-wider">
                                      LOG
                                    </Text>
                                  )}
                                </Pressable>
                              </View>
                            );
                          })}
                        </View>

                        {/* Add Set Action */}
                        <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-white/[0.07]">
                          <Pressable
                            onPress={() => handleAddExtraSet(exercise.id)}
                            className="flex-row items-center py-1 px-2 rounded-md bg-[#0D0D11] border border-white/[0.07] active:opacity-75"
                          >
                            <Plus size={12} color="#DC2626" />
                            <Text className="text-blood-red text-[10px] font-bold uppercase tracking-widest ml-1">
                              Add Set
                            </Text>
                          </Pressable>

                          {setsForEx.length > 1 && (
                            <Pressable
                              onPress={() => handleRemoveSet(exercise.id, setsForEx.length - 1)}
                              className="flex-row items-center py-1 px-2 rounded-md active:opacity-75"
                            >
                              <Trash2 size={12} color="#EF4444" />
                              <Text className="text-red-400 text-[10px] font-semibold ml-1">
                                Remove Last
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>

                      {/* Biomechanics Execution Cue */}
                      <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] mb-2.5">
                        <Text className="text-blood-red text-[10px] font-bold uppercase tracking-widest mb-0.5">
                          Progressive Overload & Biomechanical Cue:
                        </Text>
                        <Text className="text-[#F4F4F5] text-xs leading-5 font-medium">
                          {exercise.executionCue}
                        </Text>
                      </View>

                      {/* Free Exercise DB Instructions Accordion */}
                      <Pressable
                        onPress={() => handleInspectTechnique(exercise)}
                        className="flex-row items-center justify-between p-2 rounded-lg bg-obsidian active:opacity-75"
                      >
                        <Text className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                          {isExpanded ? 'Hide Anatomical Guide' : 'Free Exercise DB Technique Guide'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={14} color="#06B6D4" />
                        ) : (
                          <ChevronDown size={14} color="#06B6D4" />
                        )}
                      </Pressable>

                      {isExpanded && (
                        <View className="mt-2 p-3 rounded-lg bg-obsidian/95 border border-cyan-500/30">
                          {isTechniqueLoading ? (
                            <ActivityIndicator size="small" color="#06B6D4" />
                          ) : (
                            <View>
                              <Text className="text-cyan-300 text-[11px] font-bold uppercase mb-1.5">
                                Step-by-Step Execution:
                              </Text>
                              {exercise.instructions && exercise.instructions.length > 0 ? (
                                exercise.instructions.map((step, sIdx) => (
                                  <Text
                                    key={sIdx}
                                    className="text-text-dim text-xs leading-5 mb-1.5"
                                  >
                                    <Text className="text-white font-bold">{sIdx + 1}. </Text>
                                    {step}
                                  </Text>
                                ))
                              ) : (
                                <Text className="text-text-dim text-xs leading-5">
                                  {technique ||
                                    `${exercise.name} drives progressive tension through the ${exercise.targetMuscle}. Keep scapulae braced and control eccentric descent.`}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </GlassCard>
                  );
                })}
              </View>
            </View>

            {/* BOTTOM SESSION FINISH & RE-FORGE ACTIONS */}
            <View className="mt-3 gap-3">
              <GlowButton
                title={savingLogs ? 'SAVING SESSION...' : 'FINISH & SAVE SESSION TO SUPABASE'}
                variant="amber"
                size="lg"
                icon={<BookmarkCheck size={18} color="#090A0F" />}
                onPress={handleSaveSessionLogs}
                disabled={savingLogs}
              />

              <GlowButton
                title="RE-FORGE PROTOCOL"
                variant="outline"
                size="md"
                icon={<RefreshCw size={16} color="#DC2626" />}
                onPress={handleForgeRoutine}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
