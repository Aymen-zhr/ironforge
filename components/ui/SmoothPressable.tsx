import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';

interface SmoothPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  className?: string;
  enableHaptics?: boolean;
}

export default function SmoothPressable({
  children,
  style,
  scaleTo = 0.97,
  enableHaptics = true,
  onPress,
  className = '',
  ...props
}: SmoothPressableProps) {
  const handlePress = (event: any) => {
    if (enableHaptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? scaleTo : 1 }],
        },
        typeof style === 'function' ? (style as any)({ pressed }) : style,
      ]}
      className={className}
      {...props}
    >
      {children}
    </Pressable>
  );
}
