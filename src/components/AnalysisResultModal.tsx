import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bookmark, 
  Calendar, 
  Check, 
  AlertTriangle, 
  Scale, 
  Heart, 
  BookOpen, 
  Printer, 
  Share2, 
  Clock, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain,
  CheckCircle2,
  Download,
  Volume2,
  VolumeX,
  Hand,
  Activity
} from 'lucide-react';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { saveProfile, scheduleNotification, saveHistory } from '../services/api';
import { generateFirasatPDF } from '../services/pdfReport';
import { voiceReader } from '../services/voiceService';
import { sound } from '../services/sound';
import { toHijri } from '../services/hijriCalendar';
import { ShareAnalysisModal } from './ShareAnalysisModal';

interface AnalysisResultModalProps {
  result: FirasatAnalysisResult | null;
  profiles: SubjectProfile[];
  onClose: () => void;
  onRefreshData: () => void;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  result,
  profiles,
  onClose,
  onRefreshData
}) => {
  if (!result) return null;

  const mizaj = MIZAJ_DATA[result.dominantMizaj] || MIZAJ_DATA.sanguinis;
  const [selectedProfileId, setSelectedProfileId] = useState<string>(result.profileId || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [scheduleDays, setScheduleDays] = useState<number>(14);
  const [scheduleNote, setScheduleNote] = useState<string>('Evaluasi berkala kestabilan karakter dan ketenangan raut wajah.');
  const [scheduleSaved, setScheduleSaved] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Subscribe to TTS changes
  React.useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  // Toggle Text-to-Speech narration
  const handleToggleNarrator = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
    } else {
      const readText = `Hasil Analisis Firasat Imam Fakhruddin Ar-Razi untuk ${result.subjectName}. 
Temperamen dominan: ${result.dominantMizaj}. 
Keseimbangan: ${result.iTidalStatus}. 
Karakteristik watak: ${result.overallSummary.naturalInclination}. 
Kekuatan utama: ${result.overallSummary.primaryStrengths.join(', ')}. 
Nasihat jiwa dan riyadhah: ${result.overallSummary.spiritualAdvice}.`;
      voiceReader.speak(readText);
    }
  };

  // Save to Profile & History
  const handleSaveToProfile = async () => {
    setIsSavingProfile(true);
    try {
      let finalProfId = selectedProfileId;

      // If no profile selected, create a new one automatically
      if (!finalProfId) {
        const newProf = await saveProfile({
          name: result.subjectName,
          category: 'Keluarga',
          avatarUrl: result.imageUrl,
          notes: `Dianalisis pertama kali sebagai tipe ${mizaj.indonesianName}.`,
          monitoringIntervalDays: 14
        });
        finalProfId = newProf.id;
        setSelectedProfileId(newProf.id);
      }

      // Save history record linked to profile
      await saveHistory({
        ...result,
        profileId: finalProfId
      });

      setSavedSuccess(true);
      onRefreshData();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Schedule notification
  const handleScheduleReview = async () => {
    try {
      await scheduleNotification({
        profileId: selectedProfileId || 'unassigned',
        profileName: result.subjectName,
        days: scheduleDays,
        title: `Evaluasi Firasat Berkala: ${result.subjectName}`,
        message: scheduleNote
      });
      setScheduleSaved(true);
      setShowScheduleForm(false);
      onRefreshData();
      setTimeout(() => setScheduleSaved(false), 4000);
    } catch (err) {
      console.error('Failed to schedule notification:', err);
    }
  };

  // Download PDF Report with profile metadata & firasat findings
  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    sound.playClick();
    try {
      const matchedProfile = profiles.find(p => p.id === (selectedProfileId || result.profileId) || p.name.toLowerCase() === result.subjectName.toLowerCase());
      generateFirasatPDF(result, matchedProfile);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 600);
    }
  };

  // Print or Export report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-stone-900 border border-amber-900/40 shadow-2xl p-5 sm:p-7 space-y-6 text-stone-100">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            {result.imageUrl ? (
              <img
                src={result.imageUrl}
                alt={result.subjectName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                {result.subjectName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Hasil Analisis Firasat
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(result.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-stone-600 hidden sm:inline">•</span>
                <span className="text-amber-300 text-xs font-medium flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>{toHijri(result.timestamp).formattedWithDay}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100 mt-0.5">
                {result.subjectName}
              </h2>
              {result.ageStage && (
                <p className="text-xs text-stone-400">{result.ageStage}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleNarrator}
              title="Dengarkan Pembacaan Hasil Analisis (TTS)"
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isNarrating
                  ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30 animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isNarrating ? 'Hentikan Audio' : 'Dengarkan Naskah'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setShowShareModal(true);
              }}
              title="Bagikan Ringkasan Visual / Kartu Karakter ke Media Sosial"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Kartu</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              title="Unduh Laporan Ringkasan PDF Lengkap"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Membuat...' : 'Unduh Laporan PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Cetak Laporan"
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Temperament (Mizaj) Dominance Hero Card */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-900 border border-amber-500/30 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/60 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/90">
                Mizaj Dominan (Temperamen Batiniah)
              </span>
              <h3 className="text-xl font-bold font-title text-amber-200">
                {mizaj.indonesianName}
              </h3>
              <p className="font-arabic text-amber-400/80 text-base">{mizaj.arabicName}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {result.iTidalStatus}
              </span>
              <p className="text-[11px] text-stone-400 mt-1">
                Kualitas: <span className="text-stone-300">{mizaj.qualities}</span>
              </p>
            </div>
          </div>

          {/* 4 Mizaj Distribution Meters */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-stone-300 mb-1.5">
              <span>Distribusi 4 Cairan Tubuh (Kaidah Akhlath Al-Arba\'ah)</span>
              <span className="text-[11px] text-amber-400 font-mono">Total: 100%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Sanguinis */}
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center justify-between text-[11px] text-red-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Droplets className="w-3 h-3 text-red-500" /> Sanguinis
                  </span>
                  <span className="font-bold">{result.mizajScores?.sanguinis || 0}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all"
                    style={{ width: `${result.mizajScores?.sanguinis || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-stone-500 mt-1 block">Darah • Panas/Lembap</span>
              </div>

              {/* Koleris */}
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center justify-between text-[11px] text-amber-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Flame className="w-3 h-3 text-amber-500" /> Koleris
                  </span>
                  <span className="font-bold">{result.mizajScores?.koleris || 0}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${result.mizajScores?.koleris || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-stone-500 mt-1 block">Empedu Kuning • Panas/Kering</span>
              </div>

              {/* Melankolis */}
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center justify-between text-[11px] text-indigo-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Mountain className="w-3 h-3 text-indigo-400" /> Melankolis
                  </span>
                  <span className="font-bold">{result.mizajScores?.melankolis || 0}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${result.mizajScores?.melankolis || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-stone-500 mt-1 block">Empedu Hitam • Dingin/Kering</span>
              </div>

              {/* Flegmatis */}
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center justify-between text-[11px] text-cyan-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Wind className="w-3 h-3 text-cyan-400" /> Flegmatis
                  </span>
                  <span className="font-bold">{result.mizajScores?.flegmatis || 0}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${result.mizajScores?.flegmatis || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-stone-500 mt-1 block">Lendir • Dingin/Lembap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Share Callout Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-emerald-950/30 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>Bagikan Ringkasan Karakter ke Media Sosial</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Kartu Visual HD
                </span>
              </h4>
              <p className="text-xs text-stone-400">
                Ekspor kartu karakter estetis dengan kutipan Imam Ar-Razi, pilar akhlak, dan QR Code tautan langsung ke aplikasi.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setShowShareModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Buat Kartu Karakter</span>
          </button>
        </div>

        {/* Detailed Organ Breakdown according to Kitab Al-Firasat */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Deduksi Fisik Organ Tubuh (Kitab Al-Firasat Ar-Razi)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.features.map((feat, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-1.5 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 text-xs font-semibold">
                      {feat.organ}
                    </span>
                    <span className="font-arabic text-stone-400 text-sm">
                      {feat.arabicName}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Akurasi: {feat.confidence}%
                  </span>
                </div>

                <p className="text-xs text-stone-200 font-medium">
                  {feat.observation}
                </p>

                <p className="text-xs text-amber-200/90 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  <span className="font-semibold text-amber-400">Watak Terbaca: </span>
                  {feat.traitIndication}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/40">
                  <span>{feat.kitabRef}</span>
                  {feat.associatedAnimal && (
                    <span className="text-amber-400/80">
                      Serupa: {feat.associatedAnimal}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Trait Deduction (Pasal Kesepuluh) */}
        {result.voiceAnalysis && (
          <div className="rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/20 border border-amber-500/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Deduksi Firasat Suara & Tutur Kata (Pasal Kesepuluh Ar-Razi)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {result.voiceAnalysis.kitabReference}
              </span>
            </div>
            <p className="font-arabic text-amber-200/90 text-sm text-right">
              "{result.voiceAnalysis.arabicReference}"
            </p>
            <p className="text-xs text-stone-200 leading-relaxed">
              <span className="font-semibold text-amber-300">Karakter Batiniah: </span>
              {result.voiceAnalysis.traitSummary}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-stone-400">
              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 block">Nada Dasar:</span>
                <span className="font-semibold text-stone-300 capitalize">{result.voiceAnalysis.pitch.replace('_', ' ')}</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 block">Tempo Bicara:</span>
                <span className="font-semibold text-stone-300 capitalize">{result.voiceAnalysis.tempo.replace('_', ' ')}</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 block">Kekuatan Resonansi:</span>
                <span className="font-semibold text-stone-300 capitalize">{result.voiceAnalysis.loudness.replace('_', ' ')}</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 block">Desah Napas:</span>
                <span className="font-semibold text-stone-300 capitalize">{result.voiceAnalysis.breath.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Palm Lines Dual-Hand Deduction (Kitab Al-Firasat Ar-Razi) */}
        {result.palmAnalysis && (
          <div className="rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/30 border border-amber-500/40 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Hand className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <span>Deduksi Firasat Garis Telapak Tangan (Khuthûth al-Kaff)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                      Kaidah Ar-Razi
                    </span>
                  </h4>
                  <span className="text-xs font-arabic text-amber-400">
                    دلائل خطوط الكف واليدين • مظهر العمل والجبلة
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-mono self-start sm:self-auto bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                Tangan Kanan & Kiri
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Right Hand: Action & Actualization */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">Tangan Kanan (Al-Yad al-Yumna)</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-arabic">اليَدُ اليُمْنَى • العَمَل</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Mencerminkan etos kerja nyata, kedewasaan bertindak, ketegasan memimpin, dan daya juang lahiriah.
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Garis Kehidupan (Khathth al-Hayah):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.rightHand.lifeLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-indigo-400 font-semibold block">Garis Akal (Khathth al-Aql):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.rightHand.headLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-rose-400 font-semibold block">Garis Kalbu (Khathth al-Qalb):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.rightHand.heartLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-amber-400 font-semibold block">Tekstur & Bentuk:</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.rightHand.texture}</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-200/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                  <span className="font-semibold text-amber-300">Indikasi Lahiriah: </span>
                  {result.palmAnalysis.rightHand.mizajIndication}
                </p>
              </div>

              {/* Left Hand: Innate Disposition & Spirituality */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-cyan-400 transform -scale-x-100" />
                    <span className="text-xs font-bold text-cyan-300">Tangan Kiri (Al-Yad al-Yusra)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/90 font-arabic">اليَدُ اليُسْرَى • الفِطْرَة</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Mencerminkan fitrah nurani batiniah, potensi bakat bawaan asal, intuisi spiritual, dan kepekaan rasa.
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Garis Kehidupan (Khathth al-Hayah):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.leftHand.lifeLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-indigo-400 font-semibold block">Garis Akal (Khathth al-Aql):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.leftHand.headLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-rose-400 font-semibold block">Garis Kalbu (Khathth al-Qalb):</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.leftHand.heartLine}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                    <span className="text-[10px] text-cyan-400 font-semibold block">Tekstur & Bentuk:</span>
                    <span className="text-stone-200 text-[11px]">{result.palmAnalysis.leftHand.texture}</span>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-200/90 bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 leading-relaxed">
                  <span className="font-semibold text-cyan-300">Indikasi Batiniah: </span>
                  {result.palmAnalysis.leftHand.mizajIndication}
                </p>
              </div>
            </div>

            {/* Combined Synthesis Note */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-stone-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <span className="font-semibold text-amber-300">Harmonisasi Dua Tangan: </span>
                {result.palmAnalysis.summary}
              </p>
            </div>
          </div>
        )}

        {/* Character Synthesis: Strengths, Weaknesses, Tarjih */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Potensi & Kekuatan Batiniah</span>
            </h5>
            <ul className="text-xs text-stone-300 space-y-1">
              {result.overallSummary.primaryStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Points of Vigilance */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Titik Rawan / Kecenderungan Alami</span>
            </h5>
            <ul className="text-xs text-stone-300 space-y-1">
              {result.overallSummary.potentialWeaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tarjih Principle & Natural Inclination */}
        <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Scale className="w-4 h-4" />
            <span>Kaidah Tarjih (Penyelarasan Tanda Kontradiktif Ar-Razi)</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            {result.overallSummary.tarjihNote}
          </p>
          <div className="text-[11px] text-stone-400 bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
            <span className="font-semibold text-stone-200">Kecenderungan Hakiki: </span>
            {result.overallSummary.naturalInclination}
          </div>
        </div>

        {/* Riyadhah & Spiritual Guidance */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-stone-900 to-amber-950/30 border border-amber-800/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Riyâdhah Akhlak & Tazkiyatun Nafs (Penyempurnaan Jiwa)</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            {result.overallSummary.spiritualAdvice}
          </p>
          <p className="text-[10px] text-stone-500 italic">
            *Catatan Kitab: Bentuk fisik hanya menunjukkan tabiat dasar lahiriah (thabi\'iyyah). Kualitas batin sesungguhnya senantiasa dapat disempurnakan melalui taqwa, ilmu budi pekerti, dan riyadhah syar\'iyyah.
          </p>
        </div>

        {/* Classical Arabic Quote from Ar-Razi */}
        {result.classicalQuote && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
              {result.classicalQuote.chapter}
            </span>
            <p className="font-arabic text-base sm:text-lg text-amber-200/90 leading-relaxed">
              "{result.classicalQuote.arabicText}"
            </p>
            <p className="text-xs text-stone-300 italic">
              "{result.classicalQuote.indonesianTranslation}"
            </p>
            <p className="text-[10px] text-stone-500">
              {result.classicalQuote.context}
            </p>
          </div>
        )}

        {/* Profile Saving & Periodic Monitoring Schedule Form */}
        <div className="border-t border-stone-800 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-stone-400 mb-1">
                Tautkan ke Profil Basis Data
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="">-- Buat Profil Baru: {result.subjectName} --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSaveToProfile}
                disabled={isSavingProfile}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-stone-950" />
                    <span>Tersimpan di Basis Data!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan ke Basis Data'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwalkan Pemantauan</span>
              </button>
            </div>
          </div>

          {/* Schedule Form Drawer */}
          {showScheduleForm && (
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Pengaturan Notifikasi Pemantauan Berkala</span>
                </span>
                <span className="text-[10px] text-stone-500">Kitab Al-Firasat</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Periode Evaluasi Ulang</label>
                  <select
                    value={scheduleDays}
                    onChange={(e) => setScheduleDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
                  >
                    <option value={7}>7 Hari (Evaluasi Cepat / Situasi Kritis)</option>
                    <option value={14}>14 Hari (Standar Pengamatan Tabiat)</option>
                    <option value={30}>30 Hari (Evaluasi 1 Bulan / Riyadhah)</option>
                    <option value={60}>60 Hari (Perkembangan Jangka Panjang)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-stone-400 mb-1">Catatan Fokus Pengamatan</label>
                  <input
                    type="text"
                    value={scheduleNote}
                    onChange={(e) => setScheduleNote(e.target.value)}
                    placeholder="Contoh: Amati perubahan kerutan dahi dan kelembutan tutur kata..."
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleScheduleReview}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400"
                >
                  Pasang Pengingat
                </button>
              </div>
            </div>
          )}

          {scheduleSaved && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Jadwal pemantauan berkala berhasil ditambahkan ke pusat notifikasi!</span>
            </div>
          )}
        </div>
      </div>

      {/* Share Analysis Visual Card Modal */}
      {showShareModal && (
        <ShareAnalysisModal
          result={result}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
