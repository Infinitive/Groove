import React from 'react';
import { Sparkles, Disc, ChevronRight } from 'lucide-react';
import { Album, LibraryViewMode } from '../types';
import { VinylArtwork } from './VinylArtwork';
import { RatingStars } from './RatingStars';
import { triggerHaptic } from '../utils/haptics';

interface AlbumCardProps {
  album: Album;
  playCount: number;
  lastPlayed?: string;
  viewMode: LibraryViewMode;
  onSelect: (album: Album) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  playCount,
  viewMode,
  onSelect,
}) => {
  const hasEdition = Boolean(album.edition);

  const handleClick = () => {
    triggerHaptic('light');
    onSelect(album);
  };

  if (viewMode === 'compact') {
    return (
      <div
        id={`record-card-${album.id}`}
        onClick={handleClick}
        className="group flex items-center justify-between gap-3 px-3.5 py-2.5 bg-neutral-900/70 hover:bg-neutral-800/90 active:bg-neutral-800/95 active:scale-[0.99] transition-all duration-150 cursor-pointer select-none border-b border-white/[0.04] last:border-b-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <VinylArtwork album={album} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors">
                {album.title}
              </h4>
              {hasEdition && (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.08] text-neutral-300">
                  <Sparkles className="w-2.5 h-2.5 text-[#FF5A10]" />
                  {album.edition}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8E8E93] truncate font-normal mt-0.5">
              {album.artist}
              {album.releaseYear ? ` · ${album.releaseYear}` : ''}
              {album.format ? ` · ${album.format}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {album.personalRating !== undefined && album.personalRating > 0 && (
            <div className="hidden sm:block">
              <RatingStars value={album.personalRating} size="sm" />
            </div>
          )}

          <div className="flex items-center">
            {playCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#FF5A10]/15 text-[#FF5A10] text-[11px] font-medium flex items-center gap-1">
                <Disc className="w-3 h-3" />
                <span>{playCount}×</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-500 text-[10px]">
                Unspun
              </span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </div>
      </div>
    );
  }

  // iOS Grid View with Tactile Abstract Sleeve & Strong Typography Hierarchy
  return (
    <div
      id={`record-grid-card-${album.id}`}
      onClick={handleClick}
      className="group flex flex-col cursor-pointer select-none active:scale-[0.97] transition-all duration-200"
    >
      {/* Abstract Sleeve Card with subtle elevation & physical texture */}
      <div className="w-full aspect-square rounded-xl overflow-hidden shadow-md border border-white/[0.09] bg-neutral-900 group-hover:border-white/20 group-hover:shadow-lg transition-all duration-200">
        <VinylArtwork album={album} size="lg" />
      </div>

      {/* Title & Artist directly beneath artwork */}
      <div className="mt-2 text-left space-y-0.5">
        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FF5A10] transition-colors leading-snug">
          {album.title}
        </h4>
        <p className="text-xs text-[#8E8E93] truncate font-normal leading-snug">
          {album.artist}
        </p>

        <div className="mt-1 flex items-center justify-between text-[11px] pt-0.5">
          {album.personalRating !== undefined && album.personalRating > 0 ? (
            <RatingStars value={album.personalRating} size="sm" />
          ) : (
            <span className="text-[10px] text-neutral-500 font-mono">
              {album.releaseYear || album.format || 'Vinyl'}
            </span>
          )}

          {playCount > 0 ? (
            <span className="text-[10px] font-medium text-[#FF5A10]">
              {playCount} {playCount === 1 ? 'spin' : 'spins'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
