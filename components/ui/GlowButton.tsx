import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface GlowButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'blood' | 'emerald' | 'cyan' | 'amber' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  title,
  onPress,
  variant = 'blood',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  style,
}) => {
  const handlePress = (e: any) => {
    if (!disabled && !loading) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      if (onPress) onPress();
    }
  };

  const getContainerStyles = () => {
    switch (variant) {
      case 'blood':
        return 'bg-blood-red border border-red-500/60 shadow-lg shadow-red-600/30';
      case 'amber':
        return 'bg-amber-600 border border-amber-500/50 shadow-md shadow-amber-600/25';
      case 'cyan':
        return 'bg-cyan-500 border border-cyan-400/50 shadow-md shadow-cyan-500/25';
      case 'outline':
        return 'bg-transparent border border-blood-red/60';
      case 'ghost':
        return 'bg-[#0D0D11]/90 border border-white/[0.07]';
      case 'emerald':
      default:
        return 'bg-blood-red border border-red-500/60 shadow-lg shadow-red-600/30';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'blood':
        return 'text-[#F4F4F5] font-black tracking-widest';
      case 'amber':
        return 'text-[#F4F4F5] font-black tracking-widest';
      case 'cyan':
        return 'text-[#0D0D11] font-black tracking-widest';
      case 'outline':
        return 'text-blood-red font-black tracking-widest';
      case 'ghost':
        return 'text-[#F4F4F5] font-bold tracking-widest';
      case 'emerald':
      default:
        return 'text-[#F4F4F5] font-black tracking-widest';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3.5 rounded-lg';
      case 'lg':
        return 'py-3.5 px-6 rounded-xl';
      case 'md':
      default:
        return 'py-3 px-5 rounded-xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-[11px] uppercase tracking-widest';
      case 'lg':
        return 'text-sm uppercase tracking-widest';
      case 'md':
      default:
        return 'text-xs uppercase tracking-widest';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { opacity: pressed ? 0.78 : 1 },
        typeof style === 'function' ? (style as any)({ pressed }) : style,
      ]}
      className={`flex-row items-center justify-center ${getSizeStyles()} ${getContainerStyles()} ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#DC2626' : '#F4F4F5'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' && (
            <View className="mr-2">{icon}</View>
          )}
          <Text className={`${getTextStyles()} ${getTextSizeStyles()}`}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View className="ml-2">{icon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
};

export default GlowButton;
