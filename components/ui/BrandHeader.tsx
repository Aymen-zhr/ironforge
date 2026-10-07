import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  onProfilePress?: () => void;
  showStatus?: boolean;
}

export default function BrandHeader({
  title = 'IRONFORGE',
  subtitle = 'NEURAL HYPERTROPHY ENGINE',
  onProfilePress,
  showStatus = true,
}: BrandHeaderProps) {
  const handleProfilePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    if (onProfilePress) onProfilePress();
  };

  return (
    <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#0D0D11]/95">
      <View className="flex-row items-center">
        {/* Emblem Logo */}
        <View className="w-10 h-10 rounded-xl overflow-hidden border border-red-600/30 bg-[#0A0A0C] shadow-lg shadow-red-600/20 mr-3">
          <Image
            source={require('../../assets/generated/logo.jpg')}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View>
          <View className="flex-row items-center">
            <Text className="text-[#F4F4F5] font-black text-lg tracking-tight">
              {title}
            </Text>
            <View className="ml-2 px-1.5 py-0.5 rounded-md bg-blood-red/20 border border-red-600/40">
              <Text className="text-blood-red text-[8.5px] font-black tracking-widest uppercase">
                v2.5
              </Text>
            </View>
          </View>
          <Text className="text-[#71717A] text-[9.5px] font-bold tracking-widest uppercase">
            {subtitle}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {showStatus && (
          <View className="flex-row items-center px-2 py-1 rounded-lg bg-[#0A0A0C]/90 border border-white/[0.07]">
            <View className="w-1.5 h-1.5 rounded-full bg-blood-red mr-1.5" />
            <Text className="text-[#71717A] text-[8.5px] font-black tracking-widest uppercase">
              ATHLETE
            </Text>
          </View>
        )}

        {onProfilePress && (
          <Pressable
            onPress={handleProfilePress}
            className="w-8 h-8 rounded-lg bg-[#0D0D11] border border-white/[0.08] items-center justify-center active:opacity-75"
          >
            <User size={15} color="#F4F4F5" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
