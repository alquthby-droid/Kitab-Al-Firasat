import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { FaceScanner } from './components/FaceScanner';
import { ManualInspector } from './components/ManualInspector';
import { HistoryAndProfiles } from './components/HistoryAndProfiles';
import { NotificationCenter } from './components/NotificationCenter';
import { KitabLibrary } from './components/KitabLibrary';
import { AnalysisResultModal } from './components/AnalysisResultModal';
import { ProfileComparisonChart } from './components/ProfileComparisonChart';
import { CharacterTrendsDashboard } from './components/CharacterTrendsDashboard';
import { VoiceAnalysisModal } from './components/VoiceAnalysisModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { ChallengeMode } from './components/ChallengeMode';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { FirasatOfTheDay } from './components/FirasatOfTheDay';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { appendAnalysisRecordToDedicatedSheet, getAutoSyncSettings } from './services/googleSheets';
import { getAccessToken } from './services/googleAuth';
import { FirasatAnalysisResult, SubjectProfile, PeriodicNotification } from './types/firasat';
import { indexedDbCache } from './services/indexedDbCache';
import { 
  getProfiles, 
  getHistory, 
  getNotifications, 
  getStats, 
  checkServerHealth,
  saveProfile,
  StatsOverview 
} from './services/api';
import { 
  BookOpen, 
  Sparkles, 
  Info, 
  X, 
  Scroll, 
  ShieldCheck, 
  Heart, 
  Database,
  ExternalLink,
  Sun,
  Moon,
  Mic,
  GitCompare,
  Bell,
  ArrowRight
} from 'lucide-react';
import { sound } from './services/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [profiles, setProfiles] = useState<SubjectProfile[]>([]);
  const [history, setHistory] = useState<FirasatAnalysisResult[]>([]);
  const [notifications, setNotifications] = useState<PeriodicNotification[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  
  // Theme state: dark | light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('firasat-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  // Modal states
  const [selectedResult, setSelectedResult] = useState<FirasatAnalysisResult | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissedDueBanner, setDismissedDueBanner] = useState<boolean>(false);
  const alertedNotifIdsRef = React.useRef<Set<string>>(new Set());

  // Check if first-time user to show onboarding tour overlay
  useEffect(() => {
    try {
      const seen = localStorage.getItem('alfirasat_onboarding_seen');
      if (!seen) {
        const timer = setTimeout(() => {
          setIsOnboardingOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync theme with HTML root & body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        body.classList.add('light');
        body.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
      }
      localStorage.setItem('firasat-theme', theme);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    sound.playClick();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(nextTheme === 'light' ? 'Mode Terang (Parchment Baca) Aktif' : 'Mode Gelap Aktif');
  };

  // Load all data from API with IndexedDB offline resilience
  const refreshData = useCallback(async () => {
    try {
      const [profs, hist, notifs, st, health] = await Promise.all([
        getProfiles(),
        getHistory(),
        getNotifications(),
        getStats(),
        checkServerHealth()
      ]);
      setProfiles(profs);
      setHistory(hist);
      setNotifications(notifs);
      setStats(st);
      setHasGeminiKey(health.hasGeminiKey);

      // Persist in IndexedDB local cache
      indexedDbCache.cacheProfiles(profs);
      indexedDbCache.cacheHistory(hist);
    } catch (err) {
      console.warn('Network error, attempting IndexedDB offline retrieval:', err);
      try {
        const [cachedProfs, cachedHist] = await Promise.all([
          indexedDbCache.getCachedProfiles(),
          indexedDbCache.getCachedHistory()
        ]);
        if (cachedProfs && cachedProfs.length > 0) setProfiles(cachedProfs);
        if (cachedHist && cachedHist.length > 0) setHistory(cachedHist);
      } catch (cacheErr) {
        console.error('IndexedDB retrieval error:', cacheErr);
      }
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Periodic reminder notification check (triggers browser Notification and in-app alert if due today or overdue)
  useEffect(() => {
    const checkDueReminders = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueItems = notifications.filter(n => {
        if (n.status !== 'pending') return false;
        const due = new Date(n.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() <= today.getTime();
      });

      if (dueItems.length === 0) return;

      // Filter to items that have not yet alerted this session
      const unalertedItems = dueItems.filter(item => !alertedNotifIdsRef.current.has(item.id));
      if (unalertedItems.length === 0) return;

      unalertedItems.forEach(item => alertedNotifIdsRef.current.add(item.id));

      // Audio cue
      try {
        sound.playLockPing();
      } catch {
        // sound fallback
      }

      // Try browser Notification API
      let showedBrowserNotif = false;
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            unalertedItems.forEach(item => {
              try {
                new Notification(`Peringatan Firasat: ${item.title}`, {
                  body: item.message || 'Jadwal evaluasi berkala karakter telah jatuh tempo.',
                  icon: '/favicon.ico'
                });
                showedBrowserNotif = true;
              } catch {
                // browser blocked or threw
              }
            });
          }
        } catch {
          // sandbox iframe limitation
        }
      }

      // In-app alert fallback
      if (!showedBrowserNotif || unalertedItems.length > 0) {
        const first = unalertedItems[0];
        const extra = unalertedItems.length > 1 ? ` (+${unalertedItems.length - 1} lainnya)` : '';
        showToast(`🔔 Peringatan Evaluasi: ${first.title}${extra}`);
      }
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
  }, [notifications]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAnalysisComplete = async (res: FirasatAnalysisResult) => {
    setSelectedResult(res);
    refreshData();
    showToast(`Analisis ${res.subjectName} berhasil diselesaikan!`);

    // Automatic sync to dedicated 'Al-Firasat Records' in Google Sheets
    try {
      const autoSync = getAutoSyncSettings();
      if (autoSync.enabled && autoSync.spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          showToast(`☁️ Menyinkronkan ke 'Al-Firasat Records' Google Sheets...`);
          await appendAnalysisRecordToDedicatedSheet(token, autoSync.spreadsheetId, res, 'Al-Firasat Records');
          showToast(`☁️ Analisis ${res.subjectName} tersinkron ke 'Al-Firasat Records'!`);
          sound.playSuccessChime();
        }
      }
    } catch (syncErr: any) {
      console.warn('Auto-sync to Google Sheets failed:', syncErr);
      showToast('⚠️ Gagal auto-sync ke Google Sheets. Pastikan sesi akun Google Anda aktif.');
    }
  };

  const handleScanProfile = (profile: SubjectProfile) => {
    setActiveTab('scanner');
    showToast(`Mode pemindaian disiapkan untuk ${profile.name}`);
  };

  // Save vocal analysis note to profile
  const handleSaveVoiceNote = async (profileId: string, vocalNote: string) => {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (!targetProfile) return;
    try {
      const updatedNotes = targetProfile.notes 
        ? `${targetProfile.notes}\n${vocalNote}` 
        : vocalNote;
      await saveProfile({
        ...targetProfile,
        notes: updatedNotes
      });
      await refreshData();
      showToast(`Catatan suara berhasil disimpan ke profil ${targetProfile.name}`);
    } catch (err) {
      console.error('Failed to save vocal note:', err);
      showToast('Gagal menyimpan catatan suara ke profil');
    }
  };

  const pendingNotifsCount = notifications.filter(n => n.status === 'pending').length;
  const dueNotifications = notifications.filter(n => {
    if (n.status !== 'pending') return false;
    const due = new Date(n.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() <= today.getTime();
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-[#faf8f5] text-stone-900'
    }`}>
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingNotificationsCount={pendingNotifsCount}
        hasGeminiKey={hasGeminiKey}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenOnboardingTour={() => setIsOnboardingOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenDeployGuide={() => setIsDeployModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Urgent Due Reminders Banner */}
        {!dismissedDueBanner && dueNotifications.length > 0 && activeTab !== 'notifications' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  {dueNotifications.length} Jadwal Evaluasi Karakter Menunggu Peninjauan
                </h4>
                <p className="text-xs text-amber-300/80">
                  Subjek <span className="font-semibold text-amber-100">{dueNotifications[0].profileName}</span> telah mencapai tanggal evaluasi berkala untuk pemantauan kestabilan mizaj.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('notifications');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>Buka Jadwal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setDismissedDueBanner(true);
                }}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <FirasatOfTheDay
              onNavigateToLibrary={() => setActiveTab('library')}
              onShowToast={showToast}
            />
            <FaceScanner
              profiles={profiles}
              onAnalysisComplete={handleAnalysisComplete}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          </div>
        )}

        {activeTab === 'challenge' && (
          <ChallengeMode
            onOpenAnalysisResult={(res) => setSelectedResult(res)}
            onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === 'manual' && (
          <ManualInspector
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <CharacterTrendsDashboard
              profiles={profiles}
              history={history}
              onSelectResult={(res) => setSelectedResult(res)}
              onRefreshData={refreshData}
            />
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-6">
            <ProfileComparisonChart
              profiles={profiles}
              history={history}
            />
          </div>
        )}

        {activeTab === 'database' && (
          <HistoryAndProfiles
            profiles={profiles}
            history={history}
            onSelectResult={(res) => setSelectedResult(res)}
            onRefreshData={refreshData}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationCenter
            notifications={notifications}
            profiles={profiles}
            onRefreshData={refreshData}
            onNavigateToScanProfile={handleScanProfile}
          />
        )}

        {activeTab === 'library' && (
          <KitabLibrary />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl shadow-amber-500/30 flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Voice Analysis Modal (Bab Ash-Shawt wal-Kalam) */}
      {isVoiceModalOpen && (
        <VoiceAnalysisModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          profiles={profiles}
          onSaveToProfile={handleSaveVoiceNote}
        />
      )}

      {/* Modal Detailed Analysis Result */}
      {selectedResult && (
        <AnalysisResultModal
          result={selectedResult}
          profiles={profiles}
          onClose={() => setSelectedResult(null)}
          onRefreshData={refreshData}
        />
      )}

      {/* About & Ethical Guide Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-amber-900/40 p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-arabic text-xl">
                  ف
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-title text-stone-100">
                    Tentang Aplikasi Al-Firasat AI
                  </h3>
                  <p className="text-xs text-stone-400">
                    Berdasarkan Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi (554–606 H)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <p>
                Aplikasi ini dikembangkan berdasarkan isi naskah asli bahasa Arab dan terjemahan resmi 
                <strong> Kitab Al-Firasat</strong> (<em>Dalîluka ilâ Ma'rifat Akhlâq an-Nâs wa Thabâ'ihim wa Ka'annahum Kitâbun Maftûh</em>) 
                karya ulama besar tafsir dan filsafat Islam, <strong>Imam Fakhruddin Ar-Razi</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5 text-xs text-amber-200">
                <span className="font-bold text-amber-300 block">Etika dan Batasan Syariat:</span>
                <p>
                  1. Ilmu Firasat bukanlah ramalan gaib (kahanah) atau astrologi (nijamah) yang diharamkan syariat. 
                  Firasat ilmiah adalah <em>istidlâl bil-ahwâl azh-zhâhirah 'alal-ahwâl al-bâthinah</em> (menarik kesimpulan sifat batin dari gejala lahiriah).
                </p>
                <p>
                  2. Ciri fisik hanya menunjukkan <strong>tabiat dasar (thabi'iyyah)</strong>, bukan takdir mutlak. 
                  Manusia senantiasa dapat menyucikan tabiatnya melalui riyadhah akhlak, akal budi, dan ibadah.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-stone-100 block">Fitur Unggulan Terlengkap:</span>
                <ul className="space-y-1.5 text-stone-400 text-xs">
                  <li>• <strong>Pemindaian Wajah Real-time:</strong> Deteksi HUD proporsi geometri dahi, mata, alis, hidung, bibir, dan rahang via kamera live atau foto.</li>
                  <li>• <strong>Pemeriksa Fitur Interaktif:</strong> Uji kalkulator Mizaj berdasarkan kombinasi ciri fisik pilihan.</li>
                  <li>• <strong>Analisis dari Segi Suara & Tutur Kata:</strong> Deteksi frekuensi audio vokal real-time (Bab Ash-Shawt) dan pembaca suara narasi (TTS).</li>
                  <li>• <strong>Visualisasi Komparasi Recharts:</strong> Diagram batang 4 Mizaj dan radar 6 dimensi untuk membandingkan dua profil di basis data.</li>
                  <li>• <strong>Unduh Laporan PDF Lengkap:</strong> Ekspor hasil analisis format PDF dokumen klasik.</li>
                  <li>• <strong>Pengalih Tema Dark & Light:</strong> Kenyamanan visual mode baca naskah klasik.</li>
                  <li>• <strong>Pemantauan Berkala:</strong> Pasang pengingat terjadwal (7, 14, 30 hari) dengan notifikasi peramban.</li>
                  <li>• <strong>Perpustakaan 17 Organ:</strong> Ensiklopedia lengkap aturan kitab, audio narasi, dan dalil syar'i.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  setIsAboutOpen(false);
                  setIsDeployModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>🚀 Panduan Deployment Otomatis (Vercel & Firebase)</span>
              </button>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup & Mulai Menggunakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Guide Modal */}
      {isDeployModalOpen && (
        <DeploymentGuideModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
        />
      )}

      {/* Interactive Onboarding Tour Modal */}
      {isOnboardingOpen && (
        <OnboardingTourModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Google Sheets Sync Modal */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsModal
          isOpen={isGoogleSheetsModalOpen}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          profiles={profiles}
          history={history}
          onShowToast={showToast}
          onRefreshData={refreshData}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/80 py-4 text-center text-xs text-stone-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Al-Firasat AI • Berdasarkan Kitab Al-Firasat Imam Fakhruddin Ar-Razi (554–606 H)
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>🚀 Panduan Deploy Gratis</span>
            </button>
            <span className="text-stone-700">•</span>
            <span className="text-[11px] text-stone-400 font-mono">
              Integrasi Basis Data, Komparasi Recharts & Analisis Suara
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
