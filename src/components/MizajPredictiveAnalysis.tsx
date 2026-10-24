import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  Activity,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Wind,
  Droplets,
  Mountain,
  Compass,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Copy,
  Check,
  User,
  Zap,
  Target,
  Info
} from 'lucide-react';
import { SubjectProfile, FirasatAnalysisResult, TemperamentType } from '../types/firasat';
import {
  generateMizajPrediction,
  InterventionType,
  PredictiveAnalysisReport
} from '../services/predictiveEngine';
import { sound } from '../services/sound';
import { voiceReader } from '../services/voiceService';

interface MizajPredictiveAnalysisProps {
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
  initialProfileId?: string;
  onSelectResult?: (result: FirasatAnalysisResult) => void;
  onNavigateToManual?: () => void;
}

export const MizajPredictiveAnalysis: React.FC<MizajPredictiveAnalysisProps> = ({
  profiles,
  history,
  initialProfileId,
  onSelectResult,
  onNavigateToManual
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  );
  const [horizonDays, setHorizonDays] = useState<number>(60);
  const [intervention, setIntervention] = useState<InterventionType>('natural');
  const [chartViewMode, setChartViewMode] = useState<'mizaj' | 'itidal'>('mizaj');
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [copiedRoadmap, setCopiedRoadmap] = useState<boolean>(false);

  // Sync initialProfileId if it changes
  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId);
    }
  }, [initialProfileId]);

  // Subscribe to TTS state
  useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  // Filter history for selected profile
  const profileHistory = useMemo(() => {
    if (!selectedProfileId) return [];
    return history.filter((h) => h.profileId === selectedProfileId);
  }, [history, selectedProfileId]);

  const currentProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  // Generate Predictive Report using our mathematical & humoral engine
  const report: PredictiveAnalysisReport = useMemo(() => {
    const name = currentProfile?.name || 'Subjek Analisis';
    return generateMizajPrediction(profileHistory, name, horizonDays, intervention);
  }, [profileHistory, currentProfile, horizonDays, intervention]);

  // Audio narration
  const handleToggleAudio = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
      setIsNarrating(false);
      return;
    }

    const narrationText = `
      Laporan Analisis Prediktif Mizaj untuk ${report.profileName}.
      Berdasarkan tren historis ${report.historicalSessionsCount} sesi observasi.
      Tingkat keseimbangan I'tidal saat ini berada pada angka ${report.currentItidal} persen, dan diproyeksikan menjadi ${report.projectedItidal} persen dalam kurun waktu ${report.forecastHorizonDays} hari ke depan.
      Arah trajektori karakter adalah ${report.itidalTrajectory === 'improving' ? 'peningkatan harmoni batin' : report.itidalTrajectory === 'declining' ? 'penurunan keseimbangan' : 'sangat stabil'}.
      Temperamen yang diprediksi mendominasi adalah ${report.projectedDominant}.
      Kesimpulan Imam Fakhruddin Ar-Razi: ${report.arRaziPredictiveVerdict.summary}
      Nasihat hikmah: ${report.arRaziPredictiveVerdict.translation}
    `;

    voiceReader.speak(narrationText);
  };

  const handleCopyRoadmap = () => {
    sound.playClick();
    const text = `
=== PANDUAN PREVENTIF & ROADMAP I'TIDAL (IMAM AR-RAZI) ===
Subjek: ${report.profileName}
Proyeksi Horison: +${report.forecastHorizonDays} Hari
Skor I'tidal: ${report.currentItidal}% -> ${report.projectedItidal}% (${report.itidalTrajectory.toUpperCase()})
Temperamen Diproyeksikan: ${report.projectedDominant.toUpperCase()}

${report.preventativeRoadmap
  .map(
    (p) => `
[${p.phase}]
Fokus Akhlak: ${p.focusAkhlak}
Tindakan:
${p.recommendedActions.map((a) => `- ${a}`).join('\n')}
Pola Hidup & Nutrisi: ${p.classicalDietAndEnvironment}
`
  )
  .join('\n')}

Kutipan Klasik Kitab At-Tibb Ar-Ruhani:
"${report.arRaziPredictiveVerdict.arabicAphorism}"
(${report.arRaziPredictiveVerdict.translation})
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedRoadmap(true);
    setTimeout(() => setCopiedRoadmap(false), 2500);
  };

  // Custom Chart Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isProjected = dataPoint.isProjected;

      return (
        <div className="bg-stone-900/95 border border-amber-900/50 p-4 rounded-2xl shadow-2xl max-w-xs text-xs backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div>
              <div className="font-bold text-stone-100">{label}</div>
              <div className="text-[10px] text-stone-400">{dataPoint.dateStr}</div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isProjected
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isProjected ? 'Proyeksi Masa Depan' : 'Data Riil Aktual'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {payload.map((entry: any, i: number) => {
              if (entry.dataKey === 'itidalUpper' || entry.dataKey === 'itidalLower') return null;
              return (
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
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-stone-400">Dominan:</span>
            <span className="font-bold capitalize text-amber-400">
              {dataPoint.predictedDominant}
            </span>
          </div>

          {isProjected && (
            <div className="text-[10px] text-purple-300/80 italic pt-1">
              Tingkat keyakinan proyeksi: {dataPoint.confidenceScore}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-purple-950/30 border border-amber-900/30 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>Forecasting & Proyeksi Karakter Klasik</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100 flex items-center gap-2">
              <span>Mizaj Predictive Analysis</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Imam Ar-Razi Trajectory Engine
              </span>
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Memprediksi dinamika pergeseran humor dan keseimbangan I'tidal di masa depan berdasarkan
              kecepatan perubahan (*velocity*) riwayat observasi, dipadukan dengan kaidah disiplin akhlak
              (*At-Tibb Ar-Ruhani*).
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleAudio}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                isNarrating
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 animate-pulse'
                  : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border-stone-700'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              <span>{isNarrating ? 'Hentikan Suara' : 'Dengar Prediksi (TTS)'}</span>
            </button>

            <button
              onClick={handleCopyRoadmap}
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              {copiedRoadmap ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRoadmap ? 'Tersalin!' : 'Salin Roadmap Preventif'}</span>
            </button>
          </div>
        </div>

        {/* Profile & Parameter Controls */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Profile Picker */}
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-stone-300">Subjek:</span>
            <select
              value={selectedProfileId}
              onChange={(e) => {
                sound.playClick();
                setSelectedProfileId(e.target.value);
              }}
              className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-100 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — {p.analysisCount} Sesi Riwayat
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-stone-300">Horison Proyeksi:</span>
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              {[14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    sound.playClick();
                    setHorizonDays(days);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    horizonDays === days
                      ? 'bg-purple-600 text-stone-100 font-bold shadow-md shadow-purple-600/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  +{days} Hari
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 'What-If' Riyadhah Intervention Simulator */}
      <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Simulasi Skenario Ikhtiar & Gaya Hidup (*What-If Riyadhah*)
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">
            Karakter dapat bertransformasi melalui pembiasaan disiplin (At-Tibb Ar-Ruhani)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'natural' as InterventionType,
              title: 'Alami Organik',
              subtitle: 'Ekstrapolasi murni tren masa lalu',
              accent: 'border-stone-700 bg-stone-950/60'
            },
            {
              id: 'riyadhah_sabar' as InterventionType,
              title: 'Riyadhah Sabar',
              subtitle: 'Meredam Koleris/Api (-15%), memupuk Hilm',
              accent: 'border-emerald-500/40 bg-emerald-950/20'
            },
            {
              id: 'tafakkur_ilmu' as InterventionType,
              title: 'Tafakkur & Nalar',
              subtitle: 'Mencerahkan Melankolis (-12%), memupuk Hikmah',
              accent: 'border-blue-500/40 bg-blue-950/20'
            },
            {
              id: 'tekanan_stres' as InterventionType,
              title: 'Beban Stres Tinggi',
              subtitle: 'Lonjakan Koleris & Melankolis, I\'tidal tertekan',
              accent: 'border-rose-500/40 bg-rose-950/20'
            },
            {
              id: 'tabrid_istirahat' as InterventionType,
              title: 'Tabrid & Istirahat',
              subtitle: 'Pendinginan suhu tubuh, nutrisi sejuk (+Flegmatis)',
              accent: 'border-cyan-500/40 bg-cyan-950/20'
            }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                setIntervention(item.id);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                intervention === item.id
                  ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-900/30 ring-1 ring-purple-400'
                  : `${item.accent} hover:border-stone-600`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-stone-100">{item.title}</span>
                {intervention === item.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Forecast Chart Section */}
      <div className="rounded-3xl bg-stone-900 border border-amber-900/30 p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                {chartViewMode === 'mizaj'
                  ? 'Proyeksi 4 Cairan Tubuh (Al-Akhlath Al-Arba\'ah Forecast)'
                  : 'Proyeksi Indeks Keseimbangan I\'tidal (Equilibrium Path)'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-title text-stone-100 mt-1 flex items-center gap-2">
              <span>{report.profileName}</span>
              <span className="text-xs text-stone-400 font-normal">
                (Riwayat: {report.historicalSessionsCount} Sesi | Horison: +{report.forecastHorizonDays} Hari)
              </span>
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                sound.playClick();
                setChartViewMode('mizaj');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartViewMode === 'mizaj'
                  ? 'bg-purple-600 text-stone-100 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              4 Elemen Mizaj
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setChartViewMode('itidal');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartViewMode === 'itidal'
                  ? 'bg-purple-600 text-stone-100 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Indeks I'tidal & Koridor
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[380px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={report.timelineData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis
                dataKey="label"
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
              <Tooltip content={<CustomForecastTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => <span className="text-xs text-stone-300 font-medium">{value}</span>}
              />

              {/* Reference indicator marking present horizon */}
              <ReferenceLine
                x={report.timelineData.find((p) => !p.isProjected)?.label || 'Sesi 1'}
                stroke="#a855f7"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: 'Batas Riwayat Nyata',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'insideTopLeft'
                }}
              />

              {chartViewMode === 'mizaj' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="sanguinis"
                    name="Sanguinis / Darah (Udara)"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#1c1917', strokeWidth: 2 }}
                    strokeDasharray="4 4"
                    strokeDashoffset={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="koleris"
                    name="Koleris / Api (Panas Kering)"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#ef4444', stroke: '#1c1917', strokeWidth: 2 }}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="melankolis"
                    name="Melankolis / Tanah (Dingin Kering)"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8b5cf6', stroke: '#1c1917', strokeWidth: 2 }}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="flegmatis"
                    name="Flegmatis / Air (Dingin Lembap)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06b6d4', stroke: '#1c1917', strokeWidth: 2 }}
                    strokeDasharray="4 4"
                  />
                </>
              ) : (
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
                  <Area
                    type="monotone"
                    dataKey="itidalUpper"
                    fill="#10b981"
                    fillOpacity={0.08}
                    stroke="none"
                    name="Batas Atas Optimis"
                  />
                  <Area
                    type="monotone"
                    dataKey="itidalLower"
                    fill="#10b981"
                    fillOpacity={0.08}
                    stroke="none"
                    name="Batas Bawah Konservatif"
                  />
                  <Line
                    type="monotone"
                    dataKey="itidal"
                    name="Indeks Keseimbangan I'tidal"
                    stroke="#10b981"
                    strokeWidth={3.5}
                    dot={{ r: 6, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                    activeDot={{ r: 8, stroke: '#a7f3d0', strokeWidth: 2 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Predictive Context Footnote */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Garis putus-putus menunjukkan proyeksi matematis masa depan dengan interval kepercayaan rata-rata{' '}
              <strong className="text-stone-200">{report.confidenceScore}%</strong>.
            </span>
          </div>
          <span className="hidden sm:inline text-purple-400 font-semibold">
            {report.historicalSessionsCount < 2 ? 'Basis: 1 Sesi Awal' : `${report.historicalSessionsCount} Sesi Dihitung`}
          </span>
        </div>
      </div>

      {/* Trajectory Velocity Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {report.velocities.map((v) => {
          const isRising = v.trendDirection === 'rising';
          const isFalling = v.trendDirection === 'falling';

          return (
            <div
              key={v.humor}
              className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
                style={{ backgroundColor: v.humorColor }}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">{v.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isRising
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isFalling
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  {isRising ? (
                    <>
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+{v.monthlyDelta}%/bln</span>
                    </>
                  ) : isFalling ? (
                    <>
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{v.monthlyDelta}%/bln</span>
                    </>
                  ) : (
                    <span>Stabil</span>
                  )}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-stone-500">Saat Ini:</span>
                  <div className="text-xl font-bold font-title text-stone-200">
                    {v.currentScore}%
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-600" />
                <div className="text-right">
                  <span className="text-xs text-purple-400 font-semibold">
                    Proyeksi +{report.forecastHorizonDays}h:
                  </span>
                  <div
                    className="text-2xl font-bold font-title"
                    style={{ color: v.humorColor }}
                  >
                    {v.projectedScore}%
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed border-t border-stone-800/80 pt-2">
                {v.classicalSignificance}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Scorecard & Ar-Razi Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Prognosis I'tidal */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Prognosis Keseimbangan I'tidal
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                report.itidalTrajectory === 'improving'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : report.itidalTrajectory === 'declining'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {report.itidalTrajectory === 'improving'
                ? 'Menuju Harmoni'
                : report.itidalTrajectory === 'declining'
                ? 'Peringatan Deviasi'
                : 'Konsistensi Stabil'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-stone-400">Skor Terkini</span>
              <div className="text-3xl font-bold font-title text-stone-200">
                {report.currentItidal}%
              </div>
            </div>
            <div className="text-purple-400 font-bold text-xl">&rarr;</div>
            <div>
              <span className="text-xs text-purple-400 font-semibold">
                Proyeksi +{report.forecastHorizonDays} Hari
              </span>
              <div className="text-3xl font-bold font-title text-purple-300">
                {report.projectedItidal}%
              </div>
            </div>
          </div>

          <div className="text-xs text-stone-300 space-y-1.5 border-t border-stone-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Temperamen Dominan:</span>
              <span className="font-bold capitalize text-amber-400">
                {report.currentDominant} &rarr; {report.projectedDominant}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Estimasi Mencapai I'tidal (&ge; 75%):</span>
              <span className="font-bold text-emerald-400">
                {report.daysToOptimalItidal === 0
                  ? 'Sudah Tercapai'
                  : report.daysToOptimalItidal
                  ? `~${report.daysToOptimalItidal} Hari`
                  : 'Perlu Penguatan Riyadhah'}
              </span>
            </div>
          </div>
        </div>

        {/* Early Warning Card */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Sistem Peringatan Dini Gejolak Karakter</span>
          </div>

          {report.earlyWarnings.map((warn, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-100">{warn.title}</h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    warn.level === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : warn.level === 'elevated'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {warn.level}
                </span>
              </div>

              <div className="text-xs text-stone-300 space-y-1">
                <span className="text-[11px] text-stone-400 font-semibold">Tanda yang Perlu Diwaspadai:</span>
                <ul className="space-y-1">
                  {warn.symptoms.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-stone-300">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-amber-200/90 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                <strong>Resep Tabrid Preventif:</strong> {warn.preventativePrescription}
              </div>
            </div>
          ))}
        </div>

        {/* Kitab Ar-Razi Classical Verdict */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Kaidah Kitab At-Tibb Ar-Ruhani</span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            {report.arRaziPredictiveVerdict.summary}
          </p>

          <div className="p-3 rounded-2xl bg-stone-950/80 border border-amber-900/30 space-y-1.5">
            <div className="font-arabic text-amber-400 text-base text-right leading-loose">
              {report.arRaziPredictiveVerdict.arabicAphorism}
            </div>
            <p className="text-[11px] text-amber-200/90 italic">
              "{report.arRaziPredictiveVerdict.translation}"
            </p>
          </div>

          <div className="text-[10px] text-stone-400">
            Sumber: {report.arRaziPredictiveVerdict.sourceChapter}
          </div>
        </div>
      </div>

      {/* Preventative Action Roadmap (Fase I, II, III) */}
      <div className="rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Roadmap Preventif Pembentukan Karakter</span>
            </div>
            <h3 className="text-lg font-bold font-title text-stone-100 mt-1">
              Rencana Aksi Riyadhah Berkala Menuju I'tidal (30–90 Hari)
            </h3>
          </div>
          <button
            onClick={handleCopyRoadmap}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
          >
            {copiedRoadmap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRoadmap ? 'Tersalin' : 'Salin Petunjuk'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.preventativeRoadmap.map((phase, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {phase.targetDays}
                  </span>
                  <span className="text-[11px] font-bold text-stone-400">Langkah 0{idx + 1}</span>
                </div>

                <h4 className="text-sm font-bold text-stone-100">{phase.phase}</h4>
                <div className="text-xs font-semibold text-emerald-400">
                  Fokus: {phase.focusAkhlak}
                </div>

                <ul className="space-y-1.5 text-xs text-stone-300 pt-1">
                  {phase.recommendedActions.map((act, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
                <strong className="text-stone-300">Pola Hidup & Lingkungan:</strong> {phase.classicalDietAndEnvironment}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
