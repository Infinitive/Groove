import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Album } from '../types';
import { RatingStars } from './RatingStars';

interface AddEditRecordModalProps {
  isOpen?: boolean;
  mode?: 'add' | 'edit';
  album?: Album;
  existingAlbum?: Album;
  allAlbums?: Album[];
  onSave: (albumData: Omit<Album, 'id' | 'addedAt' | 'updatedAt'> | Album) => Promise<void>;
  onClose: () => void;
}

export const AddEditRecordModal: React.FC<AddEditRecordModalProps> = ({
  album,
  existingAlbum,
  allAlbums = [],
  onSave,
  onClose,
}) => {
  const activeRecord = album || existingAlbum;
  const isEditing = Boolean(activeRecord);

  // Form states
  const [artist, setArtist] = useState(activeRecord?.artist || '');
  const [title, setTitle] = useState(activeRecord?.title || '');
  const [releaseYear, setReleaseYear] = useState<string>(activeRecord?.releaseYear?.toString() || '');
  const [genresText, setGenresText] = useState(activeRecord?.genres?.join(', ') || '');
  const [stylesText, setStylesText] = useState(activeRecord?.styles?.join(', ') || '');
  const [format, setFormat] = useState(activeRecord?.format || '');
  const [edition, setEdition] = useState(activeRecord?.edition || '');
  const [variant, setVariant] = useState(activeRecord?.variant || '');
  const [label, setLabel] = useState(activeRecord?.label || '');
  const [country, setCountry] = useState(activeRecord?.country || '');
  const [rpm, setRpm] = useState(activeRecord?.rpm || '');
  const [discCount, setDiscCount] = useState<string>(activeRecord?.discCount?.toString() || '');
  const [catalogNumber, setCatalogNumber] = useState(activeRecord?.catalogNumber || '');
  const [purchasePrice, setPurchasePrice] = useState<string>(
    activeRecord?.purchasePrice !== undefined ? activeRecord.purchasePrice.toString() : ''
  );
  const [purchaseDate, setPurchaseDate] = useState(activeRecord?.purchaseDate || '');
  const [personalRating, setPersonalRating] = useState<number>(activeRecord?.personalRating || 0);
  const [notes, setNotes] = useState(activeRecord?.notes || '');
  const [coverImage, setCoverImage] = useState(activeRecord?.coverImage || '');

  // Matrix Runout & Identifiers
  const [barcode, setBarcode] = useState(activeRecord?.barcode || '');
  const [matrixRunout, setMatrixRunout] = useState(activeRecord?.matrixRunout || '');
  const [pressingPlant, setPressingPlant] = useState(activeRecord?.pressingPlant || '');
  const [vinylWeight, setVinylWeight] = useState(activeRecord?.vinylWeight || '');

  const [showAdvanced, setShowAdvanced] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) {
      setFormError('Artist and Title are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const parsedYear = releaseYear.trim() ? parseInt(releaseYear.trim(), 10) : undefined;
      const parsedDiscCount = discCount.trim() ? parseInt(discCount.trim(), 10) : undefined;
      const parsedPrice = purchasePrice.trim() ? parseFloat(purchasePrice.trim()) : undefined;

      const genres = genresText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const styles = stylesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const albumPayload = {
        artist: artist.trim(),
        title: title.trim(),
        releaseYear: parsedYear,
        genres: genres.length > 0 ? genres : undefined,
        styles: styles.length > 0 ? styles : undefined,
        format: format.trim() || undefined,
        edition: edition.trim() || undefined,
        variant: variant.trim() || undefined,
        label: label.trim() || undefined,
        country: country.trim() || undefined,
        rpm: rpm.trim() || undefined,
        discCount: parsedDiscCount,
        catalogNumber: catalogNumber.trim() || undefined,
        purchasePrice: parsedPrice,
        purchaseDate: purchaseDate.trim() || undefined,
        personalRating: personalRating > 0 ? personalRating : undefined,
        notes: notes.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        barcode: barcode.trim() || undefined,
        matrixRunout: matrixRunout.trim() || undefined,
        pressingPlant: pressingPlant.trim() || undefined,
        vinylWeight: vinylWeight.trim() || undefined,
      };

      if (isEditing && activeRecord) {
        await onSave({ ...activeRecord, ...albumPayload });
      } else {
        await onSave(albumPayload as any);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record.');
      setSaving(false);
    }
  };

  return (
    <div
      id="add-edit-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        id="add-edit-record-sheet"
        className="w-full sm:max-w-xl max-h-[min(90vh,calc(100dvh-5.5rem))] bg-neutral-900/95 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* iOS Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <h3 className="text-base font-bold text-white tracking-tight">
            {isEditing ? 'Edit Record' : 'Add New Record'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
          {formError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Inset Group: Primary Metadata */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1">
                Artist <span className="text-[#FF5A10]">*</span>
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Pink Floyd, Jungle, Miles Davis"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1">
                Album Title <span className="text-[#FF5A10]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Dark Side of the Moon"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Release Year</label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="1973"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Format</label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="LP, 2xLP, 180g"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Inset Group: Genre & Pressing Edition */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Genres (comma-separated)</label>
              <input
                type="text"
                value={genresText}
                onChange={(e) => setGenresText(e.target.value)}
                placeholder="Progressive Rock, Psychedelic, Funk"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Edition / Variant</label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="50th Anniversary, Amber Splatter"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Record Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Harvest, Columbia, Warp"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Cover Artwork URL (Optional)</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Inset Group: Personal Rating & Notes */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1.5">Personal Rating</label>
              <div className="flex items-center gap-3">
                <RatingStars value={personalRating} size="md" onChange={setPersonalRating} />
                <span className="text-xs text-[#8E8E93]">
                  {personalRating > 0 ? `${personalRating} / 5 stars` : 'Unrated'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Collector Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Original Japanese pressing with OBI strip, dead silent playback..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-sm text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Advanced Physical Matrix Fields Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-2 flex items-center justify-between text-xs font-semibold text-[#8E8E93] hover:text-white cursor-pointer"
            >
              <span>Deadwax, Matrix Runout & Purchase Info</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Matrix Runout</label>
                    <input
                      type="text"
                      value={matrixRunout}
                      onChange={(e) => setMatrixRunout(e.target.value)}
                      placeholder="SHVL 804 A-1"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Vinyl Weight</label>
                    <input
                      type="text"
                      value={vinylWeight}
                      onChange={(e) => setVinylWeight(e.target.value)}
                      placeholder="180g / Standard"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Purchase Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="29.99"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white placeholder:text-neutral-500 focus:border-[#FF5A10] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8E8E93] block mb-1">Acquired Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs text-white focus:border-[#FF5A10] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-98 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Album' : 'Save to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
