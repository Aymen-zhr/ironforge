import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CircularDialProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  color?: string;
  gradientColors?: [string, string];
  trackColor?: string;
  valueText?: string;
  unitText?: string;
  labelText?: string;
  children?: React.ReactNode;
}

export default function CircularDial({
  size = 140,
  strokeWidth = 10,
  progress = 0,
  color = '#FF5A1F',
  gradientColors,
  trackColor = 'rgba(255, 255, 255, 0.06)',
  valueText,
  unitText,
  labelText,
  children,
}: CircularDialProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const gradientId = `dialGrad_${Math.random().toString(36).substring(2, 7)}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {gradientColors && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}

        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated / Progress Foreground Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientColors ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {children ? (
          children
        ) : (
          <>
            {valueText !== undefined && (
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{valueText}</Text>
                {unitText && <Text style={styles.unitText}>{unitText}</Text>}
              </View>
            )}
            {labelText && <Text style={styles.labelText}>{labelText}</Text>}
          </>
        )}
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
