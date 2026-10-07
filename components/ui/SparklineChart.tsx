import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
}

export default function SparklineChart({
  data = [58, 62, 60, 67, 65, 72, 78],
  width = 120,
  height = 40,
  color = '#DC2626',
  strokeWidth = 2,
  showPoints = true,
}: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Compute points
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((val - min) / range) * innerHeight;
    return { x, y };
  });

  // Construct smooth Bezier curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  // Construct fill path
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const fillPathD = `${pathD} L ${lastPt.x} ${height} L ${firstPt.x} ${height} Z`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Gradient Area Fill */}
        <Path d={fillPathD} fill="url(#sparkGrad)" />

        {/* Smooth Curve Line */}
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last Point Glow Dot */}
        {showPoints && (
          <Circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="3"
            fill="#FFFFFF"
            stroke={color}
            strokeWidth="2"
          />
        )}
      </Svg>
    </View>
  );
}
