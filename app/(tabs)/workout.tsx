import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import {
  Play,
  Pause,
  SkipForward,
  Plus,
  Clock,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getUserProfile, UserProfile } from '../../services/userMetrics';
import {
  TrainingProgram,
  Exercise,
  getProgramsByPreference,
  getProgramById,
} from '../../data/workoutCatalog';

interface ExerciseCardProps {
  exercise: Exercise;
  setsState: boolean[];
  onToggleSet: (setIdx: number) => void;
}

function ExerciseCard({
  exercise,
  setsState,
  onToggleSet,
}: ExerciseCardProps) {
  const completedSets = setsState.filter(Boolean).length;

  return (
    <View className="rounded-3xl overflow-hidden bg-[#121216] border border-white/[0.08] p-5 gap-4 mb-6">
      {/* Visual Demonstration Viewport */}
      <View className="w-full h-64 rounded-2xl overflow-hidden bg-[#09090B] relative">
        <ExpoImage
          source={{ uri: exercise.videoUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      </View>

      {/* Title & Target Muscle */}
      <View>
        <Text className="text-white text-lg font-bold tracking-tight">
          {exercise.name}
        </Text>
        <Text className="text-[#71717A] text-[13px] mt-0.5">
          {exercise.targetMuscle} • {exercise.equipment}
        </Text>
      </View>

      {/* Set Logger: 3 Simple Circles to Check Off */}
      <View className="flex-row items-center justify-between pt-1 border-t border-white/[0.06]">
        <Text className="text-[#71717A] text-xs">
          {completedSets} of 3 sets done
        </Text>
        <View className="flex-row gap-2.5">
          {[0, 1, 2].map((sIdx) => {
            const isDone = Boolean(setsState[sIdx]);
            return (
              <Pressable
                key={sIdx}
                onPress={() => onToggleSet(sIdx)}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                className={`w-9 h-9 rounded-full items-center justify-center border ${
                  isDone
                    ? 'bg-white border-white'
                    : 'bg-[#18181D] border-white/[0.12]'
                }`}
              >
                <Text
                  className={`text-xs font-mono font-bold ${
                    isDone ? 'text-[#09090B]' : 'text-[#71717A]'
                  }`}
                >
                  {sIdx + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function HypertrophyForgeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('push-day');
  const [completedSets, setCompletedSets] = useState<Record<string, Record<string, boolean[]>>>({});

  // Built-in Rest Timer States
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [initialRestDuration, setInitialRestDuration] = useState<number>(90);
  const timerIntervalRef = useRef<any>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    async function loadUserTraining() {
      const userProf = await getUserProfile();
      setProfile(userProf);

      const pref = userProf?.splitPreference || 'Push / Pull / Legs';
      const programs = getProgramsByPreference(pref);
      setAvailablePrograms(programs);
      if (programs.length > 0) {
        setSelectedProgramId(programs[0].id);
      }
    }
    loadUserTraining();
  }, []);

  // Rest Timer Interval Countdown Engine
  useEffect(() => {
    if (isTimerRunning && restSecondsLeft !== null && restSecondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            // Timer Finished!
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            setIsTimerRunning(false);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, restSecondsLeft]);

  const activeProgram: TrainingProgram =
    getProgramById(selectedProgramId) || availablePrograms[0] || getProgramById('push-day')!;

  const handleSelectProgram = (programId: string) => {
    triggerHaptic();
    setSelectedProgramId(programId);
  };

  const startRestTimer = (durationSeconds: number = 90) => {
    setInitialRestDuration(durationSeconds);
    setRestSecondsLeft(durationSeconds);
    setIsTimerRunning(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleTimerPause = () => {
    triggerHaptic();
    setIsTimerRunning((prev) => !prev);
  };

  const skipTimer = () => {
    triggerHaptic();
    setIsTimerRunning(false);
    setRestSecondsLeft(null);
  };

  const add30Seconds = () => {
    triggerHaptic();
    setRestSecondsLeft((prev) => (prev !== null ? prev + 30 : 30));
  };

  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSets((prev) => {
      const programMap = prev[activeProgram.id] || {};
      const existingSets = programMap[exerciseId] || [false, false, false];
      const updatedSets = [...existingSets];
      const wasComplete = updatedSets[setIndex];
      updatedSets[setIndex] = !wasComplete;

      // Auto start 90s countdown when a set is checked off
      if (!wasComplete) {
        startRestTimer(90);
      }

      return {
        ...prev,
        [activeProgram.id]: {
          ...programMap,
          [exerciseId]: updatedSets,
        },
      };
    });
  };

  const formatTimerDigits = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timerProgress =
    restSecondsLeft !== null && initialRestDuration > 0
      ? Math.max(0, Math.min(100, Math.round(((initialRestDuration - restSecondsLeft) / initialRestDuration) * 100)))
      : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#09090B]">
      {/* 1. Header: Minimal clean title */}
      <View className="px-6 py-5 border-b border-white/[0.08] flex-row items-center justify-between">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          WORKOUT
        </Text>
        <Text className="text-[#71717A] text-xs font-mono">
          {profile?.splitPreference || 'PPL'}
        </Text>
      </View>

      {/* 2. Top: Clean Horizontal Split Selector */}
      <View className="px-6 py-4 border-b border-white/[0.08]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 24 }}
        >
          {availablePrograms.map((prog) => {
            const isSelected = selectedProgramId === prog.id;
            return (
              <Pressable
                key={prog.id}
                onPress={() => handleSelectProgram(prog.id)}
                className="pb-2 relative"
              >
                <Text
                  className={`text-sm tracking-wide ${
                    isSelected ? 'text-white font-bold' : 'text-[#71717A] font-medium'
                  }`}
                >
                  {prog.splitName}
                </Text>
                {isSelected && (
                  <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Built-in Rest Timer Sticky Banner (when active) */}
      {restSecondsLeft !== null && (
        <View className="mx-6 mt-4 p-4 rounded-3xl bg-[#121216] border border-white/[0.12] gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Clock size={15} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold tracking-wider uppercase">
                {restSecondsLeft === 0 ? 'Rest Complete!' : 'Rest Interval'}
              </Text>
            </View>
            <Text className="text-white font-mono text-xl font-black">
              {formatTimerDigits(restSecondsLeft)}
            </Text>
          </View>

          {/* Timer Progress Line */}
          <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${timerProgress}%` }}
            />
          </View>

          {/* Controls: Pause/Resume, +30s, Skip */}
          <View className="flex-row items-center justify-between pt-1">
            <Pressable
              onPress={toggleTimerPause}
              className="py-1.5 px-3 rounded-full bg-[#18181D] border border-white/[0.08] flex-row items-center gap-1.5"
            >
              {isTimerRunning ? (
                <>
                  <Pause size={12} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold">Pause</Text>
                </>
              ) : (
                <>
                  <Play size={12} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold">Resume</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={add30Seconds}
              className="py-1.5 px-3 rounded-full bg-[#18181D] border border-white/[0.08] flex-row items-center gap-1"
            >
              <Plus size={12} color="#FFFFFF" />
              <Text className="text-white font-mono text-xs font-bold">+30s</Text>
            </Pressable>

            <Pressable
              onPress={skipTimer}
              className="py-1.5 px-3 rounded-full bg-[#18181D] border border-white/[0.08] flex-row items-center gap-1"
            >
              <SkipForward size={12} color="#71717A" />
              <Text className="text-[#71717A] text-xs">Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 4. Exercise Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
        className="flex-1"
      >
        {activeProgram.exercises.map((exercise) => {
          const programMap = completedSets[activeProgram.id] || {};
          const setsState = programMap[exercise.id] || [false, false, false];

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              setsState={setsState}
              onToggleSet={(sIdx) => toggleSetCompletion(exercise.id, sIdx)}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
