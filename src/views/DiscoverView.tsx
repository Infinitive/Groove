import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  Shuffle,
  RefreshCw,
  PlusCircle,
  Eye,
  Radio,
  Clock,
  Sparkles,
  Music2,
  Calendar,
  Layers,
  Flame,
} from 'lucide-react';
import { Album, ListenLog } from '../types';
import { runDiscovery, DiscoveryMode, DiscoveryCandidate } from '../engines/discoveryEngine';
import { VinylArtwork } from '../components/VinylArtwork';
import { RatingStars } from '../components/RatingStars';

interface DiscoverViewProps {
  albums: Album[];
  listenLogs: ListenLog[];
  onSelectAlbum: (album: Album) => void;
  onLogListen: (album: Album) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  albums,
  listenLogs,
  onSelectAlbum,
  onLogListen,
}) => {
  const [mode, setMode] = useState<DiscoveryMode>('choose_for_me');
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedDecade, setSelectedDecade] = useState<string>('');

  const genres = useMemo(() => {
    const s = new Set<string>();
    albums.forEach((a) => a.genres?.forEach((g) => {
      if (g.trim()) s.add(g.trim());
    }));
    return Array.from(s).sort();
  }, [albums]);

  const decades = useMemo(() => {
    const s = new Set<string>();
    albums.forEach((a) => {
      if (a.releaseYear) {
        s.add(`${Math.floor(a.releaseYear / 10) * 10}s`);
      }
    });
    return Array.from(s).sort();
  }, [albums]);

  const refreshCandidates = useCallback((targetMode: DiscoveryMode = mode) => {
    const results = runDiscovery(targetMode, albums, listenLogs, {
      genre: selectedGenre || undefined,
      decade: selectedDecade || undefined,
    });
    setCandidates(results);
  }, [albums, listenLogs, mode, selectedGenre, selectedDecade]);

  useEffect(() => {
    refreshCandidates(mode);
  }, [albums, listenLogs, mode, selectedGenre, selectedDecade, refreshCandidates]);

  const modesConfig: {
    id: DiscoveryMode;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'choose_for_me',
      label: 'Pick For Me',
      description: 'Single thoughtful spotlight pick',
      icon: Compass,
    },
    {
      id: 'blind_pull',
      label: 'Blind Pull',
      description: '3 random records from the crate',
      icon: Shuffle,
    },
    {
      id: 'unplayed',
      label: 'Never Spun',
      description: 'Albums waiting for first needle drop',
      icon: Radio,
    },
    {
      id: 'forgotten',
      label: 'Forgotten Gems',
      description: 'Records not played in a long time',
      icon: Clock,
    },
    {
      id: 'top_rated',
      label: 'Top Rated',
      description: 'Your 4 & 5-star collection highlights',
      icon: Sparkles,
    },
    {
      id: 'fresh_additions',
      label: 'New to Crate',
      description: 'Most recently cataloged acquisitions',
      icon: Flame,
    },
    {
      id: 'genre',
      label: 'Genre Spotlight',
      description: 'Explore by style and musical genre',
      icon: Layers,
    },
    {
      id: 'decade',
      label: 'Time Capsule',
      description: 'Filter by original release era',
      icon: Calendar,
    },
  ];

  return (
    <div id="discover-view" className="space-y-6">
      {/* 1. iOS Inset Grouped Discovery Modes Grid (No awkward horizontal scrolling!) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
            Discovery Modes
          </h2>
          <button
            onClick={() => refreshCandidates(mode)}
            className="text-xs font-semibold text-[#FF5A10] hover:text-[#FF7A00] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reshuffle</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {modesConfig.map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800 border-[#FF5A10] shadow-sm shadow-[#FF5A10]/20'
                    : 'bg-neutral-900 border-white/[0.08] hover:bg-neutral-800/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#FF5A10] text-white'
                        : 'bg-white/[0.06] text-[#8E8E93]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#FF5A10] animate-pulse" />
                  )}
                </div>

                <div>
                  <h4
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-white' : 'text-neutral-200'
                    }`}
                  >
                    {item.label}
                  </h4>
                  <p className="text-[10px] text-[#8E8E93] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mode-Specific Controls (Genre or Decade Selectors) */}
      {mode === 'genre' && genres.length > 0 && (
        <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#8E8E93]">Select Genre</span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                selectedGenre === ''
                  ? 'bg-[#FF5A10] text-white shadow-xs'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  selectedGenre === g
                    ? 'bg-[#FF5A10] text-white shadow-xs'
                    : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'decade' && decades.length > 0 && (
        <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#8E8E93]">Select Era</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedDecade('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                selectedDecade === ''
                  ? 'bg-[#FF5A10] text-white shadow-xs'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
              }`}
            >
              All Eras
            </button>
            {decades.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDecade(selectedDecade === d ? '' : d)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  selectedDecade === d
                    ? 'bg-[#FF5A10] text-white shadow-xs'
                    : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Recommended Albums: iOS Inset Grouped Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Curated Recommendations
          </h3>
          <span className="text-xs text-[#8E8E93]">
            {candidates.length} {candidates.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
            <Music2 className="w-10 h-10 text-[#FF5A10] mx-auto stroke-[1.8]" />
            <h4 className="text-base font-semibold text-white">No records matching this mode</h4>
            <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
              {mode === 'unplayed'
                ? '🎉 Amazing! You have spun every single record in your collection.'
                : 'Try switching to another mode or resetting your active filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((cand) => (
              <div
                key={cand.album.id}
                className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 shadow-xs hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Clean Album Artwork Square */}
                  <div
                    onClick={() => onSelectAlbum(cand.album)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-sm border border-white/[0.08] flex-shrink-0 cursor-pointer active:scale-95 transition-transform bg-neutral-950"
                  >
                    <VinylArtwork album={cand.album} size="md" />
                  </div>

                  {/* Album Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => onSelectAlbum(cand.album)}
                        className="text-base font-semibold text-white hover:text-[#FF5A10] cursor-pointer transition-colors truncate"
                      >
                        {cand.album.title}
                      </h4>
                      {cand.album.edition && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FF5A10]/15 text-[#FF5A10]">
                          {cand.album.edition}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#8E8E93] font-normal truncate">
                      {cand.album.artist}
                      {cand.album.releaseYear ? ` · ${cand.album.releaseYear}` : ''}
                      {cand.album.format ? ` · ${cand.album.format}` : ''}
                    </p>

                    <div className="flex items-center gap-3 pt-0.5 text-xs text-[#8E8E93]">
                      {cand.album.personalRating !== undefined && cand.album.personalRating > 0 && (
                        <RatingStars value={cand.album.personalRating} size="sm" />
                      )}
                      <span>
                        {cand.playCount > 0 ? `${cand.playCount} spins` : 'Unplayed'}
                      </span>
                      {cand.lastPlayed && (
                        <span>· Last spun {new Date(cand.lastPlayed).toLocaleDateString()}</span>
                      )}
                    </div>

                    {cand.reason && (
                      <p className="text-[11px] text-amber-300/80 pt-0.5 font-medium">
                        💡 {cand.reason}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                    <button
                      onClick={() => onLogListen(cand.album)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Log Spin</span>
                    </button>
                    <button
                      onClick={() => onSelectAlbum(cand.album)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-white/10 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
