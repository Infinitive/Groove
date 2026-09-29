import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  X,
  Sparkles,
  Disc,
  RotateCw,
  Clock,
  Radio,
  ChevronRight,
  TrendingUp,
  PlusCircle,
  Layers,
  Flame,
} from 'lucide-react';
import { Album, LibraryViewMode } from '../types';
import { AlbumCard } from '../components/AlbumCard';
import { VinylArtwork } from '../components/VinylArtwork';
import { triggerHaptic } from '../utils/haptics';

interface LibraryViewProps {
  albums: Album[];
  albumStats: Map<string, { playCount: number; lastPlayed?: string }>;
  onSelectAlbum: (album: Album) => void;
  onOpenAdd: () => void;
  onLogListen?: (album: Album) => void;
  onNavigateTab?: (tab: 'discover' | 'analytics' | 'wishlist') => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  albums,
  albumStats,
  onSelectAlbum,
  onOpenAdd,
  onLogListen,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Dynamic time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good evening';
  }, []);

  // Distinctive collection pulse metrics (Non-redundant with basic counts)
  const pulseMetrics = useMemo(() => {
    const playedCount = albums.filter((a) => (albumStats.get(a.id)?.playCount || 0) > 0).length;
    const unplayedCount = Math.max(0, albums.length - playedCount);
    const rotationRate = albums.length > 0 ? Math.round((playedCount / albums.length) * 100) : 0;

    // Peak decade calculation
    const decadeCounts = new Map<string, number>();
    albums.forEach((a) => {
      if (a.releaseYear) {
        const d = `${Math.floor(a.releaseYear / 10) * 10}s`;
        decadeCounts.set(d, (decadeCounts.get(d) || 0) + 1);
      }
    });
    let peakDecade = '70s & 80s';
    let maxCount = 0;
    decadeCounts.forEach((cnt, dec) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        peakDecade = dec;
      }
    });

    // Year span
    const years = albums.map((a) => a.releaseYear).filter((y): y is number => typeof y === 'number' && y > 1900);
    const minYear = years.length > 0 ? Math.min(...years) : 1960;
    const maxYear = years.length > 0 ? Math.max(...years) : 2026;

    return {
      playedCount,
      unplayedCount,
      rotationRate,
      peakDecade,
      yearSpan: `${minYear}–${maxYear}`,
    };
  }, [albums, albumStats]);

  // Spotlight Next Up Recommendation
  const spotlightAlbum = useMemo(() => {
    if (albums.length === 0) return null;
    return albums[spotlightIndex % albums.length];
  }, [albums, spotlightIndex]);

  // Shelves
  const recentlyAdded = useMemo(() => {
    return [...albums]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 14);
  }, [albums]);

  const heavyRotation = useMemo(() => {
    const withPlays = albums.filter((a) => (albumStats.get(a.id)?.playCount || 0) > 0);
    return [...withPlays]
      .sort((a, b) => (albumStats.get(b.id)?.playCount || 0) - (albumStats.get(a.id)?.playCount || 0))
      .slice(0, 14);
  }, [albums, albumStats]);

  const awaitingRotation = useMemo(() => {
    return albums.filter((a) => (albumStats.get(a.id)?.playCount || 0) === 0).slice(0, 14);
  }, [albums, albumStats]);

  // Single unified search matching all relevant metadata
  const filteredAlbums = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return albums;

    if (query === 'unplayed' || query === 'unspun') {
      return albums.filter((a) => (albumStats.get(a.id)?.playCount || 0) === 0);
    }
    if (query === 'played' || query === 'spun') {
      return albums.filter((a) => (albumStats.get(a.id)?.playCount || 0) > 0);
    }

    return albums.filter((album) => {
      const titleMatch = album.title.toLowerCase().includes(query);
      const artistMatch = album.artist.toLowerCase().includes(query);
      const yearMatch = album.releaseYear?.toString().includes(query);
      const genreMatch = album.genres?.some((g) => g.toLowerCase().includes(query));
      const styleMatch = album.styles?.some((s) => s.toLowerCase().includes(query));
      const editionMatch = album.edition?.toLowerCase().includes(query);
      const variantMatch = album.variant?.toLowerCase().includes(query);
      const labelMatch = album.label?.toLowerCase().includes(query);
      const matrixMatch = album.matrixRunout?.toLowerCase().includes(query);
      const formatMatch = album.format?.toLowerCase().includes(query);
      const notesMatch = album.notes?.toLowerCase().includes(query);

      return (
        titleMatch ||
        artistMatch ||
        yearMatch ||
        genreMatch ||
        styleMatch ||
        editionMatch ||
        variantMatch ||
        labelMatch ||
        matrixMatch ||
        formatMatch ||
        notesMatch
      );
    });
  }, [albums, searchQuery, albumStats]);

  const handleSpotlightNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setSpotlightIndex((prev) => prev + 1);
  };

  const handleQuickLogSpotlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (spotlightAlbum && onLogListen) {
      onLogListen(spotlightAlbum);
    }
  };

  const handleQuickFilterUnplayed = () => {
    triggerHaptic('selection');
    setSearchQuery(searchQuery === 'unplayed' ? '' : 'unplayed');
  };

  return (
    <div id="library-view" className="space-y-6">
      {/* 1. Collection Hero & Distinctive Pulse Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1d1c25] to-[#121217] border border-white/[0.09] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#FF5A10]/12 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {greeting}, Johnathan
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5">
              Personal physical vinyl archive · {albums.length} cataloged editions
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenAdd();
            }}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-95 text-white text-xs font-semibold shadow-md shadow-[#FF5A10]/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Record</span>
          </button>
        </div>

        {/* Distinctive Pulse Metric Tiles */}
        <div className="grid grid-cols-3 gap-2.5 pt-1 relative z-10">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05]">
            <p className="text-lg sm:text-xl font-bold text-white tabular-nums">
              {pulseMetrics.rotationRate}%
            </p>
            <p className="text-[11px] text-[#8E8E93]">Active Rotation</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05]">
            <p className="text-lg sm:text-xl font-bold text-[#FF7A00] tabular-nums">
              {pulseMetrics.unplayedCount}
            </p>
            <p className="text-[11px] text-[#8E8E93]">Awaiting Needle</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05]">
            <p className="text-lg sm:text-xl font-bold text-white tabular-nums truncate">
              {pulseMetrics.peakDecade}
            </p>
            <p className="text-[11px] text-[#8E8E93]">Era Focus ({pulseMetrics.yearSpan})</p>
          </div>
        </div>
      </div>

      {/* 2. Upgraded High-Value Quick Actions (Contextual & Actionable) */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Action 1: Log Spin on Recommendation */}
          <button
            onClick={handleQuickLogSpotlight}
            className="p-3 rounded-2xl bg-neutral-900 border border-white/[0.08] hover:border-[#FF5A10]/50 hover:bg-neutral-800/80 active:scale-95 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF5A10]/15 text-[#FF5A10] flex items-center justify-center mb-2 group-hover:bg-[#FF5A10] group-hover:text-white transition-colors">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-[#FF5A10] transition-colors">
                Log Spotlight
              </p>
              <p className="text-[10px] text-[#8E8E93] truncate">
                Spin {spotlightAlbum?.title || 'record'}
              </p>
            </div>
          </button>

          {/* Action 2: Shuffle Recommendation */}
          <button
            onClick={(e) => {
              handleSpotlightNext(e);
            }}
            className="p-3 rounded-2xl bg-neutral-900 border border-white/[0.08] hover:border-white/20 hover:bg-neutral-800/80 active:scale-95 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Shuffle Pick
              </p>
              <p className="text-[10px] text-[#8E8E93]">New spotlight draw</p>
            </div>
          </button>

          {/* Action 3: Filter Unplayed Records */}
          <button
            onClick={handleQuickFilterUnplayed}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer group shadow-sm ${
              searchQuery === 'unplayed'
                ? 'bg-[#FF5A10]/15 border-[#FF5A10]'
                : 'bg-neutral-900 border-white/[0.08] hover:border-white/20 hover:bg-neutral-800/80 active:scale-95'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-colors ${
              searchQuery === 'unplayed' ? 'bg-[#FF5A10] text-white' : 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white transition-colors">
                {searchQuery === 'unplayed' ? 'Showing Unspun' : 'View Unspun'}
              </p>
              <p className="text-[10px] text-[#8E8E93]">
                {pulseMetrics.unplayedCount} waiting albums
              </p>
            </div>
          </button>

          {/* Action 4: Catalog New Pressing */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenAdd();
            }}
            className="p-3 rounded-2xl bg-neutral-900 border border-white/[0.08] hover:border-white/20 hover:bg-neutral-800/80 active:scale-95 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                Catalog Pressing
              </p>
              <p className="text-[10px] text-[#8E8E93]">Manual entry & deadwax</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Spotlight: Recommended Listen */}
      {spotlightAlbum && !searchQuery && (
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-white/[0.08] p-4 sm:p-5 shadow-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF5A10]/15 flex items-center justify-center text-[#FF5A10]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Recommended Listen
              </span>
            </div>

            <button
              onClick={handleSpotlightNext}
              className="text-xs font-semibold text-[#FF5A10] hover:text-[#FF7A00] flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>

          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectAlbum(spotlightAlbum);
            }}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group-hover:shadow-md transition-all">
              <VinylArtwork album={spotlightAlbum} size="md" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="text-base font-bold text-white group-hover:text-[#FF5A10] transition-colors truncate">
                {spotlightAlbum.title}
              </h4>
              <p className="text-xs text-[#8E8E93] truncate font-normal">
                {spotlightAlbum.artist}
                {spotlightAlbum.releaseYear ? ` · ${spotlightAlbum.releaseYear}` : ''}
              </p>
              {spotlightAlbum.edition && (
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] text-neutral-300">
                  {spotlightAlbum.edition}
                </span>
              )}

              <div className="pt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-[#FF5A10] flex items-center gap-1">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Shelf: Recently Added (GPU-Accelerated Smooth 60fps Scrolling) */}
      {recentlyAdded.length > 0 && !searchQuery && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
              Recently Added
            </h3>
            <span className="text-xs text-[#8E8E93]">{recentlyAdded.length} records</span>
          </div>

          <div
            className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar select-none -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
          >
            {recentlyAdded.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectAlbum(album);
                }}
                className="group flex-shrink-0 w-32 sm:w-36 cursor-pointer active:scale-95 transition-transform"
                style={{ contain: 'layout style paint' }}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-md border border-white/[0.08] bg-neutral-900 group-hover:border-white/20 transition-all">
                  <VinylArtwork album={album} size="lg" />
                </div>
                <div className="mt-1.5 space-y-0.5 text-left">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-[#8E8E93] truncate font-normal">
                    {album.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Shelf: Heavy Rotation */}
      {heavyRotation.length > 0 && !searchQuery && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#FF5A10]" />
              <span>In Rotation</span>
            </h3>
            <span className="text-xs text-[#8E8E93]">Most played</span>
          </div>

          <div
            className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar select-none -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
          >
            {heavyRotation.map((album) => {
              const stat = albumStats.get(album.id);
              return (
                <div
                  key={album.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectAlbum(album);
                  }}
                  className="group flex-shrink-0 w-32 sm:w-36 cursor-pointer active:scale-95 transition-transform"
                  style={{ contain: 'layout style paint' }}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden shadow-md border border-white/[0.08] bg-neutral-900 group-hover:border-white/20 transition-all">
                    <VinylArtwork album={album} size="lg" />
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-left">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-[#8E8E93] truncate font-normal">
                      {album.artist}
                    </p>
                    <p className="text-[10px] text-[#FF5A10] font-medium">
                      {stat?.playCount || 0} {stat?.playCount === 1 ? 'spin' : 'spins'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Shelf: Waiting for Rotation */}
      {awaitingRotation.length > 0 && !searchQuery && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Awaiting First Spin</span>
            </h3>
            <span className="text-xs text-[#8E8E93]">{pulseMetrics.unplayedCount} unplayed</span>
          </div>

          <div
            className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar select-none -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
          >
            {awaitingRotation.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectAlbum(album);
                }}
                className="group flex-shrink-0 w-32 sm:w-36 cursor-pointer active:scale-95 transition-transform"
                style={{ contain: 'layout style paint' }}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden shadow-md border border-white/[0.08] bg-neutral-900 group-hover:border-white/20 transition-all">
                  <VinylArtwork album={album} size="lg" />
                </div>
                <div className="mt-1.5 space-y-0.5 text-left">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-[#8E8E93] truncate font-normal">
                    {album.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Single Clean Unified Search & Stacks Grid/List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white tracking-tight">
            {searchQuery ? `Search Results (${filteredAlbums.length})` : `All Stacks (${albums.length})`}
          </h3>

          {/* View Mode Segmented Control */}
          <div className="flex items-center bg-neutral-900 border border-white/[0.08] rounded-xl p-0.5">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#2C2C2E] text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('compact');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-[#2C2C2E] text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Single Minimal Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
          <input
            id="library-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums, artists, genres, matrix runouts, labels, or 'unplayed'..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-[#8E8E93] focus:border-[#FF5A10] focus:ring-1 focus:ring-[#FF5A10]/30 focus:outline-hidden transition shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E8E93] hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Full Collection Items: List or Grid */}
        <div style={{ contain: 'layout paint' }}>
          {filteredAlbums.length === 0 ? (
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl py-16 text-center space-y-3 p-6">
              <Disc className="w-10 h-10 text-[#FF5A10] mx-auto stroke-[1.8]" />
              <h4 className="text-base font-semibold text-white">No records found</h4>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                No matches for "{searchQuery}". Search matches artist, title, label, variant, year, and deadwax matrix.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-full bg-white/[0.08] text-white text-xs font-semibold hover:bg-white/[0.12] transition cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : viewMode === 'compact' ? (
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
              {filteredAlbums.map((album) => {
                const stat = albumStats.get(album.id);
                return (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    playCount={stat?.playCount || 0}
                    lastPlayed={stat?.lastPlayed}
                    viewMode="compact"
                    onSelect={onSelectAlbum}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredAlbums.map((album) => {
                const stat = albumStats.get(album.id);
                return (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    playCount={stat?.playCount || 0}
                    lastPlayed={stat?.lastPlayed}
                    viewMode="grid"
                    onSelect={onSelectAlbum}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
