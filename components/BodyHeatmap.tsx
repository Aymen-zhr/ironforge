import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Body, { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';
import SegmentedControl from './ui/SegmentedControl';
import {
  computeHeatmapData,
  calculateVolumeLoadByMuscle,
  SLUG_DISPLAY_NAMES,
  SLUG_PERSPECTIVES,
  ExerciseVolumeItem,
} from '../utils/muscleMapping';

export type HeatmapTheme = 'green' | 'amber';

export interface BodyHeatmapProps {
  /**
   * Pre-computed muscle data for the highlighter.
   * If not provided, will be dynamically calculated from `exercises`.
   */
  data?: ExtendedBodyPart[];

  /**
   * List of workout exercises with sets/weights to compute dynamic volume load.
   */
  exercises?: ExerciseVolumeItem[];

  /**
   * Heatmap color scale theme.
   * - 'green': ['#15803D', '#22C55E', '#4ADE80'] (Default)
   * - 'amber': ['#78350F', '#D97706', '#F59E0B']
   */
  colorTheme?: HeatmapTheme;

  /**
   * Custom intensity colors (array of 3 hex colors).
   * Overrides `colorTheme` if specified.
   */
  highlightColors?: string[];

  /**
   * Current perspective ('front' | 'back').
   * If omitted, component manages perspective internally.
   */
  perspective?: 'front' | 'back';

  /**
   * Initial perspective when uncontrolled ('front' | 'back').
   */
  initialPerspective?: 'front' | 'back';

  /**
   * Callback invoked when perspective changes.
   */
  onPerspectiveChange?: (perspective: 'front' | 'back') => void;

  /**
   * Currently active/selected muscle slug filter.
   */
  selectedMuscle?: Slug | null;

  /**
   * Callback invoked when a muscle group is tapped.
   */
  onMusclePress?: (slug: Slug, displayName: string) => void;

  /**
   * Subject gender geometry.
   */
  gender?: 'male' | 'female';

  /**
   * Scale factor for the anatomical SVG. Default 0.88.
   */
  scale?: number;

  /**
   * Whether to show the FRONT / BACK segmented toggle. Default true.
   */
  showPerspectiveToggle?: boolean;

  /**
   * Whether to show the intensity color legend at the bottom. Default true.
   */
  showLegend?: boolean;

  /**
   * Optional title header above the heatmap.
   */
  title?: string;

  /**
   * Optional subtitle or target volume summary.
   */
  subtitle?: string;

  /**
   * Container style overrides.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Tailwind class overrides for container.
   */
  className?: string;

  /**
   * Whether the heatmap is interactive (can tap muscles). Default true.
   */
  interactive?: boolean;
}

const GREEN_SCALE = ['#15803D', '#22C55E', '#4ADE80'];
const AMBER_SCALE = ['#78350F', '#D97706', '#F59E0B'];

export function BodyHeatmap({
  data: explicitData,
  exercises = [],
  colorTheme = 'green',
  highlightColors,
  perspective: controlledPerspective,
  initialPerspective = 'front',
  onPerspectiveChange,
  selectedMuscle = null,
  onMusclePress,
  gender = 'male',
  scale = 0.88,
  showPerspectiveToggle = true,
  showLegend = true,
  title,
  subtitle,
  style,
  interactive = true,
}: BodyHeatmapProps) {
  const [internalPerspective, setInternalPerspective] = useState<'front' | 'back'>(
    initialPerspective
  );

  const activePerspective = controlledPerspective ?? internalPerspective;

  const colors = useMemo(() => {
    if (highlightColors && highlightColors.length > 0) {
      return highlightColors;
    }
    return colorTheme === 'amber' ? AMBER_SCALE : GREEN_SCALE;
  }, [colorTheme, highlightColors]);

  // Accent highlight color for the actively selected muscle
  const selectedAccentColor = useMemo(() => {
    return colorTheme === 'amber' ? '#F59E0B' : '#4ADE80';
  }, [colorTheme]);

  // Compute volume load per muscle
  const volumeMap = useMemo<Partial<Record<Slug, number>>>(() => {
    if (exercises.length === 0) return {};
    return calculateVolumeLoadByMuscle(exercises);
  }, [exercises]);

  // Compute heatmap data dynamically if not explicitly passed
  const heatmapData = useMemo(() => {
    if (explicitData && explicitData.length > 0) {
      if (selectedMuscle) {
        return explicitData.map((item) =>
          item.slug === selectedMuscle
            ? { ...item, color: selectedAccentColor, intensity: 3 }
            : item
        );
      }
      return explicitData;
    }

    return computeHeatmapData(exercises, {
      maxIntensityLevel: 3,
      selectedSlug: selectedMuscle,
      selectedColor: selectedAccentColor,
    });
  }, [explicitData, exercises, selectedMuscle, selectedAccentColor]);

  // Count active engaged muscle groups
  const engagedMusclesCount = useMemo(() => {
    return heatmapData.filter(
      (d: ExtendedBodyPart) => (d.intensity && d.intensity > 0) || Boolean(d.color)
    ).length;
  }, [heatmapData]);

  // Total volume load sum
  const totalVolumeLoad = useMemo(() => {
    const vals = Object.values(volumeMap) as number[];
    return vals.reduce((acc, v) => acc + v, 0);
  }, [volumeMap]);

  const handleTogglePerspective = (next: 'front' | 'back') => {
    if (next === activePerspective) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (controlledPerspective === undefined) {
      setInternalPerspective(next);
    }
    onPerspectiveChange?.(next);
  };

  const handleBodyPartPress = (part: ExtendedBodyPart) => {
    if (!interactive || !part.slug) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const name = SLUG_DISPLAY_NAMES[part.slug] || part.slug;
    onMusclePress?.(part.slug, name);
  };

  return (
    <View
      style={style}
      className="bg-[#080808] border border-white/[0.06] rounded-3xl p-4 overflow-hidden"
    >
      {/* 1. Header / HUD Bar */}
      <View className="flex-row items-center justify-between pb-3 border-b border-white/[0.04]">
        <View className="flex-1 pr-2">
          {title ? (
            <Text className="text-white text-xs font-black tracking-widest uppercase">
              {title}
            </Text>
          ) : (
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colorTheme === 'amber' ? '#F59E0B' : '#22C55E',
                }}
              />
              <Text className="text-white text-xs font-black tracking-widest uppercase">
                ANATOMICAL LOAD MAP
              </Text>
            </View>
          )}

          <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
            {subtitle
              ? subtitle
              : `${engagedMusclesCount} Active Groups • ${Math.round(
                  totalVolumeLoad
                ).toLocaleString()} KG Volume`}
          </Text>
        </View>

        {/* Segmented Perspective Switcher */}
        {showPerspectiveToggle && (
          <SegmentedControl<'front' | 'back'>
            options={[
              { value: 'front', label: 'FRONT' },
              { value: 'back', label: 'BACK' },
            ]}
            selectedValue={activePerspective}
            onValueChange={handleTogglePerspective}
            accentColor="#1F1F24"
            selectedTextColor="#FFFFFF"
          />
        )}
      </View>

      {/* 2. Active Muscle Filter Indicator */}
      {selectedMuscle && (
        <View className="mt-3 px-3 py-1.5 rounded-xl bg-[#14151C] border border-white/[0.08] flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedAccentColor }}
            />
            <Text className="text-white text-xs font-bold font-mono">
              Filtered: {SLUG_DISPLAY_NAMES[selectedMuscle] || selectedMuscle}
            </Text>
            {Boolean(volumeMap[selectedMuscle]) && (
              <Text className="text-[#A1A1AA] text-[11px] font-mono">
                ({Math.round(volumeMap[selectedMuscle] || 0)} kg)
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onMusclePress?.(selectedMuscle, '');
            }}
            className="p-1 rounded-md bg-white/[0.06] active:opacity-70"
          >
            <Ionicons name="close" size={14} color="#A1A1AA" />
          </Pressable>
        </View>
      )}

      {/* 3. Anatomical SVG Heatmap Canvas */}
      <View className="items-center justify-center my-3 relative min-h-[300px]">
        <Body
          data={heatmapData}
          colors={colors}
          gender={gender}
          side={activePerspective}
          scale={scale}
          border="none"
          defaultFill="#1A1A1A"
          defaultStroke="rgba(255, 255, 255, 0.08)"
          defaultStrokeWidth={0.5}
          onBodyPartPress={handleBodyPartPress}
        />

        {/* Quick flip helper tag */}
        <Pressable
          onPress={() =>
            handleTogglePerspective(activePerspective === 'front' ? 'back' : 'front')
          }
          className="absolute bottom-1 right-2 px-2.5 py-1 rounded-full bg-[#141418] border border-white/[0.08] flex-row items-center gap-1 active:opacity-75"
        >
          <Ionicons name="sync-outline" size={12} color="#A1A1AA" />
          <Text className="text-[#A1A1AA] text-[10px] font-mono uppercase">
            {activePerspective === 'front' ? 'View Back' : 'View Front'}
          </Text>
        </Pressable>
      </View>

      {/* 4. Intensity Legend */}
      {showLegend && (
        <View className="pt-2 border-t border-white/[0.04] flex-row items-center justify-between">
          <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
            Intensity:
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2.5 h-2.5 rounded-sm bg-[#1A1A1A] border border-white/10" />
              <Text className="text-[#71717A] text-[10px] font-mono">Rest</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: colors[0] }}
              />
              <Text className="text-[#71717A] text-[10px] font-mono">Low</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: colors[1] }}
              />
              <Text className="text-[#71717A] text-[10px] font-mono">Med</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: colors[2] }}
              />
              <Text className="text-[#71717A] text-[10px] font-mono">Peak</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default BodyHeatmap;
