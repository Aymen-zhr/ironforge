import React from 'react';
import { View, Pressable, ViewStyle, StyleProp } from 'react-native';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glow' | 'cyan-glow';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onPress,
  style,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-surface-card border-border-dark shadow-md';
      case 'glow':
        return 'bg-surface border-accent/40 shadow-sm shadow-accent/20';
      case 'cyan-glow':
        return 'bg-surface border-neon-cyan/40 shadow-sm shadow-neon-cyan/20';
      case 'default':
      default:
        return 'bg-surface border-border-dark';
    }
  };

  const baseClasses = `rounded-2xl border p-4 ${getVariantClasses()} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClasses} active:opacity-85 active:scale-[0.99]`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClasses} style={style}>
      {children}
    </View>
  );
};

export default GlassCard;
