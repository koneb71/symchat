// Search result caching to avoid duplicate searches
import type { SearchResponse } from "./web-search";

interface CacheEntry {
  query: string;
  results: SearchResponse;
  timestamp: number;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 50;

class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();

  // Normalize query for cache key
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, " ");
  }

  // Check if cached result is still valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  // Get cached results if available and valid
  get(query: string): SearchResponse | null {
    const key = this.normalizeQuery(query);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] Hit for query: "${query}"`);
    return entry.results;
  }

  // Store search results in cache
  set(query: string, results: SearchResponse): void {
    const key = this.normalizeQuery(query);

    // Enforce max cache size (LRU-like behavior)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      query: key,
      results,
      timestamp: Date.now(),
    });

    console.log(`[Cache] Stored results for query: "${query}"`);
  }

  // Clear all cached results
  clear(): void {
    this.cache.clear();
    console.log("[Cache] Cleared all cached results");
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; duration: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      duration: CACHE_DURATION,
    };
  }
}

// Singleton instance
export const searchCache = new SearchCache();

// Auto-clear expired entries every 5 minutes
setInterval(() => {
  searchCache.clearExpired();
}, 5 * 60 * 1000);
