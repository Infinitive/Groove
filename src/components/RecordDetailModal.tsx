import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Trash2,
  PlusCircle,
  Calendar,
  DollarSign,
  Disc,
  Clock,
  FileText,
  Sparkles,
  Barcode,
  Building,
  Globe,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Album, ListenLog } from '../types';
import { VinylArtwork } from './VinylArtwork';
import { RatingStars } from './RatingStars';
import { triggerHaptic } from '../utils/haptics';

interface RecordDetailModalProps {
  album: Album;
  listenLogs: ListenLog[];
  playCount: number;
  lastPlayed?: string;
  onClose: () => void;
  onEdit: (album: Album) => void;
  onDelete: (albumId: string) => void;
  onLogListen: (album: Album) => void;
  onDeleteListenLog: (logId: string) => void;
  onUpdateRating: (album: Album, newRating: number) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  album,
  listenLogs,
  playCount,
  lastPlayed,
  onClose,
  onEdit,
  onDelete,
  onLogListen,
  onDeleteListenLog,
  onUpdateRating,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhysicalDetails, setShowPhysicalDetails] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, onClose]);

  const albumLogs = listenLogs
    .filter((l) => l.recordId === album.id)
    .sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Never';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return (
        d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) +
        ' · ' +
        d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      );
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      id="record-detail-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      {/* iOS Bottom Sheet Container with Native Spring Curve */}
      <div
        id="record-detail-sheet"
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-[#16161A]/98 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* iOS Top Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Modal Top Bar */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
            Record Details
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-90 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Header Artwork & Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/10">
              <VinylArtwork album={album} size="lg" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                  {album.title}
                </h2>
                {album.edition && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FF5A10]/15 text-[#FF5A10] border border-[#FF5A10]/25">
                    <Sparkles className="w-3 h-3" />
                    {album.edition}
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-[#8E8E93]">
                {album.artist}
                {album.releaseYear ? ` · ${album.releaseYear}` : ''}
                {album.label ? ` · ${album.label}` : ''}
              </p>

              {album.variant && (
                <p className="text-xs text-[#FF7A00] font-medium">
                  Variant: {album.variant}
                </p>
              )}

              {/* Rating Component */}
              <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-2">
                <RatingStars
                  value={album.personalRating || 0}
                  size="md"
                  onChange={(r) => {
                    triggerHaptic('selection');
                    onUpdateRating(album, r);
                  }}
                />
                <span className="text-xs font-semibold text-[#8E8E93]">
                  {album.personalRating ? `${album.personalRating} / 5` : 'Rate'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Log Spin / Edit / Delete */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onLogListen(album);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5A10]/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Spin</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onEdit(album);
              }}
              className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-98 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('warning');
                setShowDeleteConfirm(true);
              }}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 active:scale-98 text-neutral-400 hover:text-red-400 border border-white/10 transition cursor-pointer"
              title="Delete Album"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Core Specifications Group */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
              General & Playback Info
            </h3>
            <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="p-3 flex items-center justify-between text-xs">
                <span className="text-[#8E8E93] flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-[#FF5A10]" />
                  Play Count
                </span>
                <span className="font-semibold text-white">
                  {playCount} {playCount === 1 ? 'spin' : 'spins'}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between text-xs">
                <span className="text-[#8E8E93] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF5A10]" />
                  Last Spun
                </span>
                <span className="font-semibold text-white">{formatDate(lastPlayed)}</span>
              </div>

              {album.format && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Format</span>
                  <span className="font-semibold text-white">{album.format}</span>
                </div>
              )}

              {album.rpm && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Speed (RPM)</span>
                  <span className="font-semibold text-white">{album.rpm} RPM</span>
                </div>
              )}

              {album.discCount !== undefined && album.discCount > 0 && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Disc Count</span>
                  <span className="font-semibold text-white">{album.discCount} {album.discCount === 1 ? 'disc' : 'discs'}</span>
                </div>
              )}

              {album.genres && album.genres.length > 0 && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Genres</span>
                  <span className="font-semibold text-white">{album.genres.join(', ')}</span>
                </div>
              )}

              {album.styles && album.styles.length > 0 && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Styles</span>
                  <span className="font-semibold text-white">{album.styles.join(', ')}</span>
                </div>
              )}

              {album.label && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Record Label</span>
                  <span className="font-semibold text-white">{album.label}</span>
                </div>
              )}

              {album.catalogNumber && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Catalog Number</span>
                  <span className="font-semibold text-white font-mono">{album.catalogNumber}</span>
                </div>
              )}

              {album.country && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Country of Origin</span>
                  <span className="font-semibold text-white">{album.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Physical Pressing, Deadwax & Matrix Metadata */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowPhysicalDetails(!showPhysicalDetails);
              }}
              className="w-full flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-[#8E8E93] hover:text-white cursor-pointer"
            >
              <span>Deadwax, Matrix & Pressing Details</span>
              {showPhysicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showPhysicalDetails && (
              <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                {album.matrixRunout ? (
                  <div className="p-3 text-xs">
                    <span className="text-[#8E8E93] block mb-1">Matrix / Runout Groove Etching</span>
                    <span className="font-mono text-white bg-neutral-900 px-2.5 py-1 rounded-md inline-block border border-white/[0.06]">
                      {album.matrixRunout}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 text-xs flex justify-between text-[#8E8E93]">
                    <span>Matrix / Runout</span>
                    <span className="text-neutral-600">Uncataloged</span>
                  </div>
                )}

                {album.pressingPlant && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="text-[#8E8E93] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#FF5A10]" />
                      Pressing Plant
                    </span>
                    <span className="font-semibold text-white">{album.pressingPlant}</span>
                  </div>
                )}

                {album.vinylWeight && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="text-[#8E8E93]">Vinyl Weight</span>
                    <span className="font-semibold text-white">{album.vinylWeight}</span>
                  </div>
                )}

                {album.barcode && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="text-[#8E8E93] flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-[#FF5A10]" />
                      Barcode (UPC/EAN)
                    </span>
                    <span className="font-mono font-semibold text-white">{album.barcode}</span>
                  </div>
                )}

                {album.pressingCountry && (
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="text-[#8E8E93] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FF5A10]" />
                      Pressing Country
                    </span>
                    <span className="font-semibold text-white">{album.pressingCountry}</span>
                  </div>
                )}

                {album.packagingExtras && album.packagingExtras.length > 0 && (
                  <div className="p-3 text-xs">
                    <span className="text-[#8E8E93] block mb-1.5">Packaging Extras</span>
                    <div className="flex flex-wrap gap-1">
                      {album.packagingExtras.map((extra) => (
                        <span
                          key={extra}
                          className="px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-300 text-[11px] border border-white/[0.06]"
                        >
                          {extra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Acquisition, Provenance & Pricing */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
              Provenance & Financials
            </h3>
            <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              {album.purchasePrice !== undefined && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#FF5A10]" />
                    Purchase Price
                  </span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    ${album.purchasePrice.toFixed(2)}
                  </span>
                </div>
              )}

              {album.purchaseDate && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5A10]" />
                    Acquired Date
                  </span>
                  <span className="font-semibold text-white">{formatDate(album.purchaseDate)}</span>
                </div>
              )}

              {album.location && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5A10]" />
                    Shelf Location
                  </span>
                  <span className="font-semibold text-white">{album.location}</span>
                </div>
              )}

              {album.discogsId && (
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-[#FF5A10]" />
                    Discogs Reference
                  </span>
                  <a
                    href={`https://www.discogs.com/release/${album.discogsId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF5A10] hover:underline font-mono"
                  >
                    r{album.discogsId}
                  </a>
                </div>
              )}

              <div className="p-3 flex items-center justify-between text-xs">
                <span className="text-[#8E8E93]">Added to Archive</span>
                <span className="text-neutral-400">{formatDate(album.addedAt)}</span>
              </div>
            </div>
          </div>

          {/* 4. Collector & Research Notes */}
          {(album.notes || album.researchNotes) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FF5A10]" />
                Notes & Provenance
              </h3>
              <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl p-3.5 text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap space-y-2">
                {album.notes && <p>{album.notes}</p>}
                {album.researchNotes && (
                  <p className="text-neutral-400 border-t border-white/[0.06] pt-2 text-[11px]">
                    <strong className="text-neutral-300">Research findings:</strong> {album.researchNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. Spin Log History */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1 flex items-center justify-between">
              <span>Listening History ({albumLogs.length})</span>
            </h3>

            {albumLogs.length === 0 ? (
              <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl p-4 text-center text-xs text-[#8E8E93]">
                No spins logged yet. Hit "Log Spin" after your listening session.
              </div>
            ) : (
              <div className="bg-neutral-950/70 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                {albumLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{formatDateTime(log.listenedAt)}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] mt-0.5">
                        {log.context && <span>{log.context}</span>}
                        {log.rating && (
                          <span>· <RatingStars value={log.rating} size="sm" /></span>
                        )}
                      </div>
                      {log.note && (
                        <p className="text-[11px] text-neutral-400 italic mt-0.5">"{log.note}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onDeleteListenLog(log.id);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1 transition cursor-pointer"
                      title="Delete log entry"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-950/50 border-t border-red-500/20 space-y-2">
            <p className="text-xs text-red-200 font-semibold text-center">
              Are you sure you want to remove "{album.title}" from your archive?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onDelete(album.id);
                }}
                className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
              >
                Delete Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
