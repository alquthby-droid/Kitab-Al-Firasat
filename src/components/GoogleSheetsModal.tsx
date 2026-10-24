import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Database, 
  Sparkles, 
  LogOut, 
  Copy, 
  Check, 
  FilePlus, 
  Link2,
  Upload,
  Download,
  CloudLightning,
  Settings2,
  ArrowRight,
  Search,
  Table,
  CheckSquare,
  Square,
  ShieldCheck,
  Flame,
  Droplets,
  Wind,
  Mountain
} from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from '../services/googleAuth';
import { 
  syncAllToGoogleSheets, 
  GoogleSheetsExportResult,
  extractSpreadsheetId,
  getSpreadsheetDetails,
  readSpreadsheetData,
  SheetImportPreview,
  getAutoSyncSettings,
  saveAutoSyncSettings,
  AutoSyncSettings,
  ensureDedicatedRecordsSheet,
  createFirasatSpreadsheet
} from '../services/googleSheets';
import { saveHistory, saveProfile } from '../services/api';
import { indexedDbCache } from '../services/indexedDbCache';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { sound } from '../services/sound';

export type SheetsTab = 'export' | 'import' | 'autosync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
  onShowToast: (msg: string) => void;
  onRefreshData?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  profiles,
  history,
  onShowToast,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<SheetsTab>('export');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Export Tab States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMode, setSyncMode] = useState<'create_new' | 'existing'>('create_new');
  const [sheetTitle, setSheetTitle] = useState<string>(`Al-Firasat AI - Basis Data Karakter (${new Date().toLocaleDateString('id-ID')})`);
  const [existingSheetInput, setExistingSheetInput] = useState<string>('');
  const [showConfirmExportDialog, setShowConfirmExportDialog] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<GoogleSheetsExportResult | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Import Tab States
  const [importSheetInput, setImportSheetInput] = useState<string>('');
  const [isLoadingSheetsMetadata, setIsLoadingSheetsMetadata] = useState<boolean>(false);
  const [availableSheetTabs, setAvailableSheetTabs] = useState<string[]>([]);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [isReadingSheet, setIsReadingSheet] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<SheetImportPreview | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Auto-Sync Tab States
  const [autoSyncConfig, setAutoSyncConfig] = useState<AutoSyncSettings>(getAutoSyncSettings());
  const [autoSyncInput, setAutoSyncInput] = useState<string>('');
  const [isSettingUpAutoSync, setIsSettingUpAutoSync] = useState<boolean>(false);
  const [autoSyncSuccessMsg, setAutoSyncSuccessMsg] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to Auth state
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    // Load auto sync config
    const currentAutoSync = getAutoSyncSettings();
    setAutoSyncConfig(currentAutoSync);
    if (currentAutoSync.spreadsheetUrl) {
      setAutoSyncInput(currentAutoSync.spreadsheetUrl);
    } else if (currentAutoSync.spreadsheetId) {
      setAutoSyncInput(currentAutoSync.spreadsheetId);
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    sound.playClick();
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        onShowToast(`Berhasil terhubung dengan Google: ${res.user.email}`);
        sound.playSuccessChime();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Gagal masuk dengan Google. Pastikan jendela sembulan (popup) diizinkan.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setAccessToken(null);
      setExportResult(null);
      setImportPreview(null);
      onShowToast('Telah keluar dari akun Google.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // EXPORT LOGIC
  const handleInitiateExport = () => {
    sound.playClick();
    setErrorMessage(null);

    if (syncMode === 'existing' && !existingSheetInput.trim()) {
      setErrorMessage('Masukkan tautan atau ID spreadsheet Google yang valid.');
      return;
    }

    setShowConfirmExportDialog(true);
  };

  const handleExecuteExport = async () => {
    sound.playClick();
    setShowConfirmExportDialog(false);
    setIsSyncing(true);
    setErrorMessage(null);

    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali.');

      const existingId = syncMode === 'existing' ? extractSpreadsheetId(existingSheetInput) : undefined;
      const res = await syncAllToGoogleSheets(token, profiles, history, existingId);

      setExportResult(res);
      onShowToast(`Berhasil mengekspor ${res.exportedProfilesCount} profil & ${res.exportedHistoryCount} riwayat ke Google Sheets!`);
      sound.playSuccessChime();
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err.message || 'Gagal menyinkronkan data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = () => {
    if (!exportResult?.spreadsheetUrl) return;
    navigator.clipboard.writeText(exportResult.spreadsheetUrl);
    setCopiedLink(true);
    sound.playClick();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // IMPORT LOGIC
  const handleInspectSpreadsheet = async () => {
    sound.playClick();
    setErrorMessage(null);
    setImportPreview(null);
    setImportSuccessCount(null);

    const sheetId = extractSpreadsheetId(importSheetInput);
    if (!sheetId) {
      setErrorMessage('Masukkan ID spreadsheet atau URL Google Sheets yang valid untuk diimpor.');
      return;
    }

    setIsLoadingSheetsMetadata(true);
    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali.');

      const details = await getSpreadsheetDetails(token, sheetId);
      const sheetsList = (details.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);

      if (sheetsList.length === 0) {
        throw new Error('Tidak ditemukan lembar kerja (sheet tabs) di spreadsheet ini.');
      }

      setAvailableSheetTabs(sheetsList);
      
      // Auto-select preferred tabs: 'Al-Firasat Records', 'Riwayat Analisis Firasat', or first tab
      const preferred = sheetsList.find((t: string) => 
        t.toLowerCase().includes('records') || 
        t.toLowerCase().includes('riwayat') ||
        t.toLowerCase().includes('al-firasat')
      ) || sheetsList[0];

      setSelectedSheetTab(preferred);
      sound.playSuccessChime();
    } catch (err: any) {
      console.error('Failed to read spreadsheet metadata:', err);
      setErrorMessage(err.message || 'Gagal memeriksa spreadsheet. Pastikan tautan valid dan akun Anda memiliki izin baca.');
    } finally {
      setIsLoadingSheetsMetadata(false);
    }
  };

  const handleLoadSheetData = async () => {
    sound.playClick();
    setErrorMessage(null);
    setImportSuccessCount(null);

    const sheetId = extractSpreadsheetId(importSheetInput);
    if (!sheetId || !selectedSheetTab) {
      setErrorMessage('Pilih lembar kerja spreadsheet terlebih dahulu.');
      return;
    }

    setIsReadingSheet(true);
    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali.');

      const preview = await readSpreadsheetData(token, sheetId, selectedSheetTab);

      if (preview.totalRows === 0) {
        setErrorMessage(`Lembar kerja '${selectedSheetTab}' tidak memiliki baris data atau hanya berisi tajuk.`);
        setImportPreview(null);
        return;
      }

      setImportPreview(preview);
      
      // Select all by default
      if (preview.isProfilesSheet && preview.importedProfiles) {
        setSelectedRecordIds(new Set(preview.importedProfiles.map(p => p.id)));
      } else {
        setSelectedRecordIds(new Set(preview.records.map(r => r.id)));
      }

      sound.playSuccessChime();
    } catch (err: any) {
      console.error('Failed to load sheet data:', err);
      setErrorMessage(err.message || 'Gagal membaca data dari lembar kerja spreadsheet.');
    } finally {
      setIsReadingSheet(false);
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!importPreview) return;
    const allIds = importPreview.isProfilesSheet 
      ? (importPreview.importedProfiles || []).map(p => p.id)
      : importPreview.records.map(r => r.id);

    if (selectedRecordIds.size === allIds.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(allIds));
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview || selectedRecordIds.size === 0) return;
    sound.playClick();
    setIsImporting(true);
    setErrorMessage(null);

    try {
      let importedCount = 0;

      if (importPreview.isProfilesSheet && importPreview.importedProfiles) {
        // Import Profiles
        const targetProfiles = importPreview.importedProfiles.filter(p => selectedRecordIds.has(p.id));
        for (const prof of targetProfiles) {
          try {
            await saveProfile(prof);
            importedCount++;
          } catch (e) {
            console.warn('Failed saving profile non-fatal:', e);
          }
        }
        try {
          await indexedDbCache.cacheProfiles([...profiles, ...targetProfiles]);
        } catch (e) {
          // ignore cache error
        }
      } else {
        // Import Analysis History Records
        const targetRecords = importPreview.records.filter(r => selectedRecordIds.has(r.id));
        for (const rec of targetRecords) {
          try {
            await saveHistory(rec);
            importedCount++;
          } catch (e) {
            console.warn('Failed saving history record non-fatal:', e);
          }
        }
        // Cache in indexedDb
        try {
          await indexedDbCache.cacheHistory([...history, ...targetRecords]);
        } catch (e) {
          // ignore cache error
        }
      }

      setImportSuccessCount(importedCount);
      sound.playSuccessChime();
      onShowToast(`Berhasil mengimpor ${importedCount} rekaman historis ke basis data Al-Firasat!`);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('Import execution error:', err);
      setErrorMessage(err.message || 'Gagal menyimpan rekaman hasil impor ke basis data.');
    } finally {
      setIsImporting(false);
    }
  };

  // AUTO-SYNC CONFIG LOGIC
  const handleToggleAutoSync = () => {
    sound.playClick();
    const newEnabled = !autoSyncConfig.enabled;
    const updated = { ...autoSyncConfig, enabled: newEnabled };
    setAutoSyncConfig(updated);
    saveAutoSyncSettings(updated);
    onShowToast(newEnabled ? 'Auto-Sync Google Sheets diaktifkan' : 'Auto-Sync Google Sheets dinonaktifkan');
  };

  const handleSaveAutoSyncTarget = async () => {
    sound.playClick();
    setErrorMessage(null);
    setAutoSyncSuccessMsg(null);

    const targetId = extractSpreadsheetId(autoSyncInput);
    if (!targetId) {
      setErrorMessage('Masukkan tautan atau ID spreadsheet Google yang valid.');
      return;
    }

    setIsSettingUpAutoSync(true);
    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali.');

      // Verify spreadsheet & ensure 'Al-Firasat Records' sheet tab exists
      const details = await getSpreadsheetDetails(token, targetId);
      const sheetTitle = details.properties?.title || 'Spreadsheet Firasat';

      await ensureDedicatedRecordsSheet(token, targetId, 'Al-Firasat Records');

      const targetUrl = `https://docs.google.com/spreadsheets/d/${targetId}/edit`;
      const updated: AutoSyncSettings = {
        enabled: true,
        spreadsheetId: targetId,
        spreadsheetUrl: targetUrl,
        spreadsheetTitle: sheetTitle,
        lastSyncTimestamp: autoSyncConfig.lastSyncTimestamp
      };

      setAutoSyncConfig(updated);
      saveAutoSyncSettings(updated);
      setAutoSyncSuccessMsg(`Tersambung ke '${sheetTitle}'! Tab 'Al-Firasat Records' siap menerima hasil pemindaian.`);
      sound.playSuccessChime();
      onShowToast(`Auto-Sync berhasil dikonfigurasi ke spreadsheet: ${sheetTitle}`);
    } catch (err: any) {
      console.error('Failed to configure auto sync:', err);
      setErrorMessage(err.message || 'Gagal menghubungkan spreadsheet untuk Auto-Sync.');
    } finally {
      setIsSettingUpAutoSync(false);
    }
  };

  const handleCreateDedicatedAutoSyncSheet = async () => {
    sound.playClick();
    setErrorMessage(null);
    setAutoSyncSuccessMsg(null);
    setIsSettingUpAutoSync(true);

    try {
      let token = accessToken;
      if (!token) token = await getAccessToken();
      if (!token) throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali.');

      const title = `Al-Firasat AI - Rekaman Otomatis (${new Date().toLocaleDateString('id-ID')})`;
      const created = await createFirasatSpreadsheet(token, title);
      
      // Ensure 'Al-Firasat Records' sheet tab exists
      await ensureDedicatedRecordsSheet(token, created.spreadsheetId, 'Al-Firasat Records');

      const updated: AutoSyncSettings = {
        enabled: true,
        spreadsheetId: created.spreadsheetId,
        spreadsheetUrl: created.spreadsheetUrl,
        spreadsheetTitle: title,
        lastSyncTimestamp: new Date().toISOString()
      };

      setAutoSyncConfig(updated);
      saveAutoSyncSettings(updated);
      setAutoSyncInput(created.spreadsheetUrl);
      setAutoSyncSuccessMsg(`Spreadsheet '${title}' berhasil dibuat di Google Drive! Setiap pemindaian sukses akan otomatis ditambahkan ke tab 'Al-Firasat Records'.`);
      sound.playSuccessChime();
      onShowToast('Spreadsheet khusus Auto-Sync berhasil dibuat & dihubungkan!');
    } catch (err: any) {
      console.error('Failed to create dedicated sheet:', err);
      setErrorMessage(err.message || 'Gagal membuat spreadsheet baru untuk Auto-Sync.');
    } finally {
      setIsSettingUpAutoSync(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 space-y-6 shadow-2xl text-stone-100">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-title text-stone-100">
                  Integrasi Google Sheets & Cloud Sync
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Sinkronisasi otomatis hasil pemindaian ke lembar <em>'Al-Firasat Records'</em>, ekspor menyeluruh, dan impor arsip historis.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Authentication Account Card */}
        {!currentUser ? (
          <div className="p-6 rounded-2xl bg-stone-950/70 border border-stone-800 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-200">
                Hubungkan Akun Google Anda
              </h4>
              <p className="text-xs text-stone-400 mt-1 max-w-md">
                Aplikasi memerlukan izin untuk membaca, membuat, dan memperbarui spreadsheet di Google Drive Anda. Token akses disimpan secara aman di memori sesi aktif.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm flex items-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Menghubungkan ke Google...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-stone-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-200">
                    {currentUser.displayName || 'Akun Google'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Terhubung
                  </span>
                  {autoSyncConfig.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <CloudLightning className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Auto-Sync Aktif</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-400">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* Feature Mode Tabs */}
        {currentUser && (
          <div className="flex border-b border-stone-800 gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('autosync');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'autosync'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <CloudLightning className="w-4 h-4 text-amber-400" />
              <span>Auto-Sync 'Al-Firasat Records'</span>
              {autoSyncConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('import');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'import'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Impor Data Karakter Historis</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('export');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Basis Data ke Sheets</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: AUTO-SYNC UPON EVERY SCAN                                          */}
        {/* ========================================================================= */}
        {currentUser && activeTab === 'autosync' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Auto-Sync Toggle Banner */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              autoSyncConfig.enabled 
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-stone-950/60 border-stone-800 text-stone-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  autoSyncConfig.enabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-stone-800 text-stone-400'
                }`}>
                  <CloudLightning className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <span>Sinkronisasi Otomatis Setiap Pemindaian Sukses</span>
                    {autoSyncConfig.enabled ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                        Nonaktif
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5 max-w-xl">
                    Setiap kali Anda menuntaskan analisis fisiognomi pada tab <strong>Pemindai Wajah & Tangan</strong> atau <strong>Pemeriksa Fitur</strong>, rekaman analisis akan ditambahkan secara instan ke tab lembar khusus <strong>'Al-Firasat Records'</strong> di Google Sheets.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  autoSyncConfig.enabled
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                {autoSyncConfig.enabled ? 'Matikan Auto-Sync' : 'Aktifkan Auto-Sync'}
              </button>
            </div>

            {/* Target Spreadsheet Setup */}
            <div className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Target Google Spreadsheet untuk Lembar 'Al-Firasat Records'</span>
                </h4>
                {autoSyncConfig.spreadsheetUrl && (
                  <a
                    href={autoSyncConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1.5">
                  Tautan atau ID Google Spreadsheet Target:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={autoSyncInput}
                    onChange={(e) => setAutoSyncInput(e.target.value)}
                    placeholder="Contoh: https://docs.google.com/spreadsheets/d/1abcXYZ.../edit atau ID Spreadsheet"
                    className="flex-1 px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAutoSyncTarget}
                    disabled={isSettingUpAutoSync || !autoSyncInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSettingUpAutoSync ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan & Verifikasi</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-xs">
                <span className="text-[11px] text-stone-400">
                  Belum punya spreadsheet khusus?
                </span>
                <button
                  type="button"
                  onClick={handleCreateDedicatedAutoSyncSheet}
                  disabled={isSettingUpAutoSync}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buat Spreadsheet 'Al-Firasat Records' Baru Sekarang</span>
                </button>
              </div>

              {autoSyncConfig.lastSyncTimestamp && (
                <div className="text-[11px] text-stone-400 pt-1">
                  Sinkronisasi terakhir berhasil pada:{' '}
                  <span className="text-stone-200 font-mono">
                    {new Date(autoSyncConfig.lastSyncTimestamp).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {autoSyncSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{autoSyncSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IMPORT HISTORICAL CHARACTER DATA                                   */}
        {/* ========================================================================= */}
        {currentUser && activeTab === 'import' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-stone-200 mb-1">
                  1. Masukkan Spreadsheet Sumber Arsip Historis
                </h4>
                <p className="text-[11px] text-stone-400">
                  Aplikasi akan membaca lembar kerja yang memiliki kolom karakter Firasat (nama subjek, dominasi mizaj, skor, dan ciri fisik) lalu menyimpannya ke basis data internal.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={importSheetInput}
                  onChange={(e) => setImportSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/... atau ID spreadsheet"
                  className="flex-1 px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={handleInspectSpreadsheet}
                  disabled={isLoadingSheetsMetadata || !importSheetInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isLoadingSheetsMetadata ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Periksa Lembar</span>
                </button>
              </div>

              {availableSheetTabs.length > 0 && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-stone-400 mb-1">
                      Pilih Lembar Kerja (Sheet Tab):
                    </label>
                    <select
                      value={selectedSheetTab}
                      onChange={(e) => setSelectedSheetTab(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-emerald-500/50"
                    >
                      {availableSheetTabs.map(tabName => (
                        <option key={tabName} value={tabName}>
                          Tab: {tabName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadSheetData}
                    disabled={isReadingSheet || !selectedSheetTab}
                    className="self-end sm:self-auto px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isReadingSheet ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Table className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Muat & Pratinjau Rekaman</span>
                  </button>
                </div>
              )}
            </div>

            {/* Import Preview Table */}
            {importPreview && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 rounded text-stone-400 hover:text-stone-200 flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      {selectedRecordIds.size === (importPreview.isProfilesSheet ? (importPreview.importedProfiles?.length || 0) : importPreview.records.length) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-500" />
                      )}
                      <span>Pilih Semua ({selectedRecordIds.size} / {importPreview.totalRows} Terpilih)</span>
                    </button>
                  </div>

                  <span className="text-xs text-stone-400">
                    Tipe:{' '}
                    <strong className="text-stone-200">
                      {importPreview.isProfilesSheet ? 'Profil Subjek' : 'Riwayat Analisis Firasat'}
                    </strong>
                  </span>
                </div>

                {/* Record List Preview */}
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-stone-800 bg-stone-950 divide-y divide-stone-900">
                  {importPreview.isProfilesSheet ? (
                    (importPreview.importedProfiles || []).map((prof) => {
                      const isSelected = selectedRecordIds.has(prof.id);
                      return (
                        <div
                          key={prof.id}
                          onClick={() => toggleSelectRecord(prof.id)}
                          className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-950/20' : 'hover:bg-stone-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-stone-200">{prof.name}</span>
                              <span className="text-[10px] text-stone-400 ml-2">({prof.category})</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-stone-400 truncate max-w-xs">{prof.notes}</span>
                        </div>
                      );
                    })
                  ) : (
                    importPreview.records.map((rec) => {
                      const isSelected = selectedRecordIds.has(rec.id);
                      return (
                        <div
                          key={rec.id}
                          onClick={() => toggleSelectRecord(rec.id)}
                          className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-950/20' : 'hover:bg-stone-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-stone-200">{rec.subjectName}</span>
                              <span className="text-[10px] text-stone-500 ml-2">
                                {new Date(rec.timestamp).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {rec.dominantMizaj}
                            </span>
                            <span className="text-[11px] text-stone-400 hidden sm:inline truncate max-w-[180px]">
                              {rec.overallSummary?.naturalInclination}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-stone-400">
                    Siap menambahkan data ke basis data lokal dan penyimpanan aplikasi.
                  </span>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || selectedRecordIds.size === 0}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Basis Data...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Impor {selectedRecordIds.size} Rekaman Terpilih</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {importSuccessCount !== null && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="font-bold text-emerald-200">
                    Impor Data Historis Selesai!
                  </h5>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    Sebanyak <strong>{importSuccessCount}</strong> rekaman karakter berhasil dimasukkan ke basis data Al-Firasat AI dan siap ditinjau di tab Arsip & Komparasi.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FULL DATABASE EXPORT                                               */}
        {/* ========================================================================= */}
        {currentUser && activeTab === 'export' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                Pilih Mode Ekspor Google Sheets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSyncMode('create_new')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    syncMode === 'create_new'
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/20'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-950'
                  }`}
                >
                  <FilePlus className="w-5 h-5 mb-2 text-emerald-400" />
                  <span className="text-xs font-bold block text-stone-200">
                    Buat Spreadsheet Baru
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Membuat spreadsheet baru di Google Drive dengan tab Profil & Riwayat terformat rapi.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncMode('existing')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    syncMode === 'existing'
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/20'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-950'
                  }`}
                >
                  <Link2 className="w-5 h-5 mb-2 text-emerald-400" />
                  <span className="text-xs font-bold block text-stone-200">
                    Gunakan Spreadsheet yang Ada
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Perbarui data pada spreadsheet yang sudah ada menggunakan ID atau URL.
                  </span>
                </button>
              </div>
            </div>

            {syncMode === 'create_new' ? (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nama Dokumen Spreadsheet
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="Nama spreadsheet..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Tautan / ID Spreadsheet Google
                </label>
                <input
                  type="text"
                  value={existingSheetInput}
                  onChange={(e) => setExistingSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1aBcD.../edit atau ID spreadsheet"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            )}

            {/* Content Preview Summary */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-lg font-bold font-title text-amber-400 block">
                  {profiles.length}
                </span>
                <span className="text-[10px] text-stone-400">Profil Subjek</span>
              </div>
              <div className="h-8 w-px bg-stone-800" />
              <div>
                <span className="text-lg font-bold font-title text-emerald-400 block">
                  {history.length}
                </span>
                <span className="text-[10px] text-stone-400">Riwayat Analisis Firasat</span>
              </div>
              <div className="h-8 w-px bg-stone-800" />
              <div>
                <span className="text-lg font-bold font-title text-cyan-400 block">
                  2 Tab
                </span>
                <span className="text-[10px] text-stone-400">Terstruktur & Terformat</span>
              </div>
            </div>

            {/* Export Success Banner */}
            {exportResult && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ekspor ke Google Sheets Berhasil!</span>
                </div>
                <p className="text-xs text-stone-300">
                  Spreadsheet <span className="font-semibold text-emerald-200">"{exportResult.title}"</span> telah berhasil dibuat dan diperbarui di Google Drive Anda.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={exportResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {currentUser && activeTab === 'export' && (
            <button
              type="button"
              onClick={handleInitiateExport}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyinkronkan ke Sheets...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor ke Google Sheets</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Mandatory User Confirmation Dialog before mutating Workspace data */}
        {showConfirmExportDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-stone-900 border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
                <h4 className="text-base font-bold text-stone-100">
                  Konfirmasi Ekspor Google Sheets
                </h4>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                Apakah Anda yakin ingin mengekspor <span className="font-bold text-amber-300">{profiles.length} Profil Subjek</span> dan <span className="font-bold text-emerald-300">{history.length} Riwayat Analisis Firasat</span> ke Google Spreadsheet di akun <span className="font-mono text-stone-200">{currentUser?.email}</span>?
              </p>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400 space-y-1">
                <p>• Data akan ditulis ke tab <strong>Profil Subjek</strong> dan <strong>Riwayat Analisis Firasat</strong>.</p>
                <p>• Tindakan ini membuat/memperbarui spreadsheet dengan izin dari akun Google Anda.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmExportDialog(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExport}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Ya, Lanjutkan Ekspor
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
