import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  selectedTextColor?: string;
}

/**
 * Standard Segmented Control
 * Eliminates overlapping pill bugs with flex-1 evenly-spaced tabs.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onValueChange,
  style,
  accentColor = '#FF5A1F',
  selectedTextColor,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={style}
      className="flex-row items-center bg-[#121216] p-1 rounded-2xl border border-white/[0.08]"
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onValueChange(option.value);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl items-center justify-center ${
              isSelected ? '' : 'bg-transparent'
            }`}
            style={isSelected ? { backgroundColor: accentColor } : undefined}
          >
            <Text
              style={isSelected && selectedTextColor ? { color: selectedTextColor } : undefined}
              className={`text-[11px] font-bold tracking-wider ${
                isSelected
                  ? selectedTextColor
                    ? 'font-mono'
                    : 'text-black font-mono'
                  : 'text-[#71717A]'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
