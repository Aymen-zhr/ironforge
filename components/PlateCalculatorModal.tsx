import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  targetWeightKg: number;
  barWeightKg?: number;
}

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export default function PlateCalculatorModal({
  visible,
  onClose,
  targetWeightKg,
  barWeightKg = 20,
}: PlateCalculatorModalProps) {
  const [currentWeight, setCurrentWeight] = useState<number>(targetWeightKg);
  const [barWeight, setBarWeight] = useState<number>(barWeightKg);

  // Sync if prop changes
  React.useEffect(() => {
    setCurrentWeight(targetWeightKg);
  }, [targetWeightKg]);

  const calculatePlates = (target: number, bar: number) => {
    const weightPerSide = Math.max(0, (target - bar) / 2);
    let remaining = weightPerSide;
    const platesUsed: { weight: number; count: number }[] = [];

    for (const plate of AVAILABLE_PLATES) {
      if (remaining >= plate) {
        const count = Math.floor(remaining / plate);
        platesUsed.push({ weight: plate, count });
        remaining = Math.round((remaining - count * plate) * 100) / 100;
      }
    }

    return { weightPerSide, platesUsed, remaining };
  };

  const { weightPerSide, platesUsed, remaining } = calculatePlates(currentWeight, barWeight);

  const getPlateColor = (w: number) => {
    switch (w) {
      case 25: return '#E11D48'; // Red
      case 20: return '#0A84FF'; // Blue
      case 15: return '#EAB308'; // Yellow
      case 10: return '#30D158'; // Green
      case 5: return '#FFFFFF';  // White
      case 2.5: return '#94A3B8'; // Silver
      default: return '#64748B'; // Gray
    }
  };

  const getPlateHeight = (w: number) => {
    switch (w) {
      case 25: return 56;
      case 20: return 52;
      case 15: return 46;
      case 10: return 40;
      case 5: return 32;
      default: return 24;
    }
  };

  const adjustWeight = (delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCurrentWeight((w) => Math.max(barWeight, Math.round((w + delta) * 10) / 10));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/85 items-center justify-center px-5">
        <View className="w-full max-w-sm rounded-3xl bg-[#12141A] border border-white/10 p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-2 border-b border-white/[0.08]">
            <View>
              <Text className="text-white text-base font-black tracking-tight uppercase">
                Olympic Plate Engine
              </Text>
              <Text className="text-[#8E8E93] text-xs font-mono mt-0.5">
                Barbell sleeve configuration
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:opacity-75"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Target Weight Summary & Steppers */}
          <View className="p-4 rounded-2xl bg-black/60 border border-white/[0.06] items-center">
            <Text className="text-[#8E8E93] text-[10px] font-mono uppercase tracking-wider mb-1">
              TOTAL TARGET LOAD
            </Text>
            <View className="flex-row items-center gap-4 my-1">
              <Pressable
                onPress={() => adjustWeight(-2.5)}
                className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center active:opacity-70"
              >
                <Text className="text-white text-sm font-bold font-mono">-2.5</Text>
              </Pressable>
              <Text className="text-white text-3xl font-black font-mono">
                {currentWeight} <Text className="text-[#10E760] text-lg">KG</Text>
              </Text>
              <Pressable
                onPress={() => adjustWeight(2.5)}
                className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center active:opacity-70"
              >
                <Text className="text-white text-sm font-bold font-mono">+2.5</Text>
              </Pressable>
            </View>
            <Text className="text-[#10E760] text-xs font-mono font-bold mt-1">
              {weightPerSide} KG per sleeve ({barWeight}kg Olympic bar)
            </Text>
          </View>

          {/* Visual Barbell Sleeve Graphic */}
          <View className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] items-center justify-center">
            <View className="h-16 w-full flex-row items-center justify-center relative">
              {/* Barbell Shaft */}
              <View className="h-3 w-full bg-[#334155] rounded-full absolute" />
              {/* Barbell Collar / Stopper */}
              <View className="w-3 h-12 bg-[#64748B] rounded-sm absolute left-12 border border-white/20" />

              {/* Rendered Plates on Sleeve */}
              <View className="flex-row items-center gap-1.5 pl-24">
                {platesUsed.flatMap((p) =>
                  Array.from({ length: p.count }).map((_, i) => (
                    <View
                      key={`${p.weight}-${i}`}
                      style={{
                        backgroundColor: getPlateColor(p.weight),
                        height: getPlateHeight(p.weight),
                        width: 10,
                      }}
                      className="rounded-sm border border-black/40 shadow-sm"
                    />
                  ))
                )}
                {platesUsed.length === 0 && (
                  <Text className="text-[#64748B] text-[10px] font-mono">Empty Bar</Text>
                )}
              </View>
            </View>
          </View>

          {/* Bar Selector */}
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[#8E8E93] text-xs font-mono">Barbell Type</Text>
            <View className="flex-row gap-2">
              {[
                { weight: 20, label: '20kg Olympic' },
                { weight: 15, label: '15kg Women' },
                { weight: 10, label: '10kg EZ' },
              ].map((b) => (
                <Pressable
                  key={b.weight}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setBarWeight(b.weight);
                  }}
                  className={`py-1 px-2.5 rounded-lg border ${
                    barWeight === b.weight ? 'bg-white border-white' : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-mono font-bold ${
                      barWeight === b.weight ? 'text-black' : 'text-[#8E8E93]'
                    }`}
                  >
                    {b.weight}kg
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Plate List Breakdown */}
          <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
            <View className="gap-1.5">
              {platesUsed.map((p, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{ backgroundColor: getPlateColor(p.weight) }}
                      className="w-3 h-5 rounded-sm"
                    />
                    <Text className="text-white text-xs font-mono font-bold">
                      {p.weight} KG Plate
                    </Text>
                  </View>
                  <Text className="text-white text-xs font-mono font-bold">
                    {p.count} × each side
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Close Action */}
          <Pressable
            onPress={onClose}
            className="w-full py-3.5 rounded-xl bg-white items-center justify-center active:opacity-85"
          >
            <Text className="text-black text-xs font-bold uppercase tracking-wider">
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
