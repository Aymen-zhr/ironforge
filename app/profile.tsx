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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Activity,
  Flame,
  Clock,
  Trash2,
  RefreshCw,
  LogOut,
  Sliders,
  Award,
  ChevronRight,
  Database,
  CloudCheck,
  Droplets,
} from 'lucide-react-native';
import { GlassCard, GlowButton, MetricBadge, AmbientGlow } from '../components/ui';
import { supabase } from '../services/supabase';
import { getDailyLog, DietLogData } from '../services/dietService';
import { Profile } from '../types/database';

export interface ProfileScreenProps {
  onBack?: () => void;
  onNavigateToScan?: () => void;
}

interface HistoricalScan {
  id: string;
  score: number;
  date: string;
  weakPoints: string[];
}

export default function ProfileScreen({ onBack, onNavigateToScan }: ProfileScreenProps) {
  // Athlete Metrics State
  const [weightKg, setWeightKg] = useState<string>('78');
  const [heightCm, setHeightCm] = useState<string>('180');
  const [bodyFat, setBodyFat] = useState<string>('13.5');
  const [preferredSplit, setPreferredSplit] = useState<string>('Upper/Lower');
  const [trainingGoal, setTrainingGoal] = useState<string>('Hypertrophy & V-Taper');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Daily Telemetry & Protocol State
  const [dietLog, setDietLog] = useState<DietLogData | null>(null);

  // Historical Telemetry State
  const [scanHistory, setScanHistory] = useState<HistoricalScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [savingMetrics, setSavingMetrics] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    async function loadProfileData() {
      setLoadingHistory(true);
      try {
        // Load Daily Protocol & Hydration Telemetry
        try {
          const log = await getDailyLog();
          setDietLog(log);
        } catch (dietErr) {
          console.warn('[ProfileScreen] Diet telemetry load error:', dietErr);
        }

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          setUserEmail(user.email || null);
          setSupabaseConnected(true);

          // Fetch profile row
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            if (profile.weight_kg) setWeightKg(String(profile.weight_kg));
            if (profile.height_cm) setHeightCm(String(profile.height_cm));
            if (profile.training_goal) setTrainingGoal(profile.training_goal);
          }

          // Fetch scan history
          const { data: scans } = await supabase
            .from('body_scans')
            .select('id, overall_symmetry_score, analyzed_at')
            .eq('user_id', user.id)
            .order('analyzed_at', { ascending: false })
            .limit(5);

          if (scans && scans.length > 0) {
            const mappedHistory: HistoricalScan[] = [];
            for (const scan of scans) {
              const { data: rankings } = await supabase
                .from('muscle_rankings')
                .select('muscle_group')
                .eq('scan_id', scan.id)
                .in('rank', ['C', 'B']);

              mappedHistory.push({
                id: scan.id,
                score: Number(scan.overall_symmetry_score) || 60,
                date: new Date(scan.analyzed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                weakPoints: rankings ? rankings.map((r) => r.muscle_group) : ['Upper Chest'],
              });
            }
            setScanHistory(mappedHistory);
          }
        } else {
          // Offline fallback sample history
          setScanHistory([
            {
              id: 'scan-1',
              score: 68,
              date: 'Oct 6, 2026',
              weakPoints: ['Upper Chest', 'Lateral Delts'],
            },
            {
              id: 'scan-2',
              score: 62,
              date: 'Sep 22, 2026',
              weakPoints: ['Upper Chest', 'Hamstrings', 'Lats'],
            },
          ]);
        }
      } catch (err) {
        console.warn('[ProfileScreen] Profile load warning:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadProfileData();
  }, []);

  // Save metrics to Supabase / local
  const handleSaveMetrics = async () => {
    setSavingMetrics(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || 'athlete@ironforge.app',
          weight_kg: Number(weightKg) || 78,
          height_cm: Number(heightCm) || 180,
          training_goal: trainingGoal,
        });
        Alert.alert('Metrics Synced', 'Biometric profile saved to Supabase Cloud.');
      } else {
        await AsyncStorage.setItem(
          '@ironforge_guest_profile',
          JSON.stringify({ weightKg, heightCm, bodyFat, preferredSplit, trainingGoal })
        );
        Alert.alert('Saved Locally', 'Biometric metrics recorded in local session.');
      }
    } catch {
      Alert.alert('Save Error', 'Could not save metrics.');
    } finally {
      setSavingMetrics(false);
    }
  };

  // Clear local device cache
  const handleClearCache = () => {
    Alert.alert(
      'Purge Local Cache',
      'This will clear cached diet logs and temporary image files from this device. Remote Supabase records remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const toRemove = keys.filter((k) => k.startsWith('@ironforge'));
              await AsyncStorage.multiRemove(toRemove);
              Alert.alert('Purged', 'Local device cache cleared successfully.');
            } catch {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-black" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-forge-border bg-forge-dark/80">
        <Pressable
          onPress={onBack}
          className="flex-row items-center py-1.5 px-2.5 rounded-lg bg-forge-dark border border-forge-border active:opacity-75"
        >
          <ArrowLeft size={16} color="#9CA3AF" />
          <Text className="text-ash-gray text-xs font-bold uppercase ml-1.5">Back</Text>
        </Pressable>

        <View className="flex-row items-center">
          <User size={16} color="#DC2626" />
          <Text className="text-bone-white text-sm font-black tracking-wider uppercase ml-1.5">
            Athlete Profile
          </Text>
        </View>

        <View className="flex-row items-center px-2 py-1 rounded-full bg-blood-red/15 border border-blood-red/40">
          <ShieldCheck size={12} color="#DC2626" />
          <Text className="text-blood-red text-[10px] font-black uppercase tracking-wider ml-1">
            Pro Level
          </Text>
        </View>
      </View>

      {/* Ambient Lighting Glow */}
      <AmbientGlow color="#DC2626" size={300} opacity={0.2} top={-50} right={-60} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ATHLETE IDENTITY BANNER */}
        <GlassCard variant="glow" className="p-5 mb-5 border-blood-red/40">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl overflow-hidden border border-blood-red/50 bg-forge-black shadow-md shadow-blood-red/20">
                <Image
                  source={require('../assets/generated/logo.jpg')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <View className="ml-3">
                <Text className="text-bone-white font-black text-lg tracking-tight">
                  {userEmail ? userEmail.split('@')[0].toUpperCase() : 'IRON ATHLETE #01'}
                </Text>
                <Text className="text-ash-gray text-xs font-semibold">
                  {userEmail || 'Local Guest Mode Operative'}
                </Text>
              </View>
            </View>

            <View className="px-2.5 py-1 rounded-full bg-blood-red/20 border border-blood-red/40">
              <Text className="text-blood-red text-[10px] font-black uppercase">
                {supabaseConnected ? 'CLOUD VAULT' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {/* Derived Anabolic Biomarkers (FFMI, Lean Mass, Fat Mass) */}
          {(() => {
            const w = Number(weightKg) || 78;
            const h = (Number(heightCm) || 180) / 100;
            const bf = Number(bodyFat) || 13.5;
            const leanMass = (w * (1 - bf / 100)).toFixed(1);
            const fatMass = (w * (bf / 100)).toFixed(1);
            const ffmi = (Number(leanMass) / (h * h)).toFixed(1);

            return (
              <View className="flex-row gap-2 pt-3 border-t border-forge-border/60">
                <View className="flex-1 p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                  <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">Lean Mass</Text>
                  <Text className="text-[#F4F4F5] font-mono tabular-nums font-black text-base mt-0.5">{leanMass} kg</Text>
                </View>
                <View className="flex-1 p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] items-center">
                  <Text className="text-[#71717A] text-[9px] font-extrabold uppercase tracking-widest">Fat Mass</Text>
                  <Text className="text-[#F4F4F5] font-mono tabular-nums font-black text-base mt-0.5">{fatMass} kg</Text>
                </View>
                <View className="flex-1 p-2.5 rounded-xl bg-[#0A0A0C] border border-red-600/30 items-center">
                  <Text className="text-blood-red text-[9px] font-black uppercase tracking-widest">FFMI Index</Text>
                  <Text className="text-blood-red font-mono tabular-nums font-black text-base mt-0.5">{ffmi}</Text>
                </View>
              </View>
            );
          })()}
        </GlassCard>

        {/* BIOMETRICS & PHYSIQUE METRICS FORM */}
        <GlassCard variant="elevated" className="p-4 mb-5 border-white/[0.07] bg-[#0D0D11]/90">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Activity size={16} color="#DC2626" />
              <Text className="text-[#F4F4F5] font-extrabold text-xs uppercase tracking-widest ml-1.5">
                Physical Metrics & Calibration
              </Text>
            </View>
            <Text className="text-[#71717A] text-[10px] font-mono">Supabase Profiles</Text>
          </View>

          {/* Form Inputs Grid */}
          <View className="gap-3 mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-widest mb-1">
                  Weight (kg)
                </Text>
                <TextInput
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="numeric"
                  className="py-2 px-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07] text-[#F4F4F5] font-mono tabular-nums text-xs font-bold"
                />
              </View>

              <View className="flex-1">
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-widest mb-1">
                  Height (cm)
                </Text>
                <TextInput
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                  className="py-2 px-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07] text-[#F4F4F5] font-mono tabular-nums text-xs font-bold"
                />
              </View>

              <View className="flex-1">
                <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-widest mb-1">
                  Body Fat (%)
                </Text>
                <TextInput
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="numeric"
                  className="py-2 px-3 rounded-xl bg-[#0A0A0C] border border-white/[0.07] text-blood-red font-mono tabular-nums text-xs font-bold"
                />
              </View>
            </View>

            <View>
              <Text className="text-[#71717A] text-[10px] font-bold uppercase tracking-widest mb-1">
                Split Preference
              </Text>
              <View className="flex-row gap-1.5">
                {['Upper/Lower', 'PPL', 'Arnold Split', 'Full Body'].map((split) => {
                  const isSelected = preferredSplit === split;
                  return (
                    <Pressable
                      key={split}
                      onPress={() => setPreferredSplit(split)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        isSelected
                          ? 'bg-blood-red/20 border-blood-red/60'
                          : 'bg-[#0A0A0C] border-white/[0.07]'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ${
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
          </View>

          <GlowButton
            title={savingMetrics ? 'SAVING METRICS...' : 'SAVE BIOMETRIC PROFILE'}
            variant="blood"
            size="md"
            icon={<ShieldCheck size={16} color="#F4F4F5" />}
            onPress={handleSaveMetrics}
            disabled={savingMetrics}
          />
        </GlassCard>

        {/* ATHLETE PROTOCOL & TARGETS */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Clock size={16} color="#DC2626" />
              <Text className="text-[#F4F4F5] text-sm font-extrabold uppercase tracking-widest ml-1.5">
                Active Protocol & Targets
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded bg-blood-red/20 border border-blood-red/40">
              <Text className="text-blood-red text-[9px] font-black uppercase tracking-widest">
                ACTIVE
              </Text>
            </View>
          </View>

          <GlassCard variant="default" className="p-4 border-white/[0.07] bg-[#0D0D11]/90 rounded-xl">
            <View className="gap-2.5">
              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Daily Calorie Goal</Text>
                <Text className="text-[#F4F4F5] text-xs font-bold font-mono">
                  {(dietLog?.targetCalories || 2580).toLocaleString()} KCAL / DAY
                </Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Monthly Weight Target</Text>
                <Text className="text-blood-red text-xs font-bold font-mono">
                  {dietLog?.targetKgPerMonth !== undefined ? (dietLog.targetKgPerMonth >= 0 ? '+' : '') + dietLog.targetKgPerMonth : '+1.0'} KG / MONTH
                </Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-cyan-500/30 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Droplets size={13} color="#06B6D4" />
                  <Text className="text-cyan-400 text-xs font-semibold ml-1.5">Daily Water Target</Text>
                </View>
                <Text className="text-cyan-300 text-xs font-bold font-mono">
                  {(((dietLog?.targetWaterMl || 3500) / 1000)).toFixed(1)}L ({(dietLog?.targetWaterMl || 3500).toLocaleString()} ML / DAY)
                </Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Hydration Reminder</Text>
                <Text className="text-[#F4F4F5] text-xs font-bold font-mono">
                  {dietLog?.waterReminderEnabled ?? true ? `ACTIVE (${dietLog?.waterReminderIntervalMinutes ?? 90} MIN)` : 'MUTED'}
                </Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Daily Protein Benchmark</Text>
                <Text className="text-blood-red text-xs font-bold font-mono">
                  2.2G / KG ({dietLog?.targetProtein || Math.round((Number(weightKg) || 78) * 2.2)}G)
                </Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Training Split</Text>
                <Text className="text-[#F4F4F5] text-xs font-bold font-mono">PUSH / PULL / LEGS (PPL)</Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Weekly Target Volume</Text>
                <Text className="text-amber-400 text-xs font-bold font-mono">14,200 LBS</Text>
              </View>

              <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
                <Text className="text-[#71717A] text-xs font-semibold">Focus Muscle Groups</Text>
                <Text className="text-[#F4F4F5] text-xs font-bold font-mono">UPPER CHEST &bull; DELTS</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* SETTINGS & DATA MANAGEMENT */}
        <GlassCard variant="default" className="p-4 border-white/[0.07] bg-[#0D0D11]/90 rounded-xl">
          <Text className="text-[#71717A] text-xs font-extrabold uppercase tracking-widest mb-3">
            System & Storage Controls
          </Text>

          <View className="gap-2.5">
            {/* Supabase Status Row */}
            <View className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.07] flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Database size={15} color="#DC2626" />
                <Text className="text-[#F4F4F5] text-xs font-bold ml-2">Supabase Cloud Vault</Text>
              </View>
              <Text className="text-blood-red text-xs font-mono font-bold">
                {supabaseConnected ? 'CONNECTED' : 'LOCAL CACHED'}
              </Text>
            </View>

            {/* Clear Local Cache Action */}
            <Pressable
              onPress={handleClearCache}
              className="p-2.5 rounded-xl bg-[#0A0A0C] border border-red-950/80 flex-row items-center justify-between active:opacity-75"
            >
              <View className="flex-row items-center">
                <Trash2 size={15} color="#EF4444" />
                <Text className="text-red-400 text-xs font-bold ml-2">Clear Local Storage Cache</Text>
              </View>
              <Text className="text-[#71717A] text-[10px] font-mono">Wipe Offline</Text>
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
