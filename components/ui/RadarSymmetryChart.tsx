import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface MuscleAxisValue {
  label: string;
  value: number; // 0 to 100
}

interface RadarSymmetryChartProps {
  size?: number;
  data?: MuscleAxisValue[];
}

const DEFAULT_AXES: MuscleAxisValue[] = [
  { label: 'CHEST', value: 78 },
  { label: 'DELTS', value: 85 },
  { label: 'ARMS', value: 72 },
  { label: 'LATS', value: 88 },
  { label: 'QUADS', value: 65 },
  { label: 'HAMS', value: 58 },
];

export default function RadarSymmetryChart({
  size = 240,
  data = DEFAULT_AXES,
}: RadarSymmetryChartProps) {
  const center = size / 2;
  const radius = center - 35; // Leave margin for labels
  const totalAxes = data.length;

  // Helper to compute (x, y) given angle and radius ratio
  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const x = center + radius * ratio * Math.cos(angle);
    const y = center + radius * ratio * Math.sin(angle);
    return { x, y };
  };

  // Helper to compute polygon points string
  const getPolygonPoints = (ratio: number) => {
    return Array.from({ length: totalAxes })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // User polygon points based on data values
  const userPolygonPoints = data
    .map((item, i) => {
      const ratio = Math.max(0.15, Math.min(1.0, item.value / 100));
      const { x, y } = getCoordinates(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View className="items-center justify-center my-2" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#DC2626" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#991B1B" stopOpacity="0.15" />
          </LinearGradient>
        </Defs>

        {/* Concentric Guide Hexagons */}
        <Polygon
          points={getPolygonPoints(1.0)}
          stroke="#1F1F26"
          strokeWidth="1.5"
          fill="transparent"
        />
        <Polygon
          points={getPolygonPoints(0.66)}
          stroke="#191920"
          strokeWidth="1"
          fill="transparent"
        />
        <Polygon
          points={getPolygonPoints(0.33)}
          stroke="#14141A"
          strokeWidth="1"
          fill="transparent"
        />

        {/* Ideal IFBB Benchmark Boundary (Dashed) */}
        <Polygon
          points={getPolygonPoints(0.92)}
          stroke="#DC2626"
          strokeWidth="1"
          strokeDasharray="4,4"
          strokeOpacity="0.4"
          fill="transparent"
        />

        {/* Radiating Axis Lines */}
        {Array.from({ length: totalAxes }).map((_, i) => {
          const outer = getCoordinates(i, 1.0);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#22222C"
              strokeWidth="1"
            />
          );
        })}

        {/* User's Actual Biomechanics Polygon */}
        <Polygon
          points={userPolygonPoints}
          stroke="#DC2626"
          strokeWidth="2"
          fill="url(#radarFill)"
        />

        {/* Vertex Dots */}
        {data.map((item, i) => {
          const ratio = Math.max(0.15, Math.min(1.0, item.value / 100));
          const pt = getCoordinates(i, ratio);
          return (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#F3F4F6"
              stroke="#DC2626"
              strokeWidth="1.5"
            />
          );
        })}
      </Svg>

      {/* Axis Labels positioned around perimeter */}
      {data.map((item, i) => {
        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
        const labelRadius = radius + 18;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);

        return (
          <View
            key={`label-${i}`}
            className="absolute items-center justify-center"
            style={{
              left: x - 26,
              top: y - 10,
              width: 52,
              height: 20,
            }}
          >
            <Text
              className={`text-[8.5px] font-black tracking-widest text-center ${
                item.value < 65 ? 'text-blood-red' : 'text-[#71717A]'
              }`}
            >
              {item.label}
            </Text>
            <Text className="text-[8.5px] font-mono font-bold text-[#F4F4F5] text-center leading-none mt-0.5">
              {item.value}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}
