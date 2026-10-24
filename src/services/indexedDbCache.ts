// IndexedDB Local Cache Service for Kitab Al-Firasat & Classical Theory References
// Provides full offline access to chapters, glossary terms, mizaj data, and theory references
import { KitabChapter, SubjectProfile, FirasatAnalysisResult } from '../types/firasat';
import { KITAB_CHAPTERS, GLOSSARY_TERMS, MIZAJ_DATA, SAMPLE_PORTRAITS } from '../data/kitabFirasatData';

const DB_NAME = 'AlFirasatLocalDB';
const DB_VERSION = 1;

export interface CacheMetadata {
  key: string;
  lastUpdated: string;
  chaptersCount: number;
  termsCount: number;
  profilesCount: number;
  historyCount: number;
  isReady: boolean;
}

export interface TheoryReference {
  id: string;
  category: 'mizaj' | 'epistemology' | 'biography' | 'tarjih' | 'glossary';
  title: string;
  arabicTitle?: string;
  content: any;
  updatedAt: string;
}

class IndexedDbCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSimulatedOffline: boolean = false;
  private onlineListeners: Set<(online: boolean) => void> = new Set();
  private memoryProfiles: SubjectProfile[] = [];
  private memoryHistory: FirasatAnalysisResult[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyOnlineListeners(true));
      window.addEventListener('offline', () => this.notifyOnlineListeners(false));
      
      // Auto-initialize and seed cache on startup silently with graceful fallback
      this.initDB()
        .then(() => this.cacheKitabAndTheory())
        .catch(() => {
          // Graceful fallback: memory cache and static references are always available
        });
    }
  }

  // Check if browser is online (taking simulated offline mode into account)
  public isOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.notifyOnlineListeners(!offline && (typeof navigator !== 'undefined' ? navigator.onLine : true));
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  public subscribeOnlineStatus(listener: (online: boolean) => void): () => void {
    this.onlineListeners.add(listener);
    listener(this.isOnline());
    return () => {
      this.onlineListeners.delete(listener);
    };
  }

  private notifyOnlineListeners(status: boolean) {
    const effectiveStatus = this.isSimulatedOffline ? false : status;
    this.onlineListeners.forEach(listener => listener(effectiveStatus));
  }

  // Open or create the database
  public async initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;

        // Store 1: Kitab chapters
        if (!db.objectStoreNames.contains('kitab_chapters')) {
          const chapterStore = db.createObjectStore('kitab_chapters', { keyPath: 'id' });
          chapterStore.createIndex('number', 'number', { unique: true });
          chapterStore.createIndex('part', 'part', { unique: false });
        }

        // Store 2: Theory references (Mizaj, Glossary, Epistemology)
        if (!db.objectStoreNames.contains('theory_references')) {
          const theoryStore = db.createObjectStore('theory_references', { keyPath: 'id' });
          theoryStore.createIndex('category', 'category', { unique: false });
        }

        // Store 3: Subject profiles cache
        if (!db.objectStoreNames.contains('profiles_cache')) {
          db.createObjectStore('profiles_cache', { keyPath: 'id' });
        }

        // Store 4: History scans cache
        if (!db.objectStoreNames.contains('history_cache')) {
          const historyStore = db.createObjectStore('history_cache', { keyPath: 'id' });
          historyStore.createIndex('profileId', 'profileId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 5: Cache Metadata
        if (!db.objectStoreNames.contains('cache_meta')) {
          db.createObjectStore('cache_meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error('IndexedDB open error'));
      };
    });

    return this.dbPromise;
  }

  // Populate/Refresh Kitab & Theory into IndexedDB
  public async cacheKitabAndTheory(): Promise<CacheMetadata> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['kitab_chapters', 'theory_references', 'cache_meta'], 'readwrite');
      const chapterStore = tx.objectStore('kitab_chapters');
      const theoryStore = tx.objectStore('theory_references');
      const metaStore = tx.objectStore('cache_meta');

      // 1. Cache all classical chapters
      KITAB_CHAPTERS.forEach(ch => {
        chapterStore.put(ch);
      });

      // 2. Cache Mizaj theory definitions
      Object.entries(MIZAJ_DATA).forEach(([key, info]) => {
        const item: TheoryReference = {
          id: `mizaj-${key}`,
          category: 'mizaj',
          title: info.indonesianName,
          arabicTitle: info.arabicName,
          content: info,
          updatedAt: new Date().toISOString()
        };
        theoryStore.put(item);
      });

      // 3. Cache glossary terms
      GLOSSARY_TERMS.forEach((term, index) => {
        const item: TheoryReference = {
          id: `glossary-${index}`,
          category: 'glossary',
          title: term.term,
          arabicTitle: term.term.includes('(') ? term.term.split('(')[1]?.replace(')', '') : undefined,
          content: term,
          updatedAt: new Date().toISOString()
        };
        theoryStore.put(item);
      });

      // 4. Cache Imam Fakhruddin Ar-Razi Biography & Epistemological Theory
      const biographyTheory: TheoryReference = {
        id: 'biography-ar-razi',
        category: 'biography',
        title: 'Biografi & Otoritas Intelektual Imam Fakhruddin Ar-Razi',
        arabicTitle: 'الإمام فخر الدين الرازي (554 - 606 هـ)',
        content: {
          birthYear: '554 H / 1149 M',
          deathYear: '606 H / 1210 M',
          title: 'Syaikhul Islam, Al-Imam Al-Allamah, Nashiruddin',
          era: 'Dinasti Ghuriyah & Khwarazmian (Persia & Transoxiana)',
          works: [
            'Kitab Al-Firasat (Buku Induk Ilmu Firasat Karakter)',
            'Mafatih al-Ghaib (Tafsir Ar-Razi / At-Tafsir Al-Kabir 32 Jilid)',
            'Al-Mahshul fi Ilm al-Ushul',
            'Al-Mabahits al-Masyriqiyyah',
            'Kitab At-Tibb Ar-Ruhani (Psikologi & Pengobatan Jiwa)'
          ],
          methodology: 'Sintesis ilmiah empiris (tajribah), deduksi rasional (burhan), dan firasat imaniyah berbasis petunjuk fitrah ilahiyah.'
        },
        updatedAt: new Date().toISOString()
      };
      theoryStore.put(biographyTheory);

      // 5. Update Metadata
      const meta: CacheMetadata = {
        key: 'global_cache_meta',
        lastUpdated: new Date().toISOString(),
        chaptersCount: KITAB_CHAPTERS.length,
        termsCount: GLOSSARY_TERMS.length,
        profilesCount: 0,
        historyCount: 0,
        isReady: true
      };
      metaStore.put(meta);

      tx.oncomplete = () => {
        resolve(meta);
      };

      tx.onerror = () => {
        resolve(meta);
      };

      tx.onabort = () => {
        resolve(meta);
      };
    });
  }

  // Retrieve Kitab Chapters from IndexedDB (with fallback)
  public async getKitabChapters(): Promise<KitabChapter[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction('kitab_chapters', 'readonly');
        const store = tx.objectStore('kitab_chapters');
        const request = store.getAll();

        request.onsuccess = () => {
          if (request.result && request.result.length > 0) {
            resolve(request.result);
          } else {
            // Fallback to static
            resolve(KITAB_CHAPTERS);
          }
        };

        request.onerror = () => {
          resolve(KITAB_CHAPTERS);
        };
      });
    } catch {
      return KITAB_CHAPTERS;
    }
  }

  // Retrieve Theory references from IndexedDB
  public async getTheoryReferences(category?: string): Promise<TheoryReference[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction('theory_references', 'readonly');
        const store = tx.objectStore('theory_references');
        const request = store.getAll();

        request.onsuccess = () => {
          let list: TheoryReference[] = request.result || [];
          if (category) {
            list = list.filter(item => item.category === category);
          }
          resolve(list);
        };

        request.onerror = () => {
          resolve([]);
        };
      });
    } catch {
      return [];
    }
  }

  // Cache profiles for offline usage
  public async cacheProfiles(profiles: SubjectProfile[]): Promise<void> {
    this.memoryProfiles = [...profiles];
    try {
      const db = await this.initDB();
      const tx = db.transaction(['profiles_cache', 'cache_meta'], 'readwrite');
      const store = tx.objectStore('profiles_cache');
      store.clear();
      profiles.forEach(p => store.put(p));
      
      const metaStore = tx.objectStore('cache_meta');
      const metaReq = metaStore.get('global_cache_meta');
      metaReq.onsuccess = () => {
        const current = metaReq.result || { key: 'global_cache_meta' };
        current.profilesCount = profiles.length;
        current.lastUpdated = new Date().toISOString();
        metaStore.put(current);
      };
    } catch {
      // Memory cache is already updated
    }
  }

  // Delete cached profile directly from IndexedDB
  public async deleteCachedProfile(id: string): Promise<void> {
    this.memoryProfiles = this.memoryProfiles.filter(p => p.id !== id);
    try {
      const db = await this.initDB();
      const tx = db.transaction(['profiles_cache'], 'readwrite');
      tx.objectStore('profiles_cache').delete(id);
    } catch {
      // Handled in memory
    }
  }

  // Retrieve cached profiles
  public async getCachedProfiles(): Promise<SubjectProfile[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction('profiles_cache', 'readonly');
        const store = tx.objectStore('profiles_cache');
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result || [];
          if (res.length > 0) {
            this.memoryProfiles = res;
            resolve(res);
          } else {
            resolve(this.memoryProfiles);
          }
        };
        req.onerror = () => resolve(this.memoryProfiles);
      });
    } catch {
      return this.memoryProfiles;
    }
  }

  // Cache history scans for offline trends & charts
  public async cacheHistory(history: FirasatAnalysisResult[]): Promise<void> {
    this.memoryHistory = [...history];
    try {
      const db = await this.initDB();
      const tx = db.transaction(['history_cache', 'cache_meta'], 'readwrite');
      const store = tx.objectStore('history_cache');
      store.clear();
      history.forEach(h => store.put(h));

      const metaStore = tx.objectStore('cache_meta');
      const metaReq = metaStore.get('global_cache_meta');
      metaReq.onsuccess = () => {
        const current = metaReq.result || { key: 'global_cache_meta' };
        current.historyCount = history.length;
        current.lastUpdated = new Date().toISOString();
        metaStore.put(current);
      };
    } catch {
      // Memory cache is already updated
    }
  }

  // Delete cached history scan directly from IndexedDB
  public async deleteCachedHistory(id: string): Promise<void> {
    this.memoryHistory = this.memoryHistory.filter(h => h.id !== id);
    try {
      const db = await this.initDB();
      const tx = db.transaction(['history_cache'], 'readwrite');
      tx.objectStore('history_cache').delete(id);
    } catch {
      // Handled in memory
    }
  }

  // Retrieve cached history
  public async getCachedHistory(): Promise<FirasatAnalysisResult[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction('history_cache', 'readonly');
        const store = tx.objectStore('history_cache');
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result || [];
          if (res.length > 0) {
            this.memoryHistory = res;
            resolve(res);
          } else {
            resolve(this.memoryHistory);
          }
        };
        req.onerror = () => resolve(this.memoryHistory);
      });
    } catch {
      return this.memoryHistory;
    }
  }

  // Check cache status and item counts
  public async getCacheStatus(): Promise<{
    isCached: boolean;
    chaptersCount: number;
    termsCount: number;
    lastUpdated: string | null;
  }> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction('cache_meta', 'readonly');
        const store = tx.objectStore('cache_meta');
        const req = store.get('global_cache_meta');

        req.onsuccess = () => {
          if (req.result) {
            resolve({
              isCached: true,
              chaptersCount: req.result.chaptersCount || KITAB_CHAPTERS.length,
              termsCount: req.result.termsCount || GLOSSARY_TERMS.length,
              lastUpdated: req.result.lastUpdated || null
            });
          } else {
            resolve({
              isCached: false,
              chaptersCount: 0,
              termsCount: 0,
              lastUpdated: null
            });
          }
        };

        req.onerror = () => {
          resolve({
            isCached: false,
            chaptersCount: 0,
            termsCount: 0,
            lastUpdated: null
          });
        };
      });
    } catch {
      return {
        isCached: false,
        chaptersCount: 0,
        termsCount: 0,
        lastUpdated: null
      };
    }
  }

  // Clear all IndexedDB stores
  public async clearCache(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['kitab_chapters', 'theory_references', 'profiles_cache', 'history_cache', 'cache_meta'], 'readwrite');
      tx.objectStore('kitab_chapters').clear();
      tx.objectStore('theory_references').clear();
      tx.objectStore('profiles_cache').clear();
      tx.objectStore('history_cache').clear();
      tx.objectStore('cache_meta').clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const indexedDbCache = new IndexedDbCacheService();
