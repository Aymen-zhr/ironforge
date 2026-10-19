import React, { useState, useEffect, useMemo } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { UserProfile } from '../../services/userMetrics';
import {
  getExerciseHistories,
  recordSetCompletion,
  saveWorkoutSession,
  ExerciseRecord,
} from '../../services/workoutHistoryService';
import {
  scheduleRestIntervalNotification,
  cancelRestIntervalNotification,
} from '../../services/notificationService';
import { playRestTimerCompletedAlert } from '../../services/restAudioAlert';
import { useIronforgeStore, ironforgeState } from '../../services/useIronforgeStore';
import IronforgeLogbookModal from '../../components/IronforgeLogbookModal';
import PlateCalculatorModal from '../../components/PlateCalculatorModal';
import {
  PRESET_PROGRAMS,
  SplitRoutine,
  calculateProgressiveOverload,
  OverloadRecommendation,
  getCustomRoutines,
  saveCustomRoutine,
  deleteCustomRoutine,
  CustomRoutine,
  CustomExerciseItem,
  createExerciseItemFromCatalog,
  calculateOneRepMaxTelemetry,
} from '../../features/workout';
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog';
import { BodyHeatmap } from '../../components/BodyHeatmap';
import {
  Slug,
  SLUG_DISPLAY_NAMES,
  filterExercisesByMuscleSlug,
  ExerciseVolumeItem,
} from '../../utils/muscleMapping';
import { expoDb } from '../../db';
import { mmkvStorage } from '../../lib/mmkv';

export interface SetRowData {
  tag: 'W' | '1' | '2' | '3' | '4' | '5' | 'D';
  weight: string;
  reps: string;
  rpe?: number;
  isCompleted: boolean;
  isPr?: boolean;
  est1Rm?: number;
}

interface UnifiedExercise {
  id: string;
  name: string;
  targetMuscle: string;
  equipment: string;
  mechanic: 'Compound' | 'Isolation';
  prescription: string;
  mediaUrl: string;
  minReps?: number;
  maxReps?: number;
}

interface ExerciseCardProps {
  exercise: UnifiedExercise;
  historyRecord: ExerciseRecord | null;
  sets: SetRowData[];
  unitLabel?: string;
  onToggleSet: (setIdx: number) => void;
  onUpdateField: (setIdx: number, field: 'weight' | 'reps', val: string) => void;
  onAdjustField: (setIdx: number, field: 'weight' | 'reps', delta: number) => void;
  onFillGhost: (setIdx: number, ghostWeight: number, ghostReps: number) => void;
  onToggleRpe: (setIdx: number) => void;
  onToggleTag: (setIdx: number) => void;
  onAddSet: () => void;
  onOpenMediaModal: () => void;
  onOpenPlateCalc: (weight: number) => void;
}

function HevyExerciseCard({
  exercise,
  historyRecord,
  sets,
  unitLabel = 'KG',
  onToggleSet,
  onUpdateField,
  onAdjustField,
  onFillGhost,
  onToggleRpe,
  onToggleTag,
  onAddSet,
  onOpenMediaModal,
  onOpenPlateCalc,
}: ExerciseCardProps) {
  const best1Rm = historyRecord?.bestEstimated1Rm || 0;
  const isFullyCompleted = sets.length > 0 && sets.every((s) => s.isCompleted);
  const primaryUri = exercise.mediaUrl;

  // Progressive Overload Math Evaluation
  const overloadTelemetry: OverloadRecommendation = useMemo(() => {
    const minR = exercise.minReps || 8;
    const maxR = exercise.maxReps || 10;
    const recent = historyRecord?.lastSets?.map((s) => ({
      date: historyRecord.lastPerformedDate || new Date().toISOString(),
      weightKg: s.weightKg,
      reps: s.reps,
      setsCompleted: 1,
      hitTopRepRange: s.reps >= maxR,
    })) || [];

    return calculateProgressiveOverload({
      exerciseId: exercise.id,
      mechanic: exercise.mechanic,
      targetMuscle: exercise.targetMuscle,
      minReps: minR,
      maxReps: maxR,
      recentSessions: recent,
    });
  }, [exercise, historyRecord]);

  // Active 1RM Telemetry based on best set entered
  const latestCompletedSet = sets.filter((s) => s.isCompleted).slice(-1)[0] || sets[0];
  const activeW = parseFloat(latestCompletedSet?.weight) || 0;
  const activeR = parseInt(latestCompletedSet?.reps, 10) || 0;
  const set1Rm = useMemo(() => {
    if (activeW > 0 && activeR > 0) {
      return calculateOneRepMaxTelemetry(activeW, activeR);
    }
    return null;
  }, [activeW, activeR]);

  return (
    <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 shadow-xl">
      {/* Exercise Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={onOpenMediaModal}
          className="flex-row items-center gap-3.5 flex-1 pr-2 active:opacity-80"
        >
          {/* Technique Thumbnail with Play Icon */}
          <View className="w-13 h-13 rounded-2xl overflow-hidden bg-black border border-white/10 relative items-center justify-center">
            <ExpoImage
              source={{ uri: primaryUri }}
              style={{ width: 52, height: 52 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View className="absolute inset-0 bg-black/35 items-center justify-center">
              <Ionicons name="play-circle" size={22} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-base font-bold tracking-tight" numberOfLines={1}>
                {exercise.name}
              </Text>
              {isFullyCompleted && (
                <Ionicons name="checkmark-circle" size={17} color="#10B981" />
              )}
            </View>
            <Text className="text-[#71717A] text-xs font-medium mt-0.5">
              {exercise.targetMuscle} • {exercise.mechanic}
            </Text>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => {
              const activeSet = sets.find((s) => !s.isCompleted && s.weight) || sets[0];
              const targetW = parseFloat(activeSet?.weight) || (exercise.mechanic === 'Compound' ? 60 : 20);
              onOpenPlateCalc(targetW);
            }}
            className="flex-row items-center gap-1 py-1.5 px-3 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 active:opacity-70"
          >
            <Ionicons name="disc-outline" size={13} color="#FF5A1F" />
            <Text className="text-[#FF5A1F] text-[10px] font-mono font-bold">Plates</Text>
          </Pressable>

          {best1Rm > 0 && (
            <View className="py-1.5 px-2.5 rounded-full bg-white/[0.06] border border-white/10">
              <Text className="text-white text-[10px] font-mono font-bold">
                PR {best1Rm}k
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progressive Overload Telemetry Badge */}
      <Pressable
        onPress={() => {
          Alert.alert(
            'Progressive Overload Telemetry',
            `${overloadTelemetry.reason}\n\nStandard Rule: Add 2.5kg when hitting the top rep range for 2 consecutive sessions.`
          );
        }}
        className="py-1.5 px-3 rounded-xl bg-black/40 border border-white/[0.06] mb-3 flex-row items-center justify-between active:opacity-80"
      >
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: overloadTelemetry.badgeColor }}
          />
          <Text
            className="text-[10px] font-mono font-bold uppercase"
            style={{ color: overloadTelemetry.badgeColor }}
          >
            {overloadTelemetry.badgeLabel}
          </Text>
          <Text className="text-[#71717A] text-[10px] font-mono" numberOfLines={1}>
            • {overloadTelemetry.reason}
          </Text>
        </View>
        <Ionicons name="information-circle-outline" size={13} color="#71717A" />
      </Pressable>

      {/* 1RM Dual Formulation Strip (Epley & Brzycki) */}
      {set1Rm && (
        <View className="py-1 px-3 rounded-lg bg-white/[0.03] border border-white/[0.04] mb-3 flex-row items-center justify-between">
          <Text className="text-[#71717A] text-[10px] font-mono">
            EST. 1RM TELEMETRY:
          </Text>
          <Text className="text-white text-[10px] font-mono font-bold">
            Epley: <Text className="text-[#10E760]">{set1Rm.epley}k</Text> • Brzycki: <Text className="text-[#00D2FF]">{set1Rm.brzycki}k</Text> • Avg: {set1Rm.average}k
          </Text>
        </View>
      )}

      {/* Structured Set Column Headers */}
      <View className="flex-row items-center justify-between px-2 pb-1.5 mb-1 border-b border-white/[0.04]">
        <Text className="w-8 text-center text-[#71717A] text-[10px] font-mono font-bold uppercase">SET</Text>
        <Text className="w-20 text-center text-[#71717A] text-[10px] font-mono font-bold uppercase">PREVIOUS</Text>
        <Text className="w-16 text-center text-[#71717A] text-[10px] font-mono font-bold uppercase">{unitLabel}</Text>
        <Text className="w-14 text-center text-[#71717A] text-[10px] font-mono font-bold uppercase">REPS</Text>
        <View className="w-9 items-center">
          <Ionicons name="checkmark-outline" size={13} color="#71717A" />
        </View>
      </View>

      {/* Interactive Sets Table */}
      <View className="gap-2">
        {sets.map((set, sIdx) => {
          const isDone = set.isCompleted;
          const prevSet = historyRecord?.lastSets?.[sIdx];
          const ghostWeight = prevSet?.weightKg ?? (exercise.mechanic === 'Compound' ? 60 : 14);
          const ghostReps = prevSet?.reps ?? 10;

          return (
            <View
              key={sIdx}
              className={`flex-row items-center justify-between p-2 rounded-2xl border transition-colors ${
                isDone
                  ? 'bg-[#10B981]/10 border-[#10B981]/30'
                  : 'bg-[#181922] border-white/[0.03]'
              }`}
            >
              {/* Set Tag Button */}
              <Pressable
                onPress={() => onToggleTag(sIdx)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] items-center justify-center border border-white/[0.06] active:opacity-75"
              >
                <Text className="text-white font-mono text-xs font-bold">
                  {set.tag}
                </Text>
              </Pressable>

              {/* Ghost Fill Button */}
              <Pressable
                onPress={() => onFillGhost(sIdx, ghostWeight, ghostReps)}
                className="w-20 py-1.5 px-1 rounded-xl bg-white/[0.03] border border-white/[0.04] items-center justify-center active:opacity-60"
              >
                <Text className="text-[#A1A1AA] text-[11px] font-mono font-medium" numberOfLines={1}>
                  {ghostWeight}k × {ghostReps}
                </Text>
              </Pressable>

              {/* Weight Input */}
              <View className="w-16 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center">
                <TextInput
                  value={set.weight}
                  onChangeText={(val) => onUpdateField(sIdx, 'weight', val)}
                  placeholder={`${ghostWeight}`}
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={5}
                  className="w-full text-white font-mono text-sm font-bold text-center p-0 m-0"
                />
              </View>

              {/* Reps Input */}
              <View className="w-14 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center">
                <TextInput
                  value={set.reps}
                  onChangeText={(val) => onUpdateField(sIdx, 'reps', val)}
                  placeholder={`${ghostReps}`}
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={3}
                  className="w-full text-white font-mono text-sm font-bold text-center p-0 m-0"
                />
              </View>

              {/* Checkmark */}
              <Pressable
                onPress={() => onToggleSet(sIdx)}
                className={`w-9 h-9 rounded-full items-center justify-center border active:scale-95 shadow-sm ${
                  isDone
                    ? 'bg-[#10B981] border-[#10B981]'
                    : 'bg-black/40 border-white/15'
                }`}
              >
                <Ionicons
                  name="checkmark-sharp"
                  size={16}
                  color={isDone ? '#000000' : '#71717A'}
                />
              </Pressable>
            </View>
          );
        })}

        {/* Add Set Button */}
        <Pressable
          onPress={onAddSet}
          className="mt-1 py-3 rounded-2xl bg-[#181922] border border-dashed border-white/10 items-center justify-center active:opacity-75"
        >
          <Text className="text-[#71717A] text-xs font-mono font-bold uppercase tracking-wider">
            + Add Set
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HypertrophyEngineScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const ironforge = useIronforgeStore();

  // Mode: 'presets' | 'custom'
  const [viewCategory, setViewCategory] = useState<'presets' | 'custom'>('presets');
  const [activeRoutineId, setActiveRoutineId] = useState<string>('ppl-push');

  // Custom Routines
  const [customRoutinesList, setCustomRoutinesList] = useState<CustomRoutine[]>([]);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [newRoutineName, setNewRoutineName] = useState<string>('');
  const [newRoutineDesc, setNewRoutineDesc] = useState<string>('');
  const [newRoutineExercises, setNewRoutineExercises] = useState<CustomExerciseItem[]>([]);
  const [catalogSearchQ, setCatalogSearchQ] = useState<string>('');
  const [showCatalogSheet, setShowCatalogSheet] = useState<boolean>(false);

  // Anatomical Heatmap & Muscle Filter States
  const [showWorkoutHeatmap, setShowWorkoutHeatmap] = useState<boolean>(true);
  const [workoutMuscleFilter, setWorkoutMuscleFilter] = useState<Slug | null>(null);
  const [showCatalogHeatmap, setShowCatalogHeatmap] = useState<boolean>(true);
  const [catalogMuscleFilter, setCatalogMuscleFilter] = useState<Slug | null>(null);

  // Exercise performance histories
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseRecord>>({});

  // Sets state map: exerciseId -> SetRowData[]
  const [setsData, setSetsData] = useState<Record<string, SetRowData[]>>({});

  // Media Lightbox Modal state
  const [activeMediaExercise, setActiveMediaExercise] = useState<UnifiedExercise | null>(null);

  // Modals & Timers
  const [sessionStartTime] = useState<number>(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [showLogbookModal, setShowLogbookModal] = useState<boolean>(false);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);

  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [targetRest, setTargetRest] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Live session timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load custom routines & histories on focus
  const loadWorkspaceData = React.useCallback(async () => {
    try {
      const profileRaw = await AsyncStorage.getItem('@ironforge_user_profile');
      if (profileRaw) setProfile(JSON.parse(profileRaw));

      const histories = await getExerciseHistories();
      setExerciseHistories(histories);

      const customs = await getCustomRoutines();
      setCustomRoutinesList(customs);

      // Restore active workout set state from MMKV
      const activeSetsRaw = mmkvStorage.getItem(`@ironforge_active_sets_${activeRoutineId}`);
      if (activeSetsRaw) {
        try {
          const parsed = JSON.parse(activeSetsRaw);
          if (parsed && typeof parsed === 'object') {
            setSetsData((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('[workout] Error loading data:', err);
    }
  }, [activeRoutineId]);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkspaceData();
    }, [loadWorkspaceData])
  );

  // Sync active sets state to MMKV
  useEffect(() => {
    if (Object.keys(setsData).length > 0) {
      mmkvStorage.setItem(
        `@ironforge_active_sets_${activeRoutineId}`,
        JSON.stringify(setsData)
      );
    }
  }, [setsData, activeRoutineId]);

  // Rest timer countdown with audio alert & haptic alert
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && restSecondsLeft !== null && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            // Play zero-latency audio chime & trigger dual haptics
            playRestTimerCompletedAlert();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, restSecondsLeft]);

  // Unified available routines
  const allPresetRoutines: SplitRoutine[] = useMemo(() => {
    return PRESET_PROGRAMS.flatMap((p) => p.routines);
  }, []);

  const activeRoutine = useMemo(() => {
    if (viewCategory === 'custom') {
      const found = customRoutinesList.find((r) => r.id === activeRoutineId);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          subtitle: found.description,
          exercises: found.exercises.map((e) => ({
            id: e.id,
            name: e.name,
            targetMuscle: e.targetMuscle,
            equipment: e.equipment,
            mechanic: e.mechanic,
            prescription: `${e.sets} Sets × ${e.repString} • RPE ${e.targetRpe} • ${e.restSeconds}s Rest`,
            mediaUrl: e.mediaUrl,
            minReps: e.minReps,
            maxReps: e.maxReps,
          })),
        };
      }
    }
    const foundPreset = allPresetRoutines.find((r) => r.id === activeRoutineId) || allPresetRoutines[0];
    return {
      id: foundPreset.id,
      name: foundPreset.name,
      subtitle: foundPreset.subtitle,
      exercises: foundPreset.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        targetMuscle: e.targetMuscle,
        equipment: e.equipment,
        mechanic: e.mechanic,
        prescription: `${e.sets} Sets × ${e.repString} • RPE ${e.targetRpe} • ${e.restSeconds}s Rest`,
        mediaUrl: e.mediaUrl,
        minReps: e.minReps,
        maxReps: e.maxReps,
      })),
    };
  }, [viewCategory, activeRoutineId, customRoutinesList, allPresetRoutines]);

  // Initial sets generator for an exercise
  const getSetsForExercise = (exerciseId: string, ex: UnifiedExercise): SetRowData[] => {
    if (setsData[exerciseId]) return setsData[exerciseId];
    const prev = exerciseHistories[exerciseId];
    const defaultWeight = prev?.lastSets?.[0]?.weightKg ?? (ex.mechanic === 'Compound' ? 60 : 14);
    const defaultReps = prev?.lastSets?.[0]?.reps ?? (ex.mechanic === 'Compound' ? 8 : 12);

    return [
      { tag: '1', weight: String(defaultWeight), reps: String(defaultReps), isCompleted: false },
      { tag: '2', weight: String(defaultWeight), reps: String(defaultReps), isCompleted: false },
      { tag: '3', weight: String(defaultWeight), reps: String(defaultReps), isCompleted: false },
    ];
  };

  const handleUpdateField = (
    exerciseId: string,
    setIdx: number,
    field: 'weight' | 'reps',
    val: string
  ) => {
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      current[setIdx] = { ...current[setIdx], [field]: val };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleAdjustField = (
    exerciseId: string,
    setIdx: number,
    field: 'weight' | 'reps',
    delta: number
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      const currentVal = parseFloat(current[setIdx]?.[field] || '0') || 0;
      const nextVal = Math.max(0, currentVal + delta);
      current[setIdx] = {
        ...current[setIdx],
        [field]: field === 'weight' ? (nextVal % 1 === 0 ? String(nextVal) : nextVal.toFixed(1)) : String(Math.round(nextVal)),
      };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleFillGhost = (
    exerciseId: string,
    setIdx: number,
    ghostWeight: number,
    ghostReps: number
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      current[setIdx] = {
        ...current[setIdx],
        weight: String(ghostWeight),
        reps: String(ghostReps),
      };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleToggleRpe = (exerciseId: string, setIdx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      const curRpe = current[setIdx].rpe;
      const nextRpe = !curRpe ? 7.5 : curRpe === 7.5 ? 8 : curRpe === 8 ? 8.5 : curRpe === 8.5 ? 9 : curRpe === 9 ? 9.5 : curRpe === 9.5 ? 10 : undefined;
      current[setIdx] = { ...current[setIdx], rpe: nextRpe };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleToggleTag = (exerciseId: string, setIdx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      const curTag = current[setIdx].tag;
      const nextTag: SetRowData['tag'] = curTag === '1' || curTag === '2' || curTag === '3' ? 'W' : curTag === 'W' ? 'D' : '1';
      current[setIdx] = { ...current[setIdx], tag: nextTag };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleAddSet = (exerciseId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId]
        ? [...prev[exerciseId]]
        : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
      const last = current[current.length - 1];
      const nextSet: SetRowData = {
        tag: `${Math.min(5, current.length + 1)}` as any,
        weight: last?.weight || '60',
        reps: last?.reps || '10',
        isCompleted: false,
      };
      return { ...prev, [exerciseId]: [...current, nextSet] };
    });
  };

  const handleToggleSet = async (
    exerciseId: string,
    exerciseName: string,
    setIdx: number,
    targetMuscle: string
  ) => {
    const current = setsData[exerciseId]
      ? [...setsData[exerciseId]]
      : getSetsForExercise(exerciseId, activeRoutine.exercises[0]);
    const targetSet = current[setIdx];

    if (!ironforge.activeSession.isActive) {
      ironforgeState.startWorkoutSession(activeRoutine.name);
    }

    if (!targetSet.isCompleted) {
      const history = exerciseHistories[exerciseId];
      const prevSet = history?.lastSets?.[setIdx];
      const fallbackWeight = prevSet?.weightKg ?? 60;
      const fallbackReps = prevSet?.reps ?? 10;

      const numWeight = parseFloat(targetSet.weight) || fallbackWeight;
      const numReps = parseInt(targetSet.reps, 10) || fallbackReps;

      const result = await recordSetCompletion({
        exerciseId,
        exerciseName,
        targetMuscle,
        setNumber: setIdx + 1,
        weightKg: numWeight,
        reps: numReps,
      });

      current[setIdx] = {
        ...targetSet,
        weight: String(numWeight),
        reps: String(numReps),
        isCompleted: true,
        isPr: result.isPr,
        est1Rm: result.estimated1Rm,
      };

      setExerciseHistories((h) => ({
        ...h,
        [exerciseId]: {
          exerciseId,
          bestEstimated1Rm: Math.max(h[exerciseId]?.bestEstimated1Rm || 0, result.estimated1Rm),
          lastPerformedDate: new Date().toISOString(),
          lastSets: h[exerciseId]?.lastSets ? [...h[exerciseId].lastSets] : [],
        },
      }));

      ironforgeState.updateSessionProgress(numWeight * numReps, 1, result.isPr ? 1 : 0);

      // Record 1RM in big lifts
      const lowerName = exerciseName.toLowerCase();
      if (lowerName.includes('bench')) ironforgeState.record1Rm('benchPress', numWeight, numReps);
      else if (lowerName.includes('squat')) ironforgeState.record1Rm('squat', numWeight, numReps);
      else if (lowerName.includes('deadlift')) ironforgeState.record1Rm('deadlift', numWeight, numReps);
      else if (lowerName.includes('overhead') || lowerName.includes('military')) ironforgeState.record1Rm('overheadPress', numWeight, numReps);
      else if (lowerName.includes('row')) ironforgeState.record1Rm('barbellRow', numWeight, numReps);

      if (result.isPr) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } else {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }

      // Rest Timer trigger
      setTargetRest(90);
      setRestSecondsLeft(90);
      setIsTimerRunning(true);
      scheduleRestIntervalNotification(90, exerciseName).catch(() => {});
    } else {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      const w = parseFloat(targetSet.weight) || 0;
      const r = parseInt(targetSet.reps, 10) || 0;
      ironforgeState.updateSessionProgress(-(w * r), -1, targetSet.isPr ? -1 : 0);

      current[setIdx] = {
        ...targetSet,
        isCompleted: false,
        isPr: false,
      };
    }

    setSetsData((prev) => ({ ...prev, [exerciseId]: current }));
  };

  const handleFinishWorkout = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    let totalVol = 0;
    let completedCount = 0;
    let prCount = 0;

    Object.values(setsData).forEach((sets) => {
      sets.forEach((s) => {
        if (s.isCompleted) {
          completedCount++;
          totalVol += (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
          if (s.isPr) prCount++;
        }
      });
    });

    const durMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const workoutId = `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const endTime = new Date().toISOString();
    const startTimeIso = new Date(sessionStartTime).toISOString();

    // Atomic SQLite Transaction: Flush completed session and sets on-device
    try {
      expoDb.withTransactionSync(() => {
        const wStmt = expoDb.prepareSync(`
          INSERT INTO workouts (id, name, start_time, end_time, volume_load, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        try {
          wStmt.executeSync([
            workoutId,
            activeRoutine.name,
            startTimeIso,
            endTime,
            totalVol,
            activeRoutine.subtitle || null,
          ]);
        } finally {
          wStmt.finalizeSync();
        }

        const wsStmt = expoDb.prepareSync(`
          INSERT INTO workout_sets (
            id, workout_id, exercise_id, set_number, weight, reps, rpe, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        try {
          Object.entries(setsData).forEach(([exId, sets]) => {
            sets.forEach((s, idx) => {
              if (s.isCompleted) {
                wsStmt.executeSync([
                  `ws-${workoutId}-${exId}-${idx}`,
                  workoutId,
                  exId,
                  idx + 1,
                  parseFloat(s.weight) || 0,
                  parseInt(s.reps, 10) || 0,
                  s.rpe ?? null,
                  endTime,
                ]);
              }
            });
          });
        } finally {
          wsStmt.finalizeSync();
        }
      });
    } catch (dbErr) {
      console.warn('[workout] SQLite session flush error:', dbErr);
    }

    await saveWorkoutSession({
      id: workoutId,
      date: endTime.split('T')[0],
      splitName: activeRoutine.name,
      durationMinutes: durMins,
      totalVolumeKg: totalVol,
      totalSetsCompleted: completedCount,
      prsAchieved: prCount,
    });

    ironforgeState.finishWorkoutSession();
    mmkvStorage.removeItem(`@ironforge_active_sets_${activeRoutine.id}`);

    await cancelRestIntervalNotification();
    setShowFinishModal(false);
    setSetsData({});
    Alert.alert('Session Recorded', `Workout logged! Completed ${completedCount} sets with ${totalVol.toLocaleString()}kg total volume on-device.`);
  };

  // Custom Routine Management
  const handleSaveCustomRoutine = async () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Name Required', 'Enter a name for your custom routine.');
      return;
    }
    if (newRoutineExercises.length === 0) {
      Alert.alert('Exercises Required', 'Add at least one exercise from the catalog.');
      return;
    }

    const newRoutine: CustomRoutine = {
      id: `custom-routine-${Date.now()}`,
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || 'Custom athletic protocol',
      exercises: newRoutineExercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = await saveCustomRoutine(newRoutine);
    setCustomRoutinesList(updated);
    setActiveRoutineId(newRoutine.id);
    setViewCategory('custom');
    setShowCustomModal(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setNewRoutineExercises([]);
    Alert.alert('Routine Created', `Custom routine "${newRoutine.name}" saved!`);
  };

  const handleAddCatalogExercise = (catEx: any) => {
    const item = createExerciseItemFromCatalog(catEx);
    setNewRoutineExercises((prev) => [...prev, item]);
    setShowCatalogSheet(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleMoveExercise = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= newRoutineExercises.length) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const list = [...newRoutineExercises];
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    setNewRoutineExercises(list);
  };

  const handleRemoveCustomExercise = (idx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setNewRoutineExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  // Dynamic session volume load mapped for anatomical heatmap
  const activeRoutineVolumeExercises: ExerciseVolumeItem[] = useMemo(() => {
    return activeRoutine.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      targetMuscle: ex.targetMuscle,
      minReps: ex.minReps,
      maxReps: ex.maxReps,
      sets: (setsData[ex.id] || []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        isCompleted: s.isCompleted,
      })),
    }));
  }, [activeRoutine.exercises, setsData]);

  // Workout exercises optionally filtered by selected muscle slug
  const displayedWorkoutExercises = useMemo(() => {
    if (!workoutMuscleFilter) return activeRoutine.exercises;
    return filterExercisesByMuscleSlug(activeRoutine.exercises, workoutMuscleFilter);
  }, [activeRoutine.exercises, workoutMuscleFilter]);

  // Catalog exercises filtered by search query and anatomical muscle slug
  const catalogResults = useMemo(() => {
    let results = EXERCISE_CATALOG;
    if (catalogSearchQ.trim()) {
      const q = catalogSearchQ.trim().toLowerCase();
      results = results.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.primaryMuscle.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q)
      );
    }
    if (catalogMuscleFilter) {
      results = filterExercisesByMuscleSlug(results, catalogMuscleFilter);
    }
    return results.slice(0, 60);
  }, [catalogSearchQ, catalogMuscleFilter]);

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            TRAIN
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
            {formatTimer(elapsedSeconds)} • {activeRoutine.name.toUpperCase()}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowLogbookModal(true);
            }}
            className="w-10 h-10 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center active:opacity-75"
          >
            <Ionicons name="trophy-outline" size={16} color="#F8FAFC" />
          </Pressable>

          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              setShowFinishModal(true);
            }}
            className="py-2 px-4 rounded-full bg-[#FF5A1F] active:opacity-85 shadow-md"
          >
            <Text className="text-black text-xs font-bold uppercase tracking-wider">
              Finish
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Mode Switcher (Presets vs Custom) */}
      <View className="px-5 py-2 border-b border-white/[0.05] bg-[#0B0C10] flex-row items-center justify-between">
        <View className="flex-row rounded-xl bg-[#14151C] p-1 border border-white/[0.06] flex-1 mr-3">
          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setViewCategory('presets');
              setActiveRoutineId('ppl-push');
              setWorkoutMuscleFilter(null);
            }}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              viewCategory === 'presets' ? 'bg-[#FF5A1F]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase ${
                viewCategory === 'presets' ? 'text-black' : 'text-[#71717A]'
              }`}
            >
              Preset Splits
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setViewCategory('custom');
              setWorkoutMuscleFilter(null);
              if (customRoutinesList.length > 0) {
                setActiveRoutineId(customRoutinesList[0].id);
              }
            }}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              viewCategory === 'custom' ? 'bg-[#FF5A1F]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase ${
                viewCategory === 'custom' ? 'text-black' : 'text-[#71717A]'
              }`}
            >
              Custom ({customRoutinesList.length})
            </Text>
          </Pressable>
        </View>

        {viewCategory === 'custom' && (
          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowCustomModal(true);
            }}
            className="py-2 px-3 rounded-xl bg-white/[0.08] border border-white/10 flex-row items-center gap-1 active:opacity-75"
          >
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-mono">Build</Text>
          </Pressable>
        )}
      </View>

      {/* 3. Routine Selector ScrollView */}
      <View className="py-2 px-5 border-b border-white/[0.05] bg-[#0B0C10]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="flex-row"
        >
          {viewCategory === 'presets' ? (
            allPresetRoutines.map((routine) => {
              const isActive = routine.id === activeRoutineId;
              return (
                <Pressable
                  key={routine.id}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setActiveRoutineId(routine.id);
                    setWorkoutMuscleFilter(null);
                  }}
                  className={`py-1.5 px-3.5 rounded-full border active:opacity-80 ${
                    isActive
                      ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                      : 'bg-[#14151C] border-white/[0.05]'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold tracking-wide ${
                      isActive ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    {routine.name}
                  </Text>
                </Pressable>
              );
            })
          ) : customRoutinesList.length === 0 ? (
            <View className="py-1">
              <Text className="text-[#71717A] text-xs font-mono">
                No custom routines built yet. Tap &ldquo;Build&rdquo; to create one.
              </Text>
            </View>
          ) : (
            customRoutinesList.map((routine) => {
              const isActive = routine.id === activeRoutineId;
              return (
                <Pressable
                  key={routine.id}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setActiveRoutineId(routine.id);
                    setWorkoutMuscleFilter(null);
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      'Delete Routine',
                      `Are you sure you want to delete "${routine.name}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteCustomRoutine(routine.id);
                            const updated = await getCustomRoutines();
                            setCustomRoutinesList(updated);
                            if (activeRoutineId === routine.id && updated.length > 0) {
                              setActiveRoutineId(updated[0].id);
                            }
                          },
                        },
                      ]
                    );
                  }}
                  className={`py-1.5 px-3.5 rounded-full border active:opacity-80 ${
                    isActive
                      ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                      : 'bg-[#14151C] border-white/[0.05]'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold tracking-wide ${
                      isActive ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    {routine.name}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* 4. Floating Rest Timer Bar (if active) */}
      {restSecondsLeft !== null && restSecondsLeft > 0 && (
        <View className="mx-5 mt-3 py-2.5 px-4 rounded-full bg-[#12131A] border border-[#FF5A1F]/30 flex-row items-center justify-between shadow-xl">
          <View className="flex-row items-center gap-2">
            <Ionicons name="timer-outline" size={16} color="#FF5A1F" />
            <Text className="text-[#FF5A1F] text-xs font-mono font-bold">
              REST: {formatTimer(restSecondsLeft)} ({targetRest}s)
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setRestSecondsLeft((s) => (s ? s + 30 : 30))}
              className="py-1 px-3 rounded-full bg-[#181922] border border-white/[0.06] active:opacity-75"
            >
              <Text className="text-white text-[11px] font-mono">+30s</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRestSecondsLeft(null);
                setIsTimerRunning(false);
              }}
              className="py-1 px-3 rounded-full bg-[#181922] border border-white/[0.06] active:opacity-75"
            >
              <Text className="text-[#71717A] text-[11px] font-mono">Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 5. Exercise Set Logger List with Anatomical Heatmap */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        className="flex-1"
      >
        {/* Heatmap Toggle & Activation Bar */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="body-outline" size={15} color="#4ADE80" />
            <Text className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              Muscle Activation
            </Text>
            {workoutMuscleFilter && (
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#15803D]/30 border border-[#22C55E]/40">
                <Text className="text-[#4ADE80] text-[10px] font-mono font-bold">
                  {SLUG_DISPLAY_NAMES[workoutMuscleFilter]}
                </Text>
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setWorkoutMuscleFilter(null);
                  }}
                  className="ml-0.5"
                >
                  <Ionicons name="close" size={12} color="#4ADE80" />
                </Pressable>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowWorkoutHeatmap((prev) => !prev);
            }}
            className="flex-row items-center gap-1 py-1 px-2.5 rounded-lg bg-[#14151C] border border-white/[0.06] active:opacity-75"
          >
            <Ionicons
              name={showWorkoutHeatmap ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#A1A1AA"
            />
            <Text className="text-[#A1A1AA] text-[10px] font-mono">
              {showWorkoutHeatmap ? 'Hide Map' : 'Show Map'}
            </Text>
          </Pressable>
        </View>

        {/* Anatomical Volume Heatmap */}
        {showWorkoutHeatmap && (
          <View className="mb-5">
            <BodyHeatmap
              exercises={activeRoutineVolumeExercises}
              colorTheme="green"
              selectedMuscle={workoutMuscleFilter}
              onMusclePress={(slug) => {
                setWorkoutMuscleFilter((prev) => (prev === slug ? null : slug));
              }}
              title="SESSION VOLUME LOAD"
              subtitle={
                workoutMuscleFilter
                  ? `Filtering routine: ${SLUG_DISPLAY_NAMES[workoutMuscleFilter]} (${displayedWorkoutExercises.length} exercises)`
                  : 'Tap any muscle to isolate exercises'
              }
              scale={0.84}
            />
          </View>
        )}

        {/* Filtered Empty State Fallback */}
        {displayedWorkoutExercises.length === 0 && workoutMuscleFilter && (
          <View className="p-6 rounded-3xl bg-[#12131A] border border-white/[0.06] items-center my-4">
            <Ionicons name="fitness-outline" size={32} color="#71717A" />
            <Text className="text-white text-sm font-bold mt-2">
              No Routine Exercises for {SLUG_DISPLAY_NAMES[workoutMuscleFilter]}
            </Text>
            <Text className="text-[#71717A] text-xs font-mono text-center mt-1 mb-4">
              The selected routine has no exercises targeting this muscle group.
            </Text>
            <Pressable
              onPress={() => setWorkoutMuscleFilter(null)}
              className="py-2.5 px-4 rounded-xl bg-[#22C55E] active:opacity-85 shadow-md"
            >
              <Text className="text-black text-xs font-bold uppercase tracking-wider font-mono">
                Show All Routine Exercises
              </Text>
            </Pressable>
          </View>
        )}

        {displayedWorkoutExercises.map((exercise) => {
          const sets = setsData[exercise.id] || getSetsForExercise(exercise.id, exercise);
          const history = exerciseHistories[exercise.id] || null;

          return (
            <HevyExerciseCard
              key={exercise.id}
              exercise={exercise}
              historyRecord={history}
              sets={sets}
              unitLabel={profile?.unitSystem === 'imperial' ? 'LBS' : 'KG'}
              onToggleSet={(sIdx) =>
                handleToggleSet(exercise.id, exercise.name, sIdx, exercise.targetMuscle)
              }
              onUpdateField={(sIdx, field, val) =>
                handleUpdateField(exercise.id, sIdx, field, val)
              }
              onAdjustField={(sIdx, field, delta) =>
                handleAdjustField(exercise.id, sIdx, field, delta)
              }
              onFillGhost={(sIdx, ghostW, ghostR) =>
                handleFillGhost(exercise.id, sIdx, ghostW, ghostR)
              }
              onToggleRpe={(sIdx) => handleToggleRpe(exercise.id, sIdx)}
              onToggleTag={(sIdx) => handleToggleTag(exercise.id, sIdx)}
              onAddSet={() => handleAddSet(exercise.id)}
              onOpenMediaModal={() => setActiveMediaExercise(exercise)}
              onOpenPlateCalc={(targetW) => setPlateCalcTargetWeight(targetW)}
            />
          );
        })}
      </ScrollView>

      {/* Finish Session Confirmation Modal */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/10 p-6 gap-4">
            <Text className="text-white text-lg font-bold">Complete Workout</Text>
            <Text className="text-[#71717A] text-xs font-mono leading-5">
              Confirm recording session duration of {Math.floor(elapsedSeconds / 60)} minutes and update exercise progressive overload records.
            </Text>
            <View className="flex-row gap-2 mt-2">
              <Pressable
                onPress={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.08] items-center justify-center active:opacity-75"
              >
                <Text className="text-white text-xs font-bold uppercase">Resume</Text>
              </Pressable>
              <Pressable
                onPress={handleFinishWorkout}
                className="flex-1 py-3 rounded-xl bg-[#FF5A1F] items-center justify-center active:opacity-85"
              >
                <Text className="text-black text-xs font-bold uppercase">Log Session</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Routine Builder Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <SafeAreaView className="flex-1 bg-[#08090C] p-6">
          <View className="flex-row items-center justify-between pb-4 border-b border-white/[0.08]">
            <Text className="text-white text-base font-bold uppercase tracking-wider">
              Build Custom Routine
            </Text>
            <Pressable
              onPress={() => setShowCustomModal(false)}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
            {/* Title & Desc */}
            <View className="mb-4">
              <Text className="text-[#71717A] text-xs font-mono uppercase mb-1">
                Routine Name
              </Text>
              <TextInput
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                placeholder="e.g. Quad Destruction & Calves"
                placeholderTextColor="#52525B"
                className="h-11 px-3.5 rounded-xl bg-[#12131A] border border-white/10 text-white font-mono text-sm"
              />
            </View>

            <View className="mb-4">
              <Text className="text-[#71717A] text-xs font-mono uppercase mb-1">
                Description (Optional)
              </Text>
              <TextInput
                value={newRoutineDesc}
                onChangeText={setNewRoutineDesc}
                placeholder="e.g. Focus on deep eccentric knee flexion"
                placeholderTextColor="#52525B"
                className="h-11 px-3.5 rounded-xl bg-[#12131A] border border-white/10 text-white font-mono text-xs"
              />
            </View>

            {/* Added Exercises List with Reordering */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Exercises ({newRoutineExercises.length})
                </Text>
                <Pressable
                  onPress={() => setShowCatalogSheet(true)}
                  className="py-1 px-3 rounded-lg bg-[#FF5A1F] flex-row items-center gap-1 active:opacity-80"
                >
                  <Ionicons name="add" size={13} color="#000000" />
                  <Text className="text-black text-xs font-bold font-mono">Add Exercise</Text>
                </Pressable>
              </View>

              {newRoutineExercises.length === 0 ? (
                <View className="p-6 rounded-2xl bg-[#12131A] border border-dashed border-white/10 items-center">
                  <Text className="text-[#71717A] text-xs font-mono text-center">
                    No exercises added yet. Tap &ldquo;Add Exercise&rdquo; to select from the 876-exercise catalog.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {newRoutineExercises.map((ex, idx) => (
                    <View
                      key={ex.id}
                      className="p-3 rounded-2xl bg-[#12131A] border border-white/[0.05] flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-white text-xs font-bold">{idx + 1}. {ex.name}</Text>
                        <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                          {ex.targetMuscle} • {ex.mechanic} • {ex.sets} sets ({ex.repString})
                        </Text>
                      </View>

                      {/* Reorder and Delete Controls */}
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={() => handleMoveExercise(idx, -1)}
                          disabled={idx === 0}
                          className={`w-7 h-7 rounded-lg items-center justify-center ${
                            idx === 0 ? 'opacity-30' : 'bg-white/10'
                          }`}
                        >
                          <Ionicons name="arrow-up" size={13} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleMoveExercise(idx, 1)}
                          disabled={idx === newRoutineExercises.length - 1}
                          className={`w-7 h-7 rounded-lg items-center justify-center ${
                            idx === newRoutineExercises.length - 1 ? 'opacity-30' : 'bg-white/10'
                          }`}
                        >
                          <Ionicons name="arrow-down" size={13} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRemoveCustomExercise(idx)}
                          className="w-7 h-7 rounded-lg bg-red-500/20 items-center justify-center ml-1"
                        >
                          <Ionicons name="trash-outline" size={13} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="pt-3 border-t border-white/[0.08]">
            <Pressable
              onPress={handleSaveCustomRoutine}
              className="w-full py-4 rounded-2xl bg-[#FF5A1F] items-center justify-center active:opacity-85 shadow-lg"
            >
              <Text className="text-black text-xs font-bold uppercase tracking-wider">
                Save Custom Routine
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Catalog Search Picker Modal */}
      <Modal
        visible={showCatalogSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCatalogSheet(false)}
      >
        <SafeAreaView className="flex-1 bg-[#08090C] p-6">
          <View className="flex-row items-center justify-between pb-3 border-b border-white/[0.08]">
            <Text className="text-white text-base font-bold uppercase tracking-wider">
              Free Exercise DB Library
            </Text>
            <Pressable
              onPress={() => setShowCatalogSheet(false)}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="my-3 h-11 px-3.5 rounded-xl bg-[#12131A] border border-white/10 flex-row items-center gap-2">
            <Ionicons name="search" size={16} color="#71717A" />
            <TextInput
              value={catalogSearchQ}
              onChangeText={setCatalogSearchQ}
              placeholder="Search 876 exercises by name, muscle, equipment..."
              placeholderTextColor="#52525B"
              className="flex-1 text-white font-mono text-xs"
            />
          </View>

          {/* Anatomical Muscle Filter Bar */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Ionicons name="filter-outline" size={14} color="#F59E0B" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                Anatomical Filter
              </Text>
              {catalogMuscleFilter && (
                <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#78350F]/40 border border-[#F59E0B]/50">
                  <Text className="text-[#F59E0B] text-[10px] font-mono font-bold">
                    {SLUG_DISPLAY_NAMES[catalogMuscleFilter]}
                  </Text>
                  <Pressable
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setCatalogMuscleFilter(null);
                    }}
                    className="ml-0.5"
                  >
                    <Ionicons name="close" size={12} color="#F59E0B" />
                  </Pressable>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              {catalogMuscleFilter && (
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setCatalogMuscleFilter(null);
                  }}
                  className="py-1 px-2 rounded-lg bg-white/[0.08] active:opacity-75"
                >
                  <Text className="text-[#A1A1AA] text-[10px] font-mono">Clear</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setShowCatalogHeatmap((prev) => !prev);
                }}
                className="flex-row items-center gap-1 py-1 px-2.5 rounded-lg bg-[#14151C] border border-white/[0.06] active:opacity-75"
              >
                <Ionicons
                  name={showCatalogHeatmap ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#A1A1AA"
                />
                <Text className="text-[#A1A1AA] text-[10px] font-mono">
                  {showCatalogHeatmap ? 'Hide Map' : 'Show Map'}
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Amber Anatomical Heatmap for Catalog Muscle Selection */}
            {showCatalogHeatmap && (
              <View className="mb-4">
                <BodyHeatmap
                  colorTheme="amber"
                  selectedMuscle={catalogMuscleFilter}
                  onMusclePress={(slug) => {
                    setCatalogMuscleFilter((prev) => (prev === slug ? null : slug));
                  }}
                  title="SELECT TARGET MUSCLE"
                  subtitle={
                    catalogMuscleFilter
                      ? `Filtered: ${SLUG_DISPLAY_NAMES[catalogMuscleFilter]} (${catalogResults.length} exercises)`
                      : 'Tap any muscle group on the anatomy model to filter'
                  }
                  scale={0.75}
                  showLegend={false}
                />
              </View>
            )}

            {/* Catalog Results List */}
            {catalogResults.length === 0 ? (
              <View className="p-6 rounded-2xl bg-[#12131A] border border-white/10 items-center my-2">
                <Ionicons name="search-outline" size={28} color="#71717A" />
                <Text className="text-white text-xs font-bold mt-2">No exercises found</Text>
                <Text className="text-[#71717A] text-[11px] font-mono text-center mt-1 mb-3">
                  Try adjusting your search terms or clearing the muscle filter.
                </Text>
                {(catalogMuscleFilter || catalogSearchQ) && (
                  <Pressable
                    onPress={() => {
                      setCatalogMuscleFilter(null);
                      setCatalogSearchQ('');
                    }}
                    className="py-2 px-4 rounded-xl bg-[#F59E0B] active:opacity-85"
                  >
                    <Text className="text-black text-xs font-bold font-mono uppercase">
                      Reset Filters
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View className="gap-2 pb-10">
                <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider mb-1">
                  Results ({catalogResults.length})
                </Text>
                {catalogResults.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => handleAddCatalogExercise(ex)}
                    className="p-3.5 rounded-2xl bg-[#12131A] border border-white/[0.04] flex-row items-center justify-between active:opacity-75"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-white text-xs font-bold">{ex.name}</Text>
                      <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                        {ex.primaryMuscle} • {ex.equipment} • {ex.mechanic}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={20} color="#FF5A1F" />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Plate Calculator Modal */}
      {plateCalcTargetWeight !== null && (
        <PlateCalculatorModal
          visible={plateCalcTargetWeight !== null}
          onClose={() => setPlateCalcTargetWeight(null)}
          targetWeightKg={plateCalcTargetWeight}
          barWeightKg={20}
        />
      )}

      {/* Logbook History Modal */}
      <IronforgeLogbookModal
        visible={showLogbookModal}
        onClose={() => setShowLogbookModal(false)}
      />

      {/* Technique Media Lightbox Modal */}
      <Modal
        visible={activeMediaExercise !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMediaExercise(null)}
      >
        <View className="flex-1 bg-black/85 items-center justify-center p-6">
          <View className="w-full bg-[#12131A] border border-white/10 rounded-3xl p-5 max-w-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-bold font-mono flex-1 mr-2" numberOfLines={1}>
                {activeMediaExercise?.name}
              </Text>
              <Pressable
                onPress={() => setActiveMediaExercise(null)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {activeMediaExercise?.mediaUrl ? (
              <View className="w-full h-56 rounded-2xl overflow-hidden bg-black mb-4 items-center justify-center border border-white/10">
                <ExpoImage
                  source={{ uri: activeMediaExercise.mediaUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
            ) : null}

            <Text className="text-[#A1A1AA] text-xs font-mono mb-2">
              Target: <Text className="text-white font-bold">{activeMediaExercise?.targetMuscle}</Text> • <Text className="text-white font-bold">{activeMediaExercise?.mechanic}</Text>
            </Text>
            <Text className="text-[#71717A] text-xs leading-5">
              Prescription: {activeMediaExercise?.prescription}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
