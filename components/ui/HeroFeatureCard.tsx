import React from 'react';
import { View, Text, Image, ImageSourcePropType, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HeroFeatureCardProps {
  imageSource: ImageSourcePropType;
  tag: string;
  title: string;
  subtitle: string;
  actionText?: string;
  badge?: string;
  onPress: () => void;
  accentColor?: string;
}

export default function HeroFeatureCard({
  imageSource,
  tag,
  title,
  subtitle,
  actionText = 'LAUNCH',
  badge,
  onPress,
  accentColor = '#DC2626',
}: HeroFeatureCardProps) {
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    if (onPress) onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
      className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0D0D11]/90 shadow-xl mb-3.5"
    >
      {/* Background Hero Image */}
      <View pointerEvents="none" className="h-40 w-full relative">
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Cinematic Gradient Overlays */}
        <View pointerEvents="none" className="absolute inset-0 bg-[#0A0A0C]/70" />
        <View pointerEvents="none" className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/50 to-transparent" />

        {/* Top Badges */}
        <View className="absolute top-3 left-3 right-3 flex-row items-center justify-between">
          <View className="px-2.5 py-1 rounded-lg bg-[#0A0A0C]/90 border border-white/[0.08] flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: accentColor }} />
            <Text className="text-[9.5px] font-black uppercase tracking-widest text-[#F4F4F5]">
              {tag}
            </Text>
          </View>

          {badge && (
            <View className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-600/40">
              <Text className="text-[9.5px] font-black uppercase tracking-widest text-blood-red">
                {badge}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Content Header */}
        <View className="absolute bottom-3 left-3 right-3 flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[#F4F4F5] font-black text-xl tracking-tight leading-tight">
              {title}
            </Text>
            <Text className="text-[#71717A] text-xs font-semibold mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <View className="flex-row items-center px-3 py-1.5 rounded-lg bg-blood-red border border-red-500/60 shadow-md shadow-red-600/30">
            <Text className="text-[#0A0A0C] font-black text-[10px] tracking-widest uppercase mr-1">
              {actionText}
            </Text>
            <ChevronRight size={13} color="#0A0A0C" strokeWidth={3} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
