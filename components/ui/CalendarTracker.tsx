import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAegisStore, DayActivitySnapshot, getTodayDateString } from '../../services/useAegisStore';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

interface CalendarTrackerProps {
  onSelectDate?: (dateStr: string) => void;
  className?: string;
  initialMode?: 'month' | 'week';
}

export default function CalendarTracker({
  onSelectDate,
  className = '',
  initialMode = 'month',
}: CalendarTrackerProps) {
  const aegis = useAegisStore();
  const todayStr = useMemo(() => getTodayDateString(0), []);

  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'month' | 'week'>(initialMode);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const goToPrevMonth = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
    onSelectDate?.(todayStr);
  };

  // Generate calendar days for the active month view
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // JS getDay(): 0 is Sun, 1 is Mon... we want 0 = Mon, 6 = Sun
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill out 35 or 42 cells (multiple of 7)
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const nextCount = 7 - remainder;
      for (let d = 1; d <= nextCount; d++) {
        const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNum: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, todayStr]);

  // Generate current 7-day week strip
  const weekStripCells = useMemo(() => {
    // Center around selectedDate or today
    const base = new Date();
    const dayOfWeek = (base.getDay() + 6) % 7; // 0 = Mon
    const monday = new Date(base);
    monday.setDate(base.getDate() - dayOfWeek);

    const cells: {
      dateStr: string;
      dayNum: number;
      dayLabel: string;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: d.getDate(),
        dayLabel: WEEKDAYS[i],
        isToday: dateStr === todayStr,
      });
    }
    return cells;
  }, [todayStr]);

  const selectedSnapshot = useMemo(() => {
    return aegis.dailySnapshots[selectedDate];
  }, [aegis.dailySnapshots, selectedDate]);

  const formatSelectedDateHeader = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const handleDayPress = (dateStr: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(dateStr);
    onSelectDate?.(dateStr);
  };

  // Helper to determine indicators for a specific day
  const getDayStatus = (dateStr: string) => {
    const snap = aegis.dailySnapshots[dateStr];
    if (!snap) return { hasWorkout: false, hasWater: false, hasMacro: false, hasWeight: false };

    const hasWorkout = Boolean(snap.workoutCompleted);
    const hasWater = snap.waterConsumedMl >= snap.waterTargetMl && snap.waterTargetMl > 0;
    const hasMacro = snap.caloriesConsumed > 0 && Math.abs(snap.caloriesConsumed - snap.caloriesTarget) <= snap.caloriesTarget * 0.15;
    const hasWeight = snap.weightKg !== undefined && snap.weightKg > 0;

    return { hasWorkout, hasWater, hasMacro, hasWeight };
  };

  return (
    <View className={`bg-[#17181F] border border-white/[0.06] rounded-3xl p-5 ${className}`}>
      {/* Calendar Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center space-x-2.5">
          <View className="w-8 h-8 rounded-xl bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 items-center justify-center">
            <Ionicons name="calendar-outline" size={16} color="#FF5A1F" />
          </View>
          <View>
            <Text className="text-white font-bold text-base tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <View className="flex-row items-center space-x-1.5 mt-0.5">
              <Ionicons name="flame" size={12} color="#FF5A1F" />
              <Text className="text-[#FF5A1F] text-[10px] font-bold tracking-wider uppercase">
                {aegis.currentStreakDays} DAY STREAK
              </Text>
            </View>
          </View>
        </View>

        {/* View Toggle & Month Steppers */}
        <View className="flex-row items-center space-x-1.5">
          {/* Mode Switcher */}
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'month' ? 'week' : 'month');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] active:bg-white/[0.12]"
          >
            <Text className="text-slate-300 text-[10px] font-bold tracking-wider uppercase">
              {viewMode === 'month' ? '7-DAY' : 'MONTH'}
            </Text>
          </Pressable>

          {/* Jump to Today Pill */}
          <Pressable
            onPress={jumpToToday}
            className="px-2.5 py-1.5 rounded-xl bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 active:bg-[#FF5A1F]/25"
          >
            <Text className="text-[#FF5A1F] text-[10px] font-bold tracking-wider uppercase">
              TODAY
            </Text>
          </Pressable>

          {/* Prev Month */}
          <Pressable
            onPress={goToPrevMonth}
            className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] items-center justify-center active:bg-white/[0.12]"
          >
            <Ionicons name="chevron-back" size={15} color="#94A3B8" />
          </Pressable>

          {/* Next Month */}
          <Pressable
            onPress={goToNextMonth}
            className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] items-center justify-center active:bg-white/[0.12]"
          >
            <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
          </Pressable>
        </View>
      </View>

      {/* Weekday Labels */}
      <View className="flex-row justify-between mb-2 px-1">
        {WEEKDAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-slate-500 text-[10px] font-bold tracking-wider">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' ? (
        <View className="flex-row flex-wrap">
          {calendarCells.map((cell, index) => {
            const isSelected = cell.dateStr === selectedDate;
            const { hasWorkout, hasWater, hasMacro, hasWeight } = getDayStatus(cell.dateStr);

            return (
              <Pressable
                key={`${cell.dateStr}-${index}`}
                onPress={() => handleDayPress(cell.dateStr)}
                className={`w-[14.28%] aspect-square p-1 items-center justify-center rounded-2xl mb-1 ${
                  isSelected
                    ? 'bg-[#FF5A1F]/20 border border-[#FF5A1F]'
                    : cell.isToday
                    ? 'border border-white/20 bg-white/[0.04]'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs ${
                    isSelected
                      ? 'text-[#FF5A1F] font-bold'
                      : cell.isToday
                      ? 'text-white font-bold'
                      : cell.isCurrentMonth
                      ? 'text-slate-200'
                      : 'text-slate-600'
                  }`}
                >
                  {cell.dayNum}
                </Text>

                {/* Multi-Metric Adherence Dots */}
                <View className="flex-row items-center space-x-0.5 mt-1 h-1.5">
                  {hasWorkout && (
                    <View className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]" />
                  )}
                  {hasWater && (
                    <View className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  )}
                  {hasMacro && (
                    <View className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  )}
                  {hasWeight && (
                    <View className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* 7-DAY COMPACT STRIP VIEW */
        <View className="flex-row justify-between">
          {weekStripCells.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const { hasWorkout, hasWater, hasMacro, hasWeight } = getDayStatus(cell.dateStr);

            return (
              <Pressable
                key={cell.dateStr}
                onPress={() => handleDayPress(cell.dateStr)}
                className={`flex-1 py-3 px-1 items-center justify-center rounded-2xl mx-0.5 ${
                  isSelected
                    ? 'bg-[#FF5A1F]/20 border border-[#FF5A1F]'
                    : cell.isToday
                    ? 'border border-white/20 bg-white/[0.04]'
                    : 'bg-[#1E2029] border border-white/[0.04]'
                }`}
              >
                <Text className="text-slate-400 text-[10px] font-bold mb-1">
                  {cell.dayLabel}
                </Text>
                <Text
                  className={`text-sm font-bold ${
                    isSelected
                      ? 'text-[#FF5A1F]'
                      : cell.isToday
                      ? 'text-white'
                      : 'text-slate-200'
                  }`}
                >
                  {cell.dayNum}
                </Text>

                {/* Dots */}
                <View className="flex-row items-center space-x-0.5 mt-1.5 h-1.5">
                  {hasWorkout && <View className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]" />}
                  {hasWater && <View className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />}
                  {hasMacro && <View className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                  {hasWeight && <View className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View className="flex-row items-center justify-around mt-4 pt-4 border-t border-white/[0.06]">
        <View className="flex-row items-center space-x-1.5">
          <View className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
          <Text className="text-slate-400 text-[10px] font-bold">WORKOUT</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <View className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <Text className="text-slate-400 text-[10px] font-bold">HYDRATION</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <View className="w-2 h-2 rounded-full bg-[#10B981]" />
          <Text className="text-slate-400 text-[10px] font-bold">MACROS</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <View className="w-2 h-2 rounded-full bg-slate-200" />
          <Text className="text-slate-400 text-[10px] font-bold">WEIGH-IN</Text>
        </View>
      </View>

      {/* SELECTED DAY PERFORMANCE SCORECARD */}
      <View className="mt-4 p-4 bg-[#1E2029] border border-white/[0.06] rounded-2xl">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="sparkles" size={14} color="#FF5A1F" />
            <Text className="text-white text-xs font-bold tracking-tight">
              {formatSelectedDateHeader(selectedDate)}
            </Text>
          </View>
          {selectedDate === todayStr ? (
            <View className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
              <Text className="text-[#10E760] text-[9px] font-black uppercase">LIVE TODAY</Text>
            </View>
          ) : (
            <Text className="text-slate-400 text-[10px] font-medium">HISTORICAL SNAPSHOT</Text>
          )}
        </View>

        {selectedSnapshot ? (
          <View className="space-y-2.5">
            {/* Workout Status */}
            <View className="flex-row items-center justify-between bg-[#12141A] p-2.5 rounded-xl border border-white/[0.04]">
              <View className="flex-row items-center space-x-2">
                <Ionicons
                  name={selectedSnapshot.workoutCompleted ? 'barbell' : 'pause-circle'}
                  size={16}
                  color={selectedSnapshot.workoutCompleted ? '#10E760' : '#64748B'}
                />
                <View>
                  <Text className="text-white text-xs font-bold">
                    {selectedSnapshot.workoutSplit || (selectedSnapshot.workoutCompleted ? 'Workout Completed' : 'Rest / Recovery Day')}
                  </Text>
                  {selectedSnapshot.workoutCompleted && (
                    <Text className="text-slate-400 text-[10px]">
                      {selectedSnapshot.workoutVolumeKg.toLocaleString()} kg Volume • {selectedSnapshot.workoutSetsCount} Sets
                      {selectedSnapshot.workoutPrsCount ? ` • ${selectedSnapshot.workoutPrsCount} PRs` : ''}
                    </Text>
                  )}
                </View>
              </View>
              <View
                className={`px-2 py-0.5 rounded ${
                  selectedSnapshot.workoutCompleted
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : 'bg-white/[0.05]'
                }`}
              >
                <Text
                  className={`text-[9px] font-black uppercase ${
                    selectedSnapshot.workoutCompleted ? 'text-[#10E760]' : 'text-slate-500'
                  }`}
                >
                  {selectedSnapshot.workoutCompleted ? 'COMPLETED' : 'REST'}
                </Text>
              </View>
            </View>

            {/* Nutrition & Water Row */}
            <View className="flex-row space-x-2">
              {/* Calories & Protein */}
              <View className="flex-1 bg-[#12141A] p-2.5 rounded-xl border border-white/[0.04]">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-400 text-[10px] font-bold">CALORIES</Text>
                  <Text className="text-white text-[10px] font-black">
                    {selectedSnapshot.caloriesConsumed} / {selectedSnapshot.caloriesTarget}
                  </Text>
                </View>
                <View className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#FF9F0A] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((selectedSnapshot.caloriesConsumed / Math.max(1, selectedSnapshot.caloriesTarget)) * 100))}%`,
                    }}
                  />
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-400 text-[10px] font-bold">PROTEIN</Text>
                  <Text className="text-emerald-400 text-[10px] font-black">
                    {selectedSnapshot.proteinConsumed}g / {selectedSnapshot.proteinTarget}g
                  </Text>
                </View>
              </View>

              {/* Hydration & Weight */}
              <View className="flex-1 bg-[#12141A] p-2.5 rounded-xl border border-white/[0.04]">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-400 text-[10px] font-bold">WATER</Text>
                  <Text className="text-[#00D2FF] text-[10px] font-black">
                    {selectedSnapshot.waterConsumedMl} / {selectedSnapshot.waterTargetMl} ml
                  </Text>
                </View>
                <View className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#00D2FF] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((selectedSnapshot.waterConsumedMl / Math.max(1, selectedSnapshot.waterTargetMl)) * 100))}%`,
                    }}
                  />
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-400 text-[10px] font-bold">WEIGHT</Text>
                  <Text className="text-white text-[10px] font-black">
                    {selectedSnapshot.weightKg ? `${selectedSnapshot.weightKg} kg` : '--'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center py-4">
            <Text className="text-slate-500 text-xs font-semibold">
              No activity logged for this date.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
