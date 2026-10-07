import React, { useState, useEffect, useMemo } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
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
import AegisLogbookModal from '../../components/AegisLogbookModal';

interface ExerciseDef {
  id: string;
  freeDbId: string;
  name: string;
  targetMuscle: string;
  mechanic: 'Compound' | 'Isolation';
  prescription: string; // e.g. "3 Sets × 8–12 Reps • RPE 8 • 90s Rest"
  mediaUrl: string;
}

interface RoutineTab {
  id: string;
  label: string;
  subtitle: string;
  exercises: ExerciseDef[];
}

// Pre-compiled structured routines for PPL, Upper/Lower, and Bro Split
const ROUTINES_BY_SPLIT: Record<string, RoutineTab[]> = {
  ppl: [
    {
      id: 'push',
      label: 'Push',
      subtitle: 'Chest, Anterior Delts & Triceps',
      exercises: [
        {
          id: 'incline-db-press',
          freeDbId: 'Incline_Dumbbell_Bench_Press',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Clavicular Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        },
        {
          id: 'bb-bench-press',
          freeDbId: 'Barbell_Bench_Press_-_Medium_Grip',
          name: 'Barbell Bench Press',
          targetMuscle: 'Sternal Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        },
        {
          id: 'lateral-raises',
          freeDbId: 'Side_Lateral_Raise',
          name: 'Lateral Raises',
          targetMuscle: 'Lateral Deltoids',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        },
        {
          id: 'cable-pushdowns',
          freeDbId: 'Triceps_Pushdown',
          name: 'Cable Tricep Pushdowns',
          targetMuscle: 'Triceps Brachii',
          mechanic: 'Isolation',
          prescription: '3 Sets × 10–12 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
        },
      ],
    },
    {
      id: 'pull',
      label: 'Pull',
      subtitle: 'Back Density, Lats & Biceps',
      exercises: [
        {
          id: 'bb-rows',
          freeDbId: 'Bent_Over_Barbell_Row',
          name: 'Barbell Rows',
          targetMuscle: 'Latissimus Dorsi & Rhomboids',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/barbell-bent-over-row.gif',
        },
        {
          id: 'lat-pulldowns',
          freeDbId: 'Wide-Grip_Lat_Pulldown',
          name: 'Lat Pulldowns',
          targetMuscle: 'Latissimus Dorsi',
          mechanic: 'Compound',
          prescription: '3 Sets × 10–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/wide-grip-lat-pulldown.gif',
        },
        {
          id: 'face-pulls',
          freeDbId: 'Face_Pull',
          name: 'Face Pulls',
          targetMuscle: 'Rear Deltoids & Rotators',
          mechanic: 'Isolation',
          prescription: '3 Sets × 15 Reps • RPE 8.5 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-face-pull.gif',
        },
        {
          id: 'incline-db-curls',
          freeDbId: 'Incline_Dumbbell_Curl',
          name: 'Incline Dumbbell Curls',
          targetMuscle: 'Biceps Brachii (Long Head)',
          mechanic: 'Isolation',
          prescription: '3 Sets × 10–12 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/incline-dumbbell-curl.gif',
        },
      ],
    },
    {
      id: 'legs',
      label: 'Legs',
      subtitle: 'Quads, Posterior Chain & Calves',
      exercises: [
        {
          id: 'bb-squats',
          freeDbId: 'Barbell_Full_Squat',
          name: 'Barbell Squats',
          targetMuscle: 'Quadriceps & Gluteals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–8 Reps • RPE 8.5 • 120s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/barbell-back-squat.gif',
        },
        {
          id: 'romanian-deadlifts',
          freeDbId: 'Romanian_Deadlift',
          name: 'Romanian Deadlifts',
          targetMuscle: 'Hamstrings & Posterior Chain',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/romanian-deadlift.gif',
        },
        {
          id: 'leg-extensions',
          freeDbId: 'Leg_Extensions',
          name: 'Leg Extensions',
          targetMuscle: 'Rectus Femoris',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/leg-extensions.gif',
        },
        {
          id: 'standing-calf-raises',
          freeDbId: 'Standing_Calf_Raises',
          name: 'Standing Calf Raises',
          targetMuscle: 'Gastrocnemius & Soleus',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/standing-calf-raises.gif',
        },
      ],
    },
  ],
  upper_lower: [
    {
      id: 'upper',
      label: 'Upper',
      subtitle: 'Total Torso Hypertrophy',
      exercises: [
        {
          id: 'bb-bench-press',
          freeDbId: 'Barbell_Bench_Press_-_Medium_Grip',
          name: 'Barbell Bench Press',
          targetMuscle: 'Sternal Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        },
        {
          id: 'bb-rows',
          freeDbId: 'Bent_Over_Barbell_Row',
          name: 'Barbell Rows',
          targetMuscle: 'Latissimus Dorsi & Rhomboids',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/barbell-bent-over-row.gif',
        },
        {
          id: 'incline-db-press',
          freeDbId: 'Incline_Dumbbell_Bench_Press',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Clavicular Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        },
        {
          id: 'lat-pulldowns',
          freeDbId: 'Wide-Grip_Lat_Pulldown',
          name: 'Lat Pulldowns',
          targetMuscle: 'Latissimus Dorsi',
          mechanic: 'Compound',
          prescription: '3 Sets × 10–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/wide-grip-lat-pulldown.gif',
        },
        {
          id: 'lateral-raises',
          freeDbId: 'Side_Lateral_Raise',
          name: 'Lateral Raises',
          targetMuscle: 'Lateral Deltoids',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        },
        {
          id: 'cable-pushdowns',
          freeDbId: 'Triceps_Pushdown',
          name: 'Cable Tricep Pushdowns',
          targetMuscle: 'Triceps Brachii',
          mechanic: 'Isolation',
          prescription: '3 Sets × 10–12 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
        },
      ],
    },
    {
      id: 'lower',
      label: 'Lower',
      subtitle: 'Quad & Posterior Chain Power',
      exercises: [
        {
          id: 'bb-squats',
          freeDbId: 'Barbell_Full_Squat',
          name: 'Barbell Squats',
          targetMuscle: 'Quadriceps & Gluteals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–8 Reps • RPE 8.5 • 120s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/barbell-back-squat.gif',
        },
        {
          id: 'romanian-deadlifts',
          freeDbId: 'Romanian_Deadlift',
          name: 'Romanian Deadlifts',
          targetMuscle: 'Hamstrings & Posterior Chain',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/romanian-deadlift.gif',
        },
        {
          id: 'leg-extensions',
          freeDbId: 'Leg_Extensions',
          name: 'Leg Extensions',
          targetMuscle: 'Rectus Femoris',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/leg-extensions.gif',
        },
        {
          id: 'standing-calf-raises',
          freeDbId: 'Standing_Calf_Raises',
          name: 'Standing Calf Raises',
          targetMuscle: 'Gastrocnemius & Soleus',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/standing-calf-raises.gif',
        },
      ],
    },
  ],
  bro_split: [
    {
      id: 'chest',
      label: 'Chest',
      subtitle: 'Pectoral Overload',
      exercises: [
        {
          id: 'bb-bench-press',
          freeDbId: 'Barbell_Bench_Press_-_Medium_Grip',
          name: 'Barbell Bench Press',
          targetMuscle: 'Sternal Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        },
        {
          id: 'incline-db-press',
          freeDbId: 'Incline_Dumbbell_Bench_Press',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Clavicular Pectorals',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        },
      ],
    },
    {
      id: 'back',
      label: 'Back',
      subtitle: 'Lat Width & Thickness',
      exercises: [
        {
          id: 'bb-rows',
          freeDbId: 'Bent_Over_Barbell_Row',
          name: 'Barbell Rows',
          targetMuscle: 'Latissimus Dorsi & Rhomboids',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/barbell-bent-over-row.gif',
        },
        {
          id: 'lat-pulldowns',
          freeDbId: 'Wide-Grip_Lat_Pulldown',
          name: 'Lat Pulldowns',
          targetMuscle: 'Latissimus Dorsi',
          mechanic: 'Compound',
          prescription: '3 Sets × 10–12 Reps • RPE 8 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/back/wide-grip-lat-pulldown.gif',
        },
      ],
    },
    {
      id: 'legs',
      label: 'Legs',
      subtitle: 'Lower Body Architecture',
      exercises: [
        {
          id: 'bb-squats',
          freeDbId: 'Barbell_Full_Squat',
          name: 'Barbell Squats',
          targetMuscle: 'Quadriceps & Gluteals',
          mechanic: 'Compound',
          prescription: '3 Sets × 6–8 Reps • RPE 8.5 • 120s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/barbell-back-squat.gif',
        },
        {
          id: 'romanian-deadlifts',
          freeDbId: 'Romanian_Deadlift',
          name: 'Romanian Deadlifts',
          targetMuscle: 'Hamstrings & Posterior Chain',
          mechanic: 'Compound',
          prescription: '3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/legs/romanian-deadlift.gif',
        },
      ],
    },
    {
      id: 'arms_shoulders',
      label: 'Shoulders/Arms',
      subtitle: 'Delts, Biceps & Triceps',
      exercises: [
        {
          id: 'lateral-raises',
          freeDbId: 'Side_Lateral_Raise',
          name: 'Lateral Raises',
          targetMuscle: 'Lateral Deltoids',
          mechanic: 'Isolation',
          prescription: '3 Sets × 12–15 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        },
        {
          id: 'incline-db-curls',
          freeDbId: 'Incline_Dumbbell_Curl',
          name: 'Incline Dumbbell Curls',
          targetMuscle: 'Biceps Brachii',
          mechanic: 'Isolation',
          prescription: '3 Sets × 10–12 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/incline-dumbbell-curl.gif',
        },
        {
          id: 'cable-pushdowns',
          freeDbId: 'Triceps_Pushdown',
          name: 'Cable Tricep Pushdowns',
          targetMuscle: 'Triceps Brachii',
          mechanic: 'Isolation',
          prescription: '3 Sets × 10–12 Reps • RPE 9 • 60s Rest',
          mediaUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
        },
      ],
    },
  ],
};

export interface SetRowData {
  weight: string;
  reps: string;
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
  onFillGhost: (setIdx: number, ghostWeight: number, ghostReps: number) => void;
}

function ExerciseCard({
  exercise,
  historyRecord,
  sets,
  unitLabel = 'KG',
  onToggleSet,
  onUpdateField,
  onFillGhost,
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  // Fallback to Free Exercise DB static start frame if gif fails or is offline
  const fallbackUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.freeDbId}/0.jpg`;
  const primaryUri = imageError ? fallbackUrl : exercise.mediaUrl;

  const best1Rm = historyRecord?.bestEstimated1Rm || 0;

  return (
    <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 mb-4 gap-3.5">
      {/* 16:9 Visual Demonstration Area */}
      <View
        style={{ aspectRatio: 16 / 9 }}
        className="w-full rounded-xl overflow-hidden bg-[#09090B] items-center justify-center relative border border-white/[0.05]"
      >
        <ExpoImage
          source={{ uri: primaryUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => {
            if (!imageError) setImageError(true);
          }}
        />

        {/* Fallback Barbell Glyph */}
        {imageError && (
          <View className="absolute inset-0 items-center justify-center bg-[#09090B]/80">
            <Ionicons name="barbell-outline" size={28} color="#52525B" />
          </View>
        )}
      </View>

      {/* Title, Target & Best 1RM Badge */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-white text-[18px] font-bold tracking-tight">
            {exercise.name}
          </Text>
          <Text className="text-[#71717A] text-xs mt-0.5">
            {exercise.targetMuscle} • {exercise.mechanic}
          </Text>
        </View>

        {best1Rm > 0 && (
          <View className="py-1 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] items-end">
            <Text className="text-[#A1A1AA] text-[10px] font-mono tracking-wider">
              PR: {best1Rm} KG
            </Text>
          </View>
        )}
      </View>

      {/* Telemetry Prescription */}
      <Text className="text-[#A1A1AA] text-xs font-mono">
        {exercise.prescription}
      </Text>

      {/* Progressive Overload Table */}
      <View className="gap-2 pt-1 border-t border-white/[0.06]">
        {/* Table Column Headers */}
        <View className="flex-row items-center justify-between px-1">
          <Text className="w-8 text-[#71717A] text-[10px] font-mono uppercase">
            SET
          </Text>
          <Text className="flex-1 text-[#71717A] text-[10px] font-mono uppercase pl-1">
            PREV (TAP TO FILL)
          </Text>
          <Text className="w-16 text-[#71717A] text-[10px] font-mono uppercase text-center">
            {unitLabel}
          </Text>
          <Text className="w-14 text-[#71717A] text-[10px] font-mono uppercase text-center">
            REPS
          </Text>
          <Text className="w-9 text-[#71717A] text-[10px] font-mono uppercase text-center">
            DONE
          </Text>
        </View>

        {/* 3 Set Rows */}
        {[0, 1, 2].map((sIdx) => {
          const currentSet = sets[sIdx] || { weight: '', reps: '', isCompleted: false };
          const prevSet = historyRecord?.lastSets?.[sIdx];
          const ghostWeight = prevSet?.weightKg ?? (exercise.mechanic === 'Compound' ? 60 : 14);
          const ghostReps = prevSet?.reps ?? (exercise.mechanic === 'Compound' ? 8 : 12);

          return (
            <View key={sIdx} className="gap-1">
              <View
                className={`flex-row items-center justify-between p-2 rounded-xl border ${
                  currentSet.isCompleted
                    ? 'bg-[#18181D]/80 border-white/[0.12]'
                    : 'bg-[#141418] border-white/[0.06]'
                }`}
              >
                {/* Set Number Pill */}
                <View className="w-8 items-center justify-center">
                  <View className="w-6 h-6 rounded-full bg-white/[0.06] items-center justify-center">
                    <Text className="text-white text-xs font-mono font-bold">
                      {sIdx + 1}
                    </Text>
                  </View>
                </View>

                {/* Ghost Previous Text (Tappable to pre-fill) */}
                <Pressable
                  onPress={() => onFillGhost(sIdx, ghostWeight, ghostReps)}
                  className="flex-1 pl-1 active:opacity-60"
                >
                  <Text className="text-[#52525B] text-xs font-mono">
                    {ghostWeight}{unitLabel.toLowerCase()} × {ghostReps}
                  </Text>
                </Pressable>

                {/* Weight Input Box */}
                <View className="w-16 items-center">
                  <TextInput
                    value={currentSet.weight}
                    onChangeText={(val) => onUpdateField(sIdx, 'weight', val)}
                    placeholder={`${ghostWeight}`}
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    maxLength={5}
                    className="w-14 h-9 px-1 rounded-lg bg-[#18181D] border border-white/10 text-white font-mono text-xs text-center"
                  />
                </View>

                {/* Reps Input Box */}
                <View className="w-14 items-center">
                  <TextInput
                    value={currentSet.reps}
                    onChangeText={(val) => onUpdateField(sIdx, 'reps', val)}
                    placeholder={`${ghostReps}`}
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    maxLength={3}
                    className="w-12 h-9 px-1 rounded-lg bg-[#18181D] border border-white/10 text-white font-mono text-xs text-center"
                  />
                </View>

                {/* Checkmark Button */}
                <View className="w-9 items-center">
                  <Pressable
                    onPress={() => onToggleSet(sIdx)}
                    className={`w-9 h-9 rounded-lg items-center justify-center border active:opacity-80 ${
                      currentSet.isCompleted
                        ? 'bg-[#DC2626] border-[#DC2626]'
                        : 'bg-[#18181D] border-white/10'
                    }`}
                  >
                    <Ionicons
                      name="checkmark-sharp"
                      size={16}
                      color={currentSet.isCompleted ? '#FFFFFF' : '#52525B'}
                    />
                  </Pressable>
                </View>
              </View>

              {/* PR Celebration Tag */}
              {currentSet.isPr && (
                <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#DC2626]/10 border border-[#DC2626]/20 self-start">
                  <Ionicons name="trophy" size={12} color="#DC2626" />
                  <Text className="text-[#DC2626] text-[10px] font-bold font-mono tracking-wider">
                    NEW 1RM PR: {currentSet.est1Rm || calculateEstimated1Rm(Number(currentSet.weight), Number(currentSet.reps))} KG
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HypertrophyEngineScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('push');
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseRecord>>({});

  // Sets state map: exerciseId -> SetRowData[]
  const [setsData, setSetsData] = useState<Record<string, SetRowData[]>>({});

  // Session timer & Finish Modal State
  const [sessionStartTime] = useState<number>(() => Date.now());
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [showLogbookModal, setShowLogbookModal] = useState<boolean>(false);

  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [targetRest, setTargetRest] = useState<number>(90);

  // Load User Profile and Exercise History on mount
  useEffect(() => {
    async function initData() {
      try {
        const [rawProf, histories] = await Promise.all([
          AsyncStorage.getItem('@ironforge_user_profile'),
          getExerciseHistories(),
        ]);

        if (histories) {
          setExerciseHistories(histories);
        }

        if (rawProf) {
          const parsed: UserProfile = JSON.parse(rawProf);
          setProfile(parsed);
          const split = parsed.splitPreference || 'ppl';
          const defaultTab = ROUTINES_BY_SPLIT[split]?.[0]?.id || 'push';
          setActiveTabId(defaultTab);
        }
      } catch (err) {
        console.warn('[Workout] Error initializing workout screen:', err);
      }
    }
    initData();
  }, []);

  // Reload profile when screen gains focus to keep split and unit system in sync
  useFocusEffect(
    React.useCallback(() => {
      async function reloadProfile() {
        try {
          const rawProf = await AsyncStorage.getItem('@ironforge_user_profile');
          if (rawProf) {
            const parsed: UserProfile = JSON.parse(rawProf);
            setProfile(parsed);
          }
        } catch {}
      }
      reloadProfile();
    }, [])
  );

  // Retrieve active routines for current split
  const activeSplitKey = profile?.splitPreference || 'ppl';
  const unitLabel = profile?.unitSystem === 'imperial' ? 'LBS' : 'KG';
  const routineTabs = useMemo(() => {
    return ROUTINES_BY_SPLIT[activeSplitKey] || ROUTINES_BY_SPLIT.ppl;
  }, [activeSplitKey]);

  // Current active routine
  const currentRoutine = useMemo(() => {
    return routineTabs.find((r) => r.id === activeTabId) || routineTabs[0];
  }, [routineTabs, activeTabId]);

  // Rest Timer Engine: Decrements every 1 second when active
  useEffect(() => {
    if (!isTimerRunning || restSecondsLeft === null) return;

    if (restSecondsLeft <= 0) {
      setIsTimerRunning(false);
      setRestSecondsLeft(null);
      cancelRestIntervalNotification().catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    }

    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          cancelRestIntervalNotification().catch(() => {});
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, restSecondsLeft]);

  // Update input text fields (weight or reps)
  const handleUpdateField = (
    exerciseId: string,
    setIdx: number,
    field: 'weight' | 'reps',
    val: string
  ) => {
    setSetsData((prev) => {
      const current = prev[exerciseId] ? [...prev[exerciseId]] : [
        { weight: '', reps: '', isCompleted: false },
        { weight: '', reps: '', isCompleted: false },
        { weight: '', reps: '', isCompleted: false },
      ];
      current[setIdx] = {
        ...current[setIdx],
        [field]: val.replace(/[^0-9.]/g, ''),
      };
      return { ...prev, [exerciseId]: current };
    });
  };

  // Quick fill from ghost text
  const handleFillGhost = (
    exerciseId: string,
    setIdx: number,
    ghostWeight: number,
    ghostReps: number
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSetsData((prev) => {
      const current = prev[exerciseId] ? [...prev[exerciseId]] : [
        { weight: '', reps: '', isCompleted: false },
        { weight: '', reps: '', isCompleted: false },
        { weight: '', reps: '', isCompleted: false },
      ];
      current[setIdx] = {
        ...current[setIdx],
        weight: String(ghostWeight),
        reps: String(ghostReps),
      };
      return { ...prev, [exerciseId]: current };
    });
  };

  // Handle set completion, calculate 1RM, detect PR, and trigger Rest Timer
  const handleToggleSet = async (
    exerciseId: string,
    exerciseName: string,
    setIdx: number,
    targetMuscle?: string
  ) => {
    const current = setsData[exerciseId] ? [...setsData[exerciseId]] : [
      { weight: '', reps: '', isCompleted: false },
      { weight: '', reps: '', isCompleted: false },
      { weight: '', reps: '', isCompleted: false },
    ];

    const targetSet = current[setIdx] || { weight: '', reps: '', isCompleted: false };
    const willBeCompleted = !targetSet.isCompleted;

    if (willBeCompleted) {
      // Determine numeric weight & reps
      const prevSet = exerciseHistories[exerciseId]?.lastSets?.[setIdx];
      const fallbackWeight = prevSet?.weightKg ?? 60;
      const fallbackReps = prevSet?.reps ?? 10;

      const numWeight = parseFloat(targetSet.weight) || fallbackWeight;
      const numReps = parseInt(targetSet.reps, 10) || fallbackReps;

      // Commit to exercise history and check for PR
      const result = await recordSetCompletion({
        exerciseId,
        exerciseName,
        targetMuscle,
        setNumber: setIdx + 1,
        weightKg: numWeight,
        reps: numReps,
      });

      // Update local set state
      current[setIdx] = {
        ...targetSet,
        weight: String(numWeight),
        reps: String(numReps),
        isCompleted: true,
        isPr: result.isPr,
        est1Rm: result.estimated1Rm,
      };

      // Refresh exercise histories in state
      setExerciseHistories((h) => ({
        ...h,
        [exerciseId]: {
          exerciseId,
          bestEstimated1Rm: Math.max(h[exerciseId]?.bestEstimated1Rm || 0, result.estimated1Rm),
          lastPerformedDate: new Date().toISOString(),
          lastSets: h[exerciseId]?.lastSets ? [...h[exerciseId].lastSets] : [],
        },
      }));

      // Feedback: High-priority success notification if PR, light tap if regular
      if (result.isPr) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      // Auto-start 90s rest timer and schedule lock-screen notification
      setTargetRest(90);
      setRestSecondsLeft(90);
      setIsTimerRunning(true);
      scheduleRestIntervalNotification(90, exerciseName).catch(() => {});
    } else {
      // Uncheck set
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      current[setIdx] = {
        ...targetSet,
        isCompleted: false,
        isPr: false,
      };
    }

    setSetsData((prev) => ({ ...prev, [exerciseId]: current }));
  };

  // Timer quick actions with upper boundary limits
  const handleAdd30s = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRestSecondsLeft((prev) => {
      const next = Math.min(300, (prev ?? 0) + 30);
      setTargetRest((t) => Math.max(t, next));
      scheduleRestIntervalNotification(next, currentRoutine.label).catch(() => {});
      return next;
    });
    setIsTimerRunning(true);
  };

  const handleSkipTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    cancelRestIntervalNotification().catch(() => {});
    setRestSecondsLeft(null);
    setIsTimerRunning(false);
  };

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

    await cancelRestIntervalNotification();
    setRestSecondsLeft(null);
    setIsTimerRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowFinishModal(false);
    setSetsData({});
    router.push('/(tabs)');
  };

  // Progress percentage for rest countdown (strictly clamped 0 - 100%)
  const timerProgressPercent =
    restSecondsLeft !== null && targetRest > 0
      ? Math.max(0, Math.min(100, (restSecondsLeft / Math.max(1, targetRest)) * 100))
      : 0;

  // Compute session metrics for completion card
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

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* 1. Header with Split Selector */}
      <View className="px-6 py-5 border-b border-white/[0.08] gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
              HYPERTROPHY ENGINE
            </Text>
            <Text className="text-[#71717A] text-[11px] font-mono mt-0.5 uppercase">
              {currentRoutine.subtitle}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowLogbookModal(true);
              }}
              className="py-1 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] flex-row items-center gap-1 active:opacity-75"
            >
              <Ionicons name="trophy-outline" size={12} color="#DC2626" />
              <Text className="text-white text-[10px] font-mono uppercase font-semibold">
                VAULT
              </Text>
            </Pressable>

            <View className="py-1 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
              <Text className="text-[#A1A1AA] text-[10px] font-mono uppercase">
                {activeSplitKey.replace('_', '/').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Clean Horizontal Routine Selector */}
        <View className="flex-row gap-2">
          {routineTabs.map((tab) => {
            const isActive = tab.id === currentRoutine.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTabId(tab.id);
                }}
                className={`py-2 px-4 rounded-xl border active:opacity-80 ${
                  isActive
                    ? 'bg-white border-white'
                    : 'bg-[#121215] border-white/10'
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#09090B]' : 'text-[#71717A]'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Scrollable Exercise List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 112 }}
        className="flex-1"
      >
        {currentRoutine.exercises.map((exercise) => {
          const sets = setsData[exercise.id] || [
            { weight: '', reps: '', isCompleted: false },
            { weight: '', reps: '', isCompleted: false },
            { weight: '', reps: '', isCompleted: false },
          ];
          const history = exerciseHistories[exercise.id] || null;

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              historyRecord={history}
              sets={sets}
              unitLabel={unitLabel}
              onToggleSet={(sIdx) =>
                handleToggleSet(exercise.id, exercise.name, sIdx, exercise.targetMuscle)
              }
              onUpdateField={(sIdx, field, val) =>
                handleUpdateField(exercise.id, sIdx, field, val)
              }
              onFillGhost={(sIdx, gW, gR) =>
                handleFillGhost(exercise.id, sIdx, gW, gR)
              }
            />
          );
        })}

        {/* Session Volume & Finish Card */}
        {completedSetsCount > 0 && (
          <View className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5 mt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  SESSION PROGRESS
                </Text>
                <Text className="text-[#71717A] text-xs font-mono mt-0.5">
                  Volume: <Text className="text-white font-bold">{Math.round(totalVolumeKg)} {unitLabel.toLowerCase()}</Text> • {completedSetsCount} sets logged
                </Text>
              </View>

              <Pressable
                onPress={() => setShowFinishModal(true)}
                className="py-2.5 px-4 rounded-xl bg-[#DC2626] items-center justify-center active:opacity-85 shadow-sm"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Finish Session
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Session Completion Modal */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View className="flex-1 bg-black/85 justify-center px-6">
          <View className="bg-[#121215] border border-white/10 rounded-3xl p-6 gap-5 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-[#DC2626]/20 items-center justify-center">
                  <Ionicons name="trophy" size={16} color="#DC2626" />
                </View>
                <View>
                  <Text className="text-white text-base font-bold uppercase tracking-wider">
                    SESSION COMPLETE
                  </Text>
                  <Text className="text-[#71717A] text-xs font-mono">
                    {currentRoutine.label.toUpperCase()} PROTOCOL
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowFinishModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={18} color="#A1A1AA" />
              </Pressable>
            </View>

            {/* Metrics 2x2 Grid */}
            <View className="gap-2.5">
              <View className="flex-row gap-2.5">
                <View className="flex-1 p-3.5 rounded-xl bg-[#18181D] border border-white/[0.06] gap-1">
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                    TOTAL VOLUME
                  </Text>
                  <Text className="text-white text-lg font-mono font-bold">
                    {Math.round(totalVolumeKg)} {unitLabel.toLowerCase()}
                  </Text>
                </View>

                <View className="flex-1 p-3.5 rounded-xl bg-[#18181D] border border-white/[0.06] gap-1">
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                    SETS COMPLETED
                  </Text>
                  <Text className="text-white text-lg font-mono font-bold">
                    {completedSetsCount} Sets
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1 p-3.5 rounded-xl bg-[#18181D] border border-white/[0.06] gap-1">
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                    SESSION DURATION
                  </Text>
                  <Text className="text-white text-lg font-mono font-bold">
                    {Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000))} min
                  </Text>
                </View>

                <View className="flex-1 p-3.5 rounded-xl bg-[#18181D] border border-white/[0.06] gap-1">
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                    NEW 1RM RECORDS
                  </Text>
                  <Text className="text-[#DC2626] text-lg font-mono font-bold">
                    {Object.values(setsData).reduce(
                      (t, sArr) => t + sArr.filter((s) => s.isPr).length,
                      0
                    )}{' '}
                    PRs
                  </Text>
                </View>
              </View>
            </View>

            {/* Complete & Save Button */}
            <Pressable
              onPress={handleFinishWorkout}
              className="w-full py-4 rounded-xl bg-[#DC2626] items-center justify-center active:opacity-85 mt-1"
            >
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Complete & Log Session
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 3. Rest Timer Sticky Bar */}
      {restSecondsLeft !== null && restSecondsLeft > 0 && (
        <View className="absolute bottom-6 left-6 right-6 z-50">
          <View className="bg-[#18181B] border border-red-600/30 rounded-xl p-4 gap-3 shadow-2xl">
            {/* Top Row: Rest Interval Countdown & Actions */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="timer-outline" size={17} color="#DC2626" />
                <Text className="text-[#DC2626] font-mono text-sm font-bold tracking-wider">
                  REST INTERVAL: {restSecondsLeft}s
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleAdd30s}
                  className="py-1.5 px-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1] active:opacity-75"
                >
                  <Text className="text-white text-xs font-mono font-bold">
                    +30s
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSkipTimer}
                  className="py-1.5 px-2.5 rounded-lg bg-[#DC2626]/20 border border-[#DC2626]/40 active:opacity-75"
                >
                  <Text className="text-[#DC2626] text-xs font-bold uppercase tracking-wider">
                    Skip
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Progress Bar Indicator */}
            <View className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
              <View
                style={{ width: `${timerProgressPercent}%` }}
                className="h-full bg-[#DC2626] rounded-full"
              />
            </View>
          </View>
        </View>
      )}

      {/* Historical Workout Logbook & PR Vault Modal */}
      <AegisLogbookModal
        visible={showLogbookModal}
        onClose={() => setShowLogbookModal(false)}
        unitSystem={profile?.unitSystem}
      />
    </SafeAreaView>
  );
}
