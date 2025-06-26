import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface RecordingProgressRingProps {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const RecordingProgressRing: React.FC<RecordingProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 4,
  color = '#FF3B30', // iOS recording red
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute' }}
      viewBox={`0 0 ${size} ${size}`}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default RecordingProgressRing; 