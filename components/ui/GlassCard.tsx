import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import SmoothPressable from './SmoothPressable';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glow' | 'blood-glow' | 'cyan-glow' | 'bento' | 'highlighted';
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
      case 'highlighted':
      case 'glow':
        return 'bg-[#1A1B24] border-[#FF5A1F]/30 shadow-lg shadow-[#FF5A1F]/10 rounded-3xl p-5';
      case 'cyan-glow':
        return 'bg-[#1A1B24] border-cyan-500/20 shadow-lg shadow-cyan-500/10 rounded-3xl p-5';
      case 'blood-glow':
        return 'bg-[#1A1B24] border-rose-500/20 shadow-lg shadow-rose-500/10 rounded-3xl p-5';
      case 'bento':
        return 'bg-[#17181F] border-white/[0.06] rounded-3xl p-5';
      case 'elevated':
        return 'bg-[#1E2029] border-white/[0.07] rounded-3xl p-5';
      case 'default':
      default:
        return 'bg-[#17181F] border-white/[0.06] rounded-3xl p-5';
    }
  };

  const baseClasses = `border ${getVariantClasses()} ${className}`;

  if (onPress) {
    return (
      <SmoothPressable
        onPress={onPress}
        className={baseClasses}
        style={style}
      >
        {children}
      </SmoothPressable>
    );
  }

  return (
    <View className={baseClasses} style={style}>
      {children}
    </View>
  );
};

export default GlassCard;
