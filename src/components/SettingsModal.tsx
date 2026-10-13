import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppIcon } from './AppIcon';

interface SettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onExportJSON: () => Promise<string>;
  onImportJSON: (
    jsonString: string,
    mode: 'replace' | 'merge'
  ) => Promise<{ importedAlbums?: number; importedLogs?: number; importedWishlist?: number; albums?: number; logs?: number }>;
  onExportCSV: (type: 'library' | 'listens' | 'wishlist') => string;
  onClearDatabase?: () => Promise<void>;
  onLoadDemoCatalogue?: () => Promise<void>;
  onResetCatalogue?: () => Promise<void>;
  onResetToCatalogue?: () => Promise<void>;
  onResetToDefault?: () => Promise<void>;
  totalAlbums?: number;
  albumCount?: number;
  collectionCount?: number;
  totalListens?: number;
  listenLogCount?: number;
  listenCount?: number;
  wishlistCount?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onExportJSON,
  onImportJSON,
  onExportCSV,
  onClearDatabase,
  onLoadDemoCatalogue,
  onResetCatalogue,
  onResetToCatalogue,
  onResetToDefault,
  totalAlbums,
  albumCount,
  collectionCount,
  totalListens,
  listenLogCount,
  listenCount,
  wishlistCount = 0,
}) => {
  const totalAlbumsCount = totalAlbums ?? albumCount ?? collectionCount ?? 0;
  const totalListensCount = totalListens ?? listenLogCount ?? listenCount ?? 0;
  const totalWishlistCount = wishlistCount ?? 0;
  const clearHandler = onClearDatabase || onResetToDefault || onResetCatalogue || onResetToCatalogue;
  const demoHandler = onLoadDemoCatalogue || onResetCatalogue || onResetToCatalogue;

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearConfirm) {
          setShowClearConfirm(false);
        } else if (showDemoConfirm) {
          setShowDemoConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showClearConfirm, showDemoConfirm, onClose]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    try {
      setProcessing(true);
      const json = await onExportJSON();
      const date = new Date().toISOString().substring(0, 10);
      downloadFile(json, `groove-backup-${date}.json`, 'application/json');
      setStatusMessage({ type: 'success', text: 'Full JSON archive downloaded.' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to export backup.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = (type: 'library' | 'listens' | 'wishlist') => {
    try {
      const csv = onExportCSV(type);
      const date = new Date().toISOString().substring(0, 10);
      downloadFile(csv, `groove-${type}-${date}.csv`, 'text/csv');
      setStatusMessage({ type: 'success', text: `Exported ${type} spreadsheet CSV.` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to export CSV.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setProcessing(true);
        const text = evt.target?.result as string;
        const result = await onImportJSON(text, importMode);
        const count = result.importedAlbums ?? result.albums ?? 0;
        setStatusMessage({
          type: 'success',
          text: `Restored ${count} albums successfully.`,
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Invalid backup file.',
        });
      } finally {
        setProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="settings-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        id="settings-sheet"
        className="w-full sm:max-w-md max-h-[min(90vh,calc(100dvh-5.5rem))] bg-neutral-900/95 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* iOS Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <h3 className="text-base font-bold text-white tracking-tight">Settings & Data</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/20 text-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* App Brand & Install */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppIcon className="w-11 h-11 rounded-xl shadow-lg border border-white/10 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">Groove</h4>
                <p className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">
                  Vinyl Registry &amp; Listening Companion
                </p>
              </div>
            </div>
            <PWAInstallButton />
          </div>

          {/* Storage Summary */}
          <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <HardDrive className="w-4 h-4 text-[#FF5A10]" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Local Storage</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-neutral-900 border border-white/[0.06]">
                <p className="text-base font-bold text-white tabular-nums">{totalAlbumsCount}</p>
                <p className="text-[10px] text-[#8E8E93]">Records</p>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900 border border-white/[0.06]">
                <p className="text-base font-bold text-white tabular-nums">{totalListensCount}</p>
                <p className="text-[10px] text-[#8E8E93]">Spins</p>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900 border border-white/[0.06]">
                <p className="text-base font-bold text-white tabular-nums">{totalWishlistCount}</p>
                <p className="text-[10px] text-[#8E8E93]">Wishlist</p>
              </div>
            </div>
          </div>

          {/* Backup & Export Group */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1">
              Backup & Export
            </h4>
            <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <button
                onClick={handleExportJSON}
                disabled={processing}
                className="w-full p-3.5 flex items-center justify-between hover:bg-neutral-900 active:bg-neutral-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-[#FF5A10]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Full JSON Backup</p>
                    <p className="text-[10px] text-[#8E8E93]">Albums, spin logs & wishlist in JSON</p>
                  </div>
                </div>
                <span className="text-xs text-[#FF5A10] font-medium">Export</span>
              </button>

              <button
                onClick={() => handleExportCSV('library')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-neutral-900 active:bg-neutral-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-[#FF5A10]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Library CSV Spreadsheet</p>
                    <p className="text-[10px] text-[#8E8E93]">Open in Excel or Apple Numbers</p>
                  </div>
                </div>
                <span className="text-xs text-[#FF5A10] font-medium">Export</span>
              </button>
            </div>
          </div>

          {/* Restore / Import Group */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1">
              Restore / Import
            </h4>
            <div className="bg-neutral-950/60 border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* iOS Segmented mode */}
              <div className="bg-neutral-900 border border-white/[0.08] p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
                    importMode === 'replace'
                      ? 'bg-[#2C2C2E] text-white shadow-xs font-semibold'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  Replace All
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
                    importMode === 'merge'
                      ? 'bg-[#2C2C2E] text-white shadow-xs font-semibold'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  Merge Existing
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-xs font-semibold text-white border border-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF5A10]" />
                <span>Select JSON Backup File</span>
              </button>
            </div>
          </div>

          {/* Demo & Reset Controls */}
          <div className="space-y-2 pt-1">
            {/* Load Demo Catalogue (Optional) */}
            {demoHandler && (
              <div>
                {!showDemoConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDemoConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-900 border border-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF5A10]" />
                    <span>Load Sample Demo Records</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-neutral-950/80 border border-white/10 rounded-2xl space-y-2">
                    <p className="text-xs text-neutral-200 font-semibold text-center">
                      Populate library with curated sample records?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDemoConfirm(false)}
                        className="flex-1 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await demoHandler();
                          setShowDemoConfirm(false);
                          setStatusMessage({ type: 'success', text: 'Sample demo catalogue loaded.' });
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] text-xs font-semibold text-white cursor-pointer"
                      >
                        Load Samples
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reset to Clean Slate */}
            {clearHandler && (
              <div>
                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-neutral-950/40 hover:bg-red-950/30 text-neutral-500 hover:text-red-400 border border-white/[0.06] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset / Wipe All Records (Clean Slate)</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-red-950/40 border border-red-500/20 rounded-2xl space-y-2">
                    <p className="text-xs text-red-200 font-semibold text-center">
                      Wipe all records, spin sessions & wishlist to a clean slate?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await clearHandler();
                          setShowClearConfirm(false);
                          setStatusMessage({ type: 'success', text: 'Database reset to empty state.' });
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Wipe Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
