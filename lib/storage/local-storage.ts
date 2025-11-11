/**
 * Type-safe LocalStorage adapter
 * Provides get/set/remove methods with error handling
 */
export class LocalStorageAdapter<T> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  /**
   * Get value from localStorage
   * @returns Parsed value or null if not found/error
   */
  get(): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const item = localStorage.getItem(this.key);
      if (!item) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${this.key}):`, error);
      return null;
    }
  }

  /**
   * Set value in localStorage
   * @param value - Value to store
   * @returns true if successful, false if quota exceeded or error
   */
  set(value: T): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      localStorage.setItem(this.key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      } else {
        console.error(`Error writing to localStorage (${this.key}):`, error);
      }
      return false;
    }
  }

  /**
   * Remove value from localStorage
   */
  remove(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error(`Error removing from localStorage (${this.key}):`, error);
    }
  }

  /**
   * Clear all localStorage (use with caution)
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if the key exists in localStorage
   */
  exists(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem(this.key) !== null;
  }
}

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  QUESTIONS: 'learning-app:questions',
  SESSIONS: 'learning-app:sessions',
  REVIEW_METADATA: 'learning-app:review-metadata',
  SETTINGS: 'learning-app:settings',
} as const;
