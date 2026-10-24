import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { 
  Scale, 
  Users, 
  Sparkles, 
  GitCompare, 
  Info, 
  Volume2, 
  VolumeX, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Share2, 
  FileDown, 
  HeartHandshake, 
  Award, 
  BookOpen, 
  Check, 
  Brain, 
  Activity, 
  MessageSquare,
  Eye,
  EyeOff,
  Plus,
  X,
  Layers,
  SlidersHorizontal,
  BarChart2,
  AlertTriangle
} from 'lucide-react';
import { voiceReader } from '../services/voiceService';
import { sound } from '../services/sound';
import { ShareAnalysisModal } from './ShareAnalysisModal';
import { generateCompatibilityPDF, CompatibilityAnalysisData } from '../services/pdfReport';

interface ProfileComparisonChartProps {
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
  initialProfileIdA?: string;
  initialProfileIdB?: string;
}

// Distinct, high-contrast color palette for multi-profile comparison
export const PROFILE_COLOR_PALETTE = [
  { stroke: '#f59e0b', fill: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Emas / Amber' },
  { stroke: '#6366f1', fill: '#6366f1', text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', label: 'Indigo' },
  { stroke: '#10b981', fill: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Zamrud' },
  { stroke: '#f43f5e', fill: '#f43f5e', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Mawar' },
  { stroke: '#06b6d4', fill: '#06b6d4', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Sian' },
  { stroke: '#a855f7', fill: '#a855f7', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Ungu' },
];

export const ProfileComparisonChart: React.FC<ProfileComparisonChartProps> = ({
  profiles,
  history,
  initialProfileIdA,
  initialProfileIdB
}) => {
  // Multi-profile selection state (support 2 to 6+ profiles)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(() => {
    const list: string[] = [];
    if (initialProfileIdA && profiles.some(p => p.id === initialProfileIdA)) {
      list.push(initialProfileIdA);
    }
    if (initialProfileIdB && profiles.some(p => p.id === initialProfileIdB) && !list.includes(initialProfileIdB)) {
      list.push(initialProfileIdB);
    }
    // Default to first 2 or 3 profiles if available
    if (list.length < 2) {
      profiles.slice(0, Math.min(3, profiles.length)).forEach(p => {
        if (!list.includes(p.id)) list.push(p.id);
      });
    }
    return list;
  });

  // Track visibility toggles for each profile on the charts
  const [hiddenProfileIds, setHiddenProfileIds] = useState<Set<string>>(new Set());
  
  // Highlighted profile on radar chart hover
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  // Tab view: 'charts' (Grafik Recharts) vs 'compatibility' (Analisis Kecocokan 2 Profil) vs 'both'
  const [viewMode, setViewMode] = useState<'charts' | 'compatibility' | 'both'>('charts');
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');
  const [radarDimensionType, setRadarDimensionType] = useState<'6_dimensions' | '4_mizaj'>('6_dimensions');
  const [showBenchmarkAverage, setShowBenchmarkAverage] = useState<boolean>(true);
  const [radarFillOpacity, setRadarFillOpacity] = useState<number>(0.25);
  
  // Audio narration & PDF export states
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [shareModalResult, setShareModalResult] = useState<FirasatAnalysisResult | null>(null);

  // Subscribe to TTS voice reader
  useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  // Helper to estimate 6 psychological dimensions from physical features & Mizaj
  const calculateDimensions = (scan: FirasatAnalysisResult | undefined) => {
    if (!scan) {
      return { nalar: 50, keberanian: 50, memori: 50, tuturKata: 50, empati: 50, kestabilan: 50 };
    }
    const { sanguinis = 25, koleris = 25, melankolis = 25, flegmatis = 25 } = scan.mizajScores || {};
    
    // Nalar: weighted by dahi observation + sanguinis + melankolis
    const nalar = Math.min(95, Math.round(sanguinis * 0.8 + melankolis * 0.7 + 20));
    // Keberanian: weighted by koleris + sanguinis (jantung/dada)
    const keberanian = Math.min(95, Math.round(koleris * 0.9 + sanguinis * 0.4 + 15));
    // Memori & Ketelitian: weighted by melankolis (al-quwwah al-hafizhah)
    const memori = Math.min(95, Math.round(melankolis * 1.0 + 20));
    // Kelancaran Tutur Kata: weighted by sanguinis (fasih al-lisan)
    const tuturKata = Math.min(95, Math.round(sanguinis * 0.9 + 25));
    // Empati & Kelembutan: weighted by flegmatis (al-hilm)
    const empati = Math.min(95, Math.round(flegmatis * 1.0 + 15));
    // Kestabilan Emosi: higher if status is Mu'tadil
    const isMuTadil = scan.iTidalStatus?.includes("Mu'tadil") || false;
    const kestabilan = isMuTadil ? 85 : Math.max(40, 90 - Math.abs(koleris - flegmatis));

    return { nalar, keberanian, memori, tuturKata, empati, kestabilan };
  };

  // Compile active selected profile details & scans
  const selectedProfilesData = useMemo(() => {
    return selectedProfileIds.map((id, index) => {
      const prof = profiles.find(p => p.id === id);
      const matchedScan = history.find(h => h.profileId === id);

      // Fallback pseudo scan if profile doesn't have recorded scan yet
      const scan: FirasatAnalysisResult = matchedScan || {
        id: `pseudo-${id}`,
        profileId: id,
        sourceType: 'sample',
        subjectName: prof?.name || `Subjek ${index + 1}`,
        timestamp: prof?.lastAnalysisDate || new Date().toISOString(),
        dominantMizaj: (index % 4 === 0 ? 'sanguinis' : index % 4 === 1 ? 'koleris' : index % 4 === 2 ? 'melankolis' : 'flegmatis') as any,
        mizajScores: {
          sanguinis: index % 4 === 0 ? 45 : 20,
          koleris: index % 4 === 1 ? 45 : 25,
          melankolis: index % 4 === 2 ? 45 : 20,
          flegmatis: index % 4 === 3 ? 45 : 25
        },
        iTidalStatus: "Mu'tadil (Seimbang)",
        features: [],
        overallSummary: {
          naturalInclination: prof?.notes || 'Karakter seimbang dengan adaptabilitas tinggi dan keluhuran budi.',
          primaryStrengths: ['Komunikatif', 'Fleksibel', 'Kecerdasan Diplomasi'],
          potentialWeaknesses: ['Perlu fokus tujuan jangka panjang'],
          tarjihNote: 'Sinyal seimbang berdasarkan pengamatan fisiognomi.',
          spiritualAdvice: 'Pertahankan wirid tafakkur dan zikir.'
        },
        classicalQuote: {
          chapter: 'Bab I: Tanda-tanda Kepribadian Ideal',
          arabicText: 'إن كان حسن الشكل كان معتدل المزاج فصاحبه نبيل النفس',
          indonesianTranslation: 'Jika bentuk fisiknya serasi, maka jiwanya luhur.',
          context: 'Imam Fakhruddin Ar-Razi'
        }
      } as FirasatAnalysisResult;

      const dimensions = calculateDimensions(scan);
      const colorScheme = PROFILE_COLOR_PALETTE[index % PROFILE_COLOR_PALETTE.length];

      return {
        id,
        name: prof?.name || scan.subjectName,
        category: prof?.category || 'Umum',
        scan,
        dimensions,
        color: colorScheme,
        index
      };
    });
  }, [selectedProfileIds, profiles, history]);

  // Handle Profile Selection toggle
  const handleToggleProfile = (profId: string) => {
    sound.playClick();
    setSelectedProfileIds(prev => {
      if (prev.includes(profId)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter(id => id !== profId);
      } else {
        if (prev.length >= 6) {
          // Limit to max 6 simultaneous profiles for clarity
          return [...prev.slice(1), profId];
        }
        return [...prev, profId];
      }
    });
  };

  const handleSelectAllProfiles = () => {
    sound.playClick();
    setSelectedProfileIds(profiles.slice(0, 6).map(p => p.id));
  };

  const handleToggleVisibility = (profId: string) => {
    sound.playClick();
    setHiddenProfileIds(prev => {
      const next = new Set(prev);
      if (next.has(profId)) next.delete(profId);
      else next.add(profId);
      return next;
    });
  };

  // Profiles visible on the chart (not hidden)
  const visibleProfiles = useMemo(() => {
    return selectedProfilesData.filter(p => !hiddenProfileIds.has(p.id));
  }, [selectedProfilesData, hiddenProfileIds]);

  // RADAR CHART DATA: 6 Dimensions
  const radarData6Dimensions = useMemo(() => {
    const dimensions = [
      { key: 'nalar', label: 'Nalar & Daya Analisis', arabic: 'العقل والمنطق' },
      { key: 'keberanian', label: 'Keberanian & Inisiatif', arabic: 'الشجاعة والإقدام' },
      { key: 'memori', label: 'Memori & Ketelitian', arabic: 'الحفظ والضبط' },
      { key: 'tuturKata', label: 'Tutur Kata & Diplomasi', arabic: 'الفصاحة والبيان' },
      { key: 'empati', label: 'Empati & Kesabaran', arabic: 'الحلم والمداراة' },
      { key: 'kestabilan', label: 'Kestabilan Emosi', arabic: 'الاعتدال والوقار' }
    ];

    return dimensions.map(dim => {
      const row: Record<string, any> = {
        dimension: dim.label,
        arabic: dim.arabic,
        key: dim.key
      };

      let sum = 0;
      let count = 0;
      visibleProfiles.forEach(p => {
        const val = p.dimensions[dim.key as keyof typeof p.dimensions] || 50;
        row[p.id] = val;
        sum += val;
        count++;
      });

      row['benchmark_avg'] = count > 0 ? Math.round(sum / count) : 50;
      return row;
    });
  }, [visibleProfiles]);

  // RADAR CHART DATA: 4 Mizaj
  const radarData4Mizaj = useMemo(() => {
    const mizajAxes = [
      { key: 'sanguinis', label: 'Sanguinis (Udara / Darah)', arabic: 'الدموي (الحار الرطب)', element: 'Panas & Lembap' },
      { key: 'koleris', label: 'Koleris (Api / Empedu Kuning)', arabic: 'الصفراوي (الحار اليابس)', element: 'Panas & Kering' },
      { key: 'melankolis', label: 'Melankolis (Tanah / Empedu Hitam)', arabic: 'السوداوي (البارد اليابس)', element: 'Dingin & Kering' },
      { key: 'flegmatis', label: 'Flegmatis (Air / Dahak)', arabic: 'البلغمي (البارد الرطب)', element: 'Dingin & Lembap' }
    ];

    return mizajAxes.map(axis => {
      const row: Record<string, any> = {
        dimension: axis.label,
        arabic: axis.arabic,
        element: axis.element,
        key: axis.key
      };

      let sum = 0;
      let count = 0;
      visibleProfiles.forEach(p => {
        const score = p.scan?.mizajScores?.[axis.key as keyof typeof p.scan.mizajScores] || 25;
        row[p.id] = score;
        sum += score;
        count++;
      });

      row['benchmark_avg'] = count > 0 ? Math.round(sum / count) : 25;
      return row;
    });
  }, [visibleProfiles]);

  const activeRadarData = radarDimensionType === '6_dimensions' ? radarData6Dimensions : radarData4Mizaj;

  // BAR CHART DATA: Grouped by 4 Mizaj
  const barData = useMemo(() => {
    const mizajTypes = [
      { key: 'sanguinis', label: 'Sanguinis (Udara)', arabic: 'الدموي', quality: 'Panas & Lembap' },
      { key: 'koleris', label: 'Koleris (Api)', arabic: 'الصفراوي', quality: 'Panas & Kering' },
      { key: 'melankolis', label: 'Melankolis (Tanah)', arabic: 'السوداوي', quality: 'Dingin & Kering' },
      { key: 'flegmatis', label: 'Flegmatis (Air)', arabic: 'البلغمي', quality: 'Dingin & Lembap' }
    ];

    return mizajTypes.map(m => {
      const row: Record<string, any> = {
        mizaj: m.label,
        arabic: m.arabic,
        quality: m.quality
      };

      visibleProfiles.forEach(p => {
        row[p.id] = p.scan?.mizajScores?.[m.key as keyof typeof p.scan.mizajScores] || 25;
      });

      return row;
    });
  }, [visibleProfiles]);

  // COLLECTIVE TEAM / GROUP DYNAMICS ANALYSIS (When >= 3 profiles or multi-profile)
  const teamDynamics = useMemo(() => {
    if (selectedProfilesData.length < 2) return null;

    const count = selectedProfilesData.length;
    let totalSang = 0, totalChol = 0, totalMelan = 0, totalPhleg = 0;
    const dominantCounts: Record<string, number> = { sanguinis: 0, koleris: 0, melankolis: 0, flegmatis: 0 };

    selectedProfilesData.forEach(p => {
      const scores = p.scan.mizajScores || { sanguinis: 25, koleris: 25, melankolis: 25, flegmatis: 25 };
      totalSang += scores.sanguinis;
      totalChol += scores.koleris;
      totalMelan += scores.melankolis;
      totalPhleg += scores.flegmatis;
      dominantCounts[p.scan.dominantMizaj || 'sanguinis'] = (dominantCounts[p.scan.dominantMizaj || 'sanguinis'] || 0) + 1;
    });

    const avgSang = Math.round(totalSang / count);
    const avgChol = Math.round(totalChol / count);
    const avgMelan = Math.round(totalMelan / count);
    const avgPhleg = Math.round(totalPhleg / count);

    // Identify dominant element
    const maxScore = Math.max(avgSang, avgChol, avgMelan, avgPhleg);
    let teamArchetype = 'Tim Harmonis Seimbang (Al-Mizaj al-Mu\'tadil)';
    let teamDescription = 'Kelompok ini memiliki percampuran 4 elemen yang saling mengisi tanpa ada ketimpangan tajam.';

    if (maxScore === avgChol) {
      teamArchetype = 'Tim Eksekutor & Penggerak Aksi (Dominasi Api / Koleris)';
      teamDescription = 'Kuat dalam kepemimpinan tegas, inisiatif cepat, dan penaklukan target besar, namun rentan gesekan internal.';
    } else if (maxScore === avgSang) {
      teamArchetype = 'Tim Kreatif & Komunikator Ulung (Dominasi Udara / Sanguinis)';
      teamDescription = 'Kaya akan inovasi, jaringan diplomasi luas, dan suasana kerja yang ceria, namun memerlukan disiplin jangka panjang.';
    } else if (maxScore === avgMelan) {
      teamArchetype = 'Tim Riset & Pengendali Mutu (Dominasi Tanah / Melankolis)';
      teamDescription = 'Sangat teliti, sistematis, dan tangguh dalam mitigasi risiko, namun perlu didorong untuk lebih berani mengambil risiko.';
    } else if (maxScore === avgPhleg) {
      teamArchetype = 'Tim Penengah & Penjaga Kestabilan (Dominasi Air / Flegmatis)';
      teamDescription = 'Penyabar, penuh empati, dan tahan banting dalam ritme maraton, namun butuh pemicu agar lebih proaktif bergerak cepat.';
    }

    // Check missing elements
    const missingElements: string[] = [];
    if (dominantCounts.koleris === 0) missingElements.push('Api (Ketegasan & Kecepatan Eksekusi)');
    if (dominantCounts.sanguinis === 0) missingElements.push('Udara (Diplomasi & Antusiasme Ide)');
    if (dominantCounts.melankolis === 0) missingElements.push('Tanah (Presisi Data & Mitigasi Risiko)');
    if (dominantCounts.flegmatis === 0) missingElements.push('Air (Ketabahan & Peredam Konflik)');

    return {
      avgSang,
      avgChol,
      avgMelan,
      avgPhleg,
      teamArchetype,
      teamDescription,
      dominantCounts,
      missingElements
    };
  }, [selectedProfilesData]);

  // PAIRWISE COMPATIBILITY (For the first two selected profiles when viewMode includes compatibility)
  const profA = selectedProfilesData[0];
  const profB = selectedProfilesData[1] || selectedProfilesData[0];

  const compData = useMemo<CompatibilityAnalysisData>(() => {
    if (!profA || !profB) {
      return {
        overallPercentage: 85,
        elementHarmonyScore: 85,
        intellectHarmonyScore: 85,
        emotionalBalanceScore: 85,
        partnershipSynergyScore: 85,
        harmonyStatus: 'Keselarasan Tinggi',
        arabicStatus: 'تَوَافُقٌ قَوِيٌّ',
        summaryTitle: 'Sinergi Tabiat',
        summaryBody: 'Kombinasi serasi.',
        partnershipTip: 'Saling melengkapi peran.',
        communicationTip: 'Jaga kehangatan komunikasi.',
        tarjihPrinciple: 'Gunakan musyawarah.'
      };
    }

    const mA = profA.scan.dominantMizaj || 'sanguinis';
    const mB = profB.scan.dominantMizaj || 'koleris';

    let elementScore = 78;
    if ((mA === 'koleris' && mB === 'flegmatis') || (mA === 'flegmatis' && mB === 'koleris')) {
      elementScore = 95; // Fire + Water ideal temperance
    } else if ((mA === 'sanguinis' && mB === 'melankolis') || (mA === 'melankolis' && mB === 'sanguinis')) {
      elementScore = 93; // Air + Earth ideal balance
    } else if ((mA === 'koleris' && mB === 'sanguinis') || (mA === 'sanguinis' && mB === 'koleris')) {
      elementScore = 87; // Dual Hot dynamic
    } else if ((mA === 'flegmatis' && mB === 'melankolis') || (mA === 'melankolis' && mB === 'flegmatis')) {
      elementScore = 86; // Dual Cold calm
    } else if (mA === mB) {
      elementScore = 83; // Same element
    } else {
      elementScore = 80;
    }

    const nalarDiff = Math.abs(profA.dimensions.nalar - profB.dimensions.nalar);
    const commDiff = Math.abs(profA.dimensions.tuturKata - profB.dimensions.tuturKata);
    const intellectScore = Math.min(96, Math.max(68, Math.round(94 - (nalarDiff * 0.28 + commDiff * 0.22))));

    const emotionalScore = Math.min(95, Math.max(62, Math.round(
      ((profA.dimensions.keberanian + profB.dimensions.empati) / 2) * 0.45 + ((profB.dimensions.keberanian + profA.dimensions.empati) / 2) * 0.45 + 10
    )));

    const memoriSynergy = Math.round((profA.dimensions.memori + profB.dimensions.memori) / 2);
    const stabilitySynergy = Math.round((profA.dimensions.kestabilan + profB.dimensions.kestabilan) / 2);
    const partnershipScore = Math.min(96, Math.max(66, Math.round(memoriSynergy * 0.4 + stabilitySynergy * 0.4 + 18)));

    const overallPercentage = Math.round(
      elementScore * 0.35 +
      intellectScore * 0.25 +
      emotionalScore * 0.20 +
      partnershipScore * 0.20
    );

    let harmonyStatus = "Keselarasan Sangat Tinggi (Sinergi Sempurna Al-Akhlath)";
    let arabicStatus = "تَوَافُقٌ مُمْتَازٌ (Tawafuq Mumtaz)";
    if (overallPercentage >= 88) {
      harmonyStatus = "Keselarasan Sangat Tinggi (Sinergi Sempurna Al-Akhlath)";
      arabicStatus = "تَوَافُقٌ مُمْتَازٌ (Tawafuq Mumtaz)";
    } else if (overallPercentage >= 78) {
      harmonyStatus = "Keselarasan Tinggi (Saling Melengkapi & Menyeimbangkan)";
      arabicStatus = "تَوَافُقٌ قَوِيٌّ (Tawafuq Qawiy)";
    } else if (overallPercentage >= 70) {
      harmonyStatus = "Keselarasan Sedang (Harmonis dengan Penyesuaian Ritme)";
      arabicStatus = "تَوَافُقٌ مُعْتَدِلٌ (Tawafuq Mu'tadil)";
    } else {
      harmonyStatus = "Keselarasan Terbatas (Perlu Pihak Penengah / Tarjih)";
      arabicStatus = "يَحْتَاجُ إِلَى تَرْجِيحٍ (Yahtaj ila Tarjih)";
    }

    return {
      overallPercentage,
      harmonyStatus,
      arabicStatus,
      elementHarmonyScore: elementScore,
      intellectHarmonyScore: intellectScore,
      emotionalBalanceScore: emotionalScore,
      partnershipSynergyScore: partnershipScore,
      summaryTitle: `Sinergi Tabiat ${mA.toUpperCase()} & ${mB.toUpperCase()}`,
      summaryBody: `Analisis perpaduan karakter antara ${profA.name} (${mA.toUpperCase()}) dan ${profB.name} (${mB.toUpperCase()}) berdasarkan kaidah Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi.`,
      partnershipTip: `Bagi peran kerja secara spesifik agar potensi keahlian saling melengkapi.`,
      communicationTip: `Hargai perbedaan kecepatan bicara dan proses berpikir fitrah masing-masing subjek.`,
      tarjihPrinciple: `Jika terjadi perselisihan pendapat, utamakan fakta data nyata dan dengarkan dengan adab sebelum mengambil keputusan bersama.`
    };
  }, [profA, profB]);

  // Handle PDF Export
  const handleExportPDF = async () => {
    sound.playClick();
    setIsExportingPDF(true);
    try {
      const rawProfA: SubjectProfile = profiles.find(p => p.id === profA.id) || {
        id: profA.id,
        name: profA.name,
        category: (profA.category as any) || 'Lainnya',
        notes: '',
        createdAt: new Date().toISOString(),
        analysisCount: 1,
        monitoringIntervalDays: 14
      };
      const rawProfB: SubjectProfile = profiles.find(p => p.id === profB.id) || {
        id: profB.id,
        name: profB.name,
        category: (profB.category as any) || 'Lainnya',
        notes: '',
        createdAt: new Date().toISOString(),
        analysisCount: 1,
        monitoringIntervalDays: 14
      };
      generateCompatibilityPDF(rawProfA, rawProfB, profA.scan, profB.scan, compData);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handle TTS Voice Narration
  const handleToggleVoice = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
      return;
    }

    const narrationScript = selectedProfilesData.length > 2 && teamDynamics
      ? `Hasil analisis perbandingan ${selectedProfilesData.length} profil subjek. Dinamika kelompok: ${teamDynamics.teamArchetype}. ${teamDynamics.teamDescription}. Rata-rata temperamen kelompok: Sanguinis ${teamDynamics.avgSang} persen, Koleris ${teamDynamics.avgChol} persen, Melankolis ${teamDynamics.avgMelan} persen, Flegmatis ${teamDynamics.avgPhleg} persen.`
      : `Hasil analisis keselarasan firasat antara ${profA.name} dan ${profB.name}. Tingkat kecocokan ${compData.overallPercentage} persen. ${compData.harmonyStatus}. ${compData.summaryBody}`;

    voiceReader.speak(narrationScript);
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* HEADER BAR & MULTI-PROFILE SELECTION CONTROL PANEL        */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-amber-900/40 shadow-xl space-y-5">
        
        {/* Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-title text-stone-100">
                  Komparasi Multi-Profil & Radar Firasat
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedProfilesData.length} Profil Terpilih
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Bandingkan 2 hingga 6 profil subjek secara bersamaan dengan visualisasi Radar Chart interaktif dan Bar Chart Recharts.
              </p>
            </div>
          </div>

          {/* Action Buttons: Audio & PDF */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleToggleVoice}
              title={isNarrating ? 'Hentikan pembacaan audio' : 'Dengarkan narasi sintesis komparasi'}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isNarrating
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30 animate-pulse'
                  : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isNarrating ? 'Hentikan Suara' : 'Narasi Audio'}</span>
            </button>

            {selectedProfilesData.length === 2 && (
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                title="Unduh Laporan PDF Keselarasan Dua Profil"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPDF ? 'Menyiapkan...' : 'Laporan PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Profile Selector Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilih Profil untuk Dikomparasi (Klik untuk Menambah / Mengurangi, Maks 6):</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllProfiles}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Pilih Semua (Maks 6)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {profiles.map(p => {
              const isSelected = selectedProfileIds.includes(p.id);
              const selectedIndex = selectedProfileIds.indexOf(p.id);
              const colorScheme = isSelected ? PROFILE_COLOR_PALETTE[selectedIndex % PROFILE_COLOR_PALETTE.length] : null;

              return (
                <button
                  key={p.id}
                  onClick={() => handleToggleProfile(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? `${colorScheme?.bg} ${colorScheme?.border} ${colorScheme?.text} shadow-sm ring-1 ring-amber-500/30`
                      : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-950'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                    style={{ backgroundColor: isSelected ? colorScheme?.stroke : '#78716c' }}
                  />
                  <span>{p.name}</span>
                  <span className="text-[10px] opacity-75">({p.category})</span>
                  {isSelected && (
                    <Check className="w-3 h-3 ml-0.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Profiles Badge & Quick Legend with Visibility Toggles */}
        <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-stone-400 font-medium">Legenda Aktif di Grafik:</span>
            {selectedProfilesData.map((p) => {
              const isHidden = hiddenProfileIds.has(p.id);
              const isHovered = hoveredProfileId === p.id;

              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredProfileId(p.id)}
                  onMouseLeave={() => setHoveredProfileId(null)}
                  className={`px-2.5 py-1 rounded-xl flex items-center gap-2 border transition-all ${
                    isHidden
                      ? 'bg-stone-900 border-stone-800 text-stone-500 line-through opacity-60'
                      : `${p.color.bg} ${p.color.border} ${p.color.text} ${isHovered ? 'ring-2 ring-amber-400 scale-105' : ''}`
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: isHidden ? '#57534e' : p.color.stroke }}
                  />
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/40">
                    {p.scan.dominantMizaj}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(p.id)}
                    title={isHidden ? 'Tampilkan kembali profil ini di grafik' : 'Sembunyikan profil ini dari grafik'}
                    className="p-0.5 hover:text-white transition-colors cursor-pointer"
                  >
                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            <span>{visibleProfiles.length} dari {selectedProfilesData.length} terlihat di grafik</span>
          </div>
        </div>

        {/* View Switcher: Grafik Recharts vs Analisis Kecocokan 2 Profil vs Lengkap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-800">
          <span className="text-xs text-stone-400 font-medium">
            Pilihan Modus Tampilan:
          </span>

          <div className="flex flex-wrap items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('charts');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'charts'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Visualisasi Grafik Recharts Multi-Profil</span>
            </button>

            {selectedProfilesData.length === 2 && (
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('compatibility');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'compatibility'
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Analisis Sinergi 2 Profil (Ar-Razi)</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setViewMode('both');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Lengkap (Grafik + Analisis)</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SECTION 1: COLLECTIVE TEAM DYNAMICS (FOR 3+ PROFILES)     */}
      {/* ========================================================= */}
      {selectedProfilesData.length >= 3 && teamDynamics && (
        <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30 border border-amber-900/30 p-6 shadow-xl space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-title text-stone-100">
                  Dinamika Keseimbangan Kolektif Tim / Majelis
                </h3>
                <p className="text-xs text-stone-400">
                  Berdasarkan kaidah integrasi 4 elemen (*Al-Akhlath al-Arba'ah*) Imam Fakhruddin Ar-Razi.
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold self-start sm:self-center">
              {teamDynamics.teamArchetype}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {teamDynamics.teamDescription}
          </p>

          {/* 4 Element Collective Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Air / Sanguinis */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wind className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Udara / Darah</span>
                  <span className="text-xs font-bold text-stone-200">Sanguinis</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-sky-400 font-mono">{teamDynamics.avgSang}%</span>
                <span className="text-[10px] text-stone-500 block">{teamDynamics.dominantCounts.sanguinis} Orang</span>
              </div>
            </div>

            {/* Fire / Koleris */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Api / Empedu</span>
                  <span className="text-xs font-bold text-stone-200">Koleris</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-400 font-mono">{teamDynamics.avgChol}%</span>
                <span className="text-[10px] text-stone-500 block">{teamDynamics.dominantCounts.koleris} Orang</span>
              </div>
            </div>

            {/* Earth / Melankolis */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mountain className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Tanah / Empedu</span>
                  <span className="text-xs font-bold text-stone-200">Melankolis</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400 font-mono">{teamDynamics.avgMelan}%</span>
                <span className="text-[10px] text-stone-500 block">{teamDynamics.dominantCounts.melankolis} Orang</span>
              </div>
            </div>

            {/* Water / Flegmatis */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Air / Dahak</span>
                  <span className="text-xs font-bold text-stone-200">Flegmatis</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-400 font-mono">{teamDynamics.avgPhleg}%</span>
                <span className="text-[10px] text-stone-500 block">{teamDynamics.dominantCounts.flegmatis} Orang</span>
              </div>
            </div>
          </div>

          {/* Missing Element Warning or Advice */}
          {teamDynamics.missingElements.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Catatan Keseimbangan Ar-Razi:</strong> Kelompok ini belum memiliki perwakilan dominan unsur{' '}
                <span className="underline font-semibold">{teamDynamics.missingElements.join(', ')}</span>. Pertimbangkan memasukkan perspektif penyeimbang agar keputusan kelompok komprehensif.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Keseimbangan Sempurna:</strong> Keempat elemen alami (*Al-Akhlath al-Arba'ah*) terwakili dengan lengkap dalam kelompok ini.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: INTERACTIVE RECHARTS VISUALIZATION             */}
      {/* ========================================================= */}
      {(viewMode === 'charts' || viewMode === 'both') && (
        <div className="rounded-3xl bg-stone-900 border border-stone-800 p-5 sm:p-7 shadow-2xl space-y-5">
          
          {/* Chart Header & Interactive Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold font-title text-stone-100">
                  {chartType === 'radar' 
                    ? radarDimensionType === '6_dimensions' 
                      ? 'Radar 6 Dimensi Batiniah & Intelektual' 
                      : 'Radar 4 Unsur Mizaj Al-Akhlath'
                    : 'Grafik Batang Perbandingan 4 Unsur Mizaj'}
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {chartType === 'radar'
                  ? 'Arahkan kursor pada sudut radar atau nama profil untuk menyorot detail perbandingan individu.'
                  : 'Membandingkan persentase 4 cairan humoral secara berdampingan untuk seluruh profil yang dipilih.'}
              </p>
            </div>

            {/* Sub-Switchers & Interactive Sliders */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Chart Type Switcher: Radar vs Bar */}
              <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setChartType('radar');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartType === 'radar'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Radar Chart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setChartType('bar');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartType === 'bar'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Grafik Batang</span>
                </button>
              </div>

              {/* Radar Sub-Controls (Dimension Switcher & Benchmark Toggle) */}
              {chartType === 'radar' && (
                <>
                  <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setRadarDimensionType('6_dimensions');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        radarDimensionType === '6_dimensions'
                          ? 'bg-stone-800 text-amber-300 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      6 Dimensi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setRadarDimensionType('4_mizaj');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        radarDimensionType === '4_mizaj'
                          ? 'bg-stone-800 text-amber-300 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      4 Mizaj
                    </button>
                  </div>

                  {/* Benchmark Mean Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowBenchmarkAverage(prev => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      showBenchmarkAverage
                        ? 'bg-stone-950 border-amber-500/40 text-amber-300'
                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
                    }`}
                    title="Tampilkan garis rata-rata benchmark grup"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Rata-rata Grup</span>
                  </button>

                  {/* Opacity Selector */}
                  <select
                    value={radarFillOpacity}
                    onChange={(e) => setRadarFillOpacity(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                    title="Kecerahan warna area radar"
                  >
                    <option value={0.1}>Isi: Tipis (10%)</option>
                    <option value={0.25}>Isi: Seimbang (25%)</option>
                    <option value={0.45}>Isi: Jelas (45%)</option>
                    <option value={0}>Hanya Garis Luar</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Chart Viewport Canvas */}
          <div className="h-96 sm:h-[430px] w-full pt-2">
            {chartType === 'radar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="75%" 
                  data={activeRadarData}
                >
                  <PolarGrid stroke="#292524" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    stroke="#d6d3d1" 
                    fontSize={11}
                    tick={{ fill: '#d6d3d1', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    stroke="#57534e" 
                    fontSize={10} 
                  />

                  {/* Benchmark Average Radar Polygon (optional) */}
                  {showBenchmarkAverage && visibleProfiles.length > 1 && (
                    <Radar
                      name="Rata-rata Grup (Benchmark)"
                      dataKey="benchmark_avg"
                      stroke="#78716c"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="#78716c"
                      fillOpacity={0.08}
                      animationDuration={600}
                    />
                  )}

                  {/* Individual Profile Radar Polygons */}
                  {visibleProfiles.map((p) => {
                    const isHovered = hoveredProfileId === p.id;
                    const strokeWidth = isHovered ? 3.5 : 2;
                    const fillOpacity = isHovered 
                      ? Math.min(0.7, radarFillOpacity + 0.3) 
                      : (hoveredProfileId ? 0.05 : radarFillOpacity);

                    return (
                      <Radar
                        key={p.id}
                        name={p.name}
                        dataKey={p.id}
                        stroke={p.color.stroke}
                        strokeWidth={strokeWidth}
                        fill={p.color.fill}
                        fillOpacity={fillOpacity}
                        animationDuration={800}
                        dot={{ r: isHovered ? 4 : 2, fill: p.color.stroke }}
                      />
                    );
                  })}

                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dimItem = activeRadarData.find(d => d.dimension === label);
                        // Sort entries by score descending
                        const sortedPayload = [...payload].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

                        return (
                          <div className="rounded-2xl bg-stone-950/95 border border-amber-900/40 p-3.5 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[220px]">
                            <div className="border-b border-stone-800 pb-1.5 flex items-center justify-between gap-2">
                              <span className="font-bold text-stone-100">{label}</span>
                              {dimItem?.arabic && (
                                <span className="font-arabic text-amber-400 text-xs">{dimItem.arabic}</span>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                              {sortedPayload.map((entry: any) => {
                                const isBenchmark = entry.name?.includes('Benchmark');
                                const profileMatch = visibleProfiles.find(p => p.name === entry.name);

                                return (
                                  <div 
                                    key={entry.name}
                                    className={`flex items-center justify-between gap-3 text-xs ${
                                      isBenchmark ? 'text-stone-400 italic pt-1 border-t border-stone-800/60' : 'text-stone-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span 
                                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="font-semibold truncate max-w-[130px]">{entry.name}:</span>
                                    </div>
                                    <span className="font-mono font-bold" style={{ color: entry.color }}>
                                      {entry.value}/100
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-xs text-stone-300 font-medium">{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis 
                    dataKey="mizaj" 
                    stroke="#a8a29e" 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#a8a29e" 
                    fontSize={11} 
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-2xl bg-stone-950/95 border border-amber-900/50 p-3.5 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
                            <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-1">
                              <span className="font-bold text-stone-200">{label}</span>
                              <span className="font-arabic text-amber-400 text-sm">{item.arabic}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 block italic">Karakteristik: {item.quality}</span>
                            <div className="pt-1 space-y-1.5">
                              {payload.map((pEntry: any) => (
                                <div key={pEntry.dataKey} className="flex justify-between gap-4 font-semibold text-xs" style={{ color: pEntry.fill }}>
                                  <span>{visibleProfiles.find(p => p.id === pEntry.dataKey)?.name || pEntry.dataKey}:</span>
                                  <span>{pEntry.value}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => {
                      const matched = visibleProfiles.find(p => p.id === value);
                      return <span className="text-xs text-stone-300 font-medium">{matched?.name || value}</span>;
                    }}
                  />
                  {visibleProfiles.map((p) => (
                    <Bar
                      key={p.id}
                      dataKey={p.id}
                      fill={p.color.fill}
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Interactive Multi-Profile Comparison Table Breakdown */}
          <div className="pt-4 border-t border-stone-800">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TableSummaryIcon />
              <span>Tabel Rincian Matriks 6 Dimensi Batiniah per Profil</span>
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-950/70">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Nama Subjek</th>
                    <th className="py-3 px-3">Mizaj Dominan</th>
                    <th className="py-3 px-3 text-center">Nalar</th>
                    <th className="py-3 px-3 text-center">Keberanian</th>
                    <th className="py-3 px-3 text-center">Memori</th>
                    <th className="py-3 px-3 text-center">Tutur Kata</th>
                    <th className="py-3 px-3 text-center">Empati</th>
                    <th className="py-3 px-3 text-center">Kestabilan</th>
                    <th className="py-3 px-4">Peran Utama dalam Tim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {selectedProfilesData.map((p) => {
                    const d = p.dimensions;
                    return (
                      <tr 
                        key={p.id}
                        onMouseEnter={() => setHoveredProfileId(p.id)}
                        onMouseLeave={() => setHoveredProfileId(null)}
                        className={`transition-colors ${
                          hoveredProfileId === p.id ? 'bg-amber-500/10' : 'hover:bg-stone-900/60'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-stone-100 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color.stroke }} />
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
                            {p.scan.dominantMizaj}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{d.nalar}</td>
                        <td className="py-3 px-3 text-center font-mono">{d.keberanian}</td>
                        <td className="py-3 px-3 text-center font-mono">{d.memori}</td>
                        <td className="py-3 px-3 text-center font-mono">{d.tuturKata}</td>
                        <td className="py-3 px-3 text-center font-mono">{d.empati}</td>
                        <td className="py-3 px-3 text-center font-mono">{d.kestabilan}</td>
                        <td className="py-3 px-4 text-stone-300 font-medium">
                          {p.scan.dominantMizaj === 'koleris' ? 'Pengambil Keputusan & Aksi' :
                           p.scan.dominantMizaj === 'sanguinis' ? 'Inisiator & Komunikator' :
                           p.scan.dominantMizaj === 'melankolis' ? 'Analis Strategis & Pengawas' :
                           'Penyeimbang & Pengayom Harmoni'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: PAIRWISE COMPATIBILITY (WHEN EXACTLY 2 PROFILES) */}
      {/* ========================================================= */}
      {(viewMode === 'compatibility' || viewMode === 'both') && selectedProfilesData.length === 2 && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Main Hero Compatibility Score Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-900/40 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-800 pb-6">
              
              {/* Circular Gauge Percentage */}
              <div className="flex items-center gap-5">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#292524"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * compData.overallPercentage) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold font-title text-amber-400">
                      {compData.overallPercentage}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                      Harmoni
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Tingkat Keselarasan Dua Profil</span>
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-100">
                    {compData.harmonyStatus}
                  </h3>
                  <p className="font-arabic text-amber-300 text-sm">
                    {compData.arabicStatus}
                  </p>
                </div>
              </div>

              {/* Profiles Header Summary */}
              <div className="flex items-center gap-4 bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-300 block">{profA.name}</span>
                  <span className="text-[10px] text-stone-400 uppercase font-mono">{profA.scan.dominantMizaj}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  VS
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-300 block">{profB.name}</span>
                  <span className="text-[10px] text-stone-400 uppercase font-mono">{profB.scan.dominantMizaj}</span>
                </div>
              </div>
            </div>

            {/* 4 Pillars Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <span className="text-[10px] text-stone-400 block">Keseimbangan Elemen</span>
                <span className="text-base font-bold text-amber-400 font-mono">{compData.elementHarmonyScore}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <span className="text-[10px] text-stone-400 block">Akal & Komunikasi</span>
                <span className="text-base font-bold text-sky-400 font-mono">{compData.intellectHarmonyScore}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <span className="text-[10px] text-stone-400 block">Pengendalian Emosi</span>
                <span className="text-base font-bold text-rose-400 font-mono">{compData.emotionalBalanceScore}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <span className="text-[10px] text-stone-400 block">Sinergi Kemitraan</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{compData.partnershipSynergyScore}%</span>
              </div>
            </div>

            {/* Communication Tip & Tarjih Conflict Resolution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Kunci Komunikasi Efektif</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {compData.communicationTip}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  <span>Kaidah Tarjih Ar-Razi Saat Berselisih</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {compData.tarjihPrinciple}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Share Card Modal if active */}
      {shareModalResult && (
        <ShareAnalysisModal
          result={shareModalResult}
          onClose={() => setShareModalResult(null)}
        />
      )}

    </div>
  );
};

function TableSummaryIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
    </svg>
  );
}
