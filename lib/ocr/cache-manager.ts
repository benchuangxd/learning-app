import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

export interface CacheEntry {
  hash: string;
  text: string;
  lastAccessed: number;
}

export interface CacheData {
  entries: CacheEntry[];
}

const cacheStorage = new LocalStorageAdapter<CacheData>(STORAGE_KEYS.OCR_CACHE);

export async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function getCachedText(fileHash: string): string | null {
  const cache = cacheStorage.get() ?? { entries: [] };
  const entry = cache.entries.find((e) => e.hash === fileHash);

  if (entry) {
    entry.lastAccessed = Date.now();
    cacheStorage.set(cache);
    console.log(`OCR cache hit for file hash: ${fileHash.substring(0, 8)}...`);
    return entry.text;
  }

  console.log(`OCR cache miss for file hash: ${fileHash.substring(0, 8)}...`);
  return null;
}

export function setCachedText(fileHash: string, text: string): void {
  const cache = cacheStorage.get() ?? { entries: [] };

  const existingIndex = cache.entries.findIndex((e) => e.hash === fileHash);
  if (existingIndex >= 0 && cache.entries[existingIndex]) {
    cache.entries[existingIndex]!.text = text;
    cache.entries[existingIndex]!.lastAccessed = Date.now();
  } else {
    cache.entries.push({
      hash: fileHash,
      text,
      lastAccessed: Date.now(),
    });
  }

  const success = cacheStorage.set(cache);

  if (!success) {
    evictLRU();
    cacheStorage.set(cache);
  }
}

function evictLRU(): void {
  const cache = cacheStorage.get();
  if (!cache || cache.entries.length === 0) return;

  cache.entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

  const evicted = cache.entries.shift();
  if (evicted) {
    console.log(`LRU eviction: removed cache entry ${evicted.hash.substring(0, 8)}...`);
  }

  cacheStorage.set(cache);
}
