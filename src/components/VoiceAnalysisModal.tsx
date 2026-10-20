import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  Bookmark, 
  Share2, 
  Info,
  Sliders,
  Flame,
  Droplets,
  Wind,
  Mountain
} from 'lucide-react';
import { evaluateVoiceFirasat, VocalAnalysisResult, voiceReader } from '../services/voiceService';
import { SubjectProfile } from '../types/firasat';
import { sound } from '../services/sound';

interface VoiceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SubjectProfile[];
  onSaveToProfile?: (profileId: string, vocalNote: string) => void;
}

export const VoiceAnalysisModal: React.FC<VoiceAnalysisModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onSaveToProfile
}) => {
  // Mode: Live Mic vs Manual Parameters
  const [inputMode, setInputMode] = useState<'mic' | 'manual'>('mic');
  
  // Mic state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [liveHz, setLiveHz] = useState<number>(0);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  
  // Voice parameters (manual or detected)
  const [pitch, setPitch] = useState<'rendah' | 'sedang' | 'tinggi'>('rendah');
  const [tempo, setTempo] = useState<'lambat' | 'sedang' | 'cepat'>('sedang');
  const [volume, setVolume] = useState<'lantang' | 'sedang' | 'pelan'>('lantang');
  const [tone, setTone] = useState<'bergema' | 'lembut' | 'parau' | 'tajam'>('bergema');

  // Result state
  const [result, setResult] = useState<VocalAnalysisResult>(() => 
    evaluateVoiceFirasat('rendah', 'sedang', 'lantang', 'bergema')
  );

  // Audio Narration (TTS) state
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  // Profile save state
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Canvas ref for audio visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Re-calculate result whenever parameters change
  useEffect(() => {
    const res = evaluateVoiceFirasat(pitch, tempo, volume, tone, liveHz > 0 ? liveHz : undefined);
    setResult(res);
  }, [pitch, tempo, volume, tone, liveHz]);

  // Subscribe to TTS changes
  useEffect(() => {
    const unsub = voiceReader.subscribe((st) => {
      setIsNarrating(st.isSpeaking && !st.isPaused);
    });
    return () => {
      unsub();
      voiceReader.stop();
    };
  }, []);

  // Cleanup mic on unmount or close
  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  const startMic = async () => {
    setMicError(null);
    try {
      sound.playClick();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecording(true);
      drawWaveform();
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setMicError('Izin mikrofon tidak diberikan atau perangkat audio tidak terdeteksi. Silakan gunakan mode Parameter Manual.');
      setInputMode('manual');
    }
  };

  const stopMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  // Draw real-time audio visualizer & pitch estimation
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(freqData);

      // Estimate dominant frequency
      let maxVal = -1;
      let maxIndex = -1;
      let sumVol = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumVol += Math.abs(dataArray[i] - 128);
        if (freqData[i] > maxVal) {
          maxVal = freqData[i];
          maxIndex = i;
        }
      }

      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const dominantHz = Math.round((maxIndex * sampleRate) / analyser.fftSize);
      const avgVol = Math.round((sumVol / bufferLength) * 3);

      if (avgVol > 8 && dominantHz > 60 && dominantHz < 1200) {
        setLiveHz(dominantHz);
        setLiveVolume(avgVol);

        // Auto map detected frequency to pitch category
        if (dominantHz < 160) {
          setPitch('rendah');
          setTone('bergema');
        } else if (dominantHz < 260) {
          setPitch('sedang');
        } else {
          setPitch('tinggi');
          setTone('tajam');
        }

        if (avgVol > 35) {
          setVolume('lantang');
        } else if (avgVol < 15) {
          setVolume('pelan');
        } else {
          setVolume('sedang');
        }
      }

      // Draw Visualizer
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Waveform line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Glow effect
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 6;
      ctx.stroke();
    };

    render();
  };

  // Toggle Text-to-Speech narration
  const handleToggleNarrator = () => {
    sound.playClick();
    if (isNarrating) {
      voiceReader.stop();
    } else {
      const textToRead = `Hasil Analisis Firasat dari Segi Suara menurut Imam Fakhruddin Ar-Razi. 
Karakteristik vokal: ${result.firasatDeduction.character}. 
Penjelasan Kitab: ${result.firasatDeduction.explanation}. 
Kekuatan watak: ${result.firasatDeduction.strengths.join(', ')}. 
Nasihat perbaikan: ${result.firasatDeduction.cautions.join(', ')}.`;
      voiceReader.speak(textToRead);
    }
  };

  const handleSaveToProfile = () => {
    if (!selectedProfileId || !onSaveToProfile) return;
    sound.playSuccessChime();
    const note = `[Analisis Suara Ar-Razi: ${result.pitchCategory.toUpperCase()} - ${result.firasatDeduction.character}]`;
    onSaveToProfile(selectedProfileId, note);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-stone-900 border border-amber-900/40 p-6 sm:p-7 shadow-2xl space-y-5 text-stone-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-title text-amber-300">
                  Analisis Firasat dari Segi Suara & Tutur Kata
                </h3>
                <span className="font-arabic text-amber-400 text-sm font-semibold">
                  (دلائل الصوت والكلام)
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Berdasarkan Kitab Al-Firasat Bab 14 karya Imam Fakhruddin Ar-Razi (554–606 H)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopMic();
              voiceReader.stop();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between gap-3 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs">
          <button
            onClick={() => {
              setInputMode('mic');
              startMic();
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'mic'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pemindai Mikrofon Real-Time</span>
          </button>

          <button
            onClick={() => {
              stopMic();
              setInputMode('manual');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'manual'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pilihan Parameter Manual</span>
          </button>
        </div>

        {/* Real-Time Microphone View */}
        {inputMode === 'mic' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl bg-stone-950 border border-stone-800 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-400 animate-ping' : 'bg-stone-600'}`} />
                  {isRecording ? 'Mendengarkan Suara Anda...' : 'Mikrofon Siaga'}
                </span>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-amber-400 font-bold">
                    {liveHz > 0 ? `${liveHz} Hz` : '-- Hz'}
                  </span>
                  <span className="text-stone-400">
                    Vol: {liveVolume}%
                  </span>
                </div>
              </div>

              {/* Oscilloscope Canvas */}
              <canvas
                ref={canvasRef}
                width={600}
                height={100}
                className="w-full h-24 rounded-xl bg-stone-950 block"
              />

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-stone-400 italic">
                  Bicaralah atau lafalkan kalimat santai untuk mendeteksi frekuensi dasar dan resonansi vokal Anda.
                </p>

                <button
                  onClick={isRecording ? stopMic : startMic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    isRecording 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'Hentikan Perekaman' : 'Mulai Perekaman'}</span>
                </button>
              </div>
            </div>

            {micError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {micError}
              </div>
            )}
          </div>
        )}

        {/* Parameter Controls (Always accessible / adjustable) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Pitch */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Frekuensi / Pitch
            </span>
            <select
              value={pitch}
              onChange={(e) => setPitch(e.target.value as any)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs text-amber-300 p-1.5 focus:outline-none"
            >
              <option value="rendah">Rendah / Bass (Jahir)</option>
              <option value="sedang">Sedang / Bariton (Mu'tadil)</option>
              <option value="tinggi">Tinggi / Melengking (Daqiq)</option>
            </select>
          </div>

          {/* Tempo */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Tempo Bicara
            </span>
            <select
              value={tempo}
              onChange={(e) => setTempo(e.target.value as any)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs text-amber-300 p-1.5 focus:outline-none"
            >
              <option value="lambat">Tenang / Perlahan (Buth'i)</option>
              <option value="sedang">Sedang / Teratur (Mu'tadil)</option>
              <option value="cepat">Cepat / Gesit (Sari')</option>
            </select>
          </div>

          {/* Volume */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Kekuatan Volume
            </span>
            <select
              value={volume}
              onChange={(e) => setVolume(e.target.value as any)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs text-amber-300 p-1.5 focus:outline-none"
            >
              <option value="lantang">Lantang & Kuat</option>
              <option value="sedang">Sedang Proporsional</option>
              <option value="pelan">Lirih & Pelan</option>
            </select>
          </div>

          {/* Timbre / Tone */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Tekstur Resonansi
            </span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs text-amber-300 p-1.5 focus:outline-none"
            >
              <option value="bergema">Bergema dari Dada</option>
              <option value="lembut">Lembut Menyejukkan</option>
              <option value="parau">Parau / Serak Berwibawa</option>
              <option value="tajam">Tajam Menusuk</option>
            </select>
          </div>
        </div>

        {/* Firasat Character Deduction Card */}
        <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30 border border-amber-900/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Hasil Deduksi Karakter Klasik
              </span>
              <h4 className="text-base sm:text-lg font-bold text-stone-100 mt-1 font-title">
                {result.firasatDeduction.character}
              </h4>
            </div>

            {/* Audio Narrator Button */}
            <button
              onClick={handleToggleNarrator}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isNarrating
                  ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/30 animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isNarrating ? 'Hentikan Audio' : 'Dengarkan Naskah (TTS)'}</span>
            </button>
          </div>

          {/* Classical Arabic Quote */}
          <div className="p-3.5 rounded-xl bg-stone-950/70 border border-amber-900/30">
            <p className="font-arabic text-amber-300 text-base sm:text-lg text-right leading-loose">
              « {result.firasatDeduction.arabicQuote} »
            </p>
            <p className="text-xs text-stone-400 mt-2 italic leading-relaxed">
              "{result.firasatDeduction.explanation}"
            </p>
          </div>

          {/* Strengths & Cautions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Potensi Luhur & Kekuatan:
              </span>
              <ul className="text-xs text-stone-300 space-y-1 pl-4 list-disc">
                {result.firasatDeduction.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Nasihat Riyadhah Jiwa:
              </span>
              <ul className="text-xs text-stone-300 space-y-1 pl-4 list-disc">
                {result.firasatDeduction.cautions.map((cau, idx) => (
                  <li key={idx}>{cau}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions: Save to Profile */}
        <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {profiles.length > 0 && onSaveToProfile ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 focus:outline-none flex-1 sm:w-48"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    Profil: {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveToProfile}
                disabled={saveSuccess}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{saveSuccess ? 'Tersimpan!' : 'Simpan ke Profil'}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-stone-500">
              Profil tersimpan di basis data dapat dihubungkan dengan hasil suara ini.
            </span>
          )}

          <button
            onClick={() => {
              stopMic();
              voiceReader.stop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
