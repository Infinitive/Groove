import React, { useState, useMemo, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit3,
  Search,
  X,
  Check,
} from 'lucide-react';
import { WishlistItem, Album } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface WishlistViewProps {
  wishlist: WishlistItem[];
  isOpenAddModal?: boolean;
  onCloseAddModal?: () => void;
  onAddWishlistItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => Promise<WishlistItem>;
  onUpdateWishlistItem?: (item: WishlistItem) => Promise<void>;
  onDeleteWishlistItem: (id: string) => Promise<void>;
  onMoveToLibrary: (item: WishlistItem, extraDetails?: Partial<Album>) => Promise<Album>;
  onSelectAlbum?: (album: Album) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlist,
  isOpenAddModal = false,
  onCloseAddModal,
  onAddWishlistItem,
  onUpdateWishlistItem,
  onDeleteWishlistItem,
  onMoveToLibrary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  // Synchronize with external trigger
  useEffect(() => {
    if (isOpenAddModal) {
      handleOpenAdd();
    }
  }, [isOpenAddModal]);

  // Form states
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [desiredEdition, setDesiredEdition] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered items via Single Omnisearch
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return wishlist;

    return wishlist.filter((item) => {
      const matchArtist = item.artist.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchEdition = item.desiredEdition?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchPriority = item.priority?.toLowerCase().includes(q);

      return matchArtist || matchTitle || matchEdition || matchNotes || matchPriority;
    });
  }, [wishlist, searchQuery]);

  const handleOpenAdd = () => {
    triggerHaptic('medium');
    setArtist('');
    setTitle('');
    setDesiredEdition('');
    setTargetPrice('');
    setPriority('medium');
    setNotes('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    triggerHaptic('light');
    setShowAddModal(false);
    setEditingItem(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleOpenEdit = (item: WishlistItem) => {
    triggerHaptic('light');
    setEditingItem(item);
    setArtist(item.artist);
    setTitle(item.title);
    setDesiredEdition(item.desiredEdition || '');
    setTargetPrice(item.targetPrice ? item.targetPrice.toString() : '');
    setPriority(item.priority || 'medium');
    setNotes(item.notes || '');
    setFormError(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) {
      setFormError('Artist and Title are required.');
      return;
    }

    triggerHaptic('success');
    const price = targetPrice ? parseFloat(targetPrice) : undefined;
    if (editingItem && onUpdateWishlistItem) {
      await onUpdateWishlistItem({
        ...editingItem,
        artist: artist.trim(),
        title: title.trim(),
        desiredEdition: desiredEdition.trim() || undefined,
        targetPrice: price,
        priority,
        notes: notes.trim() || undefined,
      });
      setEditingItem(null);
    } else {
      await onAddWishlistItem({
        artist: artist.trim(),
        title: title.trim(),
        desiredEdition: desiredEdition.trim() || undefined,
        targetPrice: price,
        priority,
        notes: notes.trim() || undefined,
      });
      setShowAddModal(false);
      if (onCloseAddModal) onCloseAddModal();
    }
  };

  return (
    <div id="wishlist-view" className="space-y-6">
      {/* 1. Header & Summary */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Crate Wishlist</h2>
          <p className="text-xs text-[#8E8E93]">
            {wishlist.length} {wishlist.length === 1 ? 'record sought' : 'records sought'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-95 text-white text-xs font-semibold shadow-md shadow-[#FF5A10]/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Wanted</span>
        </button>
      </div>

      {/* 2. Single Clean Omnisearch Bar Pattern (Identical to Stacks) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
        <input
          id="wishlist-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wanted records, artists, editions, or notes..."
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

      {/* 3. Inset Grouped Wishlist Container */}
      <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-[#8E8E93]">
            <Bookmark className="w-8 h-8 text-[#FF5A10] mx-auto opacity-75" />
            <p className="text-sm font-semibold text-white">No wishlist items found</p>
            <p className="text-xs">Add records you are hunting for at record fairs and vinyl shops.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-800/40 transition"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      item.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.priority === 'low'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.priority || 'medium'}
                  </span>
                </div>

                <p className="text-xs text-[#8E8E93]">
                  {item.artist}
                  {item.desiredEdition ? ` · ${item.desiredEdition}` : ''}
                </p>

                <div className="flex items-center gap-3 text-xs text-[#8E8E93] pt-0.5">
                  {item.targetPrice !== undefined && (
                    <span className="text-emerald-400 font-medium font-mono">
                      Target: ${item.targetPrice.toFixed(2)}
                    </span>
                  )}
                  {item.notes && <span className="truncate italic">"{item.notes}"</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    onMoveToLibrary(item);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 active:scale-95 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                  title="Move to Collection"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Acquired</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 border border-white/10 transition cursor-pointer"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onDeleteWishlistItem(item.id);
                  }}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 active:scale-95 text-neutral-400 hover:text-red-400 border border-white/10 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* iOS Bottom Sheet: Add / Edit Modal */}
      {(showAddModal || editingItem) && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div className="w-full sm:max-w-md bg-neutral-900/98 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="pt-3 pb-1 flex justify-center flex-shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/25" />
            </div>

            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingItem ? 'Edit Wanted Record' : 'Add to Wishlist'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full bg-white/[0.08] text-neutral-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs">
                  {formError}
                </div>
              )}

              <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Artist *</label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Daft Punk"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Album Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Discovery"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Desired Pressing</label>
                    <input
                      type="text"
                      value={desiredEdition}
                      onChange={(e) => setDesiredEdition(e.target.value)}
                      placeholder="Japanese Pressing"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Target Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="45.00"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] block mb-1.5">Priority</label>
                  <div className="bg-neutral-900 border border-white/[0.08] p-1 rounded-xl flex items-center gap-1">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => {
                          triggerHaptic('selection');
                          setPriority(p);
                        }}
                        className={`flex-1 py-1 rounded-lg text-xs font-medium capitalize transition ${
                          priority === p
                            ? 'bg-[#2C2C2E] text-white font-semibold shadow-xs'
                            : 'text-[#8E8E93]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Look for gatefold edition with obi..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-98 text-xs font-semibold text-white shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
