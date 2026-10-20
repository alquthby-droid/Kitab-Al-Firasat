import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Layers, 
  ShieldCheck, 
  ScanLine,
  Maximize2,
  Trash2,
  Unlock,
  RotateCcw,
  Hand
} from 'lucide-react';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { SAMPLE_PORTRAITS } from '../data/kitabFirasatData';
import { analyzeFace } from '../services/api';
import { sound } from '../services/sound';

interface FaceScannerProps {
  profiles: SubjectProfile[];
  onAnalysisComplete: (result: FirasatAnalysisResult) => void;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({
  profiles,
  onAnalysisComplete
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [scanTarget, setScanTarget] = useState<'face' | 'palm_right' | 'palm_left'>('face');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [ageStage, setAgeStage] = useState<string>('Paruh Baya (Kuhulah)');
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  // Analysis status
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected sample
  const [selectedSample, setSelectedSample] = useState<typeof SAMPLE_PORTRAITS[0] | null>(SAMPLE_PORTRAITS[0]);

  // Sync profile selection with subject name
  useEffect(() => {
    if (selectedProfileId) {
      const prof = profiles.find(p => p.id === selectedProfileId);
      if (prof) {
        setSubjectName(prof.name);
      }
    }
  }, [selectedProfileId, profiles]);

  const [cameraRequested, setCameraRequested] = useState<boolean>(false);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Perangkat atau peramban ini tidak mendukung akses kamera langsung. Silakan gunakan opsi Unggah Foto atau Galeri Sampel.');
      setCameraActive(false);
      return;
    }
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Akses kamera tidak diizinkan atau tidak tersedia:', err?.message || err);
      let msg = 'Izin kamera belum aktif atau tidak tersedia.';
      if (err?.name === 'NotAllowedError' || err?.message?.toLowerCase().includes('permission denied')) {
        msg = 'Izin kamera belum diizinkan oleh peramban. Anda dapat mengizinkannya di pengaturan peramban, atau menggunakan opsi Unggah Foto & Galeri Sampel di bawah.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'Perangkat kamera tidak terdeteksi pada sistem Anda.';
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [stream]);

  // Stop camera when unmounting or switching mode
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    if (mode === 'camera' && cameraRequested) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, cameraRequested]);

  // Draw Sacred Geometry & Firasat Landmarks on Canvas HUD
  useEffect(() => {
    let animId: number;
    let scanLineY = 0;
    let scanDirection = 1;

    const drawHUD = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && cameraActive && !capturedImage && showHUD) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;

          ctx.clearRect(0, 0, w, h);

          const bw = 24;
          const bx1 = cx - w * 0.22;
          const bx2 = cx + w * 0.22;
          const by1 = cy - h * 0.38;
          const by2 = cy + h * 0.38;

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;

          // Corner Bracket Reticles
          // Top Left
          ctx.beginPath();
          ctx.moveTo(bx1, by1 + bw);
          ctx.lineTo(bx1, by1);
          ctx.lineTo(bx1 + bw, by1);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(bx2 - bw, by1);
          ctx.lineTo(bx2, by1);
          ctx.lineTo(bx2, by1 + bw);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(bx1, by2 - bw);
          ctx.lineTo(bx1, by2);
          ctx.lineTo(bx1 + bw, by2);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(bx2 - bw, by2);
          ctx.lineTo(bx2, by2);
          ctx.lineTo(bx2, by2 - bw);
          ctx.stroke();

          if (scanTarget === 'face') {
            // 1. Center Oval Guide (Wajah Mu'tadil)
            ctx.beginPath();
            ctx.ellipse(cx, cy - 10, w * 0.22, h * 0.38, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Organ Horizontal Guides according to Ar-Razi 3-Division Proportion
            const yForehead = cy - h * 0.22;
            const yEyes = cy - h * 0.08;
            const yNose = cy + h * 0.08;
            const yMouth = cy + h * 0.22;

            drawBadge(ctx, cx - w * 0.16, yForehead, 'الجبهة', 'Dahi');
            drawBadge(ctx, cx + w * 0.14, yEyes, 'العين', 'Mata');
            drawBadge(ctx, cx - w * 0.16, yNose, 'الأنف', 'Hidung');
            drawBadge(ctx, cx + w * 0.14, yMouth, 'الفم', 'Mulut');
          } else {
            // PALM HUD RETICLE (scanTarget === 'palm_right' || scanTarget === 'palm_left')
            const isRight = scanTarget === 'palm_right';

            // Palm perimeter guideline
            ctx.beginPath();
            ctx.ellipse(cx, cy + 10, w * 0.20, h * 0.32, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // 1. Garis Kehidupan (Khathth al-Hayah) - Emerald arc curving around thumb
            ctx.beginPath();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            if (isRight) {
              ctx.arc(cx - w * 0.04, cy + h * 0.1, h * 0.14, -Math.PI * 0.6, Math.PI * 0.35);
            } else {
              ctx.arc(cx + w * 0.04, cy + h * 0.1, h * 0.14, Math.PI * 0.65, Math.PI * 1.6);
            }
            ctx.stroke();

            // 2. Garis Akal (Khathth al-Aql) - Indigo line cutting across middle
            ctx.beginPath();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.moveTo(cx - w * 0.12, cy - h * 0.02);
            ctx.lineTo(cx + w * 0.12, cy + h * 0.04);
            ctx.stroke();

            // 3. Garis Kalbu (Khathth al-Qalb) - Rose arc across upper palm
            ctx.beginPath();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 3;
            ctx.moveTo(cx + w * 0.13, cy - h * 0.14);
            ctx.quadraticCurveTo(cx, cy - h * 0.20, cx - w * 0.11, cy - h * 0.12);
            ctx.stroke();

            // Palm Badges
            drawBadge(ctx, isRight ? cx - w * 0.16 : cx + w * 0.16, cy + h * 0.14, 'خط الحياة', 'Hayah');
            drawBadge(ctx, isRight ? cx + w * 0.16 : cx - w * 0.16, cy + h * 0.03, 'خط العقل', 'Aql');
            drawBadge(ctx, isRight ? cx + w * 0.16 : cx - w * 0.16, cy - h * 0.18, 'خط القلب', 'Qalb');
            drawBadge(ctx, isRight ? cx - w * 0.14 : cx + w * 0.14, cy + h * 0.26, 'مجس الكف', 'Tekstur');

            // Top Header Badge
            const topTitle = isRight ? 'اليَدُ اليُمْنَى • Tangan Kanan (Amal)' : 'اليَدُ اليُسْرَى • Tangan Kiri (Fitrah)';
            ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            const thW = 160;
            const thH = 22;
            ctx.beginPath();
            ctx.roundRect(cx - thW / 2, by1 - 28, thW, thH, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fef3c7';
            ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(topTitle, cx, by1 - 14);
          }

          // Moving Scanner Laser Line
          scanLineY += 2.5 * scanDirection;
          if (scanLineY > by2 - 10) scanDirection = -1;
          if (scanLineY < by1 + 10) scanDirection = 1;

          const grad = ctx.createLinearGradient(bx1, scanLineY, bx2, scanLineY);
          grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
          grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.85)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = grad;
          ctx.fillRect(bx1, scanLineY - 1.5, bx2 - bx1, 3);
        }
      }
      animId = requestAnimationFrame(drawHUD);
    };

    const drawBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, arabic: string, label: string) => {
      ctx.fillStyle = 'rgba(28, 25, 23, 0.75)';
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
      ctx.lineWidth = 1;
      
      const padW = 54;
      const padH = 20;
      ctx.beginPath();
      ctx.roundRect(x - padW / 2, y - padH / 2, padW, padH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = '10px "Amiri", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${arabic} • ${label}`, x, y + 3.5);
    };

    if (cameraActive && showHUD) {
      animId = requestAnimationFrame(drawHUD);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraActive, capturedImage, showHUD, scanTarget]);

  // Capture Snapshot from Video
  const handleCapture = () => {
    if (!videoRef.current) return;
    sound.playShutter();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      sound.playLockPing();
    }
  };

  // Retake photo / Clear attachment
  const handleRetake = () => {
    sound.playClick();
    setCapturedImage(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Explicit Delete Attachment / Unlock
  const handleDeleteAttachment = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setCapturedImage(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File harus berupa gambar (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedImage(result);
        sound.playLockPing();
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute Analysis
  const runAnalysis = async () => {
    setErrorMessage(null);
    setIsAnalyzing(true);
    sound.playLockPing();

    try {
      const isPalm = scanTarget === 'palm_right' || scanTarget === 'palm_left';
      setAnalysisStep(isPalm ? 'Mendeteksi kontur telapak tangan dan alur urat...' : 'Mendeteksi landmark dan proporsi wajah...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep(isPalm ? 'Membaca Garis Hayah, Aql, & Qalb sesuai Kitab Al-Firasat...' : 'Mencocokkan tanda dahi, mata, & hidung dengan kaidah Kitab Al-Firasat...');
      await new Promise(r => setTimeout(r, 700));

      setAnalysisStep('Menghitung keseimbangan 4 Mizaj (Sanguinis, Koleris, Melankolis, Flegmatis)...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep(isPalm ? 'Mendeduksi etos amal & fitrah nurani batiniah...' : 'Menerapkan kaidah Tarjih & merumuskan nasihat akhlak...');

      let imageToSend: string | undefined = undefined;
      let finalSubjectName = subjectName.trim() || 'Subjek Analisis';

      if (mode === 'camera' || mode === 'upload') {
        imageToSend = capturedImage || undefined;
      } else if (mode === 'samples' && selectedSample) {
        imageToSend = selectedSample.imageUrl;
        finalSubjectName = selectedSample.name;
      }

      const result = await analyzeFace({
        imageBase64: imageToSend,
        subjectName: finalSubjectName,
        ageStage: ageStage,
        scanTarget: scanTarget
      });

      // Link profile ID if selected
      if (selectedProfileId) {
        result.profileId = selectedProfileId;
      }

      if (imageToSend) {
        result.imageUrl = imageToSend;
      }

      sound.playSuccessChime();
      onAnalysisComplete(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Gagal menganalisis. Silakan coba lagi.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Intro */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900/90 to-stone-950 border border-amber-900/30 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Metode Fisiognomi Rasional Klasik</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
              Pemindaian Wajah Real-Time Al-Firasat
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Membaca karakter batiniah melalui kondisi lahiriah sesuai kaidah 17 anggota tubuh, 
              proporsi kepala, dan 4 cairan tubuh (akhlath) dari Kitab Al-Firasat Imam Fakhruddin Ar-Razi.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-stone-900 border border-stone-800 rounded-xl self-stretch md:self-auto">
            <button
              onClick={() => { setMode('camera'); setCapturedImage(null); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'camera' 
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Live</span>
            </button>
            <button
              onClick={() => { setMode('upload'); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'upload' 
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Foto</span>
            </button>
            <button
              onClick={() => { setMode('samples'); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'samples' 
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Galeri Sampel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bidang Pemindaian Selector: Wajah vs Telapak Kanan vs Telapak Kiri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-lg">
        <div className="flex items-center gap-2.5 pl-1">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {scanTarget === 'face' ? <Eye className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-stone-200 block">
              {scanTarget === 'face' 
                ? 'Mode Pemindaian: Raut Wajah & Kepala' 
                : scanTarget === 'palm_right'
                ? 'Mode Pemindaian: Garis Telapak Tangan Kanan'
                : 'Mode Pemindaian: Garis Telapak Tangan Kiri'}
            </span>
            <span className="text-[10px] text-stone-400">
              {scanTarget === 'face'
                ? 'Deteksi 3 proporsi kepala, dahi, mata, hidung, & bibir'
                : scanTarget === 'palm_right'
                ? 'Al-Yad al-Yumna • Menakar etos ikhtiar nyata & kepemimpinan lahiriah'
                : 'Al-Yad al-Yusra • Menakar fitrah batiniah, daya intuisi, & ketulusan nurani'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap p-1 bg-stone-950 rounded-xl border border-stone-800 gap-1 shadow-inner">
          <button
            onClick={() => {
              sound.playClick();
              setScanTarget('face');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scanTarget === 'face'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Wajah (Al-Wajh)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setScanTarget('palm_right');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scanTarget === 'palm_right'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Telapak Kanan (Amal)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              Al-Yamin
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setScanTarget('palm_left');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scanTarget === 'palm_left'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-cyan-400 transform -scale-x-100" />
            <span>Telapak Kiri (Fitrah)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              Al-Yusra
            </span>
          </button>
        </div>
      </div>

      {/* Main Scanner Stage & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Scanner Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl flex items-center justify-center">
            
            {/* Mode 1: Camera Live */}
            {mode === 'camera' && (
              <>
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="absolute inset-0 w-full h-full object-cover mirror"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />
                    {!cameraActive && !cameraError && !cameraRequested && (
                      <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm z-20 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          {scanTarget === 'face' ? <Camera className="w-7 h-7" /> : <Hand className="w-7 h-7" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-100">
                            {scanTarget === 'face' 
                              ? 'Pemindaian Wajah Kamera Langsung' 
                              : scanTarget === 'palm_right' 
                              ? 'Pemindaian Telapak Tangan Kanan (Kamera)' 
                              : 'Pemindaian Telapak Tangan Kiri (Kamera)'}
                          </h4>
                          <p className="text-xs text-stone-400 mt-1">
                            {scanTarget === 'face'
                              ? 'Klik tombol di bawah untuk mengizinkan kamera. Anda juga dapat memilih sampel atau unggah foto tanpa webcam.'
                              : 'Arahkan telapak tangan tegak lurus menghadap kamera hingga pas di dalam bingkai panduan garis tangan.'}
                          </p>
                        </div>
                        <button
                          onClick={() => { setCameraRequested(true); startCamera(); }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Buka & Izinkan Kamera</span>
                        </button>
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <button
                            onClick={() => setMode('samples')}
                            className="text-amber-400/90 hover:text-amber-300 underline cursor-pointer"
                          >
                            Gunakan Galeri Sampel
                          </button>
                          <span className="text-stone-600">•</span>
                          <button
                            onClick={() => setMode('upload')}
                            className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
                          >
                            Unggah Foto
                          </button>
                        </div>
                      </div>
                    )}
                    {!cameraActive && !cameraError && cameraRequested && (
                      <div className="flex flex-col items-center gap-2 text-stone-400 z-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                        <span className="text-xs">Menghubungkan kamera peramban...</span>
                      </div>
                    )}
                    {cameraError && (
                      <div className="p-6 text-center max-w-md z-20 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-200">Akses Kamera Belum Aktif</h4>
                          <p className="text-xs text-stone-300 mt-1 leading-relaxed">{cameraError}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => { setCameraRequested(true); startCamera(); }}
                            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Coba Lagi
                          </button>
                          <button
                            onClick={() => setMode('samples')}
                            className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer"
                          >
                            Gunakan Galeri Sampel
                          </button>
                          <button
                            onClick={() => setMode('upload')}
                            className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer"
                          >
                            Unggah Foto
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                      <div className="px-3 py-1.5 rounded-xl bg-stone-950/85 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Foto Terkunci & Siap Dianalisis</span>
                      </div>
                      <button
                        onClick={handleDeleteAttachment}
                        title="Hapus Lampiran Foto & Buka Kunci"
                        className="px-3 py-1.5 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus / Buka Kunci</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* HUD Top-Bar Control */}
                {cameraActive && !capturedImage && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <button
                      onClick={() => setShowHUD(!showHUD)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium backdrop-blur-md transition-all ${
                        showHUD 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-stone-950/70 text-stone-400 border border-stone-800'
                      }`}
                    >
                      <ScanLine className="w-3 h-3 inline mr-1" />
                      {showHUD ? 'HUD Aktif' : 'HUD Nonaktif'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Upload Image */}
            {mode === 'upload' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Uploaded face"
                      className="w-full h-full object-cover rounded-xl"
                    />

                    {/* Menu Hapus Lampiran Top-Right Icon Button */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={handleDeleteAttachment}
                        title="Hapus Lampiran Gambar"
                        className="px-3 py-1.5 rounded-xl bg-stone-950/85 hover:bg-rose-950/90 border border-stone-700 hover:border-rose-500/50 text-stone-200 hover:text-rose-200 shadow-xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Hapus Lampiran</span>
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white rounded-lg text-xs font-medium border border-stone-700 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
                      >
                        Ganti Foto
                      </button>
                      <button
                        onClick={handleDeleteAttachment}
                        title="Hapus Lampiran Gambar"
                        className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-lg text-xs font-medium border border-rose-800/60 shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-stone-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-stone-950/40 hover:bg-stone-900/40 transition-colors p-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-stone-200">
                      Pilih atau Seret Foto Wajah ke Sini
                    </span>
                    <span className="text-xs text-stone-400 mt-1 max-w-sm">
                      Mendukung format JPG, PNG, atau WebP. Pastikan wajah menghadap depan dengan pencahayaan jelas.
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Mode 3: Sample Gallery */}
            {mode === 'samples' && selectedSample && (
              <div className="relative w-full h-full">
                <img
                  src={selectedSample.imageUrl}
                  alt={selectedSample.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent flex flex-col justify-end p-5">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                    {selectedSample.dominantMizaj} • {selectedSample.iTidalStatus}
                  </span>
                  <h4 className="text-lg font-bold text-white">{selectedSample.name}</h4>
                  <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                    {selectedSample.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Bottom Action Toolbar */}
          <div className="mt-3 flex items-center justify-between gap-3">
            {mode === 'camera' && !capturedImage ? (
              !cameraActive ? (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => { setCameraRequested(true); startCamera(); }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Aktifkan Kamera Live</span>
                  </button>
                  <button
                    onClick={() => setMode('samples')}
                    className="py-3 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-xs border border-stone-800 transition-all cursor-pointer"
                  >
                    Pilih Sampel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCapture}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {scanTarget === 'face' 
                      ? 'Ambil Foto Wajah (Kunci Deteksi)' 
                      : scanTarget === 'palm_right'
                      ? 'Ambil Foto Telapak Kanan (Kunci Garis)'
                      : 'Ambil Foto Telapak Kiri (Kunci Garis)'}
                  </span>
                </button>
              )
            ) : (mode === 'camera' && capturedImage) ? (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleDeleteAttachment}
                  title="Hapus foto dan buka kunci kamera kembali"
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-950/80 text-stone-300 hover:text-rose-200 text-xs font-semibold border border-stone-800 hover:border-rose-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hapus / Buka Kunci</span>
                </button>
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Menganalisis Kitab...' : 'Mulai Analisis Al-Firasat'}</span>
                </button>
              </div>
            ) : mode === 'upload' && capturedImage ? (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleDeleteAttachment}
                  title="Hapus lampiran gambar dan pilih ulang"
                  className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-rose-950/80 text-stone-300 hover:text-rose-200 text-xs sm:text-sm font-semibold border border-stone-800 hover:border-rose-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Hapus Lampiran</span>
                </button>
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Menganalisis Kitab...' : 'Mulai Analisis Al-Firasat'}</span>
                </button>
              </div>
            ) : mode === 'samples' ? (
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Menganalisis Sampel...' : `Analisis Sampel: ${selectedSample?.name}`}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Right Column: Subject Config & Real-Time Alignment Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Metadata Card */}
          <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Data Subjek yang Dianalisis</span>
            </h3>

            {/* Link to existing profile or type name */}
            <div>
              <label className="block text-[11px] font-medium text-stone-400 mb-1">
                Pilih dari Profil Basis Data (Opsional)
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="">-- Subjek Baru (Tanpa Profil Tersimpan) --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-400 mb-1">
                Nama Orang yang Dianalisis
              </label>
              <input
                type="text"
                placeholder="Contoh: Muhammad Razi, Fatimah, dll."
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-400 mb-1">
                Tahapan Usia (Bab II Kitab Al-Firasat)
              </label>
              <select
                value={ageStage}
                onChange={(e) => setAgeStage(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Pertumbuhan">Usia Pertumbuhan / Anak-anak (Panas-Lembap Alami)</option>
                <option value="Remaja">Usia Remaja (Panas-Kering, Idealis & Emosional)</option>
                <option value="Paruh Baya (Kuhulah)">Usia Paruh Baya / Kuhulah (Kematangan Akal Seimbang)</option>
                <option value="Usia Lanjut (Syaikhukhah)">Usia Tua / Syaikhukhah (Dingin-Kering, Bijak & Berpengalaman)</option>
              </select>
              <p className="text-[10px] text-stone-500 mt-1">
                *Imam Ar-Razi menguraikan bahwa watak alami manusia bergeser secara bertahap seiring 4 tahapan usia.
              </p>
            </div>
          </div>

          {/* Sample Selectors if in Samples Mode */}
          {mode === 'samples' && (
            <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-4 space-y-2">
              <span className="text-xs font-semibold text-stone-300">Pilih Tipe Karakter Sampel:</span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PORTRAITS.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => { 
                      sound.playClick();
                      setSelectedSample(sample); 
                      setSubjectName(sample.name); 
                      if ((sample as any).scanTarget) {
                        setScanTarget((sample as any).scanTarget);
                      } else {
                        setScanTarget('face');
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      selectedSample?.id === sample.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-semibold truncate">{sample.name.split(' (')[0]}</p>
                      <p className="text-[9px] text-amber-400 capitalize">{sample.dominantMizaj}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Classical Firasat Inspection Checklist */}
          <div className="rounded-2xl bg-stone-900/60 border border-stone-800/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Titik Fokus Analisis Firasat</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">17 Organ Kitab</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Dahi (Nalar & Memori)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Mata (Kecerdikan Jiwa)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Hidung (Kewibawaan)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Bibir (Tutur & Hasrat)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Telinga (Daya Ingat & Simak)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Proporsi Wajah (I'tidal)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/50 col-span-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>4 Mizaj (Sanguinis, Koleris, Melankolis, Flegmatis)</span>
              </div>
            </div>
          </div>

          {/* Analysis Loading State */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  Memproses Firasat Ar-Razi...
                </p>
                <p className="text-[11px] text-amber-300/80">
                  {analysisStep}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
