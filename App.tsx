import "./global.css";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  Dumbbell,
  Sparkles,
  Zap,
  Camera,
  Activity,
  Layers,
  ChevronRight,
  Flame,
  ShieldCheck,
} from "lucide-react-native";
import { GlassCard, GlowButton, MetricBadge } from "./components/ui";

export default function App() {
  const [activeSession, setActiveSession] = useState("Push / Upper Hypersplit");
  const [scanStatus, setScanStatus] = useState("Optimal Symmetry");

  const handleStartScan = () => {
    Alert.alert(
      "IronForge Vision Engine",
      "Initializing computer vision body scan and posture symmetry mapping..."
    );
  };

  const handleFridgeScan = () => {
    Alert.alert(
      "FridgeScan Multimodal AI",
      "Scanning refrigerator inventory to cross-reference with daily target macros..."
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-obsidian" edges={["top", "left", "right"]}>
        <StatusBar style="light" />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & HUD Status */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <View className="flex-row items-center">
                <Dumbbell size={22} color="#10B981" />
                <Text className="text-white text-2xl font-black tracking-tight ml-2">
                  IRON<Text className="text-accent">FORGE</Text>
                </Text>
              </View>
              <Text className="text-text-dim text-xs font-semibold tracking-wider uppercase mt-0.5">
                Elite AI Hypertrophy HUD
              </Text>
            </View>

            <View className="flex-row items-center px-3 py-1.5 rounded-full bg-surface border border-accent/40 shadow-sm shadow-accent/20">
              <View className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
              <Text className="text-accent text-[11px] font-bold tracking-wider uppercase">
                SYSTEM ONLINE
              </Text>
            </View>
          </View>

          {/* Physique Telemetry / Muscle Tier Rankings */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Activity size={16} color="#06B6D4" />
                <Text className="text-white text-sm font-bold uppercase tracking-wider ml-2">
                  Muscle Rankings // Biometric Tiering
                </Text>
              </View>
              <Text className="text-text-dim text-xs">BodyScan v2.4</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <MetricBadge variant="tier" tier="S" label="Upper Chest" />
              <MetricBadge variant="tier" tier="S" label="Lat Width" />
              <MetricBadge variant="tier" tier="A" label="Lateral Delts" />
              <MetricBadge variant="tier" tier="B" label="Quads" />
              <MetricBadge variant="tier" tier="C" label="Hamstrings" />
            </View>
          </View>

          {/* Graphify Architecture Bridge Card */}
          <GlassCard variant="glow" className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Layers size={18} color="#10B981" />
                <Text className="text-white font-extrabold text-sm tracking-wider uppercase ml-2">
                  Graphify Knowledge Graph
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded bg-accent/20 border border-accent/40">
                <Text className="text-accent text-[10px] font-bold">AST LINKED</Text>
              </View>
            </View>

            <Text className="text-text-dim text-xs leading-5 mb-3">
              Direct ontology mapping with zero context rot:
            </Text>

            {/* Pipeline Step 1 */}
            <View className="p-2.5 rounded-xl bg-obsidian/80 border border-border-dark mb-2">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-white font-mono text-xs font-semibold">[User]</Text>
                <Text className="text-accent font-mono text-[11px] mx-1.5">➔ HAS_MANY ➔</Text>
                <Text className="text-white font-mono text-xs font-semibold">[BodyScan]</Text>
                <Text className="text-accent font-mono text-[11px] mx-1.5">➔ GENERATES ➔</Text>
                <Text className="text-accent font-mono text-xs font-bold">[MuscleRankings]</Text>
              </View>
            </View>

            {/* Pipeline Step 2 */}
            <View className="p-2.5 rounded-xl bg-obsidian/80 border border-border-dark">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-white font-mono text-xs font-semibold">[FridgeScan]</Text>
                <Text className="text-neon-cyan font-mono text-[11px] mx-1.5">➔ DETECTS ➔</Text>
                <Text className="text-white font-mono text-xs font-semibold">[Ingredients]</Text>
                <Text className="text-neon-cyan font-mono text-[11px] mx-1.5">+ [Macros] ➔</Text>
                <Text className="text-neon-cyan font-mono text-xs font-bold">[SmartRecipes]</Text>
              </View>
            </View>
          </GlassCard>

          {/* Daily Target Macros Card */}
          <GlassCard variant="elevated" className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Flame size={18} color="#10B981" />
                <Text className="text-white font-extrabold text-sm tracking-wider uppercase ml-2">
                  Daily Target Macros
                </Text>
              </View>
              <Text className="text-text-dim text-xs font-semibold">2,580 KCAL</Text>
            </View>

            <View className="grid grid-cols-3 flex-row gap-2.5">
              <View className="flex-1">
                <MetricBadge label="Protein" value="215" unit="g" color="emerald" />
              </View>
              <View className="flex-1">
                <MetricBadge label="Carbs" value="260" unit="g" color="cyan" />
              </View>
              <View className="flex-1">
                <MetricBadge label="Fats" value="65" unit="g" color="muted" />
              </View>
            </View>
          </GlassCard>

          {/* Active Workout Protocol */}
          <GlassCard variant="default" className="mb-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-accent text-[11px] font-bold tracking-widest uppercase">
                ACTIVE HYPERTROPHY PROTOCOL
              </Text>
              <ShieldCheck size={16} color="#10B981" />
            </View>

            <Text className="text-white text-lg font-black tracking-tight mb-3">
              Incline DB Chest Press (30°)
            </Text>

            <View className="flex-row gap-2 justify-between">
              <MetricBadge variant="load" label="Load" value="100" unit="lbs" />
              <MetricBadge variant="load" label="Volume" value="4" unit="sets" />
              <MetricBadge variant="load" label="Target" value="8-10" unit="reps" />
              <MetricBadge variant="load" label="Effort" value="9.0" unit="RPE" />
            </View>
          </GlassCard>

          {/* Action CTAs */}
          <View className="gap-3">
            <GlowButton
              title="INITIALIZE BODY SCAN"
              variant="emerald"
              size="lg"
              icon={<Zap size={18} color="#090A0F" />}
              onPress={handleStartScan}
            />

            <GlowButton
              title="SCAN FRIDGE FOR MACROS"
              variant="cyan"
              size="md"
              icon={<Camera size={18} color="#090A0F" />}
              onPress={handleFridgeScan}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
