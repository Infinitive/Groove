import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Calendar,
  Sparkles,
  Layers,
  Clock,
  Trash2,
  Disc,
  DollarSign,
  TrendingUp,
  Building,
  BarChart3,
  Flame,
  Radio,
  Volume2,
  PlusCircle,
  Star,
  Tag,
  Award,
  Disc3,
} from 'lucide-react';
import { Album, ListenLog } from '../types';
import {
  calculateComprehensiveAnalytics,
  AnalyticsTimeRange,
} from '../engines/analyticsEngine';
import { RatingStars } from '../components/RatingStars';
import { VinylArtwork } from '../components/VinylArtwork';
import { triggerHaptic } from '../utils/haptics';

type AnalyticsSection = 'overview' | 'collection' | 'listening';

interface AnalyticsViewProps {
  albums: Album[];
  listenLogs: ListenLog[];
  onSelectAlbum: (album: Album) => void;
  onDeleteListenLog: (logId: string) => void;
  onLogListen?: (album: Album) => void;
  onOpenRecordPicker?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  albums = [],
  listenLogs = [],
  onSelectAlbum,
  onDeleteListenLog,
  onLogListen,
  onOpenRecordPicker,
}) => {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>('overview');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('all');
  const [rankingTab, setRankingTab] = useState<'most' | 'recent' | 'never'>('most');

  // Compute analytics safely using the comprehensive engine
  const analytics = useMemo(() => {
    try {
      return calculateComprehensiveAnalytics(albums, listenLogs, timeRange);
    } catch (err) {
      console.error('Analytics calculation error:', err);
      return null;
    }
  }, [albums, listenLogs, timeRange]);

  const albumMap = useMemo(() => new Map(albums.map((a) => [a.id, a])), [albums]);

  // Played vs Unplayed counts
  const playedCount = useMemo(() => {
    const playedSet = new Set(listenLogs.map((l) => l.recordId));
    return albums.filter((a) => playedSet.has(a.id)).length;
  }, [albums, listenLogs]);

  const unplayedCount = Math.max(0, albums.length - playedCount);
  const playedPercent = albums.length > 0 ? Math.round((playedCount / albums.length) * 100) : 0;

  // Active (last 60 days) vs Dormant vs Unspun
  const rotationStats = useMemo(() => {
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const albumLastPlayMap = new Map<string, number>();
    listenLogs.forEach((l) => {
      const t = new Date(l.listenedAt).getTime();
      const prev = albumLastPlayMap.get(l.recordId) || 0;
      if (t > prev) albumLastPlayMap.set(l.recordId, t);
    });

    let activeCount = 0;
    let dormantCount = 0;

    albums.forEach((a) => {
      const last = albumLastPlayMap.get(a.id);
      if (!last) {
        // unspun
      } else if (last >= sixtyDaysAgo) {
        activeCount += 1;
      } else {
        dormantCount += 1;
      }
    });

    return {
      activeCount,
      activePercent: albums.length > 0 ? Math.round((activeCount / albums.length) * 100) : 0,
      dormantCount,
      dormantPercent: albums.length > 0 ? Math.round((dormantCount / albums.length) * 100) : 0,
    };
  }, [albums, listenLogs]);

  // Breakdown by Labels
  const labelsDistribution = useMemo(() => {
    const map = new Map<string, number>();
    albums.forEach((a) => {
      const label = a.label?.trim() || 'Independent / Unspecified';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count, percentage: (count / (albums.length || 1)) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [albums]);

  // Breakdown by Formats
  const formatsDistribution = useMemo(() => {
    const map = new Map<string, number>();
    albums.forEach((a) => {
      const fmt = a.format?.trim() || 'Standard LP';
      map.set(fmt, (map.get(fmt) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([format, count]) => ({ format, count, percentage: (count / (albums.length || 1)) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [albums]);

  // Decades Breakdown
  const decadesDistribution = useMemo(() => {
    const map = new Map<string, number>();
    albums.forEach((a) => {
      if (a.releaseYear) {
        const decade = `${Math.floor(a.releaseYear / 10) * 10}s`;
        map.set(decade, (map.get(decade) || 0) + 1);
      } else {
        map.set('Unknown Era', (map.get('Unknown Era') || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([decade, count]) => ({ decade, count, percentage: (count / (albums.length || 1)) * 100 }))
      .sort((a, b) => {
        if (a.decade === 'Unknown Era') return 1;
        if (b.decade === 'Unknown Era') return -1;
        return a.decade.localeCompare(b.decade);
      });
  }, [albums]);

  // Distinct Sub-Styles from catalog
  const stylesList = useMemo(() => {
    const map = new Map<string, number>();
    albums.forEach((a) => {
      a.styles?.forEach((s) => {
        const style = s.trim();
        if (style) map.set(style, (map.get(style) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [albums]);

  // Listening Setup Context Distribution
  const setupContextDistribution = useMemo(() => {
    const map = new Map<string, number>();
    listenLogs.forEach((l) => {
      const ctx = l.context?.trim() || 'Turntable & Speakers';
      map.set(ctx, (map.get(ctx) || 0) + 1);
    });
    return Array.from(map.entries()).map(([context, count]) => ({
      context,
      count,
      percentage: Math.round((count / (listenLogs.length || 1)) * 100),
    }));
  }, [listenLogs]);

  // Highly-Rated but Neglected Records (4+ star records unplayed or low spins)
  const neglectedFavorites = useMemo(() => {
    const now = Date.now();
    const playCountMap = new Map<string, number>();
    const lastPlayMap = new Map<string, number>();

    listenLogs.forEach((l) => {
      playCountMap.set(l.recordId, (playCountMap.get(l.recordId) || 0) + 1);
      const t = new Date(l.listenedAt).getTime();
      const prev = lastPlayMap.get(l.recordId) || 0;
      if (t > prev) lastPlayMap.set(l.recordId, t);
    });

    const list: { album: Album; playCount: number; daysAgo?: number }[] = [];
    albums.forEach((album) => {
      if (album.personalRating && album.personalRating >= 4) {
        const plays = playCountMap.get(album.id) || 0;
        const last = lastPlayMap.get(album.id);
        if (plays === 0) {
          list.push({ album, playCount: 0 });
        } else if (last && now - last > 45 * 24 * 60 * 60 * 1000) {
          const daysAgo = Math.round((now - last) / (24 * 60 * 60 * 1000));
          list.push({ album, playCount: plays, daysAgo });
        }
      }
    });

    return list.slice(0, 8);
  }, [albums, listenLogs]);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? 'Never' : d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Never';
    }
  };

  const handleTabSwitch = (section: AnalyticsSection) => {
    triggerHaptic('selection');
    setActiveSection(section);
  };

  const overview = analytics?.collectionOverview;
  const demographics = analytics?.collectionDemographics;
  const temporal = analytics?.temporalListening;
  const artistListening = analytics?.artistListening;
  const genreListening = analytics?.genreListening;

  return (
    <div id="analytics-view" className="space-y-5 pb-8">
      {/* 1. iOS 3-Tab Segmented Navigation */}
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
          Archive Intelligence
        </h2>
        <div className="bg-neutral-900 border border-white/[0.08] p-1 rounded-2xl flex items-center gap-1 shadow-sm">
          <button
            onClick={() => handleTabSwitch('overview')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
              activeSection === 'overview'
                ? 'bg-[#2C2C2E] text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabSwitch('collection')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
              activeSection === 'collection'
                ? 'bg-[#2C2C2E] text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Collection
          </button>
          <button
            onClick={() => handleTabSwitch('listening')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
              activeSection === 'listening'
                ? 'bg-[#2C2C2E] text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Listening
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (TIGHTENED VERTICAL SPACING & HIGH DENSITY) */}
      {/* ======================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-3.5">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span className="text-xs font-medium">Total Inventory</span>
                <Disc className="w-4 h-4 text-[#FF5A10]" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {overview?.totalRecords || albums.length}
              </p>
              <p className="text-[11px] text-[#8E8E93]">
                {overview?.uniqueArtists || 0} unique artists
              </p>
            </div>

            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span className="text-xs font-medium">Musical Styles</span>
                <Layers className="w-4 h-4 text-[#FF7A00]" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {overview?.uniqueGenres || 0}
              </p>
              <p className="text-[11px] text-[#8E8E93]">
                {overview?.uniqueStyles || stylesList.length} sub-genres
              </p>
            </div>

            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span className="text-xs font-medium">Decades & Span</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {overview?.representedDecadesCount || decadesDistribution.length}
              </p>
              <p className="text-[11px] text-[#8E8E93]">
                {overview?.releaseYearSpan
                  ? `${overview.releaseYearSpan.min}–${overview.releaseYearSpan.max} (${overview.releaseYearSpan.spanYears} yrs)`
                  : '1956–2026'}
              </p>
            </div>

            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span className="text-xs font-medium">Archive Valuation</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {overview?.totalEstimatedSpend !== null && overview?.totalEstimatedSpend !== undefined
                  ? `$${overview.totalEstimatedSpend.toFixed(0)}`
                  : 'N/A'}
              </p>
              <p className="text-[11px] text-[#8E8E93]">
                {overview?.recordsWithPurchaseInfoCount || 0} priced records
              </p>
            </div>
          </div>

          {/* Collection Playback Ratio & Active vs Dormant Gauge */}
          <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FF5A10]" />
                <span>Collection Playback & Rotation Split</span>
              </h3>
              <span className="text-xs font-bold text-[#FF5A10] font-mono">
                {playedPercent}% Spun
              </span>
            </div>

            {/* Dual Gauge Bar */}
            <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A00] to-[#FF5A10] transition-all duration-500"
                style={{ width: `${playedPercent}%` }}
              />
              <div
                className="h-full bg-white/[0.08]"
                style={{ width: `${100 - playedPercent}%` }}
              />
            </div>

            {/* Sub-Metric Split Pills */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
                  <Flame className="w-3.5 h-3.5 text-[#FF5A10]" />
                  <span>Active (60d)</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 tabular-nums">
                  {rotationStats.activeCount} <span className="text-[11px] font-normal text-[#8E8E93]">({rotationStats.activePercent}%)</span>
                </p>
              </div>

              <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dormant</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 tabular-nums">
                  {rotationStats.dormantCount} <span className="text-[11px] font-normal text-[#8E8E93]">({rotationStats.dormantPercent}%)</span>
                </p>
              </div>

              <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span>Unspun</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 tabular-nums">
                  {unplayedCount} <span className="text-[11px] font-normal text-[#8E8E93]">({100 - playedPercent}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Rating & Pressing Variant Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Rating Breakdown */}
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rating Breakdown</span>
                </span>
                <span className="text-xs font-semibold text-amber-400 font-mono">
                  Avg ★ {overview?.averageRating ? overview.averageRating.toFixed(1) : '0.0'} / 5.0
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                  <p className="text-[11px] text-[#8E8E93]">Rated Records</p>
                  <p className="text-base font-bold text-white tabular-nums mt-0.5">
                    {overview?.ratedRecordsCount || 0}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                  <p className="text-[11px] text-[#8E8E93]">Unrated Records</p>
                  <p className="text-base font-bold text-white tabular-nums mt-0.5">
                    {overview?.unratedRecordsCount || albums.length}
                  </p>
                </div>
              </div>

              {/* Star Distribution Breakdown */}
              {analytics?.collectionDemographics?.ratingDistribution &&
                analytics.collectionDemographics.ratingDistribution.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                    {analytics.collectionDemographics.ratingDistribution
                      .slice()
                      .reverse()
                      .map((item) => (
                        <div key={item.rating} className="flex items-center gap-2 text-[11px]">
                          <span className="w-11 text-amber-400/90 font-medium whitespace-nowrap text-[10px]">
                            ★ {item.rating}
                          </span>
                          <div className="flex-1 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(4, item.percentage)}%` }}
                            />
                          </div>
                          <span className="w-7 text-right text-white font-mono text-[10px] tabular-nums">
                            {item.count}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
            </div>

            {/* Special Pressings & Variants */}
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF5A10]" />
                  <span>Physical Pressing Variants</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                  <p className="text-[11px] text-[#8E8E93]">Special Editions</p>
                  <p className="text-base font-bold text-white tabular-nums mt-0.5">
                    {overview?.recordsWithEditionCount || 0}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                  <p className="text-[11px] text-[#8E8E93]">Color Variants</p>
                  <p className="text-base font-bold text-white tabular-nums mt-0.5">
                    {overview?.recordsWithVariantCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dominant Era Summary */}
          <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-2.5 shadow-sm">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF7A00]" />
              <span>Release Timeline & Era Span</span>
            </h3>

            <div className="space-y-2">
              {decadesDistribution.map((item) => (
                <div key={item.decade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{item.decade}</span>
                    <span className="text-[#8E8E93] font-mono">
                      {item.count} {item.count === 1 ? 'record' : 'records'} ({Math.round(item.percentage)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF7A00] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, Math.round(item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COLLECTION (PURE COMPOSITION & SHAPE OF SHELF)    */}
      {/* ======================================================== */}
      {activeSection === 'collection' && (
        <div className="space-y-4">
          {/* Top Record Labels Breakdown */}
          <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FF5A10]" />
              <span>Top Record Labels</span>
            </h3>

            <div className="space-y-2.5">
              {labelsDistribution.slice(0, 8).map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[220px]">{item.label}</span>
                    <span className="text-[#8E8E93] font-mono">
                      {item.count} {item.count === 1 ? 'record' : 'records'} ({Math.round(item.percentage)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF5A10] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, Math.round(item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formats & Physical Pressing Types */}
          <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Disc className="w-4 h-4 text-[#FF7A00]" />
              <span>Format & Physical Pressing Types</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {formatsDistribution.map((item) => (
                <div
                  key={item.format}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-white/[0.06] space-y-0.5"
                >
                  <p className="text-xs font-semibold text-white truncate">{item.format}</p>
                  <p className="text-sm font-bold text-[#FF5A10] font-mono">{item.count}</p>
                  <p className="text-[10px] text-[#8E8E93]">{Math.round(item.percentage)}% of shelf</p>
                </div>
              ))}
            </div>
          </div>

          {/* Genre Distribution */}
          {demographics?.genresDistribution && (
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF5A10]" />
                <span>Musical Genre Composition</span>
              </h3>

              <div className="space-y-2.5">
                {demographics.genresDistribution.slice(0, 8).map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-[#8E8E93] font-mono">
                        {item.count} records ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF5A10] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, Math.round(item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Styles Tag Cloud */}
          {stylesList.length > 0 && (
            <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Cataloged Sub-Styles & Classifications</span>
              </h3>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {stylesList.map((item) => (
                  <span
                    key={item.name}
                    className="px-2.5 py-1 rounded-lg bg-neutral-950/70 border border-white/[0.06] text-xs text-neutral-300 flex items-center gap-1.5"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] text-[#8E8E93] font-mono">({item.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Highest-Rated Records in Archive */}
          {demographics?.highestRatedAlbums && demographics.highestRatedAlbums.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Highest Rated Records</span>
              </h3>

              <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                {demographics.highestRatedAlbums.slice(0, 8).map((album) => (
                  <div
                    key={album.id}
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectAlbum(album);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-neutral-800/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                        <VinylArtwork album={album} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white truncate">{album.title}</h4>
                        <p className="text-xs text-[#8E8E93] truncate">{album.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                      <span>★ {album.personalRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LISTENING (ACTUAL USE & LISTENING GAPS)            */}
      {/* ======================================================== */}
      {activeSection === 'listening' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Listening Activity & Rotations
              </h3>
              <p className="text-xs text-[#8E8E93]">
                {listenLogs.length} total sessions · {playedCount} albums spun ({playedPercent}% engagement)
              </p>
            </div>

            {/* Time range Selector */}
            <div className="bg-neutral-900 border border-white/[0.08] p-0.5 rounded-xl flex items-center gap-0.5">
              {(['all', 'year', '90d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    triggerHaptic('selection');
                    setTimeRange(r);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition cursor-pointer ${
                    timeRange === r
                      ? 'bg-[#2C2C2E] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Zero-Spins High-Value Pulse Empty State with Primary Action */}
          {listenLogs.length === 0 ? (
            <div className="bg-neutral-900 border border-white/[0.08] rounded-3xl p-8 text-center space-y-4 shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5A10]/15 text-[#FF5A10] flex items-center justify-center mx-auto shadow-sm">
                <Disc3 className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-white">No Spins Recorded Yet</h4>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  Drop a record on the turntable, then log your session to build playback trends, time-of-day habits, and rotation analytics.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  if (onOpenRecordPicker) {
                    onOpenRecordPicker();
                  } else if (albums.length > 0 && onLogListen) {
                    onLogListen(albums[0]);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-95 text-white text-xs font-semibold shadow-md shadow-[#FF5A10]/30 transition cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log your first spin</span>
              </button>
            </div>
          ) : (
            <>
              {/* Highly-Rated But Neglected Records (Prominent High-Value Section) */}
              {neglectedFavorites.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Neglected 4+ Star Favorites</span>
                    </h3>
                    <span className="text-[11px] text-[#8E8E93]">Ready for re-spin</span>
                  </div>

                  <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                    {neglectedFavorites.map(({ album, playCount, daysAgo }) => (
                      <div
                        key={album.id}
                        className="p-3.5 flex items-center justify-between hover:bg-neutral-800/60 transition"
                      >
                        <div
                          onClick={() => {
                            triggerHaptic('light');
                            onSelectAlbum(album);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                            <VinylArtwork album={album} size="sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-white truncate">{album.title}</h4>
                            <p className="text-xs text-[#8E8E93] truncate">
                              {album.artist} · ★ {album.personalRating}/5
                            </p>
                            <p className="text-[10px] text-amber-400/80 mt-0.5">
                              {playCount === 0 ? 'Never spun' : `Spun ${playCount}× · Last heard ${daysAgo}d ago`}
                            </p>
                          </div>
                        </div>

                        {onLogListen && (
                          <button
                            onClick={() => {
                              triggerHaptic('medium');
                              onLogListen(album);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FF5A10] hover:bg-[#FF6F28] active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer ml-2"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Spin</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ranking Mode Segmented Control */}
              <div className="bg-neutral-900 border border-white/[0.08] p-1 rounded-xl flex items-center gap-1 shadow-sm">
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    setRankingTab('most');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                    rankingTab === 'most'
                      ? 'bg-[#2C2C2E] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Most Spun
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    setRankingTab('recent');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                    rankingTab === 'recent'
                      ? 'bg-[#2C2C2E] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Recently Spun
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    setRankingTab('never');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                    rankingTab === 'never'
                      ? 'bg-[#2C2C2E] text-white shadow-xs'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Unplayed ({unplayedCount})
                </button>
              </div>

              {/* Rankings List */}
              <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                {rankingTab === 'most' && (
                  <>
                    {(!analytics?.listeningRankings?.mostPlayed || analytics.listeningRankings.mostPlayed.length === 0) ? (
                      <div className="p-8 text-center text-xs text-[#8E8E93]">
                        No listen sessions recorded in this timeframe.
                      </div>
                    ) : (
                      analytics.listeningRankings.mostPlayed.slice(0, 8).map((item, idx) => {
                        const alb = item.album;
                        if (!alb) return null;
                        return (
                          <div
                            key={alb.id}
                            onClick={() => {
                              triggerHaptic('light');
                              onSelectAlbum(alb);
                            }}
                            className="p-3.5 flex items-center justify-between hover:bg-neutral-800/60 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-5 text-center text-xs font-mono font-bold text-[#8E8E93]">
                                #{idx + 1}
                              </span>
                              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                                <VinylArtwork album={alb} size="sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-white truncate">{alb.title}</h4>
                                <p className="text-xs text-[#8E8E93] truncate">{alb.artist}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-[#FF5A10]/15 text-[#FF5A10] text-xs font-bold font-mono">
                              {item.playCount} {item.playCount === 1 ? 'spin' : 'spins'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {rankingTab === 'recent' && (
                  <>
                    {(!analytics?.listeningRankings?.recentlyPlayed || analytics.listeningRankings.recentlyPlayed.length === 0) ? (
                      <div className="p-8 text-center text-xs text-[#8E8E93]">
                        No recent playback sessions found.
                      </div>
                    ) : (
                      analytics.listeningRankings.recentlyPlayed.slice(0, 8).map((item) => {
                        const alb = item.album;
                        if (!alb) return null;
                        return (
                          <div
                            key={alb.id}
                            onClick={() => {
                              triggerHaptic('light');
                              onSelectAlbum(alb);
                            }}
                            className="p-3.5 flex items-center justify-between hover:bg-neutral-800/60 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                                <VinylArtwork album={alb} size="sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-white truncate">{alb.title}</h4>
                                <p className="text-xs text-[#8E8E93] truncate">{alb.artist}</p>
                              </div>
                            </div>
                            <span className="text-xs text-[#8E8E93] font-medium">
                              {formatDate(item.lastPlayed)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {rankingTab === 'never' && (
                  <>
                    {(!analytics?.listeningRankings?.neverPlayed || analytics.listeningRankings.neverPlayed.length === 0) ? (
                      <div className="p-8 text-center text-xs text-emerald-400 font-medium">
                        Every record in your collection has been spun at least once!
                      </div>
                    ) : (
                      analytics.listeningRankings.neverPlayed.slice(0, 8).map((alb) => (
                        <div
                          key={alb.id}
                          onClick={() => {
                            triggerHaptic('light');
                            onSelectAlbum(alb);
                          }}
                          className="p-3.5 flex items-center justify-between hover:bg-neutral-800/60 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                              <VinylArtwork album={alb} size="sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-white truncate">{alb.title}</h4>
                              <p className="text-xs text-[#8E8E93] truncate">{alb.artist}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#8E8E93] font-medium">Unplayed</span>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              {/* Listening Setup Context & Patterns */}
              {setupContextDistribution.length > 0 && (
                <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#FF5A10]" />
                    <span>Listening Setup Distribution</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {setupContextDistribution.map((item) => (
                      <div key={item.context} className="p-2.5 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                        <p className="text-xs font-semibold text-white truncate">{item.context}</p>
                        <p className="text-sm font-bold text-[#FF5A10] font-mono">{item.count} spins</p>
                        <p className="text-[10px] text-[#8E8E93]">{item.percentage}% of sessions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Temporal Patterns (Time of Day & Weekday) */}
              {temporal && temporal.listensByTimeOfDay.length > 0 && (
                <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Listening Habits & Time of Day</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {temporal.listensByTimeOfDay.map((item) => (
                      <div key={item.timeSlot} className="p-2.5 rounded-xl bg-neutral-950/60 border border-white/[0.06]">
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-sm font-bold text-purple-300 font-mono">{item.count} spins</p>
                        <p className="text-[10px] text-[#8E8E93]">{item.percentage}% of time</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Artists & Genres by Play Count */}
              {(artistListening?.topArtists.length || genreListening?.topGenres.length) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {artistListening && artistListening.topArtists.length > 0 && (
                    <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Top Played Artists
                      </h4>
                      <div className="space-y-1.5">
                        {artistListening.topArtists.slice(0, 5).map((a) => (
                          <div key={a.artist} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate max-w-[160px]">{a.artist}</span>
                            <span className="text-[#FF5A10] font-mono font-bold">{a.totalListens} spins</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {genreListening && genreListening.topGenres.length > 0 && (
                    <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Top Played Genres
                      </h4>
                      <div className="space-y-1.5">
                        {genreListening.topGenres.slice(0, 5).map((g) => (
                          <div key={g.genre} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate max-w-[160px]">{g.genre}</span>
                            <span className="text-[#FF7A00] font-mono font-bold">{g.totalListens} spins</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Chronological Logbook Entries */}
              {listenLogs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
                    Recent Spin Logbook ({listenLogs.length})
                  </h4>
                  <div className="bg-neutral-900 border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                    {listenLogs.slice(0, 8).map((log) => {
                      const alb = albumMap.get(log.recordId);
                      return (
                        <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white truncate">
                              {alb ? `${alb.title} · ${alb.artist}` : 'Archived Record'}
                            </p>
                            <p className="text-[#8E8E93] text-[11px] mt-0.5">
                              {formatDate(log.listenedAt)} {log.context ? `· ${log.context}` : ''}
                            </p>
                            {log.note && (
                              <p className="text-neutral-400 italic text-[11px] mt-0.5">"{log.note}"</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              onDeleteListenLog(log.id);
                            }}
                            className="text-neutral-500 hover:text-red-400 p-1.5 transition cursor-pointer ml-2"
                            title="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
