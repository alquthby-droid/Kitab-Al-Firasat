import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Target, 
  Trophy, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  ArrowRight, 
  BookOpen, 
  Eye, 
  ShieldCheck, 
  Award, 
  Share2, 
  ChevronRight, 
  FileText,
  ScanLine,
  Zap,
  Info
} from 'lucide-react';
import { CHALLENGE_PORTRAITS, ChallengePortrait } from '../data/challengePortraits';
import { TemperamentType, FirasatAnalysisResult } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { sound } from '../services/sound';

interface ChallengeStats {
  totalRounds: number;
  correctGuesses: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
}

interface ChallengeModeProps {
  onOpenAnalysisResult: (result: FirasatAnalysisResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

const STATS_STORAGE_KEY = 'alfirasat_challenge_stats_v1';

export const ChallengeMode: React.FC<ChallengeModeProps> = ({
  onOpenAnalysisResult,
  onNavigateToTab
}) => {
  // Stats state from local storage
  const [stats, setStats] = useState<ChallengeStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STATS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      totalRounds: 0,
      correctGuesses: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0
    };
  });

  // Active portrait state
  const [currentIndex, setCurrentIndex] = useState<number>(() => 
    Math.floor(Math.random() * CHALLENGE_PORTRAITS.length)
  );
  const currentPortrait = CHALLENGE_PORTRAITS[currentIndex];

  // User Guess State
  const [selectedMizaj, setSelectedMizaj] = useState<TemperamentType | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [activeClueTab, setActiveClueTab] = useState<'dahi' | 'mata' | 'hidung' | 'bibir' | 'raut'>('dahi');

  // Save stats whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Determine Intuition Rank based on score
  const rankInfo = useMemo(() => {
    const sc = stats.totalScore;
    if (sc >= 1000) {
      return {
        title: 'Shohibul Basîrah',
        arabic: 'صَاحِبُ البَصِيرَة',
        desc: 'Tingkat Makrifat Tertinggi: Firasat tajam tembus ke lubuk karakter lahiriah.',
        color: 'from-amber-400 to-yellow-500 text-stone-950',
        badgeBorder: 'border-amber-400'
      };
    }
    if (sc >= 600) {
      return {
        title: 'Hakim al-Wujuh',
        arabic: 'حَاكِمُ الوُجُوه',
        desc: 'Pakar Firasat: Mahir memadukan dahi, sorot mata, dan proporsi kitab.',
        color: 'from-emerald-500 to-teal-600 text-white',
        badgeBorder: 'border-emerald-400'
      };
    }
    if (sc >= 300) {
      return {
        title: 'Faris al-Mizaj',
        arabic: 'فَارِسُ المِزَاج',
        desc: 'Penunggang Firasat: Kepekaan intuisi mulai selaras dengan kaidah Ar-Razi.',
        color: 'from-cyan-500 to-blue-600 text-white',
        badgeBorder: 'border-cyan-400'
      };
    }
    if (sc >= 100) {
      return {
        title: 'Thalib al-Hikmah',
        arabic: 'طَالِبُ الحِكْمَة',
        desc: 'Penuntut Hikmah: Sedang menajamkan ketelitian pengamatan organ.',
        color: 'from-amber-600 to-orange-700 text-amber-100',
        badgeBorder: 'border-amber-600'
      };
    }
    return {
      title: 'Mubtadi\' al-Firasat',
      arabic: 'مُبْتَدِئُ الفِرَاسَة',
      desc: 'Pemula Firasat: Memulai riyadhah basirah mengamati raut wajah sesama.',
      color: 'from-stone-700 to-stone-800 text-stone-200',
      badgeBorder: 'border-stone-700'
    };
  }, [stats.totalScore]);

  // Handle guessing action
  const handleSubmitGuess = () => {
    if (!selectedMizaj || isRevealed) return;

    sound.playClick();
    const isCorrect = selectedMizaj === currentPortrait.dominantMizaj;

    // Calculate score addition
    let multiplier = 1;
    if (confidenceLevel === 'high') multiplier = 2.0;
    else if (confidenceLevel === 'medium') multiplier = 1.5;
    else multiplier = 1.0;

    let roundPoints = 0;
    if (isCorrect) {
      roundPoints = Math.round(100 * multiplier);
      sound.playSuccessChime();
    } else {
      sound.playLockPing();
    }

    setStats(prev => {
      const nextCorrect = isCorrect ? prev.correctGuesses + 1 : prev.correctGuesses;
      const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const nextBest = Math.max(prev.bestStreak, nextStreak);
      const nextScore = prev.totalScore + roundPoints;

      return {
        totalRounds: prev.totalRounds + 1,
        correctGuesses: nextCorrect,
        currentStreak: nextStreak,
        bestStreak: nextBest,
        totalScore: nextScore
      };
    });

    setIsRevealed(true);
  };

  // Next Random Challenge Face
  const handleNextPortrait = () => {
    sound.playClick();
    let nextIdx = Math.floor(Math.random() * CHALLENGE_PORTRAITS.length);
    if (nextIdx === currentIndex && CHALLENGE_PORTRAITS.length > 1) {
      nextIdx = (currentIndex + 1) % CHALLENGE_PORTRAITS.length;
    }
    setCurrentIndex(nextIdx);
    setSelectedMizaj(null);
    setIsRevealed(false);
  };

  // Reset Stats
  const handleResetStats = () => {
    sound.playClick();
    const clean: ChallengeStats = {
      totalRounds: 0,
      correctGuesses: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0
    };
    setStats(clean);
  };

  const accuracyPercent = stats.totalRounds > 0 
    ? Math.round((stats.correctGuesses / stats.totalRounds) * 100) 
    : 0;

  const isGuessedCorrectly = selectedMizaj === currentPortrait.dominantMizaj;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Banner with Arabic Calligraphy & Stats Overview */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/50 via-stone-900 to-stone-950 border border-amber-500/30 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Mode Tantangan • Latih Intuisi Firasat Ar-Razi</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold font-title text-stone-100">
                Uji Ketajaman Firasat
              </h2>
              <span className="font-arabic text-amber-400 text-lg hidden sm:inline">
                امْتِحَانُ البَصِيرَةِ وَالفِرَاسَة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl leading-relaxed">
              Amati raut muka, dahi, dan sorot mata subjek. Tebak temperamen batiniah (*Mizaj*) dominannya sebelum melihat pembuktian deduksi Kitab Al-Firasat.
            </p>
          </div>

          {/* User Basirah Rank & Stats Pill Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* Rank Card */}
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                <span>Gelar Basîrah</span>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-300 truncate">{rankInfo.title}</span>
              <span className="text-[10px] font-arabic text-amber-400/80 truncate">{rankInfo.arabic}</span>
            </div>

            {/* Streak Card */}
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                <span>Runtutan (Streak)</span>
                <Flame className={`w-3.5 h-3.5 ${stats.currentStreak > 0 ? 'text-amber-400 animate-pulse' : 'text-stone-600'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-stone-100">{stats.currentStreak}x</span>
                <span className="text-[10px] text-stone-500">Rekor: {stats.bestStreak}x</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {stats.currentStreak >= 3 ? 'Sedang Menyala 🔥' : 'Tepat Berturut-turut'}
              </span>
            </div>

            {/* Accuracy Card */}
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                <span>Akurasi</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-emerald-400">{accuracyPercent}%</span>
                <span className="text-[10px] text-stone-500">({stats.correctGuesses}/{stats.totalRounds})</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">Total {stats.totalRounds} Uji</span>
            </div>

            {/* Total Points Card */}
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                <span>Skor Intuisi</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-lg font-bold text-amber-300 font-mono">{stats.totalScore} XP</span>
              <span className="text-[10px] text-stone-400">Poin Hikmah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage: Left (Face Portrait & Clues) - Right (Guessing Interface & Deduction) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Visual Portrait Card & Facial Clues (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Portrait Container with HUD reticle */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-stone-950 shadow-2xl group">
            <img 
              src={currentPortrait.imageUrl} 
              alt="Wajah Uji Firasat"
              className="w-full h-80 sm:h-96 object-cover object-center transition-transform duration-500 group-hover:scale-102"
              crossOrigin="anonymous"
            />

            {/* HUD Reticle Overlay */}
            {showHUD && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                {/* 4 Corner Crosshairs */}
                <div className="flex justify-between items-start">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                </div>

                {/* Facial Zone Indicators */}
                <div className="space-y-6">
                  {/* Forehead */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 font-mono">
                      الجبهة • DAHI
                    </span>
                  </div>

                  {/* Eyes */}
                  <div className="flex items-center justify-around px-8">
                    <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-400/40 animate-ping" />
                    <span className="text-[9px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30 font-mono">
                      العين • MATA
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-400/40 animate-ping" />
                  </div>

                  {/* Nose & Mouth */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30 font-mono">
                      الأنف • HIDUNG
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-rose-300 border border-rose-500/30 font-mono">
                      الفم • BIBIR
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>
            )}

            {/* Bottom Floating Bar on Image */}
            <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Subjek Penilaian #{currentIndex + 1}
                </span>
                <span className="text-xs font-semibold text-stone-200">
                  {currentPortrait.ageStage}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHUD(!showHUD)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                    showHUD 
                      ? 'bg-amber-500 text-stone-950 border-amber-400' 
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
                  }`}
                >
                  <ScanLine className="w-3 h-3 inline mr-1" />
                  HUD {showHUD ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            </div>
          </div>

          {/* Observable Clues Box (Physical Signs from Kitab) */}
          <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Petunjuk Fisik Lahiriah (Kitab Al-Firasat)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">5 Parameter</span>
            </div>

            {/* Clue Tab Switchers */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800 text-[10px]">
              {(['dahi', 'mata', 'hidung', 'bibir', 'raut'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveClueTab(tab)}
                  className={`py-1 rounded-lg font-semibold uppercase transition-all cursor-pointer ${
                    activeClueTab === tab
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Clue Detail Content */}
            <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 text-xs text-stone-300 leading-relaxed min-h-[64px] flex items-center">
              <p>
                <span className="font-semibold text-amber-300 capitalize">{activeClueTab}: </span>
                {currentPortrait.observableClues[activeClueTab]}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Guessing Choice & Interactive AI Reveal (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* PHASE 1: Guessing Section (Active when NOT revealed yet) */}
          {!isRevealed ? (
            <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                    <span>Langkah 1: Tentukan Mizaj Dominan</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Pilih salah satu dari 4 temperamen batiniah sesuai ciri fisik yang tampak.
                  </p>
                </div>
              </div>

              {/* 4 Mizaj Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sanguinis */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMizaj('sanguinis');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedMizaj === 'sanguinis'
                      ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30 shadow-lg shadow-red-950/30'
                      : 'bg-stone-950/70 border-stone-800 hover:border-red-500/40 hover:bg-stone-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                      <Droplets className="w-4 h-4 text-red-500" /> Sanguinis (Damawi)
                    </span>
                    <span className="text-[10px] font-arabic text-red-300">المزاج الدموي</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Darah • Panas & Lembap. Ramah, cerdas, seimbang, diplomatis, dan berseri.
                  </p>
                  <span className="text-[9px] text-stone-500 mt-2 block font-mono">Dahi proporsional • Mata syahlah</span>
                </button>

                {/* Koleris */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMizaj('koleris');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedMizaj === 'koleris'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/30'
                      : 'bg-stone-950/70 border-stone-800 hover:border-amber-500/40 hover:bg-stone-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Flame className="w-4 h-4 text-amber-500" /> Koleris (Shafrawi)
                    </span>
                    <span className="text-[10px] font-arabic text-amber-300">المزاج الصفراوي</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Empedu Kuning • Panas & Kering. Tegas, pemberani, cepat reaktif, dan berjiwa pejuang.
                  </p>
                  <span className="text-[9px] text-stone-500 mt-2 block font-mono">Dahi berkerut tegak • Sorot singa</span>
                </button>

                {/* Melankolis */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMizaj('melankolis');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedMizaj === 'melankolis'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/30'
                      : 'bg-stone-950/70 border-stone-800 hover:border-indigo-500/40 hover:bg-stone-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                      <Mountain className="w-4 h-4 text-indigo-400" /> Melankolis (Saudawi)
                    </span>
                    <span className="text-[10px] font-arabic text-indigo-300">المزاج السوداوي</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Empedu Hitam • Dingin & Kering. Analitis, teliti, pemikir mendalam, memori kuat.
                  </p>
                  <span className="text-[9px] text-stone-500 mt-2 block font-mono">Dahi tinggi lapang • Tatap merenung</span>
                </button>

                {/* Flegmatis */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMizaj('flegmatis');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedMizaj === 'flegmatis'
                      ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/30'
                      : 'bg-stone-950/70 border-stone-800 hover:border-cyan-500/40 hover:bg-stone-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                      <Wind className="w-4 h-4 text-cyan-400" /> Flegmatis (Balghami)
                    </span>
                    <span className="text-[10px] font-arabic text-cyan-300">المزاج البلغمي</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Lendir / Flegma • Dingin & Lembap. Penyabar, pemaaf, cinta damai, santai, dan stabil.
                  </p>
                  <span className="text-[9px] text-stone-500 mt-2 block font-mono">Mata santai teduh • Bibir lembut</span>
                </button>
              </div>

              {/* Confidence Level Selector */}
              <div className="border-t border-stone-800 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tingkat Keyakinan Intuisi Firasat:</span>
                  </span>
                  <span className="text-amber-400 font-mono text-[11px]">
                    {confidenceLevel === 'high' ? 'Pengganda Skor x2.0' : confidenceLevel === 'medium' ? 'Pengganda Skor x1.5' : 'Pengganda Skor x1.0'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfidenceLevel('high')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      confidenceLevel === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    Yakin Penuh (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfidenceLevel('medium')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      confidenceLevel === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    Cukup Yakin (75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfidenceLevel('low')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      confidenceLevel === 'low'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    Mencoba (50%)
                  </button>
                </div>
              </div>

              {/* Submit Guess Button */}
              <button
                type="button"
                onClick={handleSubmitGuess}
                disabled={!selectedMizaj}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Target className="w-4 h-4" />
                <span>Kunci Firasat & Buka Deduksi Kitab Al-Firasat</span>
              </button>
            </div>
          ) : (
            
            /* PHASE 2: Revealed Deduction & Pedagogical Feedback */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Outcome Banner */}
              <div className={`p-5 rounded-3xl border shadow-xl flex items-start gap-4 ${
                isGuessedCorrectly
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40'
                  : 'bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-amber-950/40'
              }`}>
                <div className="shrink-0 pt-0.5">
                  {isGuessedCorrectly ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-lg">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border bg-black/40">
                      {isGuessedCorrectly ? 'Al-Firasah ash-Shadiqah' : 'Pelajaran Firasat'}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {isGuessedCorrectly ? `+${confidenceLevel === 'high' ? 200 : confidenceLevel === 'medium' ? 150 : 100} XP Didapatkan!` : '+0 XP'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold font-title">
                    {isGuessedCorrectly ? 'Firasat Anda Benar & Tepat!' : 'Tebakan Belum Tepat'}
                  </h3>

                  <p className="text-xs text-stone-200 leading-relaxed">
                    {isGuessedCorrectly 
                      ? `Masha Allah, intuisi Anda membaca tanda fisik ${currentPortrait.name} tepat mencerminkan temperamen ${MIZAJ_DATA[currentPortrait.dominantMizaj].indonesianName}.`
                      : `Anda menebak "${selectedMizaj ? MIZAJ_DATA[selectedMizaj].indonesianName.split(' (')[0] : ''}", namun deduksi hakiki Kitab Al-Firasat adalah "${MIZAJ_DATA[currentPortrait.dominantMizaj].indonesianName.split(' (')[0]}".`}
                  </p>
                </div>
              </div>

              {/* 4 Humors Distribution Bar Meter */}
              <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-200">
                    Proporsi 4 Cairan Tubuh (Akhlath Al-Arba'ah)
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Status: {currentPortrait.iTidalStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Sanguinis */}
                  <div className={`p-2.5 rounded-xl border ${currentPortrait.dominantMizaj === 'sanguinis' ? 'bg-red-950/50 border-red-500' : 'bg-stone-950/70 border-stone-800'}`}>
                    <div className="flex justify-between text-[11px] text-red-400 mb-1">
                      <span className="font-semibold">Sanguinis</span>
                      <span className="font-bold font-mono">{currentPortrait.mizajScores.sanguinis}%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-700" style={{ width: `${currentPortrait.mizajScores.sanguinis}%` }} />
                    </div>
                  </div>

                  {/* Koleris */}
                  <div className={`p-2.5 rounded-xl border ${currentPortrait.dominantMizaj === 'koleris' ? 'bg-amber-950/50 border-amber-500' : 'bg-stone-950/70 border-stone-800'}`}>
                    <div className="flex justify-between text-[11px] text-amber-400 mb-1">
                      <span className="font-semibold">Koleris</span>
                      <span className="font-bold font-mono">{currentPortrait.mizajScores.koleris}%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${currentPortrait.mizajScores.koleris}%` }} />
                    </div>
                  </div>

                  {/* Melankolis */}
                  <div className={`p-2.5 rounded-xl border ${currentPortrait.dominantMizaj === 'melankolis' ? 'bg-indigo-950/50 border-indigo-500' : 'bg-stone-950/70 border-stone-800'}`}>
                    <div className="flex justify-between text-[11px] text-indigo-400 mb-1">
                      <span className="font-semibold">Melankolis</span>
                      <span className="font-bold font-mono">{currentPortrait.mizajScores.melankolis}%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${currentPortrait.mizajScores.melankolis}%` }} />
                    </div>
                  </div>

                  {/* Flegmatis */}
                  <div className={`p-2.5 rounded-xl border ${currentPortrait.dominantMizaj === 'flegmatis' ? 'bg-cyan-950/50 border-cyan-500' : 'bg-stone-950/70 border-stone-800'}`}>
                    <div className="flex justify-between text-[11px] text-cyan-400 mb-1">
                      <span className="font-semibold">Flegmatis</span>
                      <span className="font-bold font-mono">{currentPortrait.mizajScores.flegmatis}%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${currentPortrait.mizajScores.flegmatis}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pedagogical Reasoning: Mengapa Subjek Ini Bertemperamen Tersebut? */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/20 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Mengapa {currentPortrait.name} Bertemperamen {MIZAJ_DATA[currentPortrait.dominantMizaj].indonesianName.split(' (')[0]}?
                    </h4>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {currentPortrait.pedagogicalReasoning.kitabChapter}
                  </span>
                </div>

                <p className="text-xs text-stone-200 leading-relaxed font-medium">
                  {currentPortrait.pedagogicalReasoning.coreConcept}
                </p>

                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/20 space-y-1.5 text-center">
                  <p className="font-arabic text-amber-200 text-sm sm:text-base leading-relaxed">
                    "{currentPortrait.pedagogicalReasoning.arabicQuote}"
                  </p>
                  <p className="text-stone-300 text-[11px] italic">
                    "{currentPortrait.pedagogicalReasoning.quoteTranslation}"
                  </p>
                </div>

                <div className="text-[11px] text-stone-400 bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                  <span className="text-amber-400 font-semibold">Dinamika Cairan Humor: </span>
                  {currentPortrait.pedagogicalReasoning.humorDynamics}
                </div>
              </div>

              {/* Action Buttons: Next Portrait or View Full PDF Report */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextPortrait}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Tantangan Wajah Berikutnya (Acak)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAnalysisResult(currentPortrait.fullAnalysisResult)}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Buka Lembar Laporan & Ekspor PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Box & Reset Option */}
      <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Mode Tantangan bertujuan mengasah ketajaman mata batin (*al-firasah al-imananyyah*) tanpa prasangka su'udzon, mengacu pada nasihat Imam Ar-Razi.
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetStats}
          title="Reset Akumulasi Statistik Tantangan"
          className="text-[11px] text-stone-500 hover:text-stone-300 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Statistik</span>
        </button>
      </div>
    </div>
  );
};
