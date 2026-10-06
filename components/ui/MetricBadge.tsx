import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';

export type TierLevel = 'S' | 'A' | 'B' | 'C';

export interface MetricBadgeProps {
  label?: string;
  value?: string | number;
  unit?: string;
  tier?: TierLevel;
  variant?: 'tier' | 'macro' | 'load' | 'status';
  color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'muted';
  icon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  unit,
  tier,
  variant = 'macro',
  color,
  icon,
  className = '',
  style,
}) => {
  // Determine color theme based on tier or explicit color prop
  const resolvedColor = (() => {
    if (color) return color;
    if (tier === 'S') return 'emerald';
    if (tier === 'A') return 'cyan';
    if (tier === 'B') return 'muted';
    if (tier === 'C') return 'amber';
    return 'emerald';
  })();

  const getColorClasses = () => {
    switch (resolvedColor) {
      case 'cyan':
        return {
          container: 'bg-[#06B6D4]/10 border-[#06B6D4]/30',
          text: 'text-[#06B6D4]',
          subtext: 'text-[#06B6D4]/80',
        };
      case 'amber':
        return {
          container: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          subtext: 'text-amber-400/80',
        };
      case 'rose':
        return {
          container: 'bg-rose-500/10 border-rose-500/30',
          text: 'text-rose-400',
          subtext: 'text-rose-400/80',
        };
      case 'muted':
        return {
          container: 'bg-[#1E293B]/60 border-[#1E293B]',
          text: 'text-text-dim',
          subtext: 'text-text-dim/70',
        };
      case 'emerald':
      default:
        return {
          container: 'bg-[#10B981]/10 border-[#10B981]/30',
          text: 'text-accent',
          subtext: 'text-accent/80',
        };
    }
  };

  const colors = getColorClasses();

  if (variant === 'tier') {
    return (
      <View
        className={`flex-row items-center self-start rounded-full px-3 py-1 border ${colors.container} ${className}`}
        style={style}
      >
        {icon && <View className="mr-1.5">{icon}</View>}
        {label && (
          <Text className="text-text-dim text-[10px] font-bold tracking-wider uppercase mr-1.5">
            {label}
          </Text>
        )}
        <View className="px-1.5 py-0.5 rounded bg-surface border border-border-dark">
          <Text className={`font-black text-xs ${colors.text}`}>
            {tier ? `TIER ${tier}` : value}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'load') {
    return (
      <View
        className={`rounded-xl px-3 py-2 bg-surface border border-border-dark flex-col items-center justify-center min-w-[72px] ${className}`}
        style={style}
      >
        {label && (
          <Text className="text-text-dim text-[10px] font-semibold tracking-wider uppercase mb-0.5">
            {label}
          </Text>
        )}
        <View className="flex-row items-baseline">
          <Text className="text-white font-extrabold text-base tracking-tight">
            {value}
          </Text>
          {unit && (
            <Text className="text-accent text-[11px] font-bold ml-1">
              {unit}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Default / macro variant
  return (
    <View
      className={`rounded-xl px-3 py-2 border ${colors.container} flex-col ${className}`}
      style={style}
    >
      <View className="flex-row items-center justify-between mb-1">
        {label && (
          <Text className="text-text-dim text-[10px] font-bold tracking-wider uppercase">
            {label}
          </Text>
        )}
        {icon && <View>{icon}</View>}
      </View>
      <View className="flex-row items-baseline">
        <Text className={`font-black text-lg tracking-tight ${colors.text}`}>
          {value}
        </Text>
        {unit && (
          <Text className={`font-semibold text-xs ml-1 ${colors.subtext}`}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
};

export default MetricBadge;
