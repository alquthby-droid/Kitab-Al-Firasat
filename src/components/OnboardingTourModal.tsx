import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Camera, 
  Sliders, 
  LineChart, 
  GitCompare, 
  Database, 
  FileText, 
  Check, 
  HelpCircle,
  Bookmark,
  Share2,
  Calendar
} from 'lucide-react';
import { sound } from '../services/sound';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: 'scanner' | 'challenge' | 'manual' | 'trends' | 'compare' | 'database') => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  arabicHeader: string;
  description: string;
  icon: React.ReactNode;
  tabTarget?: 'scanner' | 'challenge' | 'manual' | 'trends' | 'compare' | 'database';
  keyHighlights: string[];
  themeColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Pemindai Wajah Cerdas & HUD Ar-Razi',
    subtitle: 'Deteksi Real-Time 3 Proporsi Wajah Klasik',
    arabicHeader: 'الفِراسَةُ وَتَقْسِيمُ الوَجْهِ',
    description: 'Pindai wajah langsung via kamera atau unggah foto untuk mendeteksi landmark dahi, mata, hidung, dan mulut sesuai pembagian 3 proporsi Imam Ar-Razi.',
    icon: <Camera className="w-7 h-7 text-amber-400" />,
    tabTarget: 'scanner',
    keyHighlights: [
      'HUD retikel sudut & panduan proporsi dahi, mata, hidung, mulut',
      'Penguncian foto aman dengan menu Hapus Lampiran yang fleksibel',
      'Analisis otomatis 4 Mizaj (Sanguinis, Koleris, Melankolis, Flegmatis)'
    ],
    themeColor: 'from-amber-500/20 to-amber-900/40'
  },
  {
    title: 'Inspeksi Fitur & Garis Telapak Tangan',
    subtitle: 'Model 3D Wajah & Firasat Garis Telapak Kanan-Kiri',
    arabicHeader: 'دَلائِلُ الأَعْضَاءِ وَخُطُوطِ الكَفَّيْنِ',
    description: 'Eksplorasi ciri anatomis wajah 3D serta analisis garis telapak tangan kanan (etos amal nyata) dan kiri (fitrah batiniah) sesuai kaidah Kitab Al-Firasat.',
    icon: <Sliders className="w-7 h-7 text-emerald-400" />,
    tabTarget: 'manual',
    keyHighlights: [
      'Model kepala 3D Three.js interaktif dengan highlight anatomi',
      'Diagram SVG interaktif telapak tangan kanan & kiri (Garis Hayah, Aql, Qalb, & Tekstur)',
      'Perhitungan proporsi Mizaj langsung (real-time live balance calculation)'
    ],
    themeColor: 'from-emerald-500/20 to-emerald-900/40'
  },
  {
    title: 'Dasbor Tren & Keseimbangan I\'tidal',
    subtitle: 'Pantau Evolusi Jiwa & Riyadhah Akhlak Berkala',
    arabicHeader: 'مِيزَانُ الاِعْتِدَالِ الرُّوحِيِّ',
    description: 'Karakter manusia bersifat dinamis dan dapat dibentuk lewat riyadhah jiwa. Amati grafik perkembangan karakter subjek dari waktu ke waktu.',
    icon: <LineChart className="w-7 h-7 text-indigo-400" />,
    tabTarget: 'trends',
    keyHighlights: [
      'Grafik Recharts multi-garis memetakan perubahan 4 cairan tubuh',
      'Indikator status I\'tidal (keseimbangan optimal ideal Ar-Razi)',
      'Statistik perubahan watak dan rekomendasi tazkiyatun nafs'
    ],
    themeColor: 'from-indigo-500/20 to-indigo-900/40'
  },
  {
    title: 'Komparasi Sinergi & Analisis Relasi',
    subtitle: 'Diagram Radar Kecocokan Watak 2 Subjek',
    arabicHeader: 'المُقَارَنَةُ وَالمُوَافَقَةُ بَيْنَ الطَّبَائِعِ',
    description: 'Bandingkan dua profil untuk melihat interaksi antar temperamen (misal Api Koleris bertemu Udara Sanguinis) beserta tips komunikasi bijak.',
    icon: <GitCompare className="w-7 h-7 text-purple-400" />,
    tabTarget: 'compare',
    keyHighlights: [
      'Visualisasi Radar Chart tumpang tindih untuk melihat selisih sifat',
      'Catatan sinergi klasik Ar-Razi untuk rumah tangga, rekan kerja, & sahabat',
      'Narator audio suara membaca rangkuman kecocokan secara otomatis'
    ],
    themeColor: 'from-purple-500/20 to-purple-900/40'
  },
  {
    title: 'Basis Data, Cadangan JSON & Kartu Karakter',
    subtitle: 'Penanggalan Hijriah, Ekspor PDF & Media Sosial',
    arabicHeader: 'حِفْظُ البَيَانَاتِ وَالتَّوْثِيقُ الإِسْلامِيُّ',
    description: 'Kelola basis data subjek dengan aman. Ekspor cadangan JSON mandiri, cetak Laporan PDF Klasik dengan tanggal Hijriah, dan buat Kartu Karakter ber-QR Code.',
    icon: <Database className="w-7 h-7 text-rose-400" />,
    tabTarget: 'database',
    keyHighlights: [
      'Ekspor dan Impor cadangan data JSON lokal secara mandiri',
      'Penanggalan Kalender Hijriah Islam terintegrasi di seluruh rekaman',
      'Laporan PDF tipografi manuskrip klasik & Kartu Karakter visual medsos'
    ],
    themeColor: 'from-rose-500/20 to-rose-900/40'
  }
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    sound.playClick();
    if (!isLast) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    sound.playSuccessChime();
    try {
      localStorage.setItem('alfirasat_onboarding_seen', 'true');
    } catch (e) {
      // ignore
    }
    onClose();
  };

  const handleTryFeature = () => {
    sound.playClick();
    if (step.tabTarget) {
      onNavigateTab(step.tabTarget);
    }
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-stone-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header Background Banner */}
        <div className={`p-6 pb-4 bg-gradient-to-br ${step.themeColor} border-b border-stone-800 transition-all duration-300 relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Panduan Fitur Utama • Langkah {currentStepIndex + 1} dari {TOUR_STEPS.length}</span>
            </div>
            
            <button
              onClick={handleComplete}
              title="Tutup Panduan"
              className="p-1.5 rounded-full bg-stone-950/50 hover:bg-stone-950 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-amber-500/30 shrink-0 shadow-lg">
              {step.icon}
            </div>
            <div className="flex-1">
              <span className="font-arabic text-amber-300/80 text-sm block mb-0.5">
                {step.arabicHeader}
              </span>
              <h2 className="text-xl font-bold font-title text-stone-100">
                {step.title}
              </h2>
              <p className="text-xs text-amber-200/90 font-medium">
                {step.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-300 leading-relaxed">
            {step.description}
          </p>

          {/* Highlights checklist */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-2.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Sorotan Kemampuan Fitur:
            </span>
            {step.keyHighlights.map((hl, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <span>{hl}</span>
              </div>
            ))}
          </div>

          {/* Direct Try Button */}
          {step.tabTarget && (
            <div className="pt-1">
              <button
                onClick={handleTryFeature}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-amber-500/60"
              >
                <span>Buka & Coba Fitur Ini Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 pt-3 bg-stone-950/70 border-t border-stone-800/80 flex items-center justify-between gap-3">
          
          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClick();
                  setCurrentStepIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-stone-700 hover:bg-stone-500'
                }`}
                aria-label={`Ke langkah ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )}

            <button
              onClick={handleComplete}
              className="px-3 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Lewati Tur
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>{isLast ? 'Mulai Eksplorasi' : 'Selanjutnya'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
