import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Copy, 
  Check, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Heart, 
  Calendar, 
  Scroll,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { DailyFirasatItem, getDailyFirasat, getRandomFirasat } from '../data/firasatOfTheDay';
import { toHijri } from '../services/hijriCalendar';
import { sound } from '../services/sound';

interface FirasatOfTheDayProps {
  onNavigateToLibrary?: (chapterId?: string) => void;
  onShowToast?: (msg: string) => void;
  className?: string;
}

export const FirasatOfTheDay: React.FC<FirasatOfTheDayProps> = ({
  onNavigateToLibrary,
  onShowToast,
  className = ''
}) => {
  const [item, setItem] = useState<DailyFirasatItem>(() => getDailyFirasat());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fotd_collapsed') === 'true';
    }
    return false;
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const today = new Date();
  const hijri = toHijri(today);
  const gregorianStr = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleCollapse = () => {
    sound.playClick();
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('fotd_collapsed', String(next));
  };

  const handleShuffle = () => {
    sound.playClick();
    if (isPlayingAudio) stopAudio();
    const nextItem = getRandomFirasat(item.id);
    setItem(nextItem);
    if (onShowToast) {
      onShowToast(`Kutipan Kitab berganti: ${nextItem.topic}`);
    }
  };

  const handleResetToToday = () => {
    sound.playClick();
    if (isPlayingAudio) stopAudio();
    const todayItem = getDailyFirasat();
    setItem(todayItem);
    if (onShowToast) {
      onShowToast('Menampilkan kembali Firasat of the Day hari ini.');
    }
  };

  const handleCopy = () => {
    sound.playClick();
    const fullText = `"${item.indonesianTranslation}"\n\n— Teks Asli:\n${item.arabicText}\n\nKarya: Imam Fakhruddin Ar-Razi (Kitab Al-Firasat)\nTopik: ${item.topic}\nBab: ${item.chapter}\n\nHikmah: ${item.keyInsight}\nRiyadhah: ${item.spiritualRiyadhah}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      if (onShowToast) {
        onShowToast('Kutipan Firasat of the Day berhasil disalin ke clipboard!');
      }
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleAudio = () => {
    sound.playClick();
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onShowToast) onShowToast('Fitur suara tidak didukung di peramban ini.');
      return;
    }

    window.speechSynthesis.cancel();

    const narrationText = `Firasat Hari Ini. ${item.topic}. ${item.indonesianTranslation}. Pelajaran berharga: ${item.keyInsight}. Amalan riyadhah: ${item.spiritualRiyadhah}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-stone-900/90 to-stone-950 shadow-xl shadow-amber-950/20 backdrop-blur-md transition-all duration-300 ${className}`}>
      
      {/* Decorative Classical Arabesque Accent Lines */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-amber-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner shadow-amber-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Firasat of the Day
              </span>
              <span className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 inline" />
                <span>{hijri.formatted}</span>
                <span className="text-stone-500 hidden sm:inline">• {gregorianStr}</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-title text-stone-100 mt-0.5 flex items-center gap-2">
              <span>{item.topic}</span>
            </h3>
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* TTS Audio Player */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? 'Hentikan pembacaan audio' : 'Dengarkan pembacaan teks (TTS)'}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isPlayingAudio 
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30 animate-pulse'
                : 'text-amber-300/80 hover:text-amber-200 hover:bg-stone-800/60 border border-amber-500/20'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Shuffle / Random Excerpt */}
          <button
            type="button"
            onClick={handleShuffle}
            title="Acak dan baca cuplikan naskah Al-Firasat lainnya"
            className="p-2 rounded-xl text-amber-300/80 hover:text-amber-200 hover:bg-stone-800/60 border border-amber-500/20 transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Copy Quote */}
          <button
            type="button"
            onClick={handleCopy}
            title="Salin kutipan & terjemahan ke papan klip"
            className="p-2 rounded-xl text-amber-300/80 hover:text-amber-200 hover:bg-stone-800/60 border border-amber-500/20 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Collapse / Expand Card */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Buka cuplikan lengkap' : 'Perkecil tampilan'}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {!isCollapsed && (
        <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
          
          {/* Classical Arabic Quotation Callout */}
          <div className="relative p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-right space-y-3 shadow-inner">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-400 block font-mono text-left">
              — Naskah Asli Kitab Al-Firasat (Imam Fakhruddin Ar-Razi):
            </span>

            <p className="font-arabic text-lg sm:text-2xl text-amber-200 leading-loose tracking-wide dir-rtl select-text">
              {item.arabicText}
            </p>

            <div className="pt-2 border-t border-amber-800/30 text-left">
              <p className="text-xs sm:text-sm text-stone-200 font-serif italic leading-relaxed">
                "{item.indonesianTranslation}"
              </p>
            </div>
          </div>

          {/* Key Insight & Spiritual Riyadhah Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Box 1: Hikmah & Analisis Kitab */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Hikmah Fisiognomi & Akal Budi</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {item.keyInsight}
              </p>
            </div>

            {/* Box 2: Riyadhah & Tazkiyatun Nafs */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Amalan Riyadhah Hari Ini</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {item.spiritualRiyadhah}
              </p>
            </div>
          </div>

          {/* Footer Metadata & Navigation Link to Kitab Library */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs text-stone-400 border-t border-stone-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-stone-400">
                Sumber: <strong className="text-stone-200 font-medium">{item.chapter}</strong>
              </span>
              {item.organBadge && (
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-amber-300 font-medium">
                  {item.organBadge}
                </span>
              )}
              {item.mizajBadge && (
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-emerald-300 font-medium">
                  {item.mizajBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetToToday}
                title="Kembalikan ke kutipan hari ini"
                className="px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Hari Ini</span>
              </button>

              {onNavigateToLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onNavigateToLibrary(item.chapterId);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pelajari di Perpustakaan Kitab</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Audio Speaking Wave Indicator */}
      {isPlayingAudio && (
        <div className="px-5 py-2 bg-amber-500/15 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="font-semibold text-[11px]">Sedang membacakan naskah Firasat of the Day...</span>
          </div>
          <button
            onClick={stopAudio}
            className="text-[11px] underline font-bold hover:text-amber-100 cursor-pointer"
          >
            Hentikan Audio
          </button>
        </div>
      )}
    </div>
  );
};
