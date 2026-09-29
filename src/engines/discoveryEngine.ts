import { Album, ListenLog } from '../types';

export type DiscoveryMode =
  | 'choose_for_me'
  | 'blind_pull'
  | 'unplayed'
  | 'forgotten'
  | 'top_rated'
  | 'fresh_additions'
  | 'genre'
  | 'decade'
  | 'genre_era';

export interface DiscoveryCandidate {
  album: Album;
  reason: string;
  playCount: number;
  lastPlayed?: string;
}

export function pickRandomItems<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function runDiscovery(
  mode: DiscoveryMode,
  albums: Album[],
  logs: ListenLog[],
  options?: { genre?: string; style?: string; decade?: string }
): DiscoveryCandidate[] {
  if (albums.length === 0) return [];

  // Compute play stats dynamically from logs
  const albumPlayCounts = new Map<string, { count: number; lastPlayed?: string }>();
  for (const album of albums) {
    albumPlayCounts.set(album.id, { count: 0 });
  }
  for (const log of logs) {
    const stat = albumPlayCounts.get(log.recordId);
    if (stat) {
      stat.count += 1;
      if (!stat.lastPlayed || new Date(log.listenedAt) > new Date(stat.lastPlayed)) {
        stat.lastPlayed = log.listenedAt;
      }
    }
  }

  const getCandidate = (album: Album, reason: string): DiscoveryCandidate => {
    const stat = albumPlayCounts.get(album.id);
    return {
      album,
      reason,
      playCount: stat?.count || 0,
      lastPlayed: stat?.lastPlayed,
    };
  };

  switch (mode) {
    case 'blind_pull': {
      // Small group of randomly selected records (3 records)
      const selected = pickRandomItems(albums, 3);
      return selected.map((album) => {
        const stat = albumPlayCounts.get(album.id);
        const reason =
          stat && stat.count === 0
            ? 'Unplayed selection from shelf'
            : album.edition
            ? `Edition: ${album.edition}`
            : 'Blind pull from shelf';
        return getCandidate(album, reason);
      });
    }

    case 'unplayed': {
      // Prioritize records with zero listen logs
      const unplayedAlbums = albums.filter(
        (a) => (albumPlayCounts.get(a.id)?.count || 0) === 0
      );
      if (unplayedAlbums.length === 0) {
        return [];
      }
      const picked = pickRandomItems(unplayedAlbums, Math.min(3, unplayedAlbums.length));
      return picked.map((album) => getCandidate(album, 'Unplayed record in your collection'));
    }

    case 'forgotten': {
      // Records played long ago or with low play count
      const playedAlbums = albums.filter(
        (a) => (albumPlayCounts.get(a.id)?.count || 0) > 0
      );
      if (playedAlbums.length === 0) {
        // Fallback to unplayed if no listens yet
        const picked = pickRandomItems(albums, Math.min(3, albums.length));
        return picked.map((album) => getCandidate(album, 'Waiting for its first spin'));
      }

      // Sort by lastPlayed ascending (oldest first)
      const sortedByOldest = [...playedAlbums].sort((a, b) => {
        const timeA = new Date(albumPlayCounts.get(a.id)?.lastPlayed || 0).getTime();
        const timeB = new Date(albumPlayCounts.get(b.id)?.lastPlayed || 0).getTime();
        return timeA - timeB;
      });

      const picked = pickRandomItems(sortedByOldest.slice(0, Math.min(6, sortedByOldest.length)), Math.min(3, sortedByOldest.length));
      return picked.map((album) => getCandidate(album, 'Has not been spun in a long time'));
    }

    case 'top_rated': {
      const top = albums.filter((a) => a.personalRating && a.personalRating >= 4);
      const pool = top.length > 0 ? top : albums;
      const picked = pickRandomItems(pool, Math.min(3, pool.length));
      return picked.map((album) =>
        getCandidate(
          album,
          album.personalRating ? `★ Rated ${album.personalRating}/5 stars` : 'Curated collection highlight'
        )
      );
    }

    case 'fresh_additions': {
      // Prioritize recently added records
      const sortedByAdded = [...albums].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
      const recentPool = sortedByAdded.slice(0, Math.min(10, albums.length));
      const picked = pickRandomItems(recentPool, Math.min(3, recentPool.length));
      return picked.map((album) => getCandidate(album, 'Recently cataloged in crate'));
    }

    case 'genre': {
      let pool = albums;
      const reasons: string[] = [];

      if (options?.genre && options.genre.trim()) {
        const target = options.genre.trim().toLowerCase();
        pool = pool.filter((a) =>
          a.genres?.some((g) => g.toLowerCase() === target)
        );
        reasons.push(`Genre: ${options.genre}`);
      }

      if (options?.style && options.style.trim()) {
        const targetStyle = options.style.trim().toLowerCase();
        pool = pool.filter((a) =>
          a.styles?.some((s) => s.toLowerCase() === targetStyle)
        );
        reasons.push(`Style: ${options.style}`);
      }

      if (options?.genre || options?.style) {
        if (pool.length === 0) return [];
        const picked = pickRandomItems(pool, Math.min(3, pool.length));
        return picked.map((album) => getCandidate(album, reasons.join(' · ')));
      }

      const withClassification = albums.filter(
        (a) => (a.genres && a.genres.length > 0) || (a.styles && a.styles.length > 0)
      );
      const samplePool = withClassification.length > 0 ? withClassification : albums;
      const picked = pickRandomItems(samplePool, Math.min(3, samplePool.length));
      return picked.map((album) =>
        getCandidate(
          album,
          album.genres && album.genres.length > 0
            ? `Genre: ${album.genres[0]}`
            : album.styles && album.styles.length > 0
            ? `Style: ${album.styles[0]}`
            : 'From your collection'
        )
      );
    }

    case 'decade': {
      let pool = albums;
      if (options?.decade && options.decade.trim()) {
        const target = options.decade.trim();
        pool = albums.filter((a) => {
          if (!a.releaseYear) return false;
          const decadeStr = `${Math.floor(a.releaseYear / 10) * 10}s`;
          return decadeStr === target;
        });
        if (pool.length === 0) return [];
        const picked = pickRandomItems(pool, Math.min(3, pool.length));
        return picked.map((album) => getCandidate(album, `Released in the ${options.decade}`));
      }

      const withYears = albums.filter((a) => a.releaseYear);
      const samplePool = withYears.length > 0 ? withYears : albums;
      const picked = pickRandomItems(samplePool, Math.min(3, samplePool.length));
      return picked.map((album) =>
        getCandidate(
          album,
          album.releaseYear ? `Released in ${album.releaseYear}` : 'From your collection'
        )
      );
    }

    case 'genre_era': {
      let filtered = [...albums];
      const reasons: string[] = [];

      if (options?.genre && options.genre.trim()) {
        filtered = filtered.filter((a) =>
          a.genres?.some((g) => g.toLowerCase() === options.genre!.toLowerCase())
        );
        reasons.push(`Genre: ${options.genre}`);
      }

      if (options?.decade && options.decade.trim()) {
        filtered = filtered.filter((a) => {
          if (!a.releaseYear) return false;
          const decade = `${Math.floor(a.releaseYear / 10) * 10}s`;
          return decade === options.decade;
        });
        reasons.push(`Era: ${options.decade}`);
      }

      if (filtered.length === 0) return [];

      const picked = pickRandomItems(filtered, Math.min(3, filtered.length));
      return picked.map((album) => getCandidate(album, reasons.join(' • ') || 'Curated match'));
    }

    case 'choose_for_me':
    default: {
      const unplayed = albums.filter((a) => (albumPlayCounts.get(a.id)?.count || 0) === 0);
      let chosenAlbum: Album;
      let reason: string;

      if (unplayed.length > 0 && Math.random() > 0.35) {
        chosenAlbum = pickRandomItems(unplayed, 1)[0];
        reason = 'Unplayed record from shelf';
      } else {
        const highlyRated = albums.filter((a) => a.personalRating && a.personalRating >= 4);
        if (highlyRated.length > 0 && Math.random() > 0.4) {
          chosenAlbum = pickRandomItems(highlyRated, 1)[0];
          reason = `Personal favorite (Rated ★ ${chosenAlbum.personalRating})`;
        } else {
          chosenAlbum = pickRandomItems(albums, 1)[0];
          if (chosenAlbum.edition) {
            reason = `Edition: ${chosenAlbum.edition}`;
          } else if (chosenAlbum.genres && chosenAlbum.genres.length > 0) {
            reason = `Genre: ${chosenAlbum.genres[0]}`;
          } else if (chosenAlbum.releaseYear) {
            reason = `Released in ${chosenAlbum.releaseYear}`;
          } else {
            reason = 'Selected from your collection';
          }
        }
      }

      return [getCandidate(chosenAlbum, reason)];
    }
  }
}
