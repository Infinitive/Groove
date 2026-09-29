import React, { useState, useEffect } from 'react';
import { X, Clock, Headphones, Volume2, Home, Radio, Check, Disc3 } from 'lucide-react';
import { Album, ListenLog } from '../types';
import { RatingStars } from './RatingStars';
import { VinylArtwork } from './VinylArtwork';

interface LogListenModalProps {
  album: Album;
  isOpen?: boolean;
  onSave: (logData: Omit<ListenLog, 'id'>) => Promise<void>;
  onClose: () => void;
}

const CONTEXT_OPTIONS = [
  { id: 'Turntable & Speakers', label: 'Speakers', icon: Volume2 },
  { id: 'Headphones', label: 'Headphones', icon: Headphones },
  { id: 'Living Room Session', label: 'Living Room', icon: Home },
  { id: 'Late Night Ritual', label: 'Late Night', icon: Radio },
  { id: 'Other', label: 'Other', icon: Disc3 },
];

export const LogListenModal: React.FC<LogListenModalProps> = ({
  album,
  onSave,
  onClose,
}) => {
  const [sessionRating, setSessionRating] = useState<number>(0);
  const [note, setNote] = useState('');
  const [context, setContext] = useState('Turntable & Speakers');
  const [listenedAt, setListenedAt] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const isoDate = new Date(listenedAt).toISOString();
      await onSave({
        recordId: album.id,
        listenedAt: isoDate,
        rating: sessionRating > 0 ? sessionRating : undefined,
        note: note.trim() || undefined,
        context: context.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="log-listen-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        id="log-spin-sheet"
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] bg-neutral-900/95 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* iOS Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <h3 className="text-base font-bold text-white tracking-tight">Log Spin</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Album Overview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950/60 border border-white/[0.08]">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <VinylArtwork album={album} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">{album.title}</h4>
              <p className="text-xs text-[#8E8E93] truncate">{album.artist}</p>
            </div>
          </div>

          {/* Session Rating */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/[0.08] space-y-2 text-center">
            <span className="text-xs font-semibold text-[#8E8E93] block">Session Rating (Optional)</span>
            <div className="flex justify-center py-1">
              <RatingStars value={sessionRating} onChange={setSessionRating} size="lg" showLabel />
            </div>
          </div>

          {/* Listening Note */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-semibold text-[#8E8E93]">Session Notes (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Soundstage was punchy, clear treble, memorable Side B..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden resize-none"
            />
          </div>

          {/* Listening Context */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-[#8E8E93]">Listening Setup</label>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXT_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = context === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setContext(isSelected ? '' : item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#FF5A10] text-white shadow-xs'
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timestamp */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-semibold text-[#8E8E93] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF5A10]" />
              <span>Timestamp</span>
            </label>
            <input
              type="datetime-local"
              value={listenedAt}
              onChange={(e) => setListenedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-log-listen-btn"
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-98 text-xs font-semibold text-white transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Log Spin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
