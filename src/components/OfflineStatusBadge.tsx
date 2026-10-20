import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  HardDriveDownload, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  X, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { indexedDbCache } from '../services/indexedDbCache';
import { sound } from '../services/sound';

export const OfflineStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(indexedDbCache.isOnline());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(indexedDbCache.getSimulatedOffline());
  const [cacheStatus, setCacheStatus] = useState<{
    isCached: boolean;
    chaptersCount: number;
    termsCount: number;
    lastUpdated: string | null;
  }>({
    isCached: false,
    chaptersCount: 0,
    termsCount: 0,
    lastUpdated: null
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    // Listen to network & simulated status
    const unsubscribe = indexedDbCache.subscribeOnlineStatus((online) => {
      setIsOnline(online);
    });

    // Check initial cache state
    loadCacheStatus();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadCacheStatus = async () => {
    try {
      const status = await indexedDbCache.getCacheStatus();
      setCacheStatus(status);
    } catch (e) {
      console.warn('Error reading cache status:', e);
    }
  };

  const handleManualSync = async () => {
    sound.playClick();
    setIsSyncing(true);
    try {
      const meta = await indexedDbCache.cacheKitabAndTheory();
      await loadCacheStatus();
      sound.playSuccess();
      setSyncToast(`Sukses sinkronisasi: ${meta.chaptersCount} Bab Kitab & ${meta.termsCount} Teori tersimpan di IndexedDB`);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (e) {
      setSyncToast('Sinkronisasi IndexedDB gagal');
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSimulatedOffline = () => {
    sound.playClick();
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    indexedDbCache.setSimulatedOffline(next);
    if (next) {
      setSyncToast('Mode Simulasi Offline Aktif: Membaca Kitab & Teori dari IndexedDB');
    } else {
      setSyncToast('Mode Online Aktif kembali');
    }
    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <>
      {/* Mini Status Badge (Navbar / Header) */}
      <button
        onClick={() => setIsModalOpen(true)}
        title="Status Akses Offline & Cache IndexedDB Kitab Al-Firasat"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
          !isOnline 
            ? 'bg-amber-950/70 text-amber-300 border-amber-600/50 shadow-sm shadow-amber-900/30 animate-pulse'
            : 'bg-stone-900/80 text-stone-300 hover:text-stone-100 border-stone-800 hover:border-amber-750'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          )}
        </span>

        <span className="hidden sm:inline text-[11px]">
          {!isOnline ? 'Mode Offline (IndexedDB)' : 'Tersimpan Offline'}
        </span>

        <Database className="w-3.5 h-3.5 text-amber-400" />
      </button>

      {/* Sync Toast if triggered */}
      {syncToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm p-3.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Cache & Offline Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-stone-900 border border-amber-900/40 p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    Cache Lokal IndexedDB
                  </h3>
                  <p className="text-xs text-stone-400">
                    Penyimpanan internal peramban untuk akses tanpa internet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Network State Card */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isOnline 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
            }`}>
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Wifi className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <WifiOff className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {isOnline ? 'Koneksi Terhubung (Online)' : 'Mode Terputus (Offline)'}
                  </div>
                  <p className="text-[11px] text-stone-400">
                    {isOnline 
                      ? 'Sinkronisasi siap dan basis data lokal aktif.' 
                      : 'Isi Kitab Ar-Razi & referensi teori tetap dapat dibaca 100% dari IndexedDB.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cache Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="text-2xl font-bold font-title text-amber-400">
                  {cacheStatus.chaptersCount || 8}
                </div>
                <div className="text-xs font-semibold text-stone-200 mt-0.5">Bab Kitab Tersimpan</div>
                <div className="text-[10px] text-stone-400">Dalâ'il Al-A'dha' (Dahi, Mata, dll)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="text-2xl font-bold font-title text-emerald-400">
                  {cacheStatus.termsCount || 10}
                </div>
                <div className="text-xs font-semibold text-stone-200 mt-0.5">Referensi Teori & Mizaj</div>
                <div className="text-[10px] text-stone-400">Glosarium & Biografi Ar-Razi</div>
              </div>
            </div>

            {/* Offline Simulation Toggle */}
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-200">
                    Uji Coba Mode Offline
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Simulasikan pemutusan jaringan untuk memverifikasi pembacaan dari IndexedDB
                  </p>
                </div>
                <button
                  onClick={handleToggleSimulatedOffline}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isSimulatedOffline ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow ring-0 transition duration-200 ease-in-out ${
                      isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isSimulatedOffline && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Aplikasi kini membaca seluruh referensi Kitab secara mandiri tanpa internet.</span>
                </div>
              )}
            </div>

            {/* Last updated & action */}
            <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1">
              <span>
                Terakhir disinkronkan:{' '}
                {cacheStatus.lastUpdated 
                  ? new Date(cacheStatus.lastUpdated).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Saat inisialisasi aplikasi'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Memperbarui Cache...' : 'Perbarui Cache IndexedDB'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
