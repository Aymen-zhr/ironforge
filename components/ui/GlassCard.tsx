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
      case 'blood-glow':
      case 'glow':
      case 'highlighted':
        return 'bg-[#0D0D11]/90 border-red-600/30 shadow-lg shadow-red-600/10 rounded-xl p-4';
      case 'cyan-glow':
        return 'bg-[#0D0D11]/90 border-cyan-500/30 shadow-lg shadow-cyan-500/10 rounded-xl p-4';
      case 'bento':
        return 'bg-[#0D0D11]/90 border-white/[0.07] rounded-xl p-5';
      case 'elevated':
      case 'default':
      default:
        return 'bg-[#0D0D11]/90 border-white/[0.07] rounded-xl p-4';
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
