import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  WorkoutSessionRecord,
  ExerciseRecord,
  getRecentSessions,
  getExerciseHistories,
  deleteWorkoutSession,
  clearAllWorkoutHistory,
  getLifetimeStats,
} from '../services/workoutHistoryService';
import { kgToLbs } from '../services/userMetrics';

interface AegisLogbookModalProps {
  visible: boolean;
  onClose: () => void;
  unitSystem?: 'metric' | 'imperial';
}

export default function AegisLogbookModal({
  visible,
  onClose,
  unitSystem = 'metric',
}: AegisLogbookModalProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'vault'>('sessions');
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [lifetimeStats, setLifetimeStats] = useState<{
    totalVolumeKg: number;
    totalSessions: number;
    totalPrs: number;
  }>({ totalVolumeKg: 0, totalSessions: 0, totalPrs: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  const isImperial = unitSystem === 'imperial';
  const unitLabel = isImperial ? 'lbs' : 'kg';
  const formatWeight = (kg: number) =>
    isImperial ? Math.round(kgToLbs(kg)) : Math.round(kg);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const loadData = async () => {
    try {
      const [sessList, histories, stats] = await Promise.all([
        getRecentSessions(),
        getExerciseHistories(),
        getLifetimeStats(),
      ]);
      setSessions(sessList);
      setExerciseRecords(Object.values(histories));
      setLifetimeStats(stats);
    } catch (err) {
      console.warn('[AegisLogbook] Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session Record?',
      'This workout session record will be permanently deleted from your logbook.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            const updated = await deleteWorkoutSession(sessionId);
            setSessions(updated);
            const freshStats = await getLifetimeStats();
            setLifetimeStats(freshStats);
          },
        },
      ]
    );
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Wipe Training History & PR Vault?',
      'This will permanently delete all completed workout sessions and recorded personal records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe All History',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
            await clearAllWorkoutHistory();
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#09090B]">
        {/* Top Header */}
        <View className="px-6 pt-5 pb-4 border-b border-white/10 flex-row items-center justify-between bg-[#0E0E11]">
          <View className="gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-sm font-bold tracking-[2.5px] uppercase">
                LOGBOOK & PR VAULT
              </Text>
              <View className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            </View>
            <Text className="text-[#71717A] text-[11px]">
              Training archive, volume analytics & personal records
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center active:opacity-70"
          >
            <Ionicons name="close" size={18} color="#A1A1AA" />
          </Pressable>
        </View>

        {/* Lifetime Telemetry Row */}
        <View className="px-6 py-4 bg-[#121215] border-b border-white/[0.06] flex-row items-center justify-between">
          <View className="flex-1 items-center border-r border-white/10">
            <Text className="text-[#71717A] text-[10px] font-mono uppercase">
              LIFETIME VOLUME
            </Text>
            <Text className="text-white text-base font-mono font-bold mt-0.5">
              {formatWeight(lifetimeStats.totalVolumeKg).toLocaleString()}{' '}
              <Text className="text-xs text-[#71717A]">{unitLabel}</Text>
            </Text>
          </View>

          <View className="flex-1 items-center border-r border-white/10">
            <Text className="text-[#71717A] text-[10px] font-mono uppercase">
              SESSIONS
            </Text>
            <Text className="text-white text-base font-mono font-bold mt-0.5">
              {lifetimeStats.totalSessions}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="text-[#71717A] text-[10px] font-mono uppercase">
              PR MILESTONES
            </Text>
            <Text className="text-[#DC2626] text-base font-mono font-bold mt-0.5">
              ★ {lifetimeStats.totalPrs}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="px-6 pt-3 pb-1 flex-row gap-2 bg-[#09090B]">
          <Pressable
            onPress={() => {
              triggerHaptic();
              setActiveTab('sessions');
            }}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
              activeTab === 'sessions'
                ? 'bg-[#18181D] border-[#DC2626]'
                : 'bg-[#121215] border-white/5 active:opacity-75'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === 'sessions' ? 'text-white' : 'text-[#71717A]'
              }`}
            >
              Session History ({sessions.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              setActiveTab('vault');
            }}
            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
              activeTab === 'vault'
                ? 'bg-[#18181D] border-[#DC2626]'
                : 'bg-[#121215] border-white/5 active:opacity-75'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === 'vault' ? 'text-white' : 'text-[#71717A]'
              }`}
            >
              PR Trophy Vault ({exerciseRecords.length})
            </Text>
          </Pressable>
        </View>

        {/* Content ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 14 }}
          className="flex-1"
        >
          {activeTab === 'sessions' ? (
            /* TAB 1: SESSIONS LIST */
            sessions.length > 0 ? (
              sessions.map((sess) => {
                const formattedDate = new Date(sess.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <View
                    key={sess.id}
                    className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5"
                  >
                    {/* Top Row: Split + Date + Delete */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-[#DC2626]" />
                        <Text className="text-white text-xs font-bold uppercase tracking-wider">
                          {sess.splitName.toUpperCase()} PROTOCOL
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2.5">
                        <Text className="text-[#71717A] text-[11px] font-mono">
                          {formattedDate}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteSession(sess.id)}
                          className="w-7 h-7 rounded-full bg-white/[0.05] items-center justify-center active:opacity-60"
                        >
                          <Ionicons name="trash-outline" size={13} color="#71717A" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Stats 4-Column Grid */}
                    <View className="flex-row bg-[#18181D] rounded-xl p-3 border border-white/5 justify-between">
                      <View className="items-center flex-1">
                        <Text className="text-[#71717A] text-[9px] font-mono uppercase">
                          VOLUME
                        </Text>
                        <Text className="text-white font-mono text-xs font-bold mt-1">
                          {formatWeight(sess.totalVolumeKg).toLocaleString()} {unitLabel}
                        </Text>
                      </View>

                      <View className="items-center flex-1 border-l border-white/5">
                        <Text className="text-[#71717A] text-[9px] font-mono uppercase">
                          DURATION
                        </Text>
                        <Text className="text-white font-mono text-xs font-bold mt-1">
                          {sess.durationMinutes}m
                        </Text>
                      </View>

                      <View className="items-center flex-1 border-l border-white/5">
                        <Text className="text-[#71717A] text-[9px] font-mono uppercase">
                          SETS
                        </Text>
                        <Text className="text-white font-mono text-xs font-bold mt-1">
                          {sess.totalSetsCompleted}
                        </Text>
                      </View>

                      <View className="items-center flex-1 border-l border-white/5">
                        <Text className="text-[#71717A] text-[9px] font-mono uppercase">
                          MILESTONES
                        </Text>
                        <Text
                          className={`font-mono text-xs font-bold mt-1 ${
                            sess.prsAchieved > 0 ? 'text-[#DC2626]' : 'text-[#71717A]'
                          }`}
                        >
                          {sess.prsAchieved > 0 ? `★ ${sess.prsAchieved} PRs` : '0'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              /* Empty Sessions State */
              <View className="bg-[#121215] border border-white/10 rounded-2xl p-8 items-center justify-center gap-3 mt-4">
                <View className="w-12 h-12 rounded-2xl bg-white/[0.05] items-center justify-center">
                  <Ionicons name="barbell-outline" size={24} color="#71717A" />
                </View>
                <Text className="text-white text-sm font-bold uppercase tracking-wider">
                  No Recorded Sessions Yet
                </Text>
                <Text className="text-[#71717A] text-xs text-center leading-5 px-4">
                  Initiate and complete a training routine in the Train tab to log your volume, duration, and PR achievements.
                </Text>
              </View>
            )
          ) : (
            /* TAB 2: PR TROPHY VAULT */
            exerciseRecords.length > 0 ? (
              exerciseRecords
                .sort((a, b) => b.bestEstimated1Rm - a.bestEstimated1Rm)
                .map((rec) => {
                  const displayName =
                    rec.exerciseName ||
                    rec.exerciseId
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');

                  const formattedDate = new Date(rec.lastPerformedDate).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  );

                  return (
                    <View
                      key={rec.exerciseId}
                      className="bg-[#121215] border border-white/10 rounded-2xl p-4 gap-3.5"
                    >
                      {/* Top Row: Exercise Name & Target Muscle */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <Text className="text-white text-sm font-bold tracking-tight">
                            {displayName}
                          </Text>
                          {rec.targetMuscle && (
                            <Text className="text-[#71717A] text-[11px] mt-0.5">
                              {rec.targetMuscle}
                            </Text>
                          )}
                        </View>
                        <View className="w-8 h-8 rounded-full bg-[#DC2626]/20 items-center justify-center">
                          <Ionicons name="trophy" size={15} color="#DC2626" />
                        </View>
                      </View>

                      {/* Best 1RM Hero Banner */}
                      <View className="bg-[#18181D] border border-white/5 rounded-xl p-3 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[#71717A] text-[10px] font-mono uppercase">
                            ALL-TIME 1RM EST.
                          </Text>
                          <Text className="text-[#DC2626] font-mono text-lg font-bold mt-0.5">
                            ★ {formatWeight(rec.bestEstimated1Rm)} {unitLabel}
                          </Text>
                        </View>

                        <Text className="text-[#71717A] text-[10px] font-mono">
                          {formattedDate}
                        </Text>
                      </View>

                      {/* Recent Performance Sets */}
                      {rec.lastSets?.length > 0 && (
                        <View className="gap-1.5">
                          <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
                            RECENT LOGGED SETS
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {rec.lastSets.map((s, sIdx) => (
                              <View
                                key={sIdx}
                                className="py-1 px-2.5 rounded-lg bg-white/[0.04] border border-white/5 flex-row items-center gap-1.5"
                              >
                                <Text className="text-[#71717A] text-[10px] font-mono">
                                  S{sIdx + 1}:
                                </Text>
                                <Text className="text-white text-[11px] font-mono font-bold">
                                  {formatWeight(s.weightKg)}{unitLabel} × {s.reps}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
            ) : (
              /* Empty PR Vault State */
              <View className="bg-[#121215] border border-white/10 rounded-2xl p-8 items-center justify-center gap-3 mt-4">
                <View className="w-12 h-12 rounded-2xl bg-white/[0.05] items-center justify-center">
                  <Ionicons name="trophy-outline" size={24} color="#71717A" />
                </View>
                <Text className="text-white text-sm font-bold uppercase tracking-wider">
                  No PR Records Established
                </Text>
                <Text className="text-[#71717A] text-xs text-center leading-5 px-4">
                  Check off sets with your weights and reps in the Train tab. The Epley formula will calculate your estimated 1RM and award PR trophies.
                </Text>
              </View>
            )
          )}

          {/* Maintenance Action: Wipe History */}
          {(sessions.length > 0 || exerciseRecords.length > 0) && (
            <View className="pt-4 pb-6">
              <Pressable
                onPress={handleClearAllHistory}
                className="py-3 px-4 rounded-xl bg-[#141418] border border-white/5 flex-row items-center justify-between active:opacity-75"
              >
                <Text className="text-[#71717A] text-xs font-medium">
                  Wipe All Training & PR History
                </Text>
                <Ionicons name="trash-outline" size={15} color="#52525B" />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
