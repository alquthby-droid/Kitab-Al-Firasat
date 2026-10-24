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
  Hand,
  Target,
  Lightbulb,
  Sun,
  SunDim,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minimize2,
  FileSpreadsheet,
  CloudLightning
} from 'lucide-react';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { SAMPLE_PORTRAITS } from '../data/kitabFirasatData';
import { analyzeFace } from '../services/api';
import { sound } from '../services/sound';
import { getAutoSyncSettings } from '../services/googleSheets';

export interface SmartTipState {
  status: 'optimal' | 'guidance' | 'warning';
  title: string;
  advice: string;
  lightingStatus: 'Cahaya Redup' | 'Cahaya Optimal' | 'Terlalu Terang';
  lightingLevel: 'low' | 'good' | 'high';
  angleStatus: 'Kamera Rendah' | 'Sejajar Mata' | 'Kamera Tinggi';
  angleLevel: 'low' | 'good' | 'high';
  centeringStatus: 'Geser Kanan' | 'Tengah Sempurna' | 'Geser Kiri';
  centeringLevel: 'left' | 'centered' | 'right';
  distanceStatus: 'Terlalu Jauh' | 'Jarak Pas' | 'Terlalu Dekat';
  distanceLevel: 'far' | 'ideal' | 'close';
  iconType: 'sun_dim' | 'sun' | 'arrow_up' | 'arrow_down' | 'arrow_left' | 'arrow_right' | 'check' | 'lightbulb' | 'maximize' | 'minimize';
}

export const defaultSmartTip: SmartTipState = {
  status: 'optimal',
  title: 'Pencahayaan & Posisi Optimal',
  advice: 'Posisikan wajah tepat di dalam bingkai oval dengan pandangan rileks sejajar kamera.',
  lightingStatus: 'Cahaya Optimal',
  lightingLevel: 'good',
  angleStatus: 'Sejajar Mata',
  angleLevel: 'good',
  centeringStatus: 'Tengah Sempurna',
  centeringLevel: 'centered',
  distanceStatus: 'Jarak Pas',
  distanceLevel: 'ideal',
  iconType: 'check'
};

interface FaceScannerProps {
  profiles: SubjectProfile[];
  onAnalysisComplete: (result: FirasatAnalysisResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({
  profiles,
  onAnalysisComplete,
  onNavigateToTab
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
  const [showSmartTips, setShowSmartTips] = useState<boolean>(true);
  const [smartTip, setSmartTip] = useState<SmartTipState>(defaultSmartTip);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Frame Analysis for Smart Tips (Brightness, Camera Elevation, Centering & Distance)
  useEffect(() => {
    if (!cameraActive || capturedImage || !showSmartTips) return;

    let isMounted = true;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      if (!analysisCanvasRef.current) {
        analysisCanvasRef.current = document.createElement('canvas');
      }
      const canvas = analysisCanvasRef.current;
      const sampleW = 160;
      const sampleH = 120;
      if (canvas.width !== sampleW || canvas.height !== sampleH) {
        canvas.width = sampleW;
        canvas.height = sampleH;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      try {
        ctx.drawImage(video, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
        const data = imgData.data;

        let totalLuma = 0;
        let weightedY = 0;
        let weightedX = 0;
        let totalWeight = 0;

        let topLuma = 0;
        let midLuma = 0;
        let botLuma = 0;
        let topCount = 0;
        let midCount = 0;
        let botCount = 0;

        let leftLuma = 0;
        let rightLuma = 0;
        let leftCount = 0;
        let rightCount = 0;

        let borderLuma = 0;
        let borderCount = 0;
        let centerLuma = 0;
        let centerCount = 0;

        const totalPixels = sampleW * sampleH;

        for (let y = 0; y < sampleH; y++) {
          for (let x = 0; x < sampleW; x++) {
            const idx = (y * sampleW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            totalLuma += luma;

            const weight = Math.max(1, luma);
            weightedY += y * weight;
            weightedX += x * weight;
            totalWeight += weight;

            if (y < sampleH * 0.33) {
              topLuma += luma;
              topCount++;
            } else if (y < sampleH * 0.66) {
              midLuma += luma;
              midCount++;
            } else {
              botLuma += luma;
              botCount++;
            }

            if (x < sampleW * 0.5) {
              leftLuma += luma;
              leftCount++;
            } else {
              rightLuma += luma;
              rightCount++;
            }

            const isBorder = x < sampleW * 0.15 || x > sampleW * 0.85 || y < sampleH * 0.15 || y > sampleH * 0.85;
            if (isBorder) {
              borderLuma += luma;
              borderCount++;
            } else if (x > sampleW * 0.3 && x < sampleW * 0.7 && y > sampleH * 0.25 && y < sampleH * 0.75) {
              centerLuma += luma;
              centerCount++;
            }
          }
        }

        const avgLuma = totalLuma / totalPixels;
        const cyNorm = totalWeight > 0 ? (weightedY / totalWeight) / sampleH : 0.5;
        const cxNorm = totalWeight > 0 ? (weightedX / totalWeight) / sampleW : 0.5;

        const avgBorder = borderCount > 0 ? borderLuma / borderCount : 0;
        const avgCenter = centerCount > 0 ? centerLuma / centerCount : 0;

        let lightingStatus: SmartTipState['lightingStatus'] = 'Cahaya Optimal';
        let lightingLevel: SmartTipState['lightingLevel'] = 'good';
        let angleStatus: SmartTipState['angleStatus'] = 'Sejajar Mata';
        let angleLevel: SmartTipState['angleLevel'] = 'good';
        let centeringStatus: SmartTipState['centeringStatus'] = 'Tengah Sempurna';
        let centeringLevel: SmartTipState['centeringLevel'] = 'centered';
        let distanceStatus: SmartTipState['distanceStatus'] = 'Jarak Pas';
        let distanceLevel: SmartTipState['distanceLevel'] = 'ideal';

        let status: SmartTipState['status'] = 'optimal';
        let title = 'Pencahayaan & Posisi Optimal';
        let advice = 'Posisi wajah dan pencahayaan sangat baik sesuai standar Al-Firasat. Siap mengambil foto!';
        let iconType: SmartTipState['iconType'] = 'check';

        // 1. Lighting Check
        if (avgLuma < 52) {
          lightingStatus = 'Cahaya Redup';
          lightingLevel = 'low';
          status = 'warning';
          title = 'Cahaya Terlalu Redup';
          advice = 'Cahaya di sekitar wajah kurang terang. Hadapkan wajah ke arah sumber cahaya agar rona kulit tampak jelas.';
          iconType = 'sun_dim';
        } else if (avgLuma > 215) {
          lightingStatus = 'Terlalu Terang';
          lightingLevel = 'high';
          status = 'warning';
          title = 'Cahaya Terlalu Silau';
          advice = 'Pencahayaan berlebih (overexposure). Hindari lampu sorot langsung ke arah lensa kamera.';
          iconType = 'sun';
        }

        // 2. Vertical Camera Elevation Check
        const botRatio = (botLuma / (botCount || 1)) / (avgLuma || 1);
        const topRatio = (topLuma / (topCount || 1)) / (avgLuma || 1);

        if (status === 'optimal') {
          if (cyNorm > 0.58 || botRatio > 1.35) {
            angleStatus = 'Kamera Rendah';
            angleLevel = 'low';
            status = 'guidance';
            title = 'Tinggikan Kamera Sedikit';
            advice = 'Tinggikan posisi kamera atau ganjal perangkat agar lensa sejajar dengan tinggi mata (hindari sudut dari bawah).';
            iconType = 'arrow_up';
          } else if (cyNorm < 0.40 || topRatio > 1.35) {
            angleStatus = 'Kamera Tinggi';
            angleLevel = 'high';
            status = 'guidance';
            title = 'Rendahkan Kamera Sedikit';
            advice = 'Rendahkan sudut kamera sedikit atau tegakkan kepala agar raut muka terlihat seimbang.';
            iconType = 'arrow_down';
          }
        }

        // 3. Centering Check
        if (cxNorm < 0.43) {
          centeringStatus = 'Geser Kiri';
          centeringLevel = 'left';
          if (status === 'optimal') {
            status = 'guidance';
            title = 'Posisikan ke Tengah';
            advice = 'Geser posisi wajah sedikit ke arah tengah bingkai oval panduan.';
            iconType = 'arrow_right';
          }
        } else if (cxNorm > 0.57) {
          centeringStatus = 'Geser Kanan';
          centeringLevel = 'right';
          if (status === 'optimal') {
            status = 'guidance';
            title = 'Posisikan ke Tengah';
            advice = 'Geser posisi wajah sedikit ke arah tengah bingkai oval panduan.';
            iconType = 'arrow_left';
          }
        }

        // 4. Distance / Framing Check
        if (avgBorder > 150 && avgCenter > 150 && Math.abs(avgBorder - avgCenter) < 15) {
          distanceStatus = 'Terlalu Dekat';
          distanceLevel = 'close';
          if (status === 'optimal') {
            status = 'guidance';
            title = 'Mundur Sedikit';
            advice = 'Mundur sedikit dari kamera agar dahi, telinga, dan dagu masuk seutuhnya ke dalam bingkai.';
            iconType = 'maximize';
          }
        }

        // Target palm adjustments
        if (scanTarget !== 'face') {
          if (status === 'optimal') {
            title = 'Posisi Telapak Optimal';
            advice = 'Telapak tangan tegak lurus dan garis tangan terlihat jelas di dalam retikel panduan.';
          } else if (title === 'Tinggikan Kamera Sedikit' || title === 'Rendahkan Kamera Sedikit') {
            advice = 'Sejajarkan telapak tangan menghadap tegak lurus ke arah lensa kamera.';
          }
        }

        if (isMounted) {
          setSmartTip({
            status,
            title,
            advice,
            lightingStatus,
            lightingLevel,
            angleStatus,
            angleLevel,
            centeringStatus,
            centeringLevel,
            distanceStatus,
            distanceLevel,
            iconType
          });
        }
      } catch {
        // frame processing non-fatal
      }
    }, 450);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cameraActive, capturedImage, showSmartTips, scanTarget]);

  // Analyze uploaded image brightness and quality
  useEffect(() => {
    if (mode === 'upload' && capturedImage) {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 100;
        c.height = 100;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 100, 100);
          const data = ctx.getImageData(0, 0, 100, 100).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          }
          const avg = sum / (100 * 100);
          if (avg < 50) {
            setSmartTip({
              ...defaultSmartTip,
              status: 'warning',
              title: 'Foto Cenderung Redup',
              advice: 'Foto memiliki pencahayaan agak gelap. Untuk akurasi rona wajah Ar-Razi, disarankan foto dengan cahaya merata.',
              lightingStatus: 'Cahaya Redup',
              lightingLevel: 'low',
              iconType: 'sun_dim'
            });
          } else {
            setSmartTip({
              ...defaultSmartTip,
              status: 'optimal',
              title: 'Kualitas Foto Baik',
              advice: 'Pencahayaan foto seimbang dan fitur wajah siap didekonstruksi sesuai kaidah fisiognomi klasik.',
              lightingStatus: 'Cahaya Optimal',
              lightingLevel: 'good',
              iconType: 'check'
            });
          }
        }
      };
      img.src = capturedImage;
    }
  }, [mode, capturedImage]);

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

  // Image Upload handler (with fast client-side resizing to max 1280px)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File harus berupa gambar (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setCapturedImage(optimized);
          } else {
            setCapturedImage(rawResult);
          }
          sound.playLockPing();
        };
        img.onerror = () => {
          setCapturedImage(rawResult);
          sound.playLockPing();
        };
        img.src = rawResult;
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

      {/* Challenge Mode Callout Banner */}
      {onNavigateToTab && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-900/30 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>Ingin Menguji Ketajaman Firasat Anda Terlebih Dahulu?</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                  Mode Latihan
                </span>
              </h4>
              <p className="text-[11px] text-stone-400">
                Tebak temperamen Mizaj wajah acak sebelum melihat hasil AI untuk melatih intuisi basirah Ar-Razi.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('challenge')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Target className="w-4 h-4" />
            <span>Mulai Challenge Mode</span>
          </button>
        </div>
      )}

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

                {/* HUD Top-Bar Controls */}
                {cameraActive && !capturedImage && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSmartTips(!showSmartTips)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                        showSmartTips 
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50' 
                          : 'bg-stone-950/70 text-stone-400 border border-stone-800'
                      }`}
                      title="Nyalakan/matikan rekomendasi posisi wajah real-time"
                    >
                      <Lightbulb className={`w-3.5 h-3.5 ${showSmartTips ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                      <span>{showSmartTips ? 'Smart Tips: ON' : 'Smart Tips: OFF'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHUD(!showHUD)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer ${
                        showHUD 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-stone-950/70 text-stone-400 border border-stone-800'
                      }`}
                    >
                      <ScanLine className="w-3 h-3 inline mr-1" />
                      {showHUD ? 'HUD: ON' : 'HUD: OFF'}
                    </button>
                  </div>
                )}

                {/* Real-Time Smart Tips Floating Banner Overlay */}
                {cameraActive && !capturedImage && showSmartTips && (
                  <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300 ${
                      smartTip.status === 'optimal'
                        ? 'bg-stone-950/85 border-emerald-500/40 shadow-emerald-950/30'
                        : smartTip.status === 'warning'
                        ? 'bg-stone-950/90 border-red-500/50 shadow-red-950/30'
                        : 'bg-stone-950/90 border-amber-500/50 shadow-amber-950/40'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-stone-800/80">
                        <div className="flex items-center gap-1.5">
                          <div className={`p-1 rounded-md ${
                            smartTip.status === 'optimal'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : smartTip.status === 'warning'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <span>Smart Tips Real-Time</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                          </span>
                        </div>

                        {/* Real-time mini status indicators */}
                        <div className="flex items-center gap-1 text-[9px]">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            smartTip.lightingLevel === 'good'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}>
                            {smartTip.lightingStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            smartTip.angleLevel === 'good'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}>
                            {smartTip.angleStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 p-2 rounded-xl border ${
                          smartTip.status === 'optimal'
                            ? 'bg-emerald-950/60 border-emerald-500/40'
                            : smartTip.status === 'warning'
                            ? 'bg-red-950/60 border-red-500/40'
                            : 'bg-amber-950/60 border-amber-500/40'
                        }`}>
                          {smartTip.iconType === 'sun_dim' && <SunDim className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'sun' && <Sun className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'arrow_up' && <ArrowUp className="w-4 h-4 text-amber-400 animate-bounce" />}
                          {smartTip.iconType === 'arrow_down' && <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />}
                          {smartTip.iconType === 'arrow_left' && <ArrowLeft className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'arrow_right' && <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'maximize' && <Maximize2 className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'minimize' && <Minimize2 className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {smartTip.iconType === 'check' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {smartTip.iconType === 'lightbulb' && <Lightbulb className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight ${
                            smartTip.status === 'optimal'
                              ? 'text-emerald-300'
                              : smartTip.status === 'warning'
                              ? 'text-red-300'
                              : 'text-amber-200'
                          }`}>
                            {smartTip.title}
                          </p>
                          <p className="text-[11px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                            {smartTip.advice}
                          </p>
                        </div>
                      </div>
                    </div>
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

            {/* Auto-Sync to Google Sheets 'Al-Firasat Records' status indicator */}
            {getAutoSyncSettings().enabled && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <div>
                    <span className="font-bold block text-emerald-200">Auto-Sync Google Sheets Aktif</span>
                    <span className="text-[10px] text-stone-400">Hasil pemindaian otomatis ditambahkan ke tab 'Al-Firasat Records'</span>
                  </div>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-emerald-400/80 shrink-0" />
              </div>
            )}
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

          {/* Smart Tips & Real-Time Alignment Guide */}
          <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">
                    Smart Tips: Presisi Fisiognomi Ar-Razi
                  </h4>
                  <p className="text-[10px] text-stone-400">
                    {mode === 'camera' && cameraActive && !capturedImage
                      ? 'Analisis posisi wajah langsung terdeteksi'
                      : 'Kaidah pemindaian untuk akurasi optimal'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                smartTip.status === 'optimal'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
              }`}>
                {smartTip.status === 'optimal' ? 'Kondisi Ideal' : 'Perlu Penyesuaian'}
              </span>
            </div>

            {/* Current Active Advice Banner */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              smartTip.status === 'optimal'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : smartTip.status === 'warning'
                ? 'bg-red-950/30 border-red-500/30 text-red-200'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <div className="shrink-0">
                {smartTip.iconType === 'sun_dim' && <SunDim className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'sun' && <Sun className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'arrow_up' && <ArrowUp className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'arrow_down' && <ArrowDown className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'arrow_left' && <ArrowLeft className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'arrow_right' && <ArrowRight className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'maximize' && <Maximize2 className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'minimize' && <Minimize2 className="w-4 h-4 text-amber-400" />}
                {smartTip.iconType === 'check' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {smartTip.iconType === 'lightbulb' && <Lightbulb className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold block text-[11px]">{smartTip.title}</span>
                <span className="text-[10px] text-stone-300 leading-tight block">{smartTip.advice}</span>
              </div>
            </div>

            {/* 4 Pillars of Precision Indicators */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* 1. Pencahayaan */}
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <span>Pencahayaan</span>
                  <Sun className="w-3 h-3 text-amber-400" />
                </div>
                <span className={`font-semibold ${
                  smartTip.lightingLevel === 'good' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {smartTip.lightingStatus}
                </span>
              </div>

              {/* 2. Sudut Kamera */}
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <span>Tinggi Kamera</span>
                  <ArrowUp className="w-3 h-3 text-amber-400" />
                </div>
                <span className={`font-semibold ${
                  smartTip.angleLevel === 'good' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {smartTip.angleStatus}
                </span>
              </div>

              {/* 3. Posisi Tengah */}
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <span>Kesejajaran</span>
                  <Eye className="w-3 h-3 text-amber-400" />
                </div>
                <span className={`font-semibold ${
                  smartTip.centeringLevel === 'centered' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {smartTip.centeringStatus}
                </span>
              </div>

              {/* 4. Jarak Bingkai */}
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-400 mb-1">
                  <span>Jarak Wajah</span>
                  <Maximize2 className="w-3 h-3 text-amber-400" />
                </div>
                <span className={`font-semibold ${
                  smartTip.distanceLevel === 'ideal' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {smartTip.distanceStatus}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-stone-500 italic border-t border-stone-800/60 pt-2">
              "Kebenaran firasat bertumpu pada pengamatan kondisi alami wajah yang bebas dari distorsi sudut dan kegelapan bayangan." — Kitab Al-Firasat Imam Fakhruddin Ar-Razi.
            </p>
          </div>

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
