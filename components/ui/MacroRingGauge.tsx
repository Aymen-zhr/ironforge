import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MacroRingGaugeProps {
  size?: number;
  caloriesCurrent: number;
  caloriesTarget: number;
  proteinCurrent: number;
  proteinTarget: number;
  waterCurrentMl: number;
  waterTargetMl: number;
}

export default function MacroRingGauge({
  size = 180,
  caloriesCurrent,
  caloriesTarget,
  proteinCurrent,
  proteinTarget,
  waterCurrentMl,
  waterTargetMl,
}: MacroRingGaugeProps) {
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 4;

  // Radii
  const rCal = center - strokeWidth / 2 - 2;
  const rProt = rCal - strokeWidth - gap;
  const rWater = rProt - strokeWidth - gap;

  // Circumferences
  const cCal = 2 * Math.PI * rCal;
  const cProt = 2 * Math.PI * rProt;
  const cWater = 2 * Math.PI * rWater;

  // Progress (clamped 0 to 1)
  const pCal = Math.min(1, Math.max(0, caloriesCurrent / Math.max(1, caloriesTarget)));
  const pProt = Math.min(1, Math.max(0, proteinCurrent / Math.max(1, proteinTarget)));
  const pWater = Math.min(1, Math.max(0, waterCurrentMl / Math.max(1, waterTargetMl)));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#A1A1AA" />
          </LinearGradient>
          <LinearGradient id="protGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#30D158" />
            <Stop offset="100%" stopColor="#248A3D" />
          </LinearGradient>
          <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0A84FF" />
            <Stop offset="100%" stopColor="#0055B3" />
          </LinearGradient>
        </Defs>

        {/* 1. Calories Background Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rCal}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Calories Progress Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rCal}
          stroke="url(#calGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${cCal} ${cCal}`}
          strokeDashoffset={cCal * (1 - pCal)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* 2. Protein Background Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rProt}
          stroke="rgba(48, 209, 88, 0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Protein Progress Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rProt}
          stroke="url(#protGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${cProt} ${cProt}`}
          strokeDashoffset={cProt * (1 - pProt)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* 3. Water Background Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rWater}
          stroke="rgba(10, 132, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Water Progress Ring */}
        <Circle
          cx={center}
          cy={center}
          r={rWater}
          stroke="url(#waterGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${cWater} ${cWater}`}
          strokeDashoffset={cWater * (1 - pWater)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center Readout */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
          {caloriesCurrent}
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase' }}>
          / {caloriesTarget} KCAL
        </Text>
      </View>
    </View>
  );
}
