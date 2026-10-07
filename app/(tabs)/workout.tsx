import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { UserProfile } from '../../services/userMetrics';
import {
  calculateEstimated1Rm,
  getExerciseHistories,
  recordSetCompletion,
  saveWorkoutSession,
  ExerciseRecord,
} from '../../services/workoutHistoryService';
import {
  scheduleRestIntervalNotification,
  cancelRestIntervalNotification,
} from '../../services/notificationService';
import { useAegisStore, aegisState } from '../../services/useAegisStore';
import AegisLogbookModal from '../../components/AegisLogbookModal';
import PlateCalculatorModal from '../../components/PlateCalculatorModal';
import {
  MUSCLE_ROUTINES,
  RoutineTab,
  ExerciseDef,
} from '../../data/muscleRoutines';

export interface SetRowData {
  tag: 'W' | '1' | '2' | '3' | '4' | '5' | 'D';
  weight: string;
  reps: string;
  rpe?: number;
  isCompleted: boolean;
  isPr?: boolean;
  est1Rm?: number;
}

interface ExerciseCardProps {
  exercise: ExerciseDef;
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

  return (
    <View className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 mb-5 shadow-xl">
      {/* Exercise Header */}
      <View className="flex-row items-center justify-between mb-4">
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

        <View className="flex-row items-center gap-2">
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
            <View className="py-1.5 px-3 rounded-full bg-white/[0.06] border border-white/10">
              <Text className="text-white text-[10px] font-mono font-bold">
                PR {best1Rm} {unitLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Prescription Target Bar */}
      <View className="py-2 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.04] mb-3.5 flex-row items-center justify-between">
        <Text numberOfLines={1} className="flex-1 text-[#A1A1AA] text-[11px] font-mono font-medium mr-2">
          {exercise.prescription}
        </Text>
        <Text className="text-[#FF5A1F] text-xs font-mono font-bold shrink-0">
          {sets.filter((s) => s.isCompleted).length}/{sets.length} DONE
        </Text>
      </View>

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

      {/* Athleisure Set Rows */}
      <View className="gap-2">
        {sets.map((set, sIdx) => {
          const prevSet = historyRecord?.lastSets?.[sIdx];
          const ghostWeight = prevSet?.weightKg ?? (exercise.mechanic === 'Compound' ? 60 : 14);
          const ghostReps = prevSet?.reps ?? (exercise.mechanic === 'Compound' ? 8 : 12);
          const isDone = set.isCompleted;

          return (
            <View
              key={sIdx}
              className={`py-2 px-2.5 rounded-2xl border flex-row items-center justify-between transition-all ${
                isDone
                  ? 'bg-[#10B981]/[0.08] border-[#10B981]/30'
                  : 'bg-[#181922] border-white/[0.04]'
              }`}
            >
              {/* Set Tag / Stepper (w-8) */}
              <Pressable
                onPress={() => onToggleTag(sIdx)}
                className="w-8 h-8 rounded-xl bg-black/40 border border-white/[0.06] items-center justify-center active:opacity-75"
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    set.tag === 'W'
                      ? 'text-[#FF5A1F]'
                      : set.tag === 'D'
                      ? 'text-[#8B5CF6]'
                      : isDone
                      ? 'text-[#10B981]'
                      : 'text-white'
                  }`}
                >
                  {set.tag === 'W' ? 'W' : set.tag === 'D' ? 'D' : sIdx + 1}
                </Text>
              </Pressable>

              {/* Ghost Previous Benchmark Indicator (w-20) */}
              <Pressable
                onPress={() => onFillGhost(sIdx, ghostWeight, ghostReps)}
                className="w-20 py-1.5 px-1 rounded-xl bg-white/[0.03] border border-white/[0.04] items-center justify-center active:opacity-60"
              >
                <Text className="text-[#A1A1AA] text-[11px] font-mono font-medium" numberOfLines={1}>
                  {ghostWeight}k × {ghostReps}
                </Text>
              </Pressable>

              {/* Weight Input Box (w-16) */}
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

              {/* Reps Input Box (w-14) */}
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

              {/* Big Touch-Target Circular Checkmark (w-9) */}
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

        {/* Add Set Action Button */}
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
  const [activeTabId, setActiveTabId] = useState<string>('chest');
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseRecord>>({});
  const aegis = useAegisStore();

  // Sets state map: exerciseId -> SetRowData[]
  const [setsData, setSetsData] = useState<Record<string, SetRowData[]>>({});

  // Media Lightbox Modal state
  const [activeMediaExercise, setActiveMediaExercise] = useState<ExerciseDef | null>(null);
  const [mediaFrameToggle, setMediaFrameToggle] = useState<number>(0);

  // Session timer & Modals
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => Date.now());
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

  // Alternating contraction frame toggle for lightbox
  useEffect(() => {
    if (!activeMediaExercise) return;
    const interval = setInterval(() => {
      setMediaFrameToggle((f) => (f === 0 ? 1 : 0));
    }, 1400);
    return () => clearInterval(interval);
  }, [activeMediaExercise]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load user profile & histories on focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      async function loadData() {
        try {
          const profileRaw = await AsyncStorage.getItem('@ironforge_user_profile');
          if (profileRaw && isMounted) {
            setProfile(JSON.parse(profileRaw));
          }
          const histories = await getExerciseHistories();
          if (isMounted) {
            setExerciseHistories(histories);
          }
        } catch (err) {
          console.warn('[workout] Error loading profile:', err);
        }
      }
      loadData();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Rest timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && restSecondsLeft !== null && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
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

  const routineTabs = MUSCLE_ROUTINES;
  const currentRoutine = useMemo(() => {
    return routineTabs.find((r) => r.id === activeTabId) || routineTabs[0];
  }, [routineTabs, activeTabId]);

  // Initial sets generator for an exercise
  const getSetsForExercise = (exerciseId: string, ex: ExerciseDef): SetRowData[] => {
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
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
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
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
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
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
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
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
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
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
      const curTag = current[setIdx].tag;
      const nextTag: SetRowData['tag'] = curTag === '1' || curTag === '2' || curTag === '3' ? 'W' : curTag === 'W' ? 'D' : '1';
      current[setIdx] = { ...current[setIdx], tag: nextTag };
      return { ...prev, [exerciseId]: current };
    });
  };

  const handleAddSet = (exerciseId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSetsData((prev) => {
      const current = prev[exerciseId] ? [...prev[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
      const last = current[current.length - 1] || { tag: '1', weight: '60', reps: '10', isCompleted: false };
      return {
        ...prev,
        [exerciseId]: [
          ...current,
          { tag: `${Math.min(5, current.length + 1)}` as any, weight: last.weight, reps: last.reps, isCompleted: false },
        ],
      };
    });
  };

  const handleToggleSet = async (
    exerciseId: string,
    exerciseName: string,
    setIdx: number,
    targetMuscle: string
  ) => {
    const current = setsData[exerciseId] ? [...setsData[exerciseId]] : getSetsForExercise(exerciseId, currentRoutine.exercises[0]);
    const targetSet = current[setIdx];

    // Auto-start active session in global store if not already active
    if (!aegis.activeSession.isActive) {
      aegisState.startWorkoutSession(currentRoutine.label);
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

      // Update global reactive store
      aegisState.updateSessionProgress(numWeight * numReps, 1, result.isPr ? 1 : 0);

      // Check if 1RM sets new record in trophy vault
      const lowerName = exerciseName.toLowerCase();
      if (lowerName.includes('bench')) aegisState.record1Rm('benchPress', numWeight, numReps);
      else if (lowerName.includes('squat')) aegisState.record1Rm('squat', numWeight, numReps);
      else if (lowerName.includes('deadlift')) aegisState.record1Rm('deadlift', numWeight, numReps);
      else if (lowerName.includes('overhead') || lowerName.includes('military')) aegisState.record1Rm('overheadPress', numWeight, numReps);
      else if (lowerName.includes('row')) aegisState.record1Rm('barbellRow', numWeight, numReps);

      if (result.isPr) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } else {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }

      // Start 90s Rest Timer
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
      aegisState.updateSessionProgress(-(w * r), -1, targetSet.isPr ? -1 : 0);

      current[setIdx] = {
        ...targetSet,
        isCompleted: false,
        isPr: false,
      };
    }

    setSetsData((prev) => ({ ...prev, [exerciseId]: current }));
  };

  const handleAdd30s = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRestSecondsLeft((prev) => {
      const next = Math.min(300, (prev ?? 0) + 30);
      setTargetRest((t) => Math.max(t, next));
      scheduleRestIntervalNotification(next, currentRoutine.label).catch(() => {});
      return next;
    });
    setIsTimerRunning(true);
  };

  const handleSkipTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    cancelRestIntervalNotification().catch(() => {});
    setRestSecondsLeft(null);
    setIsTimerRunning(false);
  };

  const completedSetsCount = Object.values(setsData).reduce(
    (total, sArr) => total + sArr.filter((s) => s.isCompleted).length,
    0
  );

  const totalVolumeKg = Object.values(setsData).reduce((total, sArr) => {
    return (
      total +
      sArr.reduce((v, s) => {
        if (!s.isCompleted) return v;
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps, 10) || 0;
        return v + w * r;
      }, 0)
    );
  }, 0);

  const handleFinishWorkout = async () => {
    const prsCount = Object.values(setsData).reduce(
      (total, sArr) => total + sArr.filter((s) => s.isPr).length,
      0
    );
    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));

    await saveWorkoutSession({
      id: `session-${Date.now()}`,
      splitName: currentRoutine.label,
      date: new Date().toISOString(),
      durationMinutes,
      totalVolumeKg: Math.round(totalVolumeKg),
      totalSetsCompleted: completedSetsCount,
      prsAchieved: prsCount,
    });

    // Update global state store (applies muscle fatigue & updates streak)
    aegisState.finishWorkoutSession();

    await cancelRestIntervalNotification();
    setRestSecondsLeft(null);
    setIsTimerRunning(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setShowFinishModal(false);
    setSetsData({});
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Workout Session Top HUD */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            {currentRoutine.label} SESSION
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Ionicons name="time-outline" size={13} color="#FF5A1F" />
            <Text className="text-[#FF5A1F] text-xs font-mono font-bold">
              {formatTimer(elapsedSeconds)}
            </Text>
            <Text className="text-[#52525B] text-xs">•</Text>
            <Text className="text-[#71717A] text-xs font-mono">
              {completedSetsCount} sets completed
            </Text>
          </View>
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

      {/* 2. Muscle Group Pill Selector */}
      <View className="py-2.5 px-6 border-b border-white/[0.05] bg-[#0B0C10]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="flex-row"
        >
          {routineTabs.map((tab) => {
            const isActive = tab.id === currentRoutine.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setActiveTabId(tab.id);
                }}
                className={`py-2 px-4 rounded-full border active:opacity-80 ${
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
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Floating Rest Timer Bar (if active) */}
      {restSecondsLeft !== null && restSecondsLeft > 0 && (
        <View className="mx-5 mt-3 py-2.5 px-4 rounded-full bg-[#12131A] border border-[#FF5A1F]/30 flex-row items-center justify-between shadow-xl">
          <View className="flex-row items-center gap-2">
            <Ionicons name="timer-outline" size={16} color="#FF5A1F" />
            <Text className="text-[#FF5A1F] text-xs font-mono font-bold">
              REST: {formatTimer(restSecondsLeft)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleAdd30s}
              className="py-1 px-3 rounded-full bg-[#181922] border border-white/[0.06] active:opacity-75"
            >
              <Text className="text-white text-[11px] font-mono">+30s</Text>
            </Pressable>
            <Pressable
              onPress={handleSkipTimer}
              className="py-1 px-3 rounded-full bg-[#181922] border border-white/[0.06] active:opacity-75"
            >
              <Text className="text-[#71717A] text-[11px] font-mono">Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 4. Exercise Set Logger List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        className="flex-1"
      >
        {currentRoutine.exercises.map((exercise) => {
          const sets = getSetsForExercise(exercise.id, exercise);
          const history = exerciseHistories[exercise.id] || null;

          return (
            <HevyExerciseCard
              key={exercise.id}
              exercise={exercise}
              historyRecord={history}
              sets={sets}
              unitLabel="KG"
              onToggleSet={(sIdx) =>
                handleToggleSet(exercise.id, exercise.name, sIdx, exercise.targetMuscle)
              }
              onUpdateField={(sIdx, field, val) =>
                handleUpdateField(exercise.id, sIdx, field, val)
              }
              onAdjustField={(sIdx, field, delta) =>
                handleAdjustField(exercise.id, sIdx, field, delta)
              }
              onFillGhost={(sIdx, gW, gR) =>
                handleFillGhost(exercise.id, sIdx, gW, gR)
              }
              onToggleRpe={(sIdx) => handleToggleRpe(exercise.id, sIdx)}
              onToggleTag={(sIdx) => handleToggleTag(exercise.id, sIdx)}
              onAddSet={() => handleAddSet(exercise.id)}
              onOpenMediaModal={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setActiveMediaExercise(exercise);
              }}
              onOpenPlateCalc={(targetW) => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setPlateCalcTargetWeight(targetW);
              }}
            />
          );
        })}
      </ScrollView>

      {/* 5. Exercise Technique & Animation Lightbox Modal */}
      {activeMediaExercise && (
        <Modal
          visible={!!activeMediaExercise}
          animationType="slide"
          transparent
          onRequestClose={() => setActiveMediaExercise(null)}
        >
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#17181F] border-t border-white/[0.08] rounded-t-3xl p-6 gap-4 max-h-[85%]">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/[0.06]">
                <View className="flex-1 pr-3">
                  <Text className="text-[#F8FAFC] text-lg font-bold">
                    {activeMediaExercise.name}
                  </Text>
                  <Text className="text-[#94A3B8] text-xs font-mono mt-0.5">
                    {activeMediaExercise.targetMuscle} • {activeMediaExercise.mechanic}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActiveMediaExercise(null)}
                  className="w-8 h-8 rounded-full bg-[#1E2029] items-center justify-center active:opacity-75"
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Looping Technique Demonstration */}
              <View className="w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 relative">
                <ExpoImage
                  source={{
                    uri: activeMediaExercise.mediaUrl.includes('raw.githubusercontent.com')
                      ? activeMediaExercise.mediaUrl.replace('/0.jpg', `/${mediaFrameToggle}.jpg`)
                      : activeMediaExercise.mediaUrl,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                />
                <View className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/75 border border-white/10">
                  <Text className="text-[#F8FAFC] text-[9px] font-mono uppercase">
                    {mediaFrameToggle === 0 ? 'START POSITION' : 'PEAK CONTRACTION'}
                  </Text>
                </View>
              </View>

              {/* Prescription & Technique Notes */}
              <View className="p-4 rounded-2xl bg-[#1E2029] border border-white/[0.04] gap-1.5">
                <Text className="text-[#F8FAFC] text-xs font-bold uppercase tracking-wider">
                  Prescription Protocol
                </Text>
                <Text className="text-[#94A3B8] text-xs leading-5">
                  {activeMediaExercise.prescription}
                </Text>
              </View>

              <Pressable
                onPress={() => setActiveMediaExercise(null)}
                className="py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center active:opacity-85"
              >
                <Text className="text-black text-xs font-bold uppercase tracking-wider">
                  Back to Training
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 6. Finish Workout Summary Modal */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#17181F] border border-white/[0.08] p-6 items-center gap-4 shadow-2xl">
            <View className="w-14 h-14 rounded-2xl bg-[#FF5A1F]/15 items-center justify-center">
              <Ionicons name="checkmark-done" size={28} color="#FF5A1F" />
            </View>

            <View className="items-center">
              <Text className="text-[#F8FAFC] text-lg font-bold tracking-tight">
                Complete Session
              </Text>
              <Text className="text-[#94A3B8] text-xs mt-1 text-center">
                Log completed volume and update your 1RM PR trophy vault.
              </Text>
            </View>

            <View className="w-full p-4 rounded-2xl bg-[#1E2029] border border-white/[0.04] gap-2.5">
              <View className="flex-row justify-between">
                <Text className="text-[#94A3B8] text-xs font-mono">Routine</Text>
                <Text className="text-[#F8FAFC] text-xs font-bold">{currentRoutine.label}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#94A3B8] text-xs font-mono">Duration</Text>
                <Text className="text-[#F8FAFC] text-xs font-mono font-bold">
                  {formatTimer(elapsedSeconds)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#94A3B8] text-xs font-mono">Sets Logged</Text>
                <Text className="text-[#FF5A1F] text-xs font-mono font-bold">
                  {completedSetsCount} Sets
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#94A3B8] text-xs font-mono">Total Volume</Text>
                <Text className="text-[#F8FAFC] text-xs font-mono font-bold">
                  {Math.round(totalVolumeKg)} KG
                </Text>
              </View>
            </View>

            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={() => setShowFinishModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#1E2029] border border-white/[0.08] items-center justify-center active:opacity-75"
              >
                <Text className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">
                  Resume
                </Text>
              </Pressable>
              <Pressable
                onPress={handleFinishWorkout}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center active:opacity-85"
              >
                <Text className="text-black text-xs font-bold uppercase tracking-wider">
                  Save Workout
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Aegis 1RM Vault Modal */}
      <AegisLogbookModal
        visible={showLogbookModal}
        onClose={() => setShowLogbookModal(false)}
      />

      {/* 8. Barbell Olympic Plate Calculator Modal */}
      <PlateCalculatorModal
        visible={plateCalcTargetWeight !== null}
        onClose={() => setPlateCalcTargetWeight(null)}
        targetWeightKg={plateCalcTargetWeight ?? 60}
      />
    </SafeAreaView>
  );
}
