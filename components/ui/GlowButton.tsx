import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export interface GlowButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'emerald' | 'cyan' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlowButton: React.FC<GlowButtonProps> = ({
  title,
  onPress,
  variant = 'emerald',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  style,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getContainerStyles = () => {
    switch (variant) {
      case 'cyan':
        return 'bg-neon-cyan border border-cyan-300/40';
      case 'outline':
        return 'bg-transparent border border-accent/60';
      case 'ghost':
        return 'bg-surface-card border border-border-dark';
      case 'emerald':
      default:
        return 'bg-accent border border-emerald-400/40';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'cyan':
        return 'text-obsidian font-extrabold';
      case 'outline':
        return 'text-accent font-bold';
      case 'ghost':
        return 'text-white font-semibold';
      case 'emerald':
      default:
        return 'text-obsidian font-extrabold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3.5 rounded-lg';
      case 'lg':
        return 'py-4 px-6 rounded-2xl';
      case 'md':
      default:
        return 'py-3.5 px-5 rounded-xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs tracking-wider uppercase';
      case 'lg':
        return 'text-base tracking-widest uppercase';
      case 'md':
      default:
        return 'text-sm tracking-wider uppercase';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, style]}
      className={`flex-row items-center justify-center ${getSizeStyles()} ${getContainerStyles()} ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#10B981' : '#090A0F'}
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
    </AnimatedPressable>
  );
};

export default GlowButton;
