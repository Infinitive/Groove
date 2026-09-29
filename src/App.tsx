/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Disc3, AlertCircle } from 'lucide-react';
import { useVinylData } from './hooks/useVinylData';
import { NavigationTab, Album } from './types';
import { Navigation } from './components/Navigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LibraryView } from './views/LibraryView';
import { DiscoverView } from './views/DiscoverView';
import { AnalyticsView } from './views/AnalyticsView';
import { WishlistView } from './views/WishlistView';
import { RecordDetailModal } from './components/RecordDetailModal';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { LogListenModal } from './components/LogListenModal';
import { SettingsModal } from './components/SettingsModal';
import { RecordPickerModal } from './components/RecordPickerModal';

export default function App() {
  const {
    albums,
    listenLogs,
    wishlist,
    albumStats,
    loading,
    error,
    addAlbum,
    updateAlbum,
    deleteAlbum,
    addListenLog,
    deleteListenLog,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    moveWishlistToLibrary,
    exportJSON,
    importJSON,
    resetToCatalogue,
    exportCSV,
  } = useVinylData();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('library');

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentTab]);

  // Modal / Interaction states
  const [selectedAlbumForDetail, setSelectedAlbumForDetail] = useState<Album | null>(null);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [albumToLogListen, setAlbumToLogListen] = useState<Album | null>(null);
  const [isRecordPickerOpen, setIsRecordPickerOpen] = useState(false);
  const [isWishlistAddModalOpen, setIsWishlistAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Loading state (Apple Dark Mode Loading)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#16161A] border border-white/10 flex items-center justify-center shadow-2xl">
          <Disc3 className="w-8 h-8 text-[#FF5A10] animate-spin stroke-[2.2]" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-semibold text-white tracking-tight">Opening Groove</h2>
          <p className="text-xs text-[#8E8E93]">Accessing local vinyl collection...</p>
        </div>
      </div>
    );
  }

  // Error state (Apple Dark Alert Card)
  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-6 rounded-[24px] bg-[#16161A] border border-white/10 max-w-md text-center space-y-3 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-[#FF5A10] mx-auto stroke-[2.2]" />
          <h2 className="text-lg font-bold text-white tracking-tight">Database Initialization Error</h2>
          <p className="text-xs text-[#8E8E93] leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-[#FF5A10] hover:bg-[#FF6F28] text-white text-xs font-semibold transition active:scale-95 shadow-sm shadow-[#FF5A10]/30 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col selection:bg-[#FF5A10]/25 selection:text-[#FF7A00]">
      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Main View Container with Zero Top Header & Safe-Area Top Padding */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-[env(safe-area-inset-top,1.25rem)] sm:pt-6 pb-28 sm:pb-32">
        <div key={currentTab} className="tab-view-wrapper">
          {currentTab === 'library' && (
            <LibraryView
              albums={albums}
              albumStats={albumStats}
              onSelectAlbum={(album) => setSelectedAlbumForDetail(album)}
              onOpenAdd={() => setIsAddRecordOpen(true)}
              onLogListen={(album) => setAlbumToLogListen(album)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {currentTab === 'discover' && (
            <DiscoverView
              albums={albums}
              listenLogs={listenLogs}
              onSelectAlbum={(album) => setSelectedAlbumForDetail(album)}
              onLogListen={(album) => setAlbumToLogListen(album)}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              albums={albums}
              listenLogs={listenLogs}
              onSelectAlbum={(album) => setSelectedAlbumForDetail(album)}
              onDeleteListenLog={deleteListenLog}
              onLogListen={(album) => setAlbumToLogListen(album)}
              onOpenRecordPicker={() => setIsRecordPickerOpen(true)}
            />
          )}

          {currentTab === 'wishlist' && (
            <WishlistView
              wishlist={wishlist}
              isOpenAddModal={isWishlistAddModalOpen}
              onCloseAddModal={() => setIsWishlistAddModalOpen(false)}
              onAddWishlistItem={addWishlistItem}
              onUpdateWishlistItem={updateWishlistItem}
              onDeleteWishlistItem={deleteWishlistItem}
              onMoveToLibrary={moveWishlistToLibrary}
              onSelectAlbum={(album) => setSelectedAlbumForDetail(album)}
            />
          )}
        </div>
      </main>

      {/* Persistent Bottom Floating Navigation (4-Item Pill + Separate Right "+" Circle) */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={handleTabChange}
        onOpenRecordPicker={() => setIsRecordPickerOpen(true)}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
        onOpenAddWishlist={() => {
          handleTabChange('wishlist');
          setIsWishlistAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* FAST 2-TAP RECORD PICKER FOR LOG A SPIN */}
      {isRecordPickerOpen && (
        <RecordPickerModal
          albums={albums}
          albumStats={albumStats}
          onSelectRecord={(album) => {
            setIsRecordPickerOpen(false);
            setAlbumToLogListen(album);
          }}
          onClose={() => setIsRecordPickerOpen(false)}
        />
      )}

      {/* MODAL 1: Record Detail */}
      {selectedAlbumForDetail && (
        <RecordDetailModal
          album={selectedAlbumForDetail}
          listenLogs={listenLogs}
          playCount={albumStats.get(selectedAlbumForDetail.id)?.playCount || 0}
          lastPlayed={albumStats.get(selectedAlbumForDetail.id)?.lastPlayed}
          onClose={() => setSelectedAlbumForDetail(null)}
          onEdit={(album) => {
            setSelectedAlbumForDetail(null);
            setAlbumToEdit(album);
          }}
          onDelete={(id) => {
            deleteAlbum(id);
            setSelectedAlbumForDetail(null);
          }}
          onLogListen={(album) => {
            setAlbumToLogListen(album);
          }}
          onDeleteListenLog={deleteListenLog}
          onUpdateRating={(album, newRating) => {
            updateAlbum({ ...album, personalRating: newRating });
            setSelectedAlbumForDetail({ ...album, personalRating: newRating });
          }}
        />
      )}

      {/* MODAL 2: Add or Edit Record */}
      {(isAddRecordOpen || albumToEdit) && (
        <AddEditRecordModal
          album={albumToEdit || undefined}
          onClose={() => {
            setIsAddRecordOpen(false);
            setAlbumToEdit(null);
          }}
          onSave={async (albumData) => {
            if (albumToEdit) {
              await updateAlbum({ ...albumToEdit, ...albumData });
              setAlbumToEdit(null);
            } else {
              await addAlbum(albumData);
              setIsAddRecordOpen(false);
            }
          }}
        />
      )}

      {/* MODAL 3: Log Listen Session */}
      {albumToLogListen && (
        <LogListenModal
          album={albumToLogListen}
          onClose={() => setAlbumToLogListen(null)}
          onSave={async (logData) => {
            await addListenLog(logData);
            setAlbumToLogListen(null);
          }}
        />
      )}

      {/* MODAL 4: Settings & Data Backup */}
      {isSettingsOpen && (
        <SettingsModal
          totalAlbums={albums.length}
          totalListens={listenLogs.length}
          onClose={() => setIsSettingsOpen(false)}
          onExportJSON={exportJSON}
          onImportJSON={importJSON}
          onExportCSV={exportCSV}
          onResetToDefault={resetToCatalogue}
        />
      )}
    </div>
  );
}
