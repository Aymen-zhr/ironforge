import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedMetricRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  variant?: 'blood' | 'amber' | 'cyan';
}

export default function AnimatedMetricRing({
  score,
  size = 130,
  strokeWidth = 10,
  label,
  sublabel,
  variant = 'blood',
}: AnimatedMetricRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(100, Math.max(0, score)),
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const getGradientColors = () => {
    switch (variant) {
      case 'amber':
        return { start: '#F59E0B', end: '#DC2626' };
      case 'cyan':
        return { start: '#06B6D4', end: '#3B82F6' };
      case 'blood':
      default:
        return { start: '#FF2E4C', end: '#991B1B' };
    }
  };

  const colors = getGradientColors();

  return (
    <View pointerEvents="none" className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} className="rotate-[-90deg]">
        <Defs>
          <LinearGradient id={`ringGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.start} />
            <Stop offset="100%" stopColor={colors.end} />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#14141A"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Stroke */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#ringGradient-${variant})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>

      {/* Center Readout with Monospace Numbers and #F4F4F5 / #71717A */}
      <View className="absolute items-center justify-center">
        <Text className="text-[#F4F4F5] font-mono font-black text-3xl tracking-tight">
          {score}
        </Text>
        {label && (
          <Text className="text-blood-red text-[8.5px] font-black uppercase tracking-widest mt-[-2px]">
            {label}
          </Text>
        )}
        {sublabel && (
          <Text className="text-[#71717A] font-mono text-[8.5px] font-bold uppercase tracking-widest">
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}
