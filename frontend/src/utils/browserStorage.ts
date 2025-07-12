/**
 * Browser Storage Optimization Utilities
 * Intelligent caching for browser storage with compression and expiration
 * EbroValley Digital - Advanced Performance Optimization
 */

export interface StorageOptions {
  compress?: boolean;
  expirationTime?: number; // in milliseconds
  storageType?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  maxSize?: number; // in bytes
}

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiration?: number;
  compressed?: boolean;
  version: string;
}

export class BrowserStorageManager {
  private static instance: BrowserStorageManager;
  private compressionThreshold = 1024; // 1KB
  private maxStorageSize = 5 * 1024 * 1024; // 5MB default
  private version = '1.0.0';

  private constructor() {}

  static getInstance(): BrowserStorageManager {
    if (!BrowserStorageManager.instance) {
      BrowserStorageManager.instance = new BrowserStorageManager();
    }
    return BrowserStorageManager.instance;
  }

  /**
   * Store data with intelligent compression and expiration
   */
  async setItem<T>(
    key: string, 
    data: T, 
    options: StorageOptions = {}
  ): Promise<boolean> {
    try {
      const {
        compress = true,
        expirationTime,
        storageType = 'localStorage',
        maxSize = this.maxStorageSize
      } = options;

      // Serialize data
      let serializedData = JSON.stringify(data);
      
      // Check size before compression
      if (new Blob([serializedData]).size > maxSize) {
        console.warn(`Data size exceeds maximum allowed (${maxSize} bytes)`);
        return false;
      }

      // Compress if data is large enough and compression is enabled
      let shouldCompress = false;
      if (compress && serializedData.length > this.compressionThreshold) {
        try {
          const compressed = await this.compressString(serializedData);
          if (compressed.length < serializedData.length * 0.8) { // Only use if 20%+ savings
            serializedData = compressed;
            shouldCompress = true;
          }
        } catch (error) {
          console.warn('Compression failed, storing uncompressed:', error);
        }
      }

      const cachedData: CachedData<string> = {
        data: serializedData,
        timestamp: Date.now(),
        expiration: expirationTime ? Date.now() + expirationTime : undefined,
        compressed: shouldCompress,
        version: this.version
      };

      const finalData = JSON.stringify(cachedData);

      // Store based on storage type
      switch (storageType) {
        case 'localStorage':
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, finalData);
            return true;
          }
          break;
        case 'sessionStorage':
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(key, finalData);
            return true;
          }
          break;
        case 'indexedDB':
          return await this.setIndexedDBItem(key, finalData);
      }

      return false;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  }

  /**
   * Retrieve data with automatic decompression and expiration check
   */
  async getItem<T>(
    key: string, 
    storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' = 'localStorage'
  ): Promise<T | null> {
    try {
      let rawData: string | null = null;

      // Retrieve based on storage type
      switch (storageType) {
        case 'localStorage':
          if (typeof localStorage !== 'undefined') {
            rawData = localStorage.getItem(key);
          }
          break;
        case 'sessionStorage':
          if (typeof sessionStorage !== 'undefined') {
            rawData = sessionStorage.getItem(key);
          }
          break;
        case 'indexedDB':
          rawData = await this.getIndexedDBItem(key);
          break;
      }

      if (!rawData) return null;

      const cachedData: CachedData<string> = JSON.parse(rawData);

      // Check expiration
      if (cachedData.expiration && Date.now() > cachedData.expiration) {
        await this.removeItem(key, storageType);
        return null;
      }

      // Check version compatibility
      if (cachedData.version !== this.version) {
        console.warn(`Version mismatch for key ${key}, clearing cache`);
        await this.removeItem(key, storageType);
        return null;
      }

      let data = cachedData.data;

      // Decompress if needed
      if (cachedData.compressed) {
        try {
          data = await this.decompressString(data);
        } catch (error) {
          console.error('Decompression failed:', error);
          await this.removeItem(key, storageType);
          return null;
        }
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(
    key: string, 
    storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' = 'localStorage'
  ): Promise<boolean> {
    try {
      switch (storageType) {
        case 'localStorage':
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
            return true;
          }
          break;
        case 'sessionStorage':
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(key);
            return true;
          }
          break;
        case 'indexedDB':
          return await this.removeIndexedDBItem(key);
      }
      return false;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  /**
   * Clear expired items from storage
   */
  async clearExpired(): Promise<number> {
    let clearedCount = 0;

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        try {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const cachedData: CachedData = JSON.parse(rawData);
            if (cachedData.expiration && Date.now() > cachedData.expiration) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Invalid format, remove it
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    }

    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        try {
          const rawData = sessionStorage.getItem(key);
          if (rawData) {
            const cachedData: CachedData = JSON.parse(rawData);
            if (cachedData.expiration && Date.now() > cachedData.expiration) {
              sessionStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          sessionStorage.removeItem(key);
          clearedCount++;
        }
      }
    }

    return clearedCount;
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    localStorage: { used: number; available: number };
    sessionStorage: { used: number; available: number };
  } {
    const getStorageSize = (storage: Storage | undefined): { used: number; available: number } => {
      if (!storage) return { used: 0, available: 0 };

      let used = 0;
      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          used += storage[key].length + key.length;
        }
      }

      // Estimate available space (usually ~5MB for localStorage)
      const estimated = 5 * 1024 * 1024;
      return {
        used,
        available: Math.max(0, estimated - used)
      };
    };

    return {
      localStorage: getStorageSize(typeof localStorage !== 'undefined' ? localStorage : undefined),
      sessionStorage: getStorageSize(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined)
    };
  }

  /**
   * Compress string using gzip-like compression
   */
  private async compressString(str: string): Promise<string> {
    if (typeof CompressionStream === 'undefined') {
      // Fallback to simple RLE compression
      return this.simpleCompress(str);
    }

    try {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      writer.write(encoder.encode(str));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return btoa(String.fromCharCode(...compressed));
    } catch (error) {
      return this.simpleCompress(str);
    }
  }

  /**
   * Decompress string
   */
  private async decompressString(compressed: string): Promise<string> {
    if (typeof DecompressionStream === 'undefined') {
      return this.simpleDecompress(compressed);
    }

    try {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      const decoder = new TextDecoder();
      const binaryString = atob(compressed);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      writer.write(bytes);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return decoder.decode(decompressed);
    } catch (error) {
      return this.simpleDecompress(compressed);
    }
  }

  /**
   * Simple compression fallback
   */
  private simpleCompress(str: string): string {
    return str.replace(/(.)\1+/g, (match, char) => {
      return char + match.length.toString(36);
    });
  }

  /**
   * Simple decompression fallback
   */
  private simpleDecompress(compressed: string): string {
    return compressed.replace(/(.)([0-9a-z]+)/g, (match, char, count) => {
      return char.repeat(parseInt(count, 36));
    });
  }

  /**
   * IndexedDB operations
   */
  private async setIndexedDBItem(key: string, data: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('AppCache', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache');
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          
          const putRequest = store.put(data, key);
          putRequest.onsuccess = () => resolve(true);
          putRequest.onerror = () => resolve(false);
        };
        
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }

  private async getIndexedDBItem(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('AppCache', 1);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      } catch (error) {
        resolve(null);
      }
    });
  }

  private async removeIndexedDBItem(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('AppCache', 1);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = () => resolve(false);
        };
        
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

// Global instance
export const storageManager = BrowserStorageManager.getInstance();

/**
 * Convenience functions for common operations
 */
export const cache = {
  set: <T>(key: string, data: T, options?: StorageOptions) => 
    storageManager.setItem(key, data, options),
  
  get: <T>(key: string, storageType?: 'localStorage' | 'sessionStorage' | 'indexedDB') => 
    storageManager.getItem<T>(key, storageType),
  
  remove: (key: string, storageType?: 'localStorage' | 'sessionStorage' | 'indexedDB') => 
    storageManager.removeItem(key, storageType),
  
  clear: () => storageManager.clearExpired(),
  
  stats: () => storageManager.getStorageStats()
};

/**
 * Auto-cleanup on page load
 */
if (typeof window !== 'undefined') {
  // Clean expired items on load
  window.addEventListener('load', () => {
    storageManager.clearExpired().then(count => {
      if (count > 0) {
        console.log(`Cleared ${count} expired cache items`);
      }
    });
  });
  
  // Periodic cleanup every 30 minutes
  setInterval(() => {
    storageManager.clearExpired();
  }, 30 * 60 * 1000);
}