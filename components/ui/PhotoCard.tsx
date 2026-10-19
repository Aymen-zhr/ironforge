import React from 'react';
import {
  View,
  Text,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PhotoCardProps {
  imageSource: ImageSourcePropType | string;
  tag?: string;
  tagColor?: string;
  title: string;
  subtitle?: string;
  meta?: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
  actionLabel?: string;
  onActionPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  aspectRatio?: number; // e.g. 16/9 = 1.77
}

export default function PhotoCard({
  imageSource,
  tag,
  tagColor = '#FF5A1F',
  title,
  subtitle,
  meta,
  actionLabel,
  onActionPress,
  className = '',
  style,
  aspectRatio = 16 / 9,
}: PhotoCardProps) {
  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  return (
    <View
      className={`rounded-3xl overflow-hidden bg-[#17181F] border border-white/[0.06] shadow-xl ${className}`}
      style={style}
    >
      {/* Background Image Container */}
      <View style={{ width: '100%', aspectRatio }} className="relative bg-[#0F1014]">
        <ExpoImage
          source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={250}
        />

        {/* Ambient Top & Bottom Scrims */}
        <View className="absolute inset-0 bg-black/25" />
        <View className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#17181F] via-[#17181F]/70 to-transparent" />

        {/* Optional Tag Chip */}
        {tag && (
          <View className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex-row items-center space-x-1.5">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: tagColor }} />
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </Text>
          </View>
        )}
      </View>

      {/* Card Content & Action Area */}
      <View className="p-5 pt-3 bg-[#17181F]">
        <Text className="text-white text-xl font-bold tracking-tight mb-1">
          {title}
        </Text>

        {subtitle && (
          <Text className="text-slate-400 text-xs leading-5 mb-3.5">
            {subtitle}
          </Text>
        )}

        {/* Meta Stats Row */}
        {meta && meta.length > 0 && (
          <View className="flex-row items-center space-x-4 mb-4 pt-1">
            {meta.map((item, idx) => (
              <View key={idx} className="flex-row items-center space-x-1.5">
                <Ionicons name={item.icon} size={13} color="#94A3B8" />
                <Text className="text-slate-300 text-xs font-medium">
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        {actionLabel && (
          <Pressable
            onPress={() => {
              triggerHaptic();
              onActionPress?.();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center flex-row space-x-2 active:opacity-90 shadow-md shadow-[#FF5A1F]/20"
          >
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
