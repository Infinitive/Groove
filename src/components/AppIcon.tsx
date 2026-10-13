import React from 'react';

interface AppIconProps {
  className?: string;
  size?: number;
}

/**
 * Native Vector App Icon
 * Exact abstract acoustic waveform ("sine wave") on tactile obsidian matte squircle plate
 * with double-layer elevation shadows, ambient ember glow, and chamfer highlight rim.
 */
export const AppIcon: React.FC<AppIconProps> = ({ className = 'w-11 h-11', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Groove App Icon"
    >
      <defs>
        {/* Background Gradient (Subtle overhead studio lighting on dark matte) */}
        <linearGradient id="appIconBgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#262629" />
          <stop offset="25%" stopColor="#1C1C1F" />
          <stop offset="65%" stopColor="#131315" />
          <stop offset="100%" stopColor="#0A0A0C" />
        </linearGradient>

        {/* Top Rim Specular Highlight (Subtle chamfer highlight) */}
        <linearGradient id="appIconRimGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </linearGradient>

        {/* Acoustic Waveform Ember Gradient */}
        <linearGradient id="appIconWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFA238" />
          <stop offset="25%" stopColor="#FF6616" />
          <stop offset="70%" stopColor="#F04804" />
          <stop offset="100%" stopColor="#D42C00" />
        </linearGradient>

        {/* Ambient Center Ember Glow */}
        <radialGradient id="appIconCenterGlow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#FF5A10" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#FF5A10" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FF5A10" stopOpacity="0" />
        </radialGradient>

        {/* Drop Shadow for Tactile Elevation */}
        <filter id="appIconWaveElevation" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
        </filter>

        <clipPath id="appIconSquircleClip">
          <rect width="512" height="512" rx="115" ry="115" />
        </clipPath>
      </defs>

      {/* Squircle Canvas */}
      <g clipPath="url(#appIconSquircleClip)">
        {/* Base Matte Surface */}
        <rect width="512" height="512" fill="url(#appIconBgGrad)" />

        {/* Ambient Heat & Overhead Light */}
        <circle cx="256" cy="256" r="210" fill="url(#appIconCenterGlow)" />
        <ellipse cx="256" cy="30" rx="220" ry="120" fill="#FFFFFF" opacity="0.04" />

        {/* Tactile Acoustic Waveform (Sine wave pulse) */}
        <path
          d="M 0 256 L 50 256 C 74 256, 88 168, 108 168 C 132 168, 150 392, 176 392 C 204 392, 226 125, 256 125 C 286 125, 308 392, 336 392 C 362 392, 380 168, 404 168 C 424 168, 438 256, 462 256 L 512 256"
          fill="none"
          stroke="url(#appIconWaveGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#appIconWaveElevation)"
        />

        {/* Inner Rim Stroke Highlight */}
        <rect
          width="512"
          height="512"
          rx="115"
          ry="115"
          fill="none"
          stroke="url(#appIconRimGrad)"
          strokeWidth="2.5"
        />
      </g>
    </svg>
  );
};
