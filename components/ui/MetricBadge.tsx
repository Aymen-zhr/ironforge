import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';

export type TierLevel = 'S' | 'A' | 'B' | 'C';

export interface MetricBadgeProps {
  label?: string;
  value?: string | number;
  unit?: string;
  tier?: TierLevel;
  variant?: 'tier' | 'macro' | 'load' | 'status';
  color?: 'blood' | 'rust' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'muted';
  size?: 'sm' | 'md' | 'lg';
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
  size = 'md',
  icon,
  className = '',
  style,
}) => {
  // Determine color theme based on tier or explicit color prop
  const resolvedColor = (() => {
    if (color) return color;
    if (tier === 'S') return 'blood';
    if (tier === 'A') return 'amber';
    if (tier === 'B') return 'muted';
    if (tier === 'C') return 'rust';
    return 'blood';
  })();

  const getColorClasses = () => {
    switch (resolvedColor) {
      case 'blood':
        return {
          container: 'bg-[#DC2626]/15 border-red-600/40 shadow-sm shadow-red-600/20',
          text: 'text-[#DC2626]',
          subtext: 'text-[#DC2626]/80',
        };
      case 'rust':
        return {
          container: 'bg-[#7F1D1D]/25 border-red-900/50',
          text: 'text-[#F87171]',
          subtext: 'text-[#F87171]/80',
        };
      case 'cyan':
        return {
          container: 'bg-[#06B6D4]/10 border-[#06B6D4]/30',
          text: 'text-[#06B6D4]',
          subtext: 'text-[#06B6D4]/80',
        };
      case 'amber':
        return {
          container: 'bg-amber-500/15 border-amber-500/40',
          text: 'text-amber-400',
          subtext: 'text-amber-400/80',
        };
      case 'rose':
        return {
          container: 'bg-rose-500/15 border-rose-500/40',
          text: 'text-rose-400',
          subtext: 'text-rose-400/80',
        };
      case 'muted':
        return {
          container: 'bg-[#0D0D11] border-white/[0.07]',
          text: 'text-[#71717A]',
          subtext: 'text-[#71717A]/70',
        };
      case 'emerald':
      default:
        return {
          container: 'bg-[#DC2626]/15 border-red-600/40',
          text: 'text-[#DC2626]',
          subtext: 'text-[#DC2626]/80',
        };
    }
  };

  const colors = getColorClasses();

  if (variant === 'tier') {
    return (
      <View
        className={`flex-row items-center self-start rounded-xl px-2.5 py-1 border ${colors.container} ${className}`}
        style={style}
      >
        {icon && <View className="mr-1.5">{icon}</View>}
        {label && (
          <Text className="text-[#71717A] text-[9.5px] font-bold tracking-widest uppercase mr-1.5">
            {label}
          </Text>
        )}
        <View className="px-1.5 py-0.5 rounded-lg bg-[#0D0D11] border border-white/[0.08]">
          <Text className={`font-mono font-black text-xs tracking-tight ${colors.text}`}>
            {tier ? `TIER ${tier}` : value}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'load') {
    return (
      <View
        className={`rounded-xl px-3 py-2 bg-[#0D0D11]/90 border border-white/[0.07] flex-col items-center justify-center min-w-[72px] ${className}`}
        style={style}
      >
        {label && (
          <Text className="text-[#71717A] text-[9.5px] font-bold tracking-widest uppercase mb-0.5">
            {label}
          </Text>
        )}
        <View className="flex-row items-baseline">
          <Text className="text-[#F4F4F5] font-mono font-black text-base tracking-tight">
            {value}
          </Text>
          {unit && (
            <Text className="text-[#71717A] font-mono text-[10px] font-semibold ml-1">
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
      className={`rounded-xl px-3 py-2 border ${colors.container} bg-[#0D0D11]/90 flex-col ${className}`}
      style={style}
    >
      <View className="flex-row items-center justify-between mb-1">
        {label && (
          <Text className="text-[#71717A] text-[9.5px] font-bold tracking-widest uppercase">
            {label}
          </Text>
        )}
        {icon && <View>{icon}</View>}
      </View>
      <View className="flex-row items-baseline">
        <Text className={`font-mono font-black text-lg tracking-tight ${colors.text}`}>
          {value}
        </Text>
        {unit && (
          <Text className="font-mono text-[#71717A] font-semibold text-xs ml-1">
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
};

export default MetricBadge;
