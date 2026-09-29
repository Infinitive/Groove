import React, { useState, useMemo } from 'react';
import { Search, X, Disc, Clock, Radio, Sparkles } from 'lucide-react';
import { Album } from '../types';
import { VinylArtwork } from './VinylArtwork';
import { triggerHaptic } from '../utils/haptics';

interface RecordPickerModalProps {
  albums: Album[];
  albumStats: Map<string, { playCount: number; lastPlayed?: string }>;
  onSelectRecord: (album: Album) => void;
  onClose: () => void;
}

export const RecordPickerModal: React.FC<RecordPickerModalProps> = ({
  albums,
  albumStats,
  onSelectRecord,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Unplayed suggestions
  const unplayedSuggestions = useMemo(() => {
    return albums
      .filter((a) => (albumStats.get(a.id)?.playCount || 0) === 0)
      .slice(0, 6);
  }, [albums, albumStats]);

  // Recently added suggestions
  const recentlyAddedSuggestions = useMemo(() => {
    return [...albums]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 6);
  }, [albums]);

  // Filtered records matching search
  const filteredAlbums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return albums;

    return albums.filter((a) => {
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchArtist = a.artist.toLowerCase().includes(q);
      const matchLabel = a.label?.toLowerCase().includes(q);
      const matchYear = a.releaseYear?.toString().includes(q);
      const matchFormat = a.format?.toLowerCase().includes(q);
      return matchTitle || matchArtist || matchLabel || matchYear || matchFormat;
    });
  }, [albums, searchQuery]);

  const handlePick = (album: Album) => {
    triggerHaptic('selection');
    onSelectRecord(album);
  };

  return (
    <div
      id="record-picker-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        id="record-picker-sheet"
        className="w-full sm:max-w-lg max-h-[88vh] bg-[#16161A]/98 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* iOS Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Sheet Top Bar */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Select Record to Spin</h3>
            <p className="text-xs text-[#8E8E93]">Choose an album to log your listening session</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, artist, label, or release year..."
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
        </div>

        {/* Quick Suggestions when not searching */}
        {!searchQuery && (
          <div className="px-4 py-2 space-y-3 flex-shrink-0 border-b border-white/[0.04]">
            {/* Unplayed Suggestions */}
            {unplayedSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1">
                  <Radio className="w-3 h-3 text-purple-400" />
                  <span>Awaiting First Spin</span>
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {unplayedSuggestions.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => handlePick(album)}
                      className="flex-shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-neutral-900 border border-white/[0.06] hover:border-purple-500/50 active:scale-95 transition text-left cursor-pointer"
                    >
                      <VinylArtwork album={album} size="sm" className="!w-7 !h-7 !rounded-md" />
                      <div className="max-w-[120px]">
                        <p className="text-xs font-semibold text-white truncate">{album.title}</p>
                        <p className="text-[10px] text-[#8E8E93] truncate">{album.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Added Suggestions */}
            {recentlyAddedSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#FF5A10]" />
                  <span>Recently Added</span>
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {recentlyAddedSuggestions.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => handlePick(album)}
                      className="flex-shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-neutral-900 border border-white/[0.06] hover:border-[#FF5A10]/50 active:scale-95 transition text-left cursor-pointer"
                    >
                      <VinylArtwork album={album} size="sm" className="!w-7 !h-7 !rounded-md" />
                      <div className="max-w-[120px]">
                        <p className="text-xs font-semibold text-white truncate">{album.title}</p>
                        <p className="text-[10px] text-[#8E8E93] truncate">{album.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Records List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 divide-y divide-white/[0.04]">
          {filteredAlbums.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8E8E93]">
              No records found matching "{searchQuery}"
            </div>
          ) : (
            filteredAlbums.map((album) => {
              const stat = albumStats.get(album.id);
              const plays = stat?.playCount || 0;
              return (
                <div
                  key={album.id}
                  onClick={() => handlePick(album)}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-neutral-800/40 rounded-xl transition cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-xs">
                      <VinylArtwork album={album} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors">
                        {album.title}
                      </h4>
                      <p className="text-xs text-[#8E8E93] truncate">
                        {album.artist}
                        {album.releaseYear ? ` · ${album.releaseYear}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {plays > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF5A10]/15 text-[#FF5A10] text-[10px] font-bold font-mono">
                        {plays}×
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 text-[10px] font-medium">
                        Unspun
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
