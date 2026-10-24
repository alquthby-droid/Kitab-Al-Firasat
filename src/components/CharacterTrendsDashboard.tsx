import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Calendar,
  User,
  Sliders,
  Volume2,
  VolumeX,
  PlusCircle,
  Sparkles,
  BookOpen,
  Scale,
  Award,
  ChevronRight,
  Info,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Flame,
  Wind,
  Droplets,
  Mountain,
  Compass
} from 'lucide-react';
import { SubjectProfile, FirasatAnalysisResult, TemperamentType } from '../types/firasat';
import { sound } from '../services/sound';
import { voiceReader } from '../services/voiceService';
import { saveHistory } from '../services/api';
import { MizajPredictiveAnalysis } from './MizajPredictiveAnalysis';

interface CharacterTrendsDashboardProps {
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
  onSelectResult?: (result: FirasatAnalysisResult) => void;
  onRefreshData?: () => void;
}

type TrendMetricMode = 'mizaj' | 'itidal' | 'traits';

export const CharacterTrendsDashboard: React.FC<CharacterTrendsDashboardProps> = ({
  profiles,
  history,
  onSelectResult,
  onRefreshData
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profiles.length > 0 ? profiles[0].id : 'all'
  );
  const [dashboardView, setDashboardView] = useState<'history_trends' | 'predictive_forecast'>('history_trends');
  const [metricMode, setMetricMode] = useState<TrendMetricMode>('mizaj');
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New simulated scan state for quick progression testing
  const [newScanValues, setNewScanValues] = useState({
    sanguinis: 48,
    koleris: 22,
    melankolis: 18,
    flegmatis: 12,
    notes: 'Evaluasi lanjutan: Riyadhah kesabaran berhasil menekan gejolak temperamen koleris.'
  });

  // Subscribe to TTS status
  React.useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  // Filter and sort history records chronologically for the selected profile
  const filteredHistory = useMemo(() => {
    let list = [...history];
    if (selectedProfileId !== 'all') {
      list = list.filter((h) => h.profileId === selectedProfileId);
    }
    // Sort ascending by timestamp
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [history, selectedProfileId]);

  // Current selected profile metadata
  const currentProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  // Transform historical records into formatted Recharts LineChart data
  const chartData = useMemo(() => {
    return filteredHistory.map((item, index) => {
      const dateObj = new Date(item.timestamp);
      const formattedDate = dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });

      // Calculate I'tidal Index (0 - 100)
      // Ideal Mu'tadil in Ar-Razi theory has harmonious proportions near 25-35% with no single humor exceeding 50%
      const { sanguinis, koleris, melankolis, flegmatis } = item.mizajScores;
      const variance = Math.abs(sanguinis - 25) + Math.abs(koleris - 25) + Math.abs(melankolis - 25) + Math.abs(flegmatis - 25);
      const itidalScore = Math.max(30, Math.min(98, Math.round(100 - (variance * 0.7))));

      // Calculate Core Akhlak traits based on classical humoral interactions:
      // Hikmah (Wisdom): High when Melankolis + Sanguinis are balanced without excess Koleris
      const hikmah = Math.round(Math.min(96, Math.max(40, (sanguinis * 0.8) + (melankolis * 0.9) - (koleris * 0.2) + 20)));
      // Syaja'ah (Courage): High when Koleris is active and Sanguinis gives warmth
      const syajaah = Math.round(Math.min(98, Math.max(35, (koleris * 0.9) + (sanguinis * 0.5) + 15)));
      // Hilm (Forbearance / Equanimity): High when Flegmatis / moist element balances fire
      const hilm = Math.round(Math.min(95, Math.max(30, (flegmatis * 1.1) + (sanguinis * 0.5) - (koleris * 0.4) + 30)));
      // 'Iffah (Self-restraint): Discipline and control
      const iffah = Math.round(Math.min(96, Math.max(35, (itidalScore * 0.85) + (melankolis * 0.2))));
      // 'Adl (Justice / Equilibrium)
      const adl = itidalScore;

      return {
        sessionIndex: index + 1,
        sessionLabel: `Sesi ${index + 1} (${formattedDate})`,
        fullDate: dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        timestamp: item.timestamp,
        subjectName: item.subjectName,
        // Humors
        sanguinis,
        koleris,
        melankolis,
        flegmatis,
        // Keseimbangan I'tidal
        itidal: itidalScore,
        // Akhlak Dimensions
        hikmah,
        syajaah,
        hilm,
        iffah,
        adl,
        dominantMizaj: item.dominantMizaj,
        notes: item.notes || item.overallSummary?.naturalInclination || 'Observasi karakter berkala.',
        rawItem: item
      };
    });
  }, [filteredHistory]);

  // Calculate trends summary statistics (first vs latest session)
  const trendsSummary = useMemo(() => {
    if (chartData.length === 0) return null;

    const first = chartData[0];
    const latest = chartData[chartData.length - 1];

    const itidalDelta = latest.itidal - first.itidal;
    const kolerisDelta = latest.koleris - first.koleris;
    const sanguinisDelta = latest.sanguinis - first.sanguinis;
    const hilmDelta = latest.hilm - first.hilm;

    let trendDescription = '';
    let arRaziAdvice = '';

    if (itidalDelta > 5) {
      trendDescription = `Tingkat I'tidal meningkat +${itidalDelta}%, menunjukkan bahwa program pembiasaan akhlak (riyadhah) dan ketenangan mental berhasil meredam distorsi humor tubuh.`;
      arRaziAdvice = 'Pertahankan istiqamah dalam tafakkur dan interaksi santun. Karakter subjek saat ini berada pada tingkatan Al-Mizaj al-Mu\'tadil yang sangat terpuji.';
    } else if (itidalDelta < -5) {
      trendDescription = `Tingkat I'tidal menurun ${itidalDelta}%, terdapat indikasi gejolak emosional atau tekanan eksternal yang memicu ketidakseimbangan salah satu elemen.`;
      arRaziAdvice = 'Imam Fakhruddin Ar-Razi menyarankan pendinginan jiwa (tabrid), memperbanyak istirahat, serta menghindari perdebatan sengit hingga temperamen kembali tenang.';
    } else {
      trendDescription = `Karakter subjek tergolong sangat konsisten dan stabil (fluktuasi I'tidal hanya ${itidalDelta}%).`;
      arRaziAdvice = 'Konsistensi adalah modal utama bagi pembentukan reputasi luhur. Terus pantau setiap 14-30 hari sesuai kaidah pemantauan berkala.';
    }

    return {
      totalSessions: chartData.length,
      firstDate: first.fullDate,
      latestDate: latest.fullDate,
      currentItidal: latest.itidal,
      itidalDelta,
      currentDominant: latest.dominantMizaj,
      kolerisDelta,
      sanguinisDelta,
      hilmDelta,
      trendDescription,
      arRaziAdvice
    };
  }, [chartData]);

  // Audio Narrator for the Trends
  const handleToggleNarrator = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
      setIsNarrating(false);
      return;
    }

    if (!trendsSummary || chartData.length === 0) {
      voiceReader.speak('Belum ada data historis yang cukup untuk menganalisis tren perkembangan karakter subjek ini.');
      return;
    }

    const name = currentProfile?.name || 'Subjek Terpilih';
    const text = `
      Laporan Perkembangan Karakter Al-Firasat untuk ${name}.
      Berdasarkan ${trendsSummary.totalSessions} sesi observasi berkala dari tanggal ${trendsSummary.firstDate} hingga ${trendsSummary.latestDate}.
      Skor keseimbangan I'tidal saat ini berada pada angka ${trendsSummary.currentItidal} persen, dengan perubahan sebesar ${trendsSummary.itidalDelta >= 0 ? 'kenaikan plus ' + trendsSummary.itidalDelta : trendsSummary.itidalDelta} persen.
      Temperamen dominan saat ini adalah ${trendsSummary.currentDominant}.
      ${trendsSummary.trendDescription}
      Nasihat Imam Fakhruddin Ar-Razi: ${trendsSummary.arRaziAdvice}
    `;

    voiceReader.speak(text);
  };

  // Quick New Observation Simulation / Entry
  const handleAddNewObservation = async () => {
    if (!currentProfile) return;
    sound.playClick();
    setIsSubmitting(true);

    try {
      // Determine dominant humor
      const scores = {
        sanguinis: Number(newScanValues.sanguinis),
        koleris: Number(newScanValues.koleris),
        melankolis: Number(newScanValues.melankolis),
        flegmatis: Number(newScanValues.flegmatis)
      };

      let dominant: TemperamentType = 'sanguinis';
      let maxScore = scores.sanguinis;
      if (scores.koleris > maxScore) { dominant = 'koleris'; maxScore = scores.koleris; }
      if (scores.melankolis > maxScore) { dominant = 'melankolis'; maxScore = scores.melankolis; }
      if (scores.flegmatis > maxScore) { dominant = 'flegmatis'; maxScore = scores.flegmatis; }

      const newHistoryItem: FirasatAnalysisResult = {
        id: `hist-${Date.now()}`,
        profileId: currentProfile.id,
        subjectName: currentProfile.name,
        timestamp: new Date().toISOString(),
        imageUrl: currentProfile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        sourceType: 'manual',
        dominantMizaj: dominant,
        mizajScores: scores,
        iTidalStatus: dominant === 'sanguinis' ? 'Mu\'tadil (Seimbang)' : 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)',
        features: [
          {
            organ: 'Wajah & Sorot Mata',
            arabicName: 'الوجه والعين',
            observation: 'Raut wajah menunjukkan dinamika riyadhah pembiasaan karakter terbaru',
            kitabRef: 'Bab Evaluasi Berkala',
            traitIndication: 'Perubahan tabiat ke arah kestabilan',
            humorEffect: 'Penyesuaian peredaran cairan tubuh',
            confidence: 93
          }
        ],
        overallSummary: {
          primaryStrengths: ['Kemampuan adaptasi diri', 'Kesadaran introspeksi'],
          potentialWeaknesses: ['Memerlukan ketekunan istiqamah'],
          naturalInclination: `Perkembangan mutakhir menunjukkan pergeseran ke arah ${dominant}.`,
          tarjihNote: 'Sesi evaluasi berkala yang tersimpan dalam riwayat deret waktu.',
          spiritualAdvice: 'Tetap istiqamah menjaga keselarasan lahir dan batin.'
        },
        classicalQuote: {
          chapter: 'Bab I: Keseimbangan Fisik & Ruhani',
          arabicText: 'الأخلاق قابلة للتغيير بالرياضة والتدريب',
          indonesianTranslation: 'Akhlak dan tabiat dapat berubah melalui latihan disiplin dan pembiasaan diri.',
          context: 'Imam Fakhruddin Ar-Razi dalam At-Tibb Ar-Ruhani.'
        },
        notes: newScanValues.notes
      };

      await saveHistory(newHistoryItem);
      sound.playSuccess();
      setIsAddModalOpen(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to add observation session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Recharts Tooltip for rich Ar-Razi interpretations
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-stone-900/95 border border-amber-900/40 p-4 rounded-2xl shadow-2xl max-w-xs text-xs backdrop-blur-md">
          <div className="font-bold text-stone-100 flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
            <span>{label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold uppercase">
              {dataPoint.dominantMizaj}
            </span>
          </div>

          <div className="space-y-1.5 my-2">
            {payload.map((entry: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold font-title text-stone-100">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>

          {dataPoint.notes && (
            <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 italic">
              "{dataPoint.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Level Dashboard View Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90 border border-amber-900/40 p-2 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              sound.playClick();
              setDashboardView('history_trends');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              dashboardView === 'history_trends'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 shadow-md shadow-amber-900/30'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tren Riwayat Historis</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setDashboardView('predictive_forecast');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              dashboardView === 'predictive_forecast'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-stone-100 shadow-md shadow-purple-900/40'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Mizaj Predictive Analysis</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              AI Forecast
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-stone-400 pr-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {dashboardView === 'history_trends'
              ? 'Analisis deret waktu perubahan karakter aktual'
              : 'Prediksi matematis & kaidah humoral Ar-Razi 14–90 hari'}
          </span>
        </div>
      </div>

      {dashboardView === 'predictive_forecast' ? (
        <MizajPredictiveAnalysis
          profiles={profiles}
          history={history}
          initialProfileId={selectedProfileId !== 'all' ? selectedProfileId : profiles[0]?.id}
          onSelectResult={onSelectResult}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Statistik & Deret Waktu Al-Firasat</span>
                </div>
            <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
              Tren Perkembangan Karakter Subjek
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Memvisualisasikan dinamika pergeseran humor (Mizaj), tingkat keseimbangan (I'tidal), 
              dan dimensi akhlak dari waktu ke waktu berdasarkan teori transformasi karakter Imam Fakhruddin Ar-Razi.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleNarrator}
              title="Dengarkan Analisis Tren Deret Waktu (TTS)"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                isNarrating
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 animate-pulse'
                  : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border-stone-700'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isNarrating ? 'Hentikan Audio' : 'Dengarkan Tren (TTS)'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Evaluasi Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Profile Selector */}
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-stone-300">Pilih Profil Subjek:</span>
            <select
              value={selectedProfileId}
              onChange={(e) => {
                sound.playClick();
                setSelectedProfileId(e.target.value);
              }}
              className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-100 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) - {p.analysisCount} Observasi
                </option>
              ))}
              <option value="all">Semua Profil (Tren Agregat)</option>
            </select>
          </div>

          {/* Metric View Modes */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                sound.playClick();
                setMetricMode('mizaj');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metricMode === 'mizaj'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              4 Elemen Mizaj
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setMetricMode('itidal');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metricMode === 'itidal'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Indeks I'tidal
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setMetricMode('traits');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metricMode === 'traits'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              5 Dimensi Akhlak
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="rounded-3xl bg-stone-900 border border-amber-900/30 p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                {metricMode === 'mizaj' && 'Dinamika 4 Cairan Tubuh (Al-Akhlath Al-Arba\'ah)'}
                {metricMode === 'itidal' && 'Tingkat Keseimbangan & Harmonisasi Karakter (I\'tidal)'}
                {metricMode === 'traits' && 'Evolusi 5 Dimensi Akhlak Pokok Imam Ar-Razi'}
              </span>
            </div>
            <h3 className="text-lg font-bold font-title text-stone-100 mt-1">
              {currentProfile ? currentProfile.name : 'Seluruh Profil'}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-400">
            <span>
              Total Titik Observasi: <strong className="text-stone-200">{chartData.length}</strong> Sesi
            </span>
            {chartData.length > 0 && (
              <span>
                Rentang: <strong className="text-stone-200">{chartData[0].sessionLabel.split(' ')[2]?.replace('(', '') || ''} - {chartData[chartData.length - 1].sessionLabel.split(' ')[2]?.replace(')', '') || ''}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Recharts LineChart */}
        {chartData.length < 2 ? (
          <div className="py-16 text-center space-y-3">
            <Activity className="w-12 h-12 text-stone-600 mx-auto animate-pulse" />
            <h4 className="text-base font-bold text-stone-300">
              Diperlukan Minimal 2 Titik Observasi untuk Menampilkan Garis Tren
            </h4>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              Profil ini baru memiliki {chartData.length} catatan observasi. Tambahkan sesi evaluasi baru untuk melihat visualisasi garis perubahan karakter.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Sesi Evaluasi Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="sessionLabel"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 16 }}
                  formatter={(value) => <span className="text-xs text-stone-300 font-medium">{value}</span>}
                />

                {/* 1. MIZAJ HUMORS MODE */}
                {metricMode === 'mizaj' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sanguinis"
                      name="Sanguinis / Darah (Udara - Hangat Lembap)"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#f59e0b', stroke: '#1c1917', strokeWidth: 2 }}
                      activeDot={{ r: 8, stroke: '#fef3c7', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="koleris"
                      name="Koleris / Empedu Kuning (Api - Panas Kering)"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#ef4444', stroke: '#1c1917', strokeWidth: 2 }}
                      activeDot={{ r: 8, stroke: '#fee2e2', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="melankolis"
                      name="Melankolis / Empedu Hitam (Tanah - Dingin Kering)"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#1c1917', strokeWidth: 2 }}
                      activeDot={{ r: 7, stroke: '#ede9fe', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="flegmatis"
                      name="Flegmatis / Lendir (Air - Dingin Lembap)"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#06b6d4', stroke: '#1c1917', strokeWidth: 2 }}
                      activeDot={{ r: 7, stroke: '#cffafe', strokeWidth: 2 }}
                    />
                  </>
                )}

                {/* 2. ITIDAL INDEX MODE */}
                {metricMode === 'itidal' && (
                  <>
                    <ReferenceLine
                      y={75}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Batas Keseimbangan Ideal (Al-Mu\'tadil >= 75%)',
                        fill: '#10b981',
                        fontSize: 11,
                        position: 'top'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="itidal"
                      name="Indeks Keseimbangan I'tidal"
                      stroke="#10b981"
                      strokeWidth={3.5}
                      dot={{ r: 6, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                      activeDot={{ r: 9, stroke: '#a7f3d0', strokeWidth: 2 }}
                    />
                  </>
                )}

                {/* 3. AKHLAK TRAITS MODE */}
                {metricMode === 'traits' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="hikmah"
                      name="Hikmah (Daya Nalar & Kebijaksanaan)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="syajaah"
                      name="Syaja'ah (Keberanian & Daya Juang)"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f97316' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hilm"
                      name="Hilm (Ketenangan & Kesabaran)"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#14b8a6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="iffah"
                      name="'Iffah (Pengendalian Diri & Kehormatan)"
                      stroke="#ec4899"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#ec4899' }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Analytical Summary Cards */}
      {trendsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Keseimbangan Terkini */}
          <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400">Skor I'tidal Terkini</span>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                trendsSummary.itidalDelta >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {trendsSummary.itidalDelta >= 0 ? (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{trendsSummary.itidalDelta}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>{trendsSummary.itidalDelta}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-title text-emerald-400">
                {trendsSummary.currentItidal}%
              </span>
              <span className="text-xs text-stone-400">
                {trendsSummary.currentItidal >= 75 ? 'Mu\'tadil (Seimbang)' : 'Dalam Proses Penyeimbangan'}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {trendsSummary.trendDescription}
            </p>
          </div>

          {/* Card 2: Pergeseran Elemen Terbesar */}
          <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
            <span className="text-xs font-semibold text-stone-400">Dinamika Humor Dominan</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-title text-amber-400 capitalize">
                {trendsSummary.currentDominant}
              </span>
              <span className="text-xs text-stone-400">
                (Koleris {trendsSummary.kolerisDelta >= 0 ? `+${trendsSummary.kolerisDelta}%` : `${trendsSummary.kolerisDelta}%`}, Hilm {trendsSummary.hilmDelta >= 0 ? `+${trendsSummary.hilmDelta}%` : `${trendsSummary.hilmDelta}%`})
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Karakter menunjukkan respons positif terhadap kebiasaan rutin. Sinyal panas empedu mulai diimbangi oleh kelembapan sejuk.
            </p>
          </div>

          {/* Card 3: Nasihat Imam Fakhruddin Ar-Razi */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/30 via-stone-900 to-stone-900 border border-amber-900/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Tazkiyah & Riyadhah Ar-Razi</span>
            </div>
            <p className="text-xs text-amber-200/90 italic leading-relaxed">
              "{trendsSummary.arRaziAdvice}"
            </p>
            <div className="text-[11px] text-stone-400 pt-1">
              Rujukan: Kitab At-Tibb Ar-Ruhani & Kitab Al-Firasat (Pasal Al-Istiqamah)
            </div>
          </div>
        </div>
      )}

      {/* Chronological Observation Milestones */}
      <div className="rounded-3xl bg-stone-900 border border-stone-800 p-6 space-y-4">
        <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Milestone Sesi Evaluasi ({chartData.length} Catatan)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chartData.map((session, idx) => (
            <div
              key={idx}
              onClick={() => onSelectResult && onSelectResult(session.rawItem)}
              className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 hover:border-amber-700/60 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">{session.sessionLabel}</span>
                <span className="text-[11px] text-stone-400">{session.fullDate}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-300">
                  Dominan: <strong className="capitalize text-stone-100">{session.dominantMizaj}</strong>
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  I'tidal {session.itidal}%
                </span>
              </div>

              <p className="text-[11px] text-stone-400 line-clamp-2 italic">
                "{session.notes}"
              </p>

              <div className="pt-1 flex items-center justify-end text-[11px] text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>Buka Detail Sesi &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Analysis Quick Callout in Trends View */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/40 via-stone-900 to-stone-900 border border-purple-900/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <span>Ingin Memprediksi Perubahan Mizaj Subjek di Masa Depan?</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                Fitur Baru
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-xl">
              Lihat proyeksi matematis 14 hingga 90 hari ke depan, kecepatan perubahan per bulan (*velocity*),
              sistem peringatan dini gejolak emosi, serta simulasi pengaruh riyadhah (*what-if lifestyle*).
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            setDashboardView('predictive_forecast');
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-stone-100 text-xs font-bold flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <span>Buka Mizaj Predictive Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )}

      {/* Modal: Tambah Catatan Evaluasi Cepat */}
      {isAddModalOpen && currentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-amber-900/40 p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    Catat Evaluasi Lanjutan untuk {currentProfile.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Tambahkan titik observasi baru ke garis tren Recharts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-100 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Sanguinis (Udara / %)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newScanValues.sanguinis}
                    onChange={(e) => setNewScanValues({ ...newScanValues, sanguinis: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Koleris (Api / %)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newScanValues.koleris}
                    onChange={(e) => setNewScanValues({ ...newScanValues, koleris: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Melankolis (Tanah / %)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newScanValues.melankolis}
                    onChange={(e) => setNewScanValues({ ...newScanValues, melankolis: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Flegmatis (Air / %)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newScanValues.flegmatis}
                    onChange={(e) => setNewScanValues({ ...newScanValues, flegmatis: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Catatan Observasi Perilaku & Riyadhah
                </label>
                <textarea
                  rows={3}
                  value={newScanValues.notes}
                  onChange={(e) => setNewScanValues({ ...newScanValues, notes: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="Catatan perkembangan karakter subjek setelah interval pemantauan..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleAddNewObservation}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Titik Evaluasi'}</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
