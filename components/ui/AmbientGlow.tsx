import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface AmbientGlowProps {
  color?: string;
  size?: number;
  opacity?: number;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  className?: string;
}

export default function AmbientGlow({
  color = '#DC2626',
  size = 300,
  opacity = 0.22,
  top,
  left,
  right,
  bottom,
  className = '',
}: AmbientGlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          top,
          left,
          right,
          bottom,
          pointerEvents: 'none' as any,
        },
      ]}
      className={className}
    >
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="50%" stopColor={color} stopOpacity={opacity * 0.4} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#glowGrad)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
});
