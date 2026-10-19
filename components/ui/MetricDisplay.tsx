import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface MetricDisplayProps {
  value: number | string;
  unit?: string;
  label?: string;
  fractionDigits?: number;
  valueColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  containerStyle?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

/**
 * Standardized Tabular-Numeral Metric Display
 * Enforces monospaced tabular alignment for weights, reps, calories, and time.
 */
export function MetricDisplay({
  value,
  unit,
  label,
  fractionDigits,
  valueColor = '#FFFFFF',
  size = 'md',
  containerStyle,
  valueStyle,
}: MetricDisplayProps) {
  const formattedValue =
    typeof value === 'number' && fractionDigits !== undefined
      ? value.toFixed(fractionDigits)
      : typeof value === 'number'
      ? value.toLocaleString()
      : value;

  const sizeClasses = {
    sm: { value: 'text-sm font-bold', unit: 'text-[10px]', label: 'text-[9px]' },
    md: { value: 'text-lg font-extrabold', unit: 'text-xs', label: 'text-[10px]' },
    lg: { value: 'text-2xl font-black', unit: 'text-sm', label: 'text-xs' },
    xl: { value: 'text-3xl font-black', unit: 'text-base', label: 'text-xs' },
  }[size];

  return (
    <View style={containerStyle} className="items-start">
      {label ? (
        <Text className={`${sizeClasses.label} text-[#71717A] uppercase font-semibold tracking-wider mb-0.5`}>
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-baseline space-x-1">
        <Text
          style={[{ color: valueColor }, valueStyle]}
          className={`${sizeClasses.value} font-mono tracking-tight`}
        >
          {formattedValue}
        </Text>
        {unit ? (
          <Text className={`${sizeClasses.unit} text-[#71717A] font-mono font-medium ml-1`}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default MetricDisplay;
