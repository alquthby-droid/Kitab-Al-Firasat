import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Check, 
  X, 
  AudioWaveform, 
  Clock, 
  Scale, 
  AlertCircle 
} from 'lucide-react';
import { VoiceTraitData } from '../types/firasat';
import { sound } from '../services/sound';

interface VoiceAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoice: (voiceData: VoiceTraitData) => void;
  currentVoice?: VoiceTraitData;
}

export const VoiceAnalyzerModal: React.FC<VoiceAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onApplyVoice,
  currentVoice
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [pitch, setPitch] = useState<VoiceTraitData['pitch']>(currentVoice?.pitch || 'sedang');
  const [tempo, setTempo] = useState<VoiceTraitData['tempo']>(currentVoice?.tempo || 'sedang');
  const [loudness, setLoudness] = useState<VoiceTraitData['loudness']>(currentVoice?.loudness || 'sedang');
  const [breath, setBreath] = useState<VoiceTraitData['breath']>(currentVoice?.breath || 'teratur');
  const [detectedHz, setDetectedHz] = useState<number>(140);
  const [detectedDb, setDetectedDb] = useState<number>(45);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      setIsRecording(true);
      sound.playLockPing();

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const canvasCtx = canvas?.getContext('2d');

      const render = () => {
        if (!analyserRef.current || !canvasCtx || !canvas) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate simple volume (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const db = Math.round(rms * 100);
        setDetectedDb(db);

        // Estimate Pitch frequency from FFT
        const freqArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqArray);
        let maxIdx = 0;
        let maxVal = 0;
        for (let i = 0; i < freqArray.length; i++) {
          if (freqArray[i] > maxVal) {
            maxVal = freqArray[i];
            maxIdx = i;
          }
        }
        const nyquist = ctx.sampleRate / 2;
        const dominantFreq = Math.round((maxIdx * nyquist) / freqArray.length);
        if (dominantFreq > 60 && dominantFreq < 1200) {
          setDetectedHz(dominantFreq);
          if (dominantFreq < 130) {
            setPitch('berat_rendah');
          } else if (dominantFreq > 220) {
            setPitch('tinggi_melengking');
          } else {
            setPitch('sedang');
          }
        }

        if (db > 40) {
          setLoudness('lantang_tebal');
        } else if (db < 15) {
          setLoudness('lirih_halus');
        } else {
          setLoudness('sedang');
        }

        // Draw oscilloscope waveform
        canvasCtx.fillStyle = '#0c0a09';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#f59e0b';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        animFrameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (err: any) {
      console.warn('Microphone access unavailable or denied:', err?.message || err);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsRecording(false);
  };

  // Classical deduction based on selected or detected voice traits
  const getClassicalDeduction = () => {
    if (pitch === 'berat_rendah' && loudness === 'lantang_tebal') {
      return {
        summary: 'Pemberani, berwibawa, berjiwa pelindung, panas tubuh dan rongga dada lapang.',
        arabic: 'الصوت العظيم الغليظ الثقيل يدل على قوة الحرارة وسعة الصدر والشجاعة',
        kitab: 'Kitab Al-Firasat, Pasal Kesepuluh (hal. 98 / 184)'
      };
    } else if (tempo === 'cepat_tergesa') {
      return {
        summary: 'Gegabah, berpikiran cepat namun tergesa-gesa, kurang sabar menimbang perkara.',
        arabic: 'من كان كلامه سريعا فهو عَجُول قليل الفهم',
        kitab: 'Kitab Al-Firasat, Pasal Kesepuluh'
      };
    } else if (tempo === 'lambat_tertata') {
      return {
        summary: 'Penyabar, berakhlak mulia, berwibawa tinggi, akal memimpin hawa nafsu.',
        arabic: 'من كان كلامه بطيئا فهو صبور ذو وقار وأخلاق جميلة',
        kitab: 'Kitab Al-Firasat, Pasal Kesepuluh'
      };
    } else if (pitch === 'tinggi_melengking' || loudness === 'lirih_halus') {
      return {
        summary: 'Cenderung pemalu atau penakut, rongga vokal sempit, dominan sifat dingin.',
        arabic: 'الصوت الصغير يدل على ضيق الحنجرة والبرودة والجبن',
        kitab: 'Kitab Al-Firasat, Pasal Keenam (hal. 68)'
      };
    }

    return {
      summary: 'Karakter vokal mu\'tadil (seimbang), tutur kata teratur dan adaptif.',
      arabic: 'الصوت الأملس المعتدل يدل على اعتدال المزاج ورجاحة العقل',
      kitab: 'Kitab Al-Firasat, Kaidah I\'tidal Suara'
    };
  };

  const deduction = getClassicalDeduction();

  const handleApply = () => {
    const voiceData: VoiceTraitData = {
      pitch,
      tempo,
      loudness,
      breath,
      traitSummary: deduction.summary,
      arabicReference: deduction.arabic,
      kitabReference: deduction.kitab
    };
    onApplyVoice(voiceData);
    sound.playSuccessChime();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-amber-900/40 p-6 sm:p-7 space-y-5 shadow-2xl text-stone-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-title text-stone-100">
                Analisis Suara, Napas & Tutur Kata
              </h3>
              <p className="text-xs text-stone-400">
                Berdasarkan Kitab Al-Firasat Pasal Kesepuluh (Imam Fakhruddin Ar-Razi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Card */}
        <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <AudioWaveform className="w-4 h-4 text-amber-400" />
              <span>Deteksi Spektrum Suara Mikrofon (Opsional)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400 font-mono">
                {isRecording ? `${detectedHz} Hz • ${detectedDb} dB` : 'Mikrofon Standby'}
              </span>
              <button
                onClick={isRecording ? stopListening : startListening}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Hentikan Rekam' : 'Deteksi Suara'}</span>
              </button>
            </div>
          </div>

          <div className="relative h-16 w-full rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={500}
              height={64}
              className="w-full h-full"
            />
            {!isRecording && (
              <span className="absolute text-[11px] text-stone-500">
                Klik 'Deteksi Suara' untuk menguji nada & intonasi bicara, atau atur parameter di bawah secara manual.
              </span>
            )}
          </div>
        </div>

        {/* Manual Parameter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Pitch */}
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
            <label className="font-semibold text-stone-300 block">Nada Dasar Suara (Pitch)</label>
            <select
              value={pitch}
              onChange={(e) => setPitch(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
            >
              <option value="berat_rendah">Berat, Tebal, dan Rendah (Al-Ghalizh)</option>
              <option value="sedang">Sedang & Proporsional (Mu'tadil)</option>
              <option value="tinggi_melengking">Tinggi, Tajam, atau Melengking (Ad-Daqiq)</option>
            </select>
            <span className="text-[10px] text-stone-500">Suara berat berasal dari rongga dada lapang.</span>
          </div>

          {/* Tempo */}
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
            <label className="font-semibold text-stone-300 block">Tempo Bertutur Kata (Kalam)</label>
            <select
              value={tempo}
              onChange={(e) => setTempo(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
            >
              <option value="lambat_tertata">Pelan, Tenang, dan Tertata (Bathi' Shabur)</option>
              <option value="sedang">Sedang & Wajar</option>
              <option value="cepat_tergesa">Cepat & Tergesa-gesa (Sari' 'Ajul)</option>
            </select>
            <span className="text-[10px] text-stone-500">Tempo bicara mencerminkan kestabilan akal.</span>
          </div>

          {/* Loudness */}
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
            <label className="font-semibold text-stone-300 block">Kekuatan Resonansi & Volume</label>
            <select
              value={loudness}
              onChange={(e) => setLoudness(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
            >
              <option value="lantang_tebal">Lantang, Beresonansi Dalam (Jahir)</option>
              <option value="sedang">Sedang & Cukup Jelas</option>
              <option value="lirih_halus">Lirih, Lembut, atau Halus (Khafi)</option>
            </select>
            <span className="text-[10px] text-stone-500">Kekuatan suara sejalan dengan panasnya jantung.</span>
          </div>

          {/* Breath */}
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
            <label className="font-semibold text-stone-300 block">Desah Napas (An-Nafas)</label>
            <select
              value={breath}
              onChange={(e) => setBreath(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
            >
              <option value="panas_lapang">Panjang, Tenang & Lapang (Nafas Thawil)</option>
              <option value="teratur">Teratur Normal</option>
              <option value="berat_tersendat">Berat, Dangkal, atau Tersendat (Nafas Ghalizh)</option>
            </select>
            <span className="text-[10px] text-stone-500">Napas panjang adalah tanda keteguhan batin.</span>
          </div>
        </div>

        {/* Deduksi Kitab Al-Firasat Box */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deduksi Firasat Suara Imam Ar-Razi:</span>
            </span>
            <span className="text-[10px] text-stone-400">{deduction.kitab}</span>
          </div>

          <p className="font-arabic text-sm text-amber-200 text-right leading-relaxed">
            "{deduction.arabic}"
          </p>

          <p className="text-xs text-stone-200 font-medium">
            {deduction.summary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Parameter Suara</span>
          </button>
        </div>
      </div>
    </div>
  );
};
