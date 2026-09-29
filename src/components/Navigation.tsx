import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Compass,
  Sparkles,
  MoreHorizontal,
  Plus,
  Bookmark,
  SlidersHorizontal,
  Disc3,
  BookmarkPlus,
  X,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface NavigationProps {
  currentTab: NavigationTab;
  onChangeTab: (tab: NavigationTab) => void;
  onOpenRecordPicker: () => void;
  onOpenAddRecord: () => void;
  onOpenAddWishlist: () => void;
  onOpenSettings: () => void;
  wishlistCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  onOpenRecordPicker,
  onOpenAddRecord,
  onOpenAddWishlist,
  onOpenSettings,
  wishlistCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMorePopover, setShowMorePopover] = useState(false);
  const [showActionPopover, setShowActionPopover] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;

        // Top of page: always expand
        if (currentScrollY < 40) {
          setIsCollapsed(false);
        }
        // Downward scroll: collapse 4-item pill to left circle
        else if (delta > 12 && currentScrollY > 80) {
          setIsCollapsed(true);
          setShowMorePopover(false);
          setShowActionPopover(false);
        }
        // Upward scroll: spring back to expanded bar
        else if (delta < -12) {
          setIsCollapsed(false);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });

      ticking.current = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Primary 4 items in bottom pill
  const primaryTabs = [
    { id: 'library' as const, label: 'Stacks', icon: Layers },
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'analytics' as const, label: 'Insights', icon: Sparkles },
    { id: 'more' as const, label: 'More', icon: MoreHorizontal, badge: wishlistCount },
  ];

  // Map current tab icon for collapsed circle
  const getActiveIcon = () => {
    if (currentTab === 'library') return Layers;
    if (currentTab === 'discover') return Compass;
    if (currentTab === 'analytics') return Sparkles;
    if (currentTab === 'wishlist') return Bookmark;
    return Layers;
  };
  const ActiveIcon = getActiveIcon();

  const handleTabClick = (tabId: 'library' | 'discover' | 'analytics' | 'more') => {
    triggerHaptic('selection');
    if (tabId === 'more') {
      setShowActionPopover(false);
      setShowMorePopover(!showMorePopover);
      return;
    }
    setShowMorePopover(false);
    setShowActionPopover(false);
    onChangeTab(tabId);
  };

  const handleExpandFromLeftCircle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsCollapsed(false);
  };

  const handleToggleActionPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setShowMorePopover(false);
    setShowActionPopover(!showActionPopover);
  };

  return (
    <>
      {/* Backdrop for Popovers */}
      {(showMorePopover || showActionPopover) && (
        <div
          onClick={() => {
            setShowMorePopover(false);
            setShowActionPopover(false);
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        />
      )}

      {/* 1. "More" Upward Popover Menu */}
      {showMorePopover && (
        <div
          id="more-popover-menu"
          className="fixed bottom-22 sm:bottom-24 right-20 sm:right-28 z-50 w-48 rounded-2xl bg-neutral-900/98 backdrop-blur-2xl border border-white/12 shadow-2xl p-1.5 space-y-1 animate-slide-up origin-bottom-right"
        >
          <button
            onClick={() => {
              triggerHaptic('selection');
              setShowMorePopover(false);
              onChangeTab('wishlist');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentTab === 'wishlist'
                ? 'bg-[#FF5A10]/15 text-[#FF5A10]'
                : 'text-neutral-200 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FF5A10] text-white text-[10px] font-bold">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowMorePopover(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-200 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      )}

      {/* 2. Right "+" Action Popover Menu */}
      {showActionPopover && (
        <div
          id="action-popover-menu"
          className="fixed bottom-22 sm:bottom-24 right-4 sm:right-6 z-50 w-52 rounded-2xl bg-neutral-900/98 backdrop-blur-2xl border border-white/12 shadow-2xl p-1.5 space-y-1 animate-slide-up origin-bottom-right"
        >
          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowActionPopover(false);
              onOpenRecordPicker();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-white/[0.06] transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#FF5A10]/15 text-[#FF5A10] flex items-center justify-center flex-shrink-0">
              <Disc3 className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">Log a Spin</p>
              <p className="text-[10px] text-[#8E8E93] font-normal leading-tight">Quick turntable session</p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowActionPopover(false);
              onOpenAddRecord();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-white/[0.06] transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="leading-tight">Add Record</p>
              <p className="text-[10px] text-[#8E8E93] font-normal leading-tight">Catalog new pressing</p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowActionPopover(false);
              onOpenAddWishlist();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-white/[0.06] transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">Add to Wishlist</p>
              <p className="text-[10px] text-[#8E8E93] font-normal leading-tight">Wanted record hunt</p>
            </div>
          </button>
        </div>
      )}

      {/* 3. Main Navigation Pill (Morphs to Left Floating Circle on Downward Scroll) */}
      <nav
        id="bottom-navigation-container"
        aria-label="Main Navigation"
        onClick={isCollapsed ? handleExpandFromLeftCircle : undefined}
        className={`fixed bottom-4 sm:bottom-6 z-40 select-none transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
          isCollapsed
            ? 'left-4 sm:left-6 translate-x-0 w-14 h-14 rounded-full cursor-pointer shadow-2xl hover:scale-105 active:scale-90'
            : 'left-4 sm:left-6 sm:left-1/2 sm:-translate-x-[calc(50%+2rem)] w-[calc(100%-6.5rem)] sm:w-auto sm:min-w-[320px] max-w-[340px] h-[58px] rounded-full'
        }`}
      >
        <div
          className={`w-full h-full dark-glass-tabbar rounded-full flex items-center justify-around relative shadow-2xl transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            isCollapsed ? 'p-0 justify-center border border-white/20' : 'p-1.5 px-2'
          }`}
        >
          {isCollapsed ? (
            /* Left Floating Active Tab Circle (56px x 56px) */
            <div className="relative flex items-center justify-center text-[#FF5A10] animate-fade-in">
              <ActiveIcon className="w-6 h-6 stroke-[2.3]" />
              {currentTab === 'wishlist' && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#FF5A10] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </div>
          ) : (
            /* 4-Item Pill: Stacks, Discover, Insights, More */
            primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isTabActive =
                tab.id === 'more'
                  ? currentTab === 'wishlist' || showMorePopover
                  : currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabClick(tab.id);
                  }}
                  aria-label={tab.label}
                  aria-current={isTabActive ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
                    isTabActive
                      ? 'text-[#FF5A10]'
                      : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Active Capsule Glow */}
                  {isTabActive && (
                    <span className="absolute inset-0 rounded-full bg-[#FF5A10]/15 border border-[#FF5A10]/30 transition-all duration-200" />
                  )}

                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-4.5 h-4.5 transition-transform duration-200 ${
                        isTabActive ? 'scale-105 stroke-[2.4] text-[#FF5A10]' : 'stroke-[1.9]'
                      }`}
                    />
                    {tab.id === 'more' && wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-2.5 min-w-3.5 h-3.5 px-1 rounded-full bg-[#FF5A10] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs shadow-[#FF5A10]/50">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9.5px] mt-0.5 tracking-tight font-medium relative z-10 transition-colors whitespace-nowrap ${
                      isTabActive ? 'font-semibold text-[#FF5A10]' : 'text-[#8E8E93]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </nav>

      {/* 4. Separate Right-Side Floating Action Circle ("+") Always In Place (56px x 56px) */}
      <button
        id="bottom-action-button"
        onClick={handleToggleActionPopover}
        aria-label="Add or Log"
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-full dark-glass-tabbar flex items-center justify-center shadow-2xl border border-white/20 active:scale-90 hover:scale-105 cursor-pointer transition-all duration-200 ${
          showActionPopover ? 'bg-[#FF5A10] text-white rotate-45 border-[#FF5A10]' : 'text-white'
        }`}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </>
  );
};
