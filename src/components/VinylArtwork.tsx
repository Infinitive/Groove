import React, { memo } from 'react';
import { Album } from '../types';

interface VinylArtworkProps {
  album: Album;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscPeek?: boolean;
  className?: string;
}

interface PaletteTheme {
  bg: string;
  accent: string;
  secondaryAccent: string;
  pattern: 'arcs' | 'diagonal' | 'bauhaus' | 'concentric' | 'waves' | 'split';
}

const ARTWORK_PALETTES: PaletteTheme[] = [
  {
    bg: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
    accent: '#818cf8',
    secondaryAccent: '#c084fc',
    pattern: 'arcs',
  },
  {
    bg: 'from-[#431407] via-[#7c2d12] to-[#1c1917]',
    accent: '#fb923c',
    secondaryAccent: '#fde047',
    pattern: 'diagonal',
  },
  {
    bg: 'from-[#064e3b] via-[#047857] to-[#022c22]',
    accent: '#34d399',
    secondaryAccent: '#22d3ee',
    pattern: 'bauhaus',
  },
  {
    bg: 'from-[#4c0519] via-[#881337] to-[#1f030a]',
    accent: '#fb7185',
    secondaryAccent: '#f43f5e',
    pattern: 'concentric',
  },
  {
    bg: 'from-[#082f49] via-[#0369a1] to-[#0f172a]',
    accent: '#38bdf8',
    secondaryAccent: '#a5b4fc',
    pattern: 'waves',
  },
  {
    bg: 'from-[#3f2c00] via-[#713f12] to-[#1c1917]',
    accent: '#facc15',
    secondaryAccent: '#fb923c',
    pattern: 'split',
  },
  {
    bg: 'from-[#3b0764] via-[#581c87] to-[#18022e]',
    accent: '#d8b4fe',
    secondaryAccent: '#f472b6',
    pattern: 'diagonal',
  },
  {
    bg: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
    accent: '#94a3b8',
    secondaryAccent: '#38bdf8',
    pattern: 'arcs',
  },
];

// Global $O(1)$ memory cache so no calculations occur on re-render or scroll
const themeCache = new Map<string, PaletteTheme>();

function getAlbumTheme(album: Album): PaletteTheme {
  const key = album.id || `${album.artist}|${album.title}`;
  const cached = themeCache.get(key);
  if (cached) return cached;

  let hash = 0;
  const str = `${album.artist || ''}-${album.title || ''}-${album.releaseYear || ''}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const theme = ARTWORK_PALETTES[Math.abs(hash) % ARTWORK_PALETTES.length];
  themeCache.set(key, theme);
  return theme;
}

const sizeClasses = {
  sm: 'w-12 h-12 rounded-lg',
  md: 'w-20 h-20 rounded-xl',
  lg: 'w-full aspect-square rounded-xl',
  xl: 'w-48 h-48 sm:w-56 sm:h-56 rounded-2xl',
};

export const VinylArtwork: React.FC<VinylArtworkProps> = memo(({
  album,
  size = 'md',
  className = '',
}) => {
  const theme = getAlbumTheme(album);

  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 bg-gradient-to-br ${theme.bg} shadow-md border border-white/[0.09] select-none ${sizeClasses[size]} ${className}`}
      style={{ willChange: 'transform' }}
    >
      {/* Subtle Matte Cardstock Inner Shadow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_12px_rgba(0,0,0,0.5)] z-10" />

      {/* Pure Abstract Geometric Art (No Text, No Titles, No Monograms) */}
      <svg
        className="w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {theme.pattern === 'arcs' && (
          <>
            <circle cx="85" cy="15" r="55" stroke={theme.accent} strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
            <circle cx="85" cy="15" r="35" stroke={theme.accent} strokeWidth="1.5" opacity="0.6" />
            <circle cx="85" cy="15" r="18" fill={theme.accent} opacity="0.25" />
            <line x1="12" y1="88" x2="68" y2="88" stroke={theme.secondaryAccent} strokeWidth="1.5" opacity="0.5" />
          </>
        )}

        {theme.pattern === 'diagonal' && (
          <>
            <line x1="-20" y1="20" x2="100" y2="140" stroke={theme.accent} strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="120" y2="120" stroke={theme.secondaryAccent} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <rect x="62" y="18" width="22" height="22" rx="4" stroke={theme.accent} strokeWidth="1.2" opacity="0.35" />
          </>
        )}

        {theme.pattern === 'bauhaus' && (
          <>
            <rect x="12" y="12" width="36" height="36" fill={theme.accent} opacity="0.2" />
            <circle cx="68" cy="68" r="22" stroke={theme.secondaryAccent} strokeWidth="1.5" opacity="0.6" />
            <line x1="12" y1="62" x2="52" y2="62" stroke={theme.accent} strokeWidth="2" opacity="0.7" />
          </>
        )}

        {theme.pattern === 'concentric' && (
          <>
            <circle cx="50" cy="50" r="42" stroke={theme.accent} strokeWidth="1" strokeDasharray="2 3" opacity="0.35" />
            <circle cx="50" cy="50" r="26" stroke={theme.secondaryAccent} strokeWidth="1.5" opacity="0.6" />
            <circle cx="50" cy="50" r="12" fill={theme.accent} opacity="0.3" />
          </>
        )}

        {theme.pattern === 'waves' && (
          <>
            <path d="M 0 32 Q 25 18, 50 32 T 100 32" stroke={theme.accent} strokeWidth="1.8" opacity="0.5" />
            <path d="M 0 48 Q 25 34, 50 48 T 100 48" stroke={theme.secondaryAccent} strokeWidth="1.2" opacity="0.4" />
            <path d="M 0 64 Q 25 50, 50 64 T 100 64" stroke={theme.accent} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
          </>
        )}

        {theme.pattern === 'split' && (
          <>
            <polygon points="0,0 100,0 100,100" fill={theme.accent} opacity="0.12" />
            <circle cx="35" cy="65" r="20" stroke={theme.secondaryAccent} strokeWidth="1.5" opacity="0.6" />
            <circle cx="70" cy="30" r="8" fill={theme.accent} opacity="0.35" />
          </>
        )}
      </svg>
    </div>
  );
});

VinylArtwork.displayName = 'VinylArtwork';
