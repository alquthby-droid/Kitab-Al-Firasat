import React, { useState, useMemo, useRef } from 'react';
import { 
  Database, 
  User, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Calendar, 
  Plus, 
  GitCompare, 
  Check, 
  Clock, 
  FileText,
  Bookmark,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
  AlertTriangle,
  X,
  Upload,
  FileJson,
  Table,
  LayoutList,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Droplets,
  Wind,
  Mountain,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { FirasatAnalysisResult, SubjectProfile, TemperamentType } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { saveProfile, deleteProfile, deleteHistory } from '../services/api';
import { generateFirasatPDF } from '../services/pdfReport';
import { sound } from '../services/sound';
import { indexedDbCache } from '../services/indexedDbCache';
import { toHijri } from '../services/hijriCalendar';
import { exportBackupToJson, importBackupFromJson } from '../services/dataBackup';
import { ProfileComparisonChart } from './ProfileComparisonChart';
import { ShareAnalysisModal } from './ShareAnalysisModal';
import { GoogleSheetsModal } from './GoogleSheetsModal';

interface HistoryAndProfilesProps {
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
  onSelectResult: (result: FirasatAnalysisResult) => void;
  onRefreshData: () => void;
  onNavigateToScanner: () => void;
}

export const HistoryAndProfiles: React.FC<HistoryAndProfilesProps> = ({
  profiles,
  history,
  onSelectResult,
  onRefreshData,
  onNavigateToScanner
}) => {
  const [subTab, setSubTab] = useState<'profiles' | 'history' | 'compare'>('history');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // History Filter States
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedMizajFilter, setSelectedMizajFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedCompatibilityFilter, setSelectedCompatibilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'score_desc' | 'confidence_desc'>('date_desc');
  const [historyViewMode, setHistoryViewMode] = useState<'table' | 'cards'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Profile creation modal
  const [showAddProfileModal, setShowAddProfileModal] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newProfileCategory, setNewProfileCategory] = useState<SubjectProfile['category']>('Keluarga');
  const [newProfileNotes, setNewProfileNotes] = useState<string>('');
  const [newProfileInterval, setNewProfileInterval] = useState<number>(14);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shareTargetResult, setShareTargetResult] = useState<FirasatAnalysisResult | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);

  // In-app deletion confirmation state (100% iframe-safe, no blocked window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'history' | 'profile';
    id: string;
    name: string;
    subInfo?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // JSON Data Backup & Restore states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleExportJson = () => {
    sound.playClick();
    exportBackupToJson(profiles, history);
    setBackupMessage({
      text: `Cadangan data JSON mandiri berhasil diunduh (${profiles.length} profil, ${history.length} rekaman analisis).`,
      type: 'success'
    });
    setTimeout(() => setBackupMessage(null), 5000);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    sound.playClick();
    try {
      const text = await file.text();
      const res = await importBackupFromJson(text);
      if (res.success) {
        sound.playSuccessChime();
        setBackupMessage({ text: res.message, type: 'success' });
        onRefreshData();
      } else {
        setBackupMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setBackupMessage({ text: err.message || 'Gagal membaca berkas cadangan JSON', type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setBackupMessage(null), 6000);
    }
  };

  // Count active filters for badge and reset
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (dateFilterPreset !== 'all') count++;
    if (selectedMizajFilter !== 'all') count++;
    if (selectedCategoryFilter !== 'all') count++;
    if (selectedCompatibilityFilter !== 'all') count++;
    return count;
  }, [searchQuery, dateFilterPreset, selectedMizajFilter, selectedCategoryFilter, selectedCompatibilityFilter]);

  const handleResetFilters = () => {
    sound.playClick();
    setSearchQuery('');
    setDateFilterPreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMizajFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedCompatibilityFilter('all');
  };

  // Filtered & Sorted History
  const filteredHistory = useMemo(() => {
    const now = new Date();

    return history.filter(item => {
      // 1. Text Search Query
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = !query || 
        item.subjectName.toLowerCase().includes(query) ||
        (item.overallSummary?.naturalInclination && item.overallSummary.naturalInclination.toLowerCase().includes(query)) ||
        (item.dominantMizaj && item.dominantMizaj.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      // 2. Date Filtering
      const itemDate = new Date(item.timestamp);
      let matchesDate = true;

      if (dateFilterPreset === 'today') {
        matchesDate = itemDate.toDateString() === now.toDateString();
      } else if (dateFilterPreset === '7days') {
        const past7 = new Date();
        past7.setDate(now.getDate() - 7);
        matchesDate = itemDate >= past7;
      } else if (dateFilterPreset === '30days') {
        const past30 = new Date();
        past30.setDate(now.getDate() - 30);
        matchesDate = itemDate >= past30;
      } else if (dateFilterPreset === 'this_month') {
        matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      } else if (dateFilterPreset === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) matchesDate = false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) matchesDate = false;
        }
      }

      if (!matchesDate) return false;

      // 3. Character Category / Dominant Mizaj
      const matchesMizaj = selectedMizajFilter === 'all' || item.dominantMizaj === selectedMizajFilter;
      if (!matchesMizaj) return false;

      // 4. Profile Category Filtering
      let matchesCategory = true;
      if (selectedCategoryFilter !== 'all') {
        if (selectedCategoryFilter === 'Umum') {
          matchesCategory = !item.profileId || !profiles.some(p => p.id === item.profileId);
        } else {
          const matchedProf = profiles.find(p => p.id === item.profileId);
          matchesCategory = matchedProf?.category === selectedCategoryFilter;
        }
      }
      if (!matchesCategory) return false;

      // 5. Compatibility / Balance Level (Tingkat Kecocokan / I'tidal)
      const maxScore = Math.max(
        item.mizajScores?.sanguinis || 0,
        item.mizajScores?.koleris || 0,
        item.mizajScores?.melankolis || 0,
        item.mizajScores?.flegmatis || 0
      );
      const avgConfidence = item.features?.length 
        ? Math.round(item.features.reduce((acc, f) => acc + (f.confidence || 85), 0) / item.features.length)
        : 85;

      let matchesCompatibility = true;
      if (selectedCompatibilityFilter === 'mutadil') {
        // Mu'tadil (Seimbang Harmonis)
        matchesCompatibility = (item.iTidalStatus || '').toLowerCase().includes("mu'tadil") && 
          !(item.iTidalStatus || '').toLowerCase().includes("ghairu");
      } else if (selectedCompatibilityFilter === 'ghairu') {
        // Ghairu Mu'tadil (Condong kuat ke satu unsur)
        matchesCompatibility = (item.iTidalStatus || '').toLowerCase().includes("ghairu");
      } else if (selectedCompatibilityFilter === 'high_score') {
        // Skor dominan tinggi >= 40%
        matchesCompatibility = maxScore >= 40;
      } else if (selectedCompatibilityFilter === 'very_high_score') {
        // Skor dominan sangat tinggi >= 50%
        matchesCompatibility = maxScore >= 50;
      } else if (selectedCompatibilityFilter === 'high_confidence') {
        // Akurasi Firasat >= 90%
        matchesCompatibility = avgConfidence >= 90;
      }

      return matchesCompatibility;
    }).sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.subjectName.localeCompare(b.subjectName);
      }
      if (sortBy === 'score_desc') {
        const scoreA = Math.max(a.mizajScores?.sanguinis || 0, a.mizajScores?.koleris || 0, a.mizajScores?.melankolis || 0, a.mizajScores?.flegmatis || 0);
        const scoreB = Math.max(b.mizajScores?.sanguinis || 0, b.mizajScores?.koleris || 0, b.mizajScores?.melankolis || 0, b.mizajScores?.flegmatis || 0);
        return scoreB - scoreA;
      }
      if (sortBy === 'confidence_desc') {
        const confA = a.features?.length ? a.features.reduce((acc, f) => acc + (f.confidence || 85), 0) / a.features.length : 85;
        const confB = b.features?.length ? b.features.reduce((acc, f) => acc + (f.confidence || 85), 0) / b.features.length : 85;
        return confB - confA;
      }
      // default: date_desc (terbaru)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [
    history, 
    searchQuery, 
    dateFilterPreset, 
    customStartDate, 
    customEndDate, 
    selectedMizajFilter, 
    selectedCategoryFilter, 
    selectedCompatibilityFilter, 
    sortBy, 
    profiles
  ]);

  // Filtered Profiles
  const filteredProfiles = profiles.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle Add Profile
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setIsSubmitting(true);
    try {
      await saveProfile({
        name: newProfileName.trim(),
        category: newProfileCategory,
        notes: newProfileNotes.trim(),
        monitoringIntervalDays: newProfileInterval,
        createdAt: new Date().toISOString()
      });
      setShowAddProfileModal(false);
      setNewProfileName('');
      setNewProfileNotes('');
      onRefreshData();
    } catch (err) {
      console.error('Failed to create profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'history') {
        await deleteHistory(deleteTarget.id);
      } else {
        await deleteProfile(deleteTarget.id);
      }
      sound.playClick();
      setDeleteTarget(null);
      onRefreshData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Mizaj Badge & Theme
  const getMizajBadge = (dominantMizaj: TemperamentType) => {
    switch (dominantMizaj) {
      case 'koleris':
        return {
          label: 'Koleris',
          quality: 'Panas & Kering',
          element: 'Api',
          icon: <Flame className="w-3 h-3 text-amber-500" />,
          color: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
          dot: 'bg-amber-400'
        };
      case 'melankolis':
        return {
          label: 'Melankolis',
          quality: 'Dingin & Kering',
          element: 'Tanah',
          icon: <Mountain className="w-3 h-3 text-indigo-400" />,
          color: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
          dot: 'bg-indigo-400'
        };
      case 'flegmatis':
        return {
          label: 'Flegmatis',
          quality: 'Dingin & Lembap',
          element: 'Air',
          icon: <Wind className="w-3 h-3 text-cyan-400" />,
          color: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
          dot: 'bg-cyan-400'
        };
      default:
        return {
          label: 'Sanguinis',
          quality: 'Panas & Lembap',
          element: 'Udara',
          icon: <Droplets className="w-3 h-3 text-red-400" />,
          color: 'bg-red-950/70 text-red-300 border-red-800/80',
          dot: 'bg-red-400'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Arsip Fisiognomi & Basis Data Subjek</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
              Riwayat Analisis Firasat & Profil Subjek
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
              Kelola arsip pembacaan karakter, pantau perkembangan berkala, dan filter riwayat berdasarkan tanggal, kategori watak, serta tingkat kecocokan.
            </p>
          </div>

          {/* Quick Actions: Add Profile & Backup Data */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setShowAddProfileModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Profil</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsGoogleSheetsModalOpen(true);
              }}
              title="Ekspor & Sinkronkan ke Google Sheets"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            <button
              onClick={handleExportJson}
              title="Unduh berkas JSON cadangan"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ekspor JSON</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              disabled={isImporting}
              title="Pulihkan data dari berkas JSON cadangan"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-emerald-300 border border-stone-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Impor JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Backup Feedback Message Banner */}
        {backupMessage && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            backupMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{backupMessage.text}</span>
            </div>
            <button
              onClick={() => setBackupMessage(null)}
              className="p-1 hover:bg-black/20 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex p-1 bg-stone-900 border border-stone-800 rounded-xl self-start">
          <button
            onClick={() => {
              sound.playClick();
              setSubTab('history');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'history'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tabel Riwayat Analisis ({history.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSubTab('profiles');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'profiles'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil Subjek ({profiles.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSubTab('compare');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'compare'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Komparasi & Kecocokan</span>
          </button>
        </div>

        {/* Fast Search input for Profiles tab */}
        {subTab === 'profiles' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Cari profil subjek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: PROFILES LIST                                  */}
      {/* ========================================================= */}
      {subTab === 'profiles' && (
        <div className="space-y-4">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-stone-900/40 border border-stone-800/80 p-8">
              <User className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-200">Belum Ada Profil yang Didaftarkan</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Daftarkan profil individu yang ingin Anda amati watak dan perkembangannya secara berkala.
              </p>
              <button
                onClick={() => setShowAddProfileModal(true)}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl"
              >
                Tambah Profil Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((prof) => {
                const profileScans = history.filter(h => h.profileId === prof.id);
                const latestScan = profileScans[0];
                const mizajInfo = latestScan ? MIZAJ_DATA[latestScan.dominantMizaj] : null;

                return (
                  <div
                    key={prof.id}
                    className="rounded-2xl bg-stone-900/70 border border-stone-800 p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-md group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {prof.avatarUrl ? (
                            <img
                              src={prof.avatarUrl}
                              alt={prof.name}
                              className="w-12 h-12 rounded-xl object-cover border border-amber-500/30"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-base">
                              {prof.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-medium">
                              {prof.category}
                            </span>
                            <h4 className="text-sm font-bold text-stone-100 mt-1 group-hover:text-amber-300 transition-colors">
                              {prof.name}
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            setDeleteTarget({
                              type: 'profile',
                              id: prof.id,
                              name: prof.name,
                              subInfo: `Kategori: ${prof.category}`
                            });
                          }}
                          title="Hapus Profil Subjek"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {prof.notes && (
                        <p className="text-xs text-stone-400 mt-3 line-clamp-2 italic">
                          "{prof.notes}"
                        </p>
                      )}

                      {/* Analysis status summary */}
                      <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-1.5 text-xs text-stone-300">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">Total Analisis:</span>
                          <span className="font-semibold text-amber-400">{profileScans.length} kali</span>
                        </div>

                        {mizajInfo && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-stone-400">Mizaj Terkini:</span>
                            <span className="font-semibold text-stone-200">{mizajInfo.indonesianName.split(' (')[0]}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">Jadwal Tinjauan:</span>
                          <span className="text-stone-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Tiap {prof.monitoringIntervalDays} Hari
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-between gap-2">
                      {latestScan ? (
                        <button
                          onClick={() => onSelectResult(latestScan)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hasil Terakhir</span>
                        </button>
                      ) : (
                        <button
                          onClick={onNavigateToScanner}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-amber-500/20 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pindai Wajah</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSubTab('compare')}
                        title="Bandingkan karakter subjek ini dengan profil lain menggunakan grafik Recharts"
                        className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-amber-500/15 hover:text-amber-300 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bandingkan</span>
                      </button>

                      {latestScan && (
                        <button
                          onClick={() => setShareTargetResult(latestScan)}
                          title="Bagikan Ringkasan Karakter ke Media Sosial"
                          className="py-1.5 px-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Bagikan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: HISTORY TABLE WITH ENHANCED MULTI-FILTERS     */}
      {/* ========================================================= */}
      {subTab === 'history' && (
        <div className="space-y-4">
          
          {/* Main Filter Toolbar */}
          <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-4 space-y-3.5 shadow-lg">
            
            {/* Top Row: Search Input + 3 Primary Filters + View Switcher */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search by Name/Trait */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Cari nama subjek, kecenderungan watak, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3 Main Filters Grid / Flex */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 1. Date Filter (Tanggal) */}
                <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    value={dateFilterPreset}
                    onChange={(e) => {
                      sound.playClick();
                      setDateFilterPreset(e.target.value as any);
                    }}
                    className="bg-transparent text-xs text-stone-200 font-medium focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Semua Tanggal</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="30days">30 Hari Terakhir</option>
                    <option value="this_month">Bulan Ini</option>
                    <option value="custom">Rentang Khusus...</option>
                  </select>
                </div>

                {/* 2. Character Category Filter (Mizaj / Watak) */}
                <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    value={selectedMizajFilter}
                    onChange={(e) => {
                      sound.playClick();
                      setSelectedMizajFilter(e.target.value);
                    }}
                    className="bg-transparent text-xs text-stone-200 font-medium focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Semua Mizaj (Watak)</option>
                    <option value="sanguinis">Sanguinis (Panas-Lembap / Udara)</option>
                    <option value="koleris">Koleris (Panas-Kering / Api)</option>
                    <option value="melankolis">Melankolis (Dingin-Kering / Tanah)</option>
                    <option value="flegmatis">Flegmatis (Dingin-Lembap / Air)</option>
                  </select>
                </div>

                {/* 3. Compatibility & Balance Filter (Tingkat Kecocokan / I'tidal) */}
                <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <select
                    value={selectedCompatibilityFilter}
                    onChange={(e) => {
                      sound.playClick();
                      setSelectedCompatibilityFilter(e.target.value);
                    }}
                    className="bg-transparent text-xs text-stone-200 font-medium focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Semua Keselarasan</option>
                    <option value="mutadil">Mu'tadil (Seimbang Harmonis)</option>
                    <option value="ghairu">Ghairu Mu'tadil (Condong)</option>
                    <option value="high_score">Skor Dominan Tinggi (≥ 40%)</option>
                    <option value="very_high_score">Skor Sangat Tinggi (≥ 50%)</option>
                    <option value="high_confidence">Akurasi Firasat Tinggi (≥ 90%)</option>
                  </select>
                </div>

                {/* Advanced Filter Toggle */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowAdvancedFilters(!showAdvancedFilters);
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showAdvancedFilters || dateFilterPreset === 'custom' || selectedCategoryFilter !== 'all'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-950 text-stone-400 hover:text-stone-200 border-stone-800'
                  }`}
                  title="Tampilkan opsi filter lanjutan"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lanjutan</span>
                </button>

                {/* View Mode Toggle: Table vs Cards */}
                <div className="flex items-center gap-0.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setHistoryViewMode('table');
                    }}
                    title="Tampilan Tabel Berbaris"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      historyViewMode === 'table'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setHistoryViewMode('cards');
                    }}
                    title="Tampilan Kartu Ringkas"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      historyViewMode === 'cards'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Advanced Filters Row: Custom Date Range, Profile Category, & Sorting */}
            {(showAdvancedFilters || dateFilterPreset === 'custom') && (
              <div className="pt-3 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-stone-950/40 p-3 rounded-xl border border-stone-800/60">
                {/* Custom Date Start */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setDateFilterPreset('custom');
                    }}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Custom Date End */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Tanggal Akhir:
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setDateFilterPreset('custom');
                    }}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Profile Category Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Kategori Relasi Profil:
                  </label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      sound.playClick();
                      setSelectedCategoryFilter(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Semua Kategori Profil</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Rekan Kerja">Rekan Kerja</option>
                    <option value="Partner Bisnis">Partner Bisnis</option>
                    <option value="Murid/Binaan">Murid / Binaan</option>
                    <option value="Sahabat">Sahabat</option>
                    <option value="Diri Sendiri">Diri Sendiri</option>
                    <option value="Umum">Umum / Tanpa Profil</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Urutkan Berdasarkan:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      sound.playClick();
                      setSortBy(e.target.value as any);
                    }}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="date_desc">Waktu: Terbaru ke Terlama</option>
                    <option value="date_asc">Waktu: Terlama ke Terbaru</option>
                    <option value="name_asc">Nama Subjek (A-Z)</option>
                    <option value="score_desc">Skor Mizaj Tertinggi</option>
                    <option value="confidence_desc">Keyakinan Firasat Tertinggi</option>
                  </select>
                </div>
              </div>
            )}

            {/* Filter Summary & Active Filter Tags Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-stone-400">
                <span>
                  Menampilkan <strong className="text-amber-400">{filteredHistory.length}</strong> dari {history.length} rekaman analisis
                </span>

                {/* Active filter badges */}
                {dateFilterPreset !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">
                    Tanggal: {dateFilterPreset === 'today' ? 'Hari Ini' : dateFilterPreset === '7days' ? '7 Hari' : dateFilterPreset === '30days' ? '30 Hari' : dateFilterPreset === 'this_month' ? 'Bulan Ini' : `${customStartDate || 'Awal'} s/d ${customEndDate || 'Akhir'}`}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-400" onClick={() => setDateFilterPreset('all')} />
                  </span>
                )}

                {selectedMizajFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px] capitalize">
                    Mizaj: {selectedMizajFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-400" onClick={() => setSelectedMizajFilter('all')} />
                  </span>
                )}

                {selectedCompatibilityFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">
                    Keselarasan: {selectedCompatibilityFilter === 'mutadil' ? "Mu'tadil" : selectedCompatibilityFilter === 'ghairu' ? 'Ghairu' : selectedCompatibilityFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-400" onClick={() => setSelectedCompatibilityFilter('all')} />
                  </span>
                )}

                {selectedCategoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">
                    Kategori: {selectedCategoryFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-400" onClick={() => setSelectedCategoryFilter('all')} />
                  </span>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/40 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filter ({activeFilterCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Empty State when Filter Yields No Result */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-stone-900/40 border border-stone-800/80 p-8 space-y-3">
              <FileText className="w-12 h-12 text-stone-600 mx-auto" />
              <h3 className="text-base font-bold text-stone-200">
                {activeFilterCount > 0 
                  ? 'Tidak Ada Rekaman yang Sesuai dengan Kriteria Filter' 
                  : 'Belum Ada Rekaman Analisis yang Tersimpan'}
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                {activeFilterCount > 0
                  ? 'Coba sesuaikan rentang tanggal, kategori karakter, atau hapus filter tingkat kecocokan untuk menampilkan hasil lainnya.'
                  : 'Mulai pemindaian wajah kamera live atau pemeriksa fitur manual untuk menyimpan arsip analisis pertama Anda.'}
              </p>
              {activeFilterCount > 0 ? (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl border border-stone-700 transition-colors cursor-pointer"
                >
                  Bersihkan Semua Filter
                </button>
              ) : (
                <button
                  onClick={onNavigateToScanner}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Buka Pemindai Sekarang
                </button>
              )}
            </div>
          ) : historyViewMode === 'table' ? (
            
            /* ========================================================= */
            /* TABLE VIEW: CLEAN, STRUCTURED, PROFESSIONAL TABULAR DATA */
            /* ========================================================= */
            <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/70 shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/80 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Subjek & Tipe</th>
                    <th className="py-3 px-4">Tanggal & Hijriah</th>
                    <th className="py-3 px-4">Kategori Karakter (Mizaj)</th>
                    <th className="py-3 px-4">Tingkat Kecocokan / Keseimbangan</th>
                    <th className="py-3 px-4">Akurasi Firasat</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredHistory.map((item) => {
                    const mizajBadge = getMizajBadge(item.dominantMizaj);
                    const matchedProf = profiles.find(p => p.id === item.profileId);
                    const hijri = toHijri(item.timestamp);
                    const maxScore = Math.max(
                      item.mizajScores?.sanguinis || 0,
                      item.mizajScores?.koleris || 0,
                      item.mizajScores?.melankolis || 0,
                      item.mizajScores?.flegmatis || 0
                    );
                    const avgConfidence = item.features?.length 
                      ? Math.round(item.features.reduce((acc, f) => acc + (f.confidence || 85), 0) / item.features.length)
                      : 88;

                    const isMuTadil = (item.iTidalStatus || '').toLowerCase().includes("mu'tadil") && 
                      !(item.iTidalStatus || '').toLowerCase().includes("ghairu");

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelectResult(item)}
                        className="hover:bg-stone-800/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. Subjek & Tipe */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.subjectName}
                                className="w-10 h-10 rounded-xl object-cover border border-stone-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                                {item.subjectName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                                {item.subjectName}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                                <span className="capitalize px-1.5 py-0.2 rounded bg-stone-800 text-stone-300">
                                  {item.sourceType === 'camera' ? 'Kamera' : item.sourceType === 'manual' ? 'Manual' : 'Sampel'}
                                </span>
                                {item.palmAnalysis && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    +Telapak
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Tanggal & Hijriah */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="text-stone-200 block font-medium">
                              {new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span className="text-[10px] text-amber-400 font-arabic block">
                              {hijri.formatted}
                            </span>
                          </div>
                        </td>

                        {/* 3. Kategori Karakter (Mizaj) */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold">
                              <span className={`w-2 h-2 rounded-full ${mizajBadge.dot}`} />
                              <span className="text-stone-200">{mizajBadge.label}</span>
                              <span className="text-[10px] text-stone-400">({mizajBadge.element})</span>
                            </div>
                            {matchedProf && (
                              <span className="text-[10px] text-stone-400 block pl-1">
                                Kategori: <strong className="text-stone-300">{matchedProf.category}</strong>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Tingkat Kecocokan & Keseimbangan */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isMuTadil 
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80' 
                                  : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                              }`}>
                                {isMuTadil ? "Mu'tadil (Seimbang)" : "Ghairu Mu'tadil"}
                              </span>
                              <span className="font-mono text-xs font-bold text-stone-200">
                                {maxScore}%
                              </span>
                            </div>
                            <div className="w-24 bg-stone-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isMuTadil ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${maxScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. Akurasi Firasat */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono font-bold text-emerald-300 text-xs">
                              {avgConfidence}%
                            </span>
                          </div>
                        </td>

                        {/* 6. Tindakan */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                onSelectResult(item);
                              }}
                              title="Lihat Rincian Analisis"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                generateFirasatPDF(item);
                              }}
                              title="Unduh Laporan PDF Naskah Klasik"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                setShareTargetResult(item);
                              }}
                              title="Bagikan Kartu Karakter"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                setDeleteTarget({
                                  type: 'history',
                                  id: item.id,
                                  name: item.subjectName,
                                  subInfo: `${item.dominantMizaj.toUpperCase()} • ${new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} • ${toHijri(item.timestamp).formatted}`
                                });
                              }}
                              title="Hapus Rekaman Analisis"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            
            /* ========================================================= */
            /* CARD VIEW: EXPANDED CARDS WITH ACCENTS & METADATA         */
            /* ========================================================= */
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const mizajBadge = getMizajBadge(item.dominantMizaj);
                const matchedProf = profiles.find(p => p.id === item.profileId);
                const hijri = toHijri(item.timestamp);
                const maxScore = Math.max(
                  item.mizajScores?.sanguinis || 0,
                  item.mizajScores?.koleris || 0,
                  item.mizajScores?.melankolis || 0,
                  item.mizajScores?.flegmatis || 0
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectResult(item)}
                    className="rounded-2xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/40 p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.subjectName}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-700 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                          {item.subjectName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                            {item.subjectName}
                          </h4>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${mizajBadge.color}`}>
                            {item.dominantMizaj} ({maxScore}%)
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium">
                            {item.iTidalStatus}
                          </span>
                          {matchedProf && (
                            <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.2 rounded">
                              {matchedProf.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                          {item.overallSummary?.naturalInclination || 'Karakter seimbang'}
                        </p>
                        
                        {/* Dual Date Display */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-stone-400">
                          <span>
                            {new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                          <span className="text-stone-600">•</span>
                          <span className="text-amber-400 font-medium flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            <span>{hijri.formattedWithDay}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setShareTargetResult(item);
                        }}
                        title="Bagikan Ringkasan Visual ke Media Sosial"
                        className="p-2 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          generateFirasatPDF(item);
                        }}
                        title="Unduh Laporan PDF Lengkap"
                        className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setDeleteTarget({
                            type: 'history',
                            id: item.id,
                            name: item.subjectName,
                            subInfo: `${item.dominantMizaj.toUpperCase()} • ${new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} • ${hijri.formatted}`
                          });
                        }}
                        title="Hapus Rekaman Analisis"
                        className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: RECHARTS & COMPATIBILITY VIEW                  */}
      {/* ========================================================= */}
      {subTab === 'compare' && (
        <ProfileComparisonChart
          profiles={profiles}
          history={history}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD PROFILE MODAL                                */}
      {/* ========================================================= */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100">Daftarkan Profil Subjek Baru</h3>
              </div>
              <button
                onClick={() => setShowAddProfileModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Nama Lengkap Subjek *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Al-Khawarizmi"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Kategori Hubungan
                </label>
                <select
                  value={newProfileCategory}
                  onChange={(e) => setNewProfileCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Keluarga">Keluarga</option>
                  <option value="Rekan Kerja">Rekan Kerja</option>
                  <option value="Partner Bisnis">Partner Bisnis</option>
                  <option value="Murid/Binaan">Murid / Binaan</option>
                  <option value="Sahabat">Sahabat</option>
                  <option value="Diri Sendiri">Diri Sendiri</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Interval Pemantauan Berkala
                </label>
                <select
                  value={newProfileInterval}
                  onChange={(e) => setNewProfileInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={7}>Setiap 7 Hari (Mingguan)</option>
                  <option value={14}>Setiap 14 Hari (Dua Mingguan)</option>
                  <option value={30}>Setiap 30 Hari (Bulanan)</option>
                  <option value={60}>Setiap 60 Hari (Dua Bulanan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Catatan / Konteks Awal
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan mengenai karakteristik, peran, atau tujuan pengamatan watak..."
                  value={newProfileNotes}
                  onChange={(e) => setNewProfileNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newProfileName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SHARE ANALYSIS CARD MODAL                        */}
      {/* ========================================================= */}
      {shareTargetResult && (
        <ShareAnalysisModal
          result={shareTargetResult}
          onClose={() => setShareTargetResult(null)}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: IN-APP DELETION CONFIRMATION (NO WINDOW.ALERT)   */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    Konfirmasi Hapus {deleteTarget.type === 'history' ? 'Rekaman Analisis' : 'Profil Subjek'}
                  </h3>
                  <p className="text-xs text-stone-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Details Card */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                {deleteTarget.type === 'history' ? 'Arsip Analisis Firasat' : 'Data Profil Subjek'}
              </span>
              <p className="text-sm font-bold text-stone-100">
                {deleteTarget.name}
              </p>
              {deleteTarget.subInfo && (
                <p className="text-xs text-stone-400">
                  {deleteTarget.subInfo}
                </p>
              )}
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data ini dari basis data? Rekaman akan segera dibersihkan dari penyimpanan lokal dan server.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Sheets Modal */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsModal
          isOpen={isGoogleSheetsModalOpen}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          profiles={profiles}
          history={history}
          onShowToast={(msg) => setBackupMessage({ type: 'success', text: msg })}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};
