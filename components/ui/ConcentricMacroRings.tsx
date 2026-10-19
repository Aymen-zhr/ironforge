import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ConcentricMacroRingsProps {
  size?: number;
  consumedCalories: number;
  targetCalories: number;
  consumedProtein: number;
  targetProtein: number;
  consumedCarbs: number;
  targetCarbs: number;
}

export default function ConcentricMacroRings({
  size = 150,
  consumedCalories = 0,
  targetCalories = 2500,
  consumedProtein = 0,
  targetProtein = 180,
  consumedCarbs = 0,
  targetCarbs = 260,
}: ConcentricMacroRingsProps) {
  const strokeWidth = 8;
  const gap = 4;

  // Outer Ring: Calories (Solar Orange)
  const r1 = (size - strokeWidth) / 2;
  const c1 = 2 * Math.PI * r1;
  const p1 = Math.min(100, Math.max(0, (consumedCalories / Math.max(1, targetCalories)) * 100));
  const offset1 = c1 - (p1 / 100) * c1;

  // Middle Ring: Protein (Crisp Emerald)
  const r2 = r1 - strokeWidth - gap;
  const c2 = 2 * Math.PI * r2;
  const p2 = Math.min(100, Math.max(0, (consumedProtein / Math.max(1, targetProtein)) * 100));
  const offset2 = c2 - (p2 / 100) * c2;

  // Inner Ring: Carbs (Cyan / Sky)
  const r3 = r2 - strokeWidth - gap;
  const c3 = 2 * Math.PI * r3;
  const p3 = Math.min(100, Math.max(0, (consumedCarbs / Math.max(1, targetCarbs)) * 100));
  const offset3 = c3 - (p3 / 100) * c3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track 1 */}
        <Circle cx={size / 2} cy={size / 2} r={r1} stroke="rgba(255, 90, 31, 0.15)" strokeWidth={strokeWidth} fill="none" />
        {/* Fill 1 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r1}
          stroke="#FF5A1F"
          strokeWidth={strokeWidth}
          strokeDasharray={`${c1} ${c1}`}
          strokeDashoffset={offset1}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Track 2 */}
        <Circle cx={size / 2} cy={size / 2} r={r2} stroke="rgba(16, 185, 129, 0.15)" strokeWidth={strokeWidth} fill="none" />
        {/* Fill 2 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeDasharray={`${c2} ${c2}`}
          strokeDashoffset={offset2}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Track 3 */}
        <Circle cx={size / 2} cy={size / 2} r={r3} stroke="rgba(56, 189, 248, 0.15)" strokeWidth={strokeWidth} fill="none" />
        {/* Fill 3 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r3}
          stroke="#38BDF8"
          strokeWidth={strokeWidth}
          strokeDasharray={`${c3} ${c3}`}
          strokeDashoffset={offset3}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center Values */}
      <View style={styles.centerContent}>
        <Text style={styles.calsText}>{consumedCalories}</Text>
        <Text style={styles.calsSub}>/ {targetCalories} KCAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  calsSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
