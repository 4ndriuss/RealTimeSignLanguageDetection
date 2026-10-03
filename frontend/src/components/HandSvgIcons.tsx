/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Standard 21 MediaPipe hand landmark connection topology
export const HAND_CONNECTIONS: Array<[number, number]> = [
  // Palm base
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky finger
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];

// Normalized base 21 points for open hand pose
export const DEFAULT_OPEN_HAND_POINTS = [
  { x: 150, y: 260 }, // 0: Wrist
  { x: 115, y: 235 }, // 1: Thumb CMC
  { x: 88, y: 195 },  // 2: Thumb MCP
  { x: 72, y: 160 },  // 3: Thumb IP
  { x: 60, y: 128 },  // 4: Thumb Tip
  { x: 110, y: 155 }, // 5: Index MCP
  { x: 102, y: 112 }, // 6: Index PIP
  { x: 98, y: 78 },   // 7: Index DIP
  { x: 95, y: 48 },   // 8: Index Tip
  { x: 145, y: 150 }, // 9: Middle MCP
  { x: 145, y: 105 }, // 10: Middle PIP
  { x: 145, y: 70 },  // 11: Middle DIP
  { x: 145, y: 38 },  // 12: Middle Tip
  { x: 180, y: 158 }, // 13: Ring MCP
  { x: 185, y: 115 }, // 14: Ring PIP
  { x: 188, y: 82 },  // 15: Ring DIP
  { x: 190, y: 52 },  // 16: Ring Tip
  { x: 215, y: 175 }, // 17: Pinky MCP
  { x: 228, y: 138 }, // 18: Pinky PIP
  { x: 235, y: 110 }, // 19: Pinky DIP
  { x: 240, y: 84 },  // 20: Pinky Tip
];

// Landmark Skeleton Visualizer
interface HandSkeletonProps {
  points?: Array<{ x: number; y: number }>;
  className?: string;
  strokeColor?: string;
  nodeColor?: string;
  activeNodeIndex?: number;
}

export const HandSkeleton: React.FC<HandSkeletonProps> = ({
  points = DEFAULT_OPEN_HAND_POINTS,
  className = "w-full h-full",
  strokeColor = "#d97706",
  nodeColor = "#b45309",
  activeNodeIndex = 8,
}) => {
  return (
    <svg 
      viewBox="0 0 300 300" 
      className={className} 
      aria-hidden="true" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Connection bones */}
      {HAND_CONNECTIONS.map(([startIdx, endIdx], i) => {
        const p1 = points[startIdx] || points[0];
        const p2 = points[endIdx] || points[0];
        return (
          <line
            key={`bone-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
        );
      })}

      {/* Landmark keypoints */}
      {points.map((pt, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const isWrist = idx === 0;
        const isActive = idx === activeNodeIndex;

        return (
          <g key={`pt-${idx}`}>
            {isActive && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r="10"
                fill="url(#nodeGlow)"
                className="animate-ping"
                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
              />
            )}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isTip ? 5 : isWrist ? 6 : 3.5}
              fill={isActive ? "#f59e0b" : isTip ? "#ea580c" : nodeColor}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </svg>
  );
};

// Hand Sign Illustration 1: Salam / Sapaan (Wave Hand)
export const HandWaveIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    aria-hidden="true"
  >
    <path 
      d="M24 40C24 40 18 36 16 30L15 22C14.5 18 17 14 21 14.5C21.5 14.5 22 15 22.5 15.5V9C22.5 7.5 23.5 6.5 25 6.5C26.5 6.5 27.5 7.5 27.5 9V14C28 13.5 29 13 30 13C31.5 13 32.5 14 32.5 15.5V17C33 16.5 34 16 35 16C36.5 16 37.5 17 37.5 18.5V26C37.5 34 31 40 24 40Z" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path d="M15 22L12 25C10 27 10 30 12 32L16 35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M10 14C8 17 8 21 10 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    <path d="M7 11C4 16 4 22 7 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.4" />
  </svg>
);

// Hand Sign Illustration 2: Terima Kasih (Flat Open Hand to Heart/Chin)
export const HandThankYouIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    aria-hidden="true"
  >
    <path 
      d="M12 36L18 20C19 17 22 15 25 16L32 18C35 19 36 22 35 25L32 36" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path d="M14 26L30 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 10V6M26 12L28 8M18 12L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    <path d="M8 40H38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Hand Sign Illustration 3: Jempol / Setuju / Bagus
export const HandThumbsUpIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    aria-hidden="true"
  >
    <path 
      d="M16 22V38M16 22H11C9.5 22 8 23.5 8 25V35C8 36.5 9.5 38 11 38H16M16 22L23 12C24.5 10 27 10 28 12C28.5 13 28.5 15 27.5 17L25 22H36C38 22 39.5 23.5 39 25.5L36.5 35.5C36 37 34.5 38 33 38H16" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// Hand Sign Illustration 4: Dua Jari / Damai / Abjad V
export const HandPeaceIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    aria-hidden="true"
  >
    <path 
      d="M20 22V10C20 8.5 21.5 7.5 23 8C24.5 8.5 25 10 25 11.5V18" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M25 18L30 11C31 9.5 33 9.5 34 11C35 12.5 34 14.5 33 16L29 23" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M20 22C19 22 17 23 16 25L14 28C13 29.5 13.5 32 15 33L19 35" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M29 23C32 24.5 33 27 32 30L31 35C30 38 27 40 23 40C19 40 16 38 15 34" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
  </svg>
);

// Hand Sign Illustration 5: Hati / Cinta (BISINDO gesture)
export const HandHeartGestureIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    aria-hidden="true"
  >
    <path 
      d="M24 16C21 11 15 11 12 15C8 20 9 27 16 33L24 40L32 33C39 27 40 20 36 15C33 11 27 11 24 16Z" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path d="M20 22L24 26L28 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
