import React, { useState, useMemo } from 'react';
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
  MessageSquare
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

export const ProfileComparisonChart: React.FC<ProfileComparisonChartProps> = ({
  profiles,
  history,
  initialProfileIdA,
  initialProfileIdB
}) => {
  // Profiles selection
  const [selectedProfIdA, setSelectedProfIdA] = useState<string>(
    initialProfileIdA || profiles[0]?.id || ''
  );
  const [selectedProfIdB, setSelectedProfIdB] = useState<string>(
    initialProfileIdB || profiles[1]?.id || profiles[0]?.id || ''
  );

  // Tab view: 'compatibility' (Analisis Kecocokan) vs 'charts' (Grafik Recharts) vs 'both'
  const [viewMode, setViewMode] = useState<'compatibility' | 'charts' | 'both'>('compatibility');
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [shareModalResult, setShareModalResult] = useState<FirasatAnalysisResult | null>(null);

  // Subscribe to TTS
  React.useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  const profA = profiles.find(p => p.id === selectedProfIdA) || profiles[0];
  const profB = profiles.find(p => p.id === selectedProfIdB) || profiles[1] || profiles[0];

  // Find scan for profile or fallback
  const scanA = useMemo(() => {
    if (!profA) {
      if (history[0]) return history[0];
      return {
        id: 'default-a',
        subjectName: 'Subjek A',
        timestamp: new Date().toISOString(),
        dominantMizaj: 'sanguinis' as const,
        mizajScores: { sanguinis: 40, koleris: 25, melankolis: 20, flegmatis: 15 },
        iTidalStatus: "Mu'tadil (Seimbang)",
        overallSummary: {
          naturalInclination: 'Karakter seimbang dengan adaptabilitas tinggi dan keluhuran budi.',
          primaryStrengths: ['Komunikatif', 'Fleksibel', 'Kecerdasan Diplomasi'],
          potentialWeaknesses: ['Perlu fokus tujuan jangka panjang']
        }
      } as unknown as FirasatAnalysisResult;
    }
    const match = history.find(h => h.profileId === profA.id);
    if (match) return match;
    // Fallback pseudo scan for profile if not scanned yet
    return {
      id: `pseudo-${profA.id}`,
      profileId: profA.id,
      subjectName: profA.name,
      timestamp: profA.lastAnalysisDate || new Date().toISOString(),
      dominantMizaj: 'sanguinis' as const,
      mizajScores: { sanguinis: 38, koleris: 26, melankolis: 22, flegmatis: 14 },
      iTidalStatus: "Mu'tadil (Seimbang)",
      overallSummary: {
        naturalInclination: profA.notes || 'Karakter seimbang dengan adaptabilitas tinggi dan keluhuran budi.',
        primaryStrengths: ['Komunikatif', 'Fleksibel', 'Kecerdasan Diplomasi'],
        potentialWeaknesses: ['Perlu fokus tujuan jangka panjang']
      }
    } as unknown as FirasatAnalysisResult;
  }, [profA, history]);

  const scanB = useMemo(() => {
    if (!profB) {
      if (history[1]) return history[1];
      if (history[0]) return history[0];
      return {
        id: 'default-b',
        subjectName: 'Subjek B',
        timestamp: new Date().toISOString(),
        dominantMizaj: 'koleris' as const,
        mizajScores: { sanguinis: 20, koleris: 48, melankolis: 18, flegmatis: 14 },
        iTidalStatus: 'Koleris Ghalib (Tegas & Aktif)',
        overallSummary: {
          naturalInclination: 'Karakter tegas berorientasi pada hasil dan keteguhan visi.',
          primaryStrengths: ['Ketegasan memimpin', 'Pemberani', 'Eksekutor Tangguh'],
          potentialWeaknesses: ['Perlu memperhalus intonasi bicara']
        }
      } as unknown as FirasatAnalysisResult;
    }
    const match = history.find(h => h.profileId === profB.id);
    if (match) return match;
    return {
      id: `pseudo-${profB.id}`,
      profileId: profB.id,
      subjectName: profB.name,
      timestamp: profB.lastAnalysisDate || new Date().toISOString(),
      dominantMizaj: 'koleris' as const,
      mizajScores: { sanguinis: 20, koleris: 48, melankolis: 18, flegmatis: 14 },
      iTidalStatus: 'Koleris Ghalib (Tegas & Aktif)',
      overallSummary: {
        naturalInclination: profB.notes || 'Karakter tegas berorientasi pada hasil dan keteguhan visi.',
        primaryStrengths: ['Ketegasan memimpin', 'Pemberani', 'Eksekutor Tangguh'],
        potentialWeaknesses: ['Perlu memperhalus intonasi bicara']
      }
    } as unknown as FirasatAnalysisResult;
  }, [profB, history]);

  const nameA = profA?.name || scanA?.subjectName || 'Subjek A';
  const nameB = profB?.name || scanB?.subjectName || 'Subjek B';

  // Helper to estimate psychological dimensions from physical features & Mizaj
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

  const dimA = useMemo(() => calculateDimensions(scanA), [scanA]);
  const dimB = useMemo(() => calculateDimensions(scanB), [scanB]);

  // Synergy commentary according to Imam Fakhruddin Ar-Razi
  const synergyNote = useMemo(() => {
    if (!scanA || !scanB) return { title: '', body: '', tip: '' };
    const mA = scanA.dominantMizaj || 'sanguinis';
    const mB = scanB.dominantMizaj || 'koleris';

    if (mA === mB) {
      return {
        title: `Kesesuaian Watak Sejenis (${mA.toUpperCase()} & ${mB.toUpperCase()})`,
        body: `Kedua subjek memiliki kesamaan unsur dominan. Mereka akan sangat cepat sepaham dalam gaya komunikasi dan ritme kerja. Namun, Imam Ar-Razi mengingatkan perlunya pihak ketiga yang berimbang saat terjadi kebuntuan agar kelemahan watak yang sama tidak saling mengunci.`,
        tip: `Bagi peran kerja secara spesifik agar tidak terjadi tumpang tindih dominasi visi.`
      };
    }

    if ((mA === 'koleris' && mB === 'flegmatis') || (mA === 'flegmatis' && mB === 'koleris')) {
      return {
        title: 'Sinergi Ideal Api & Air (Koleris & Flegmatis)',
        body: `Kombinasi klasik yang paling saling menstabilkan menurut Kitab Al-Firasat. Ketegasan, inisiatif, dan kecepatan ${mA === 'koleris' ? nameA : nameB} (Koleris) akan diredam secara anggun oleh ketenangan, kesabaran, dan daya tahan ${mA === 'flegmatis' ? nameA : nameB} (Flegmatis). Keduanya mencegah keputusan emosional yang terburu-buru.`,
        tip: `Beri ruang bagi sosok Flegmatis untuk memproses informasi dengan tenang sebelum Koleris meminta keputusan akhir.`
      };
    }

    if ((mA === 'sanguinis' && mB === 'melankolis') || (mA === 'melankolis' && mB === 'sanguinis')) {
      return {
        title: 'Sinergi Ceria & Analitis (Sanguinis & Melankolis)',
        body: `Kombinasi Udara dan Tanah: ${mA === 'sanguinis' ? nameA : nameB} menghadirkan energi sosial, daya persuasi diplomasi, dan inovasi gagasan segar, sementara ${mA === 'melankolis' ? nameA : nameB} menyusun struktur rapi, mitigasi risiko mendalam, dan ketelitian kalkulasi.`,
        tip: `Sosok Sanguinis perlu menghargai data dan kehati-hatian Melankolis, sedangkan Melankolis disarankan tidak terlalu kaku merespons dinamika spontan.`
      };
    }

    if ((mA === 'koleris' && mB === 'sanguinis') || (mA === 'sanguinis' && mB === 'koleris')) {
      return {
        title: 'Sinergi Dinamis Dua Unsur Panas (Koleris & Sanguinis)',
        body: `Kedua subjek didominasi oleh hawa panas (Al-Hararah). Memiliki antusiasme ekspansif luar biasa, daya juang tinggi, dan mobilitas cepat. Sangat efektif dalam memulai proyek terobosan atau memimpin tim dalam kancah tantangan baru.`,
        tip: `Latih mendengarkan saran bawahan dan selalu cek kelengkapan dokumen administratif sebelum mengeksekusi.`
      };
    }

    return {
      title: `Harmoni Perbedaan Tabiat (${mA.toUpperCase()} & ${mB.toUpperCase()})`,
      body: `Perbedaan kadar kehangatan dan kelembapan fisik menciptakan perpaduan pandangan yang kaya. Satu pihak menjaga momentum maju, sedangkan pihak lain memastikan kehati-hatian pijakan.`,
      tip: `Gunakan musyawarah dengan hati terbuka dan saling mengakui kelebihan fitrah masing-masing.`
    };
  }, [scanA, scanB, nameA, nameB]);

  // Comprehensive Ar-Razi Compatibility Analysis Data
  const compData = useMemo<CompatibilityAnalysisData>(() => {
    const mA = scanA?.dominantMizaj || 'sanguinis';
    const mB = scanB?.dominantMizaj || 'koleris';

    // 1. Element Harmony Score (4 Akhlath balance)
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

    // 2. Intellect & Communication Harmony (Akal & Fashahah)
    const nalarDiff = Math.abs(dimA.nalar - dimB.nalar);
    const commDiff = Math.abs(dimA.tuturKata - dimB.tuturKata);
    const intellectScore = Math.min(96, Math.max(68, Math.round(94 - (nalarDiff * 0.28 + commDiff * 0.22))));

    // 3. Emotional Balance & Forbearance (Qalb & Hilm)
    const emotionalScore = Math.min(95, Math.max(62, Math.round(
      ((dimA.keberanian + dimB.empati) / 2) * 0.45 + ((dimB.keberanian + dimA.empati) / 2) * 0.45 + 10
    )));

    // 4. Partnership & Collaboration Synergy (Ta'awun & Amal)
    const memoriSynergy = Math.round((dimA.memori + dimB.memori) / 2);
    const stabilitySynergy = Math.round((dimA.kestabilan + dimB.kestabilan) / 2);
    const partnershipScore = Math.min(96, Math.max(66, Math.round(memoriSynergy * 0.4 + stabilitySynergy * 0.4 + 18)));

    // Overall Compatibility Percentage
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
      summaryTitle: synergyNote.title,
      summaryBody: synergyNote.body,
      partnershipTip: synergyNote.tip,
      communicationTip: `Gunakan gaya dialog yang saling menghargai ritme tabiat. Biarkan ${nameA} (${mA}) mengutarakan sudut pandangnya secara utuh sebelum ${nameB} (${mB}) menyampaikan kesimpulan.`,
      tarjihPrinciple: `Jika terjadi perbedaan pandangan antara ${nameA} dan ${nameB}, terapkan Kaidah Tarjih Imam Ar-Razi: dahulukan keputusan yang berlandaskan data dan pertimbangan akal (Akal ar-Ra's) serta kedamaian hati bersama.`
    };
  }, [scanA, scanB, nameA, nameB, dimA, dimB, synergyNote]);

  // Audio Narrator for compatibility & synergy text
  const handleToggleNarrator = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
    } else {
      const readText = `Analisis Kecocokan Karakter menurut Kitab Al-Firasat Imam Fakhruddin Ar-Razi. 
Membandingkan profil ${nameA} dengan ${nameB}. 
Persentase keselarasan karakter adalah ${compData.overallPercentage} persen. Status: ${compData.harmonyStatus}.
${compData.summaryTitle}. 
Analisis Kitab: ${compData.summaryBody} 
Kunci sukses kemitraan: ${compData.partnershipTip}
Kaidah Tarjih Ar-Razi: ${compData.tarjihPrinciple}`;
      voiceReader.speak(readText);
    }
  };

  // Export Compatibility PDF
  const handleExportPDF = () => {
    sound.playClick();
    setIsExportingPDF(true);
    try {
      generateCompatibilityPDF(
        profA || { id: 'prof-a', name: nameA, category: 'Umum' },
        profB || { id: 'prof-b', name: nameB, category: 'Umum' },
        scanA,
        scanB,
        compData
      );
      sound.playSuccessChime();
    } catch (err) {
      console.error('Failed to export compatibility PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Data for Recharts Bar Chart (4 Mizaj Elements Comparison)
  const barData = useMemo(() => {
    return [
      {
        mizaj: 'Sanguinis (Udara)',
        arabic: 'الدم',
        quality: 'Panas & Lembap',
        [nameA]: scanA?.mizajScores?.sanguinis || 25,
        [nameB]: scanB?.mizajScores?.sanguinis || 25,
      },
      {
        mizaj: 'Koleris (Api)',
        arabic: 'الصفراء',
        quality: 'Panas & Kering',
        [nameA]: scanA?.mizajScores?.koleris || 25,
        [nameB]: scanB?.mizajScores?.koleris || 25,
      },
      {
        mizaj: 'Melankolis (Tanah)',
        arabic: 'السوداء',
        quality: 'Dingin & Kering',
        [nameA]: scanA?.mizajScores?.melankolis || 25,
        [nameB]: scanB?.mizajScores?.melankolis || 25,
      },
      {
        mizaj: 'Flegmatis (Air)',
        arabic: 'البلغم',
        quality: 'Dingin & Lembap',
        [nameA]: scanA?.mizajScores?.flegmatis || 25,
        [nameB]: scanB?.mizajScores?.flegmatis || 25,
      }
    ];
  }, [scanA, scanB, nameA, nameB]);

  // Data for Recharts Radar Chart (6 Psychological Dimensions)
  const radarData = useMemo(() => {
    return [
      {
        dimension: 'Daya Nalar (Akal)',
        [nameA]: dimA.nalar,
        [nameB]: dimB.nalar,
        fullMark: 100
      },
      {
        dimension: 'Keberanian (Qalb)',
        [nameA]: dimA.keberanian,
        [nameB]: dimB.keberanian,
        fullMark: 100
      },
      {
        dimension: 'Ketelitian (Hifzh)',
        [nameA]: dimA.memori,
        [nameB]: dimB.memori,
        fullMark: 100
      },
      {
        dimension: 'Komunikasi (Fashahah)',
        [nameA]: dimA.tuturKata,
        [nameB]: dimB.tuturKata,
        fullMark: 100
      },
      {
        dimension: 'Kelembutan (Hilm)',
        [nameA]: dimA.empati,
        [nameB]: dimB.empati,
        fullMark: 100
      },
      {
        dimension: 'Kestabilan (I\'tidal)',
        [nameA]: dimA.kestabilan,
        [nameB]: dimB.kestabilan,
        fullMark: 100
      }
    ];
  }, [dimA, dimB, nameA, nameB]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Selector */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>Analisis Kecocokan Karakter & Komparasi Recharts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
              Keselarasan Dua Profil Berdasarkan Firasat Imam Ar-Razi
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
              Pilih dua profil subjek dari basis data untuk menganalisis persentase kecocokan karakter, 
              keseimbangan 4 cairan tubuh (Al-Akhlath), serta sinergi kepribadian klasik.
            </p>
          </div>

          {/* Action Buttons: TTS Audio & PDF Export */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleToggleNarrator}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isNarrating
                  ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/30 animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isNarrating ? 'Hentikan Suara' : 'Dengarkan (TTS)'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Menyusun PDF...' : 'Ekspor PDF Naskah'}</span>
            </button>
          </div>
        </div>

        {/* Profile Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
          {/* Profile A */}
          <div className="p-3.5 rounded-xl bg-stone-950/70 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Subjek Pertama (Profil A)
              </span>
              <span className="text-[10px] text-stone-400">
                {profA?.category || 'Profil'}
              </span>
            </div>

            <select
              value={selectedProfIdA}
              onChange={(e) => {
                sound.playClick();
                setSelectedProfIdA(e.target.value);
              }}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 font-semibold focus:outline-none focus:border-amber-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === selectedProfIdB}>
                  {p.name} {p.id === selectedProfIdB ? '(Sedang dipilih di B)' : ''}
                </option>
              ))}
            </select>

            {/* Profile A Mini Info */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
              <span>Mizaj: <strong className="text-amber-300 uppercase">{scanA?.dominantMizaj}</strong></span>
              {scanA && (
                <button
                  onClick={() => setShareModalResult(scanA)}
                  title="Bagikan Kartu Karakter Profil A"
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-500/20 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Kartu</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile B */}
          <div className="p-3.5 rounded-xl bg-stone-950/70 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                Subjek Kedua (Profil B)
              </span>
              <span className="text-[10px] text-stone-400">
                {profB?.category || 'Profil'}
              </span>
            </div>

            <select
              value={selectedProfIdB}
              onChange={(e) => {
                sound.playClick();
                setSelectedProfIdB(e.target.value);
              }}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 font-semibold focus:outline-none focus:border-indigo-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === selectedProfIdA}>
                  {p.name} {p.id === selectedProfIdA ? '(Sedang dipilih di A)' : ''}
                </option>
              ))}
            </select>

            {/* Profile B Mini Info */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
              <span>Mizaj: <strong className="text-indigo-300 uppercase">{scanB?.dominantMizaj}</strong></span>
              {scanB && (
                <button
                  onClick={() => setShareModalResult(scanB)}
                  title="Bagikan Kartu Karakter Profil B"
                  className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold flex items-center gap-1 border border-indigo-500/20 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Kartu</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher: Analisis Kecocokan vs Grafik Recharts vs Keduanya */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-800">
          <span className="text-xs text-stone-400 font-medium">
            Pilihan Modus Analisis Komparatif:
          </span>

          <div className="flex flex-wrap items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
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
              <span>Analisis Kecocokan (Ar-Razi)</span>
            </button>

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
              <span>Visualisasi Grafik Recharts</span>
            </button>

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
              <span>Lengkap (Keduanya)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: ANALISIS KECOCOKAN KARAKTER (AR-RAZI PRINCIPLE) */}
      {/* ========================================================= */}
      {(viewMode === 'compatibility' || viewMode === 'both') && (
        <div className="space-y-5">
          
          {/* Main Hero Compatibility Score Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-900/40 p-6 shadow-2xl space-y-6">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-800 pb-6">
              
              {/* Circular Gauge / Percentage Indicator */}
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
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-title text-amber-300">
                      {compData.overallPercentage}%
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
                      Selaras
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Prinsip Kitab Al-Firasat
                    </span>
                    <span className="text-xs font-arabic text-amber-400 font-bold">
                      {compData.arabicStatus}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-title text-stone-100">
                    {compData.harmonyStatus}
                  </h3>
                  <p className="text-xs text-stone-400 max-w-md">
                    Tingkat keselarasan fitrah bawaan lahiriah antara <strong>{nameA}</strong> dan <strong>{nameB}</strong> berlandaskan perimbangan 4 unsur cairan tubuh dan daya nalar.
                  </p>
                </div>
              </div>

              {/* Fast Quick Details & Export Action */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Dokumen Naskah Klasik</span>
                </button>
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Dilengkapi ornamen border autentik Islam</span>
                </span>
              </div>
            </div>

            {/* 4 Pillars Compatibility Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Pillar 1: Mizaj & Akhlath */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Mizaj & Akhlath</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {compData.elementHarmonyScore}%
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${compData.elementHarmonyScore}%` }} 
                  />
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Keseimbangan unsur alamiah (Api, Udara, Tanah, Air) yang saling menstabilkan.
                </p>
              </div>

              {/* Pillar 2: Nalar & Komunikasi */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span>Nalar & Dialog</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {compData.intellectHarmonyScore}%
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${compData.intellectHarmonyScore}%` }} 
                  />
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Kelancaran bertukar gagasan, logika berpikir, dan pemahaman bersama.
                </p>
              </div>

              {/* Pillar 3: Emosi & Kesabaran */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Emosi & Sabar</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {compData.emotionalBalanceScore}%
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${compData.emotionalBalanceScore}%` }} 
                  />
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Dinamika antara ketegasan (ghadhab) dengan kelembutan pemaaf (hilm).
                </p>
              </div>

              {/* Pillar 4: Sinergi Kemitraan */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                    <Users className="w-4 h-4 text-rose-400" />
                    <span>Kemitraan Kerja</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    {compData.partnershipSynergyScore}%
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${compData.partnershipSynergyScore}%` }} 
                  />
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Efektivitas pembagian tugas, eksekusi nyata, dan ketahanan dalam komitmen.
                </p>
              </div>
            </div>

            {/* Classical Kitab Interpretation Box */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{compData.summaryTitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {compData.summaryBody}
              </p>
            </div>

            {/* Practical Advice & Tarjih Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Communication Advice */}
              <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kunci Komunikasi Sehari-hari</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {compData.communicationTip}
                </p>
              </div>

              {/* Tarjih Conflict Principle */}
              <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Kaidah Tarjih Ar-Razi saat Berselisih</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {compData.tarjihPrinciple}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: VISUALISASI GRAFIK (4 MIZAJ & RADAR 6 DIMENSI)  */}
      {/* ========================================================= */}
      {(viewMode === 'charts' || viewMode === 'both') && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5 sm:p-6 shadow-xl space-y-4">
          
          {/* Chart Header & Sub-Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-title text-stone-100 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400" />
                <span>
                  {chartType === 'bar' 
                    ? 'Grafik Batang Perbandingan 4 Unsur Mizaj' 
                    : 'Radar 6 Dimensi Batiniah & Intelektual'}
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {chartType === 'bar'
                  ? 'Menampilkan kadar persentase 4 cairan tubuh (Dam, Shafra, Sauda, Balgham)'
                  : 'Memetakan daya nalar, keberanian, memori, komunikasi, empati, dan kestabilan'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs self-start sm:self-center">
              <button
                onClick={() => {
                  sound.playClick();
                  setChartType('bar');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Grafik Batang 4 Mizaj
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setChartType('radar');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  chartType === 'radar'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Radar 6 Dimensi Batin
              </button>
            </div>
          </div>

          {/* Chart Viewport */}
          <div className="h-80 sm:h-96 w-full pt-2">
            {chartType === 'bar' ? (
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
                          <div className="rounded-xl bg-stone-950/95 border border-amber-900/50 p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-1">
                              <span className="font-bold text-stone-200">{label}</span>
                              <span className="font-arabic text-amber-400 text-sm">{item.arabic}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 block italic">Sifat: {item.quality}</span>
                            <div className="pt-1 space-y-1">
                              <div className="flex justify-between gap-4 text-amber-300 font-semibold">
                                <span>{nameA}:</span>
                                <span>{payload[0].value}%</span>
                              </div>
                              <div className="flex justify-between gap-4 text-indigo-300 font-semibold">
                                <span>{nameB}:</span>
                                <span>{payload[1]?.value}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => <span className="text-xs text-stone-300 font-medium">{value}</span>}
                  />
                  <Bar 
                    dataKey={nameA} 
                    fill="#f59e0b" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={900} 
                  />
                  <Bar 
                    dataKey={nameB} 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={900} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="75%" 
                  data={radarData}
                >
                  <PolarGrid stroke="#292524" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    stroke="#a8a29e" 
                    fontSize={11} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    stroke="#57534e" 
                    fontSize={10} 
                  />
                  <Radar 
                    name={nameA} 
                    dataKey={nameA} 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.4} 
                    animationDuration={800}
                  />
                  <Radar 
                    name={nameB} 
                    dataKey={nameB} 
                    stroke="#6366f1" 
                    fill="#6366f1" 
                    fillOpacity={0.4} 
                    animationDuration={800}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-stone-950/95 border border-stone-800 p-2.5 shadow-xl text-xs space-y-1">
                            <span className="font-bold text-stone-200 block border-b border-stone-800 pb-1">
                              {payload[0].payload.dimension}
                            </span>
                            <div className="text-amber-400 font-semibold flex justify-between gap-4">
                              <span>{nameA}:</span>
                              <span>{payload[0].value}/100</span>
                            </div>
                            <div className="text-indigo-400 font-semibold flex justify-between gap-4">
                              <span>{nameB}:</span>
                              <span>{payload[1]?.value}/100</span>
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
            )}
          </div>

          {/* 4 Elements Delta Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-stone-800">
            {/* Air / Sanguinis */}
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Udara / Darah</span>
                  <span className="text-xs font-bold text-stone-200">Sanguinis</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">
                {scanA?.mizajScores?.sanguinis || 0}% vs {scanB?.mizajScores?.sanguinis || 0}%
              </span>
            </div>

            {/* Fire / Koleris */}
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Api / Empedu</span>
                  <span className="text-xs font-bold text-stone-200">Koleris</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">
                {scanA?.mizajScores?.koleris || 0}% vs {scanB?.mizajScores?.koleris || 0}%
              </span>
            </div>

            {/* Earth / Melankolis */}
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Tanah / Empedu</span>
                  <span className="text-xs font-bold text-stone-200">Melankolis</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">
                {scanA?.mizajScores?.melankolis || 0}% vs {scanB?.mizajScores?.melankolis || 0}%
              </span>
            </div>

            {/* Water / Flegmatis */}
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Air / Lendir</span>
                  <span className="text-xs font-bold text-stone-200">Flegmatis</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {scanA?.mizajScores?.flegmatis || 0}% vs {scanB?.mizajScores?.flegmatis || 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Share Analysis Visual Card Modal */}
      {shareModalResult && (
        <ShareAnalysisModal
          result={shareModalResult}
          onClose={() => setShareModalResult(null)}
        />
      )}
    </div>
  );
};
