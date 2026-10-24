import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  Square,
  Sparkles,
  ExternalLink,
  Flame,
  Droplets,
  Wind,
  Mountain,
  QrCode,
  Layers,
  Palette,
  Image as ImageIcon,
  MessageCircle,
  Twitter,
  Send,
  Linkedin
} from 'lucide-react';
import QRCode from 'qrcode';
import { FirasatAnalysisResult, TemperamentType } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { sound } from '../services/sound';
import { toHijri } from '../services/hijriCalendar';

export type CardFormat = 'square' | 'story' | 'landscape';
export type CardTheme = 'obsidian' | 'parchment' | 'elemental';

interface ShareAnalysisModalProps {
  result: FirasatAnalysisResult;
  onClose: () => void;
}

export const ShareAnalysisModal: React.FC<ShareAnalysisModalProps> = ({
  result,
  onClose
}) => {
  const [format, setFormat] = useState<CardFormat>('square');
  const [theme, setTheme] = useState<CardTheme>('obsidian');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mizaj = MIZAJ_DATA[result.dominantMizaj] || MIZAJ_DATA.sanguinis;

  // App URL for sharing and QR code
  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?ref=share&mizaj=${result.dominantMizaj}`
    : 'https://al-firasat-ai.web.app';

  // Check if Web Share API is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Generate QR Code data URL
  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: theme === 'parchment' ? '#3d240f' : '#fbbf24',
        light: theme === 'parchment' ? '#fdf8ec' : '#1c1917'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [appUrl, theme]);

  // Theme styling helpers
  const getThemeColors = () => {
    if (theme === 'parchment') {
      return {
        bg: 'from-[#fbf4e6] via-[#f7ebd4] to-[#ebd8b7]',
        cardBg: '#f7ebd4',
        border: 'border-[#b89562]',
        borderColor: '#b89562',
        innerBorderColor: '#c7a778',
        textPrimary: 'text-[#36220f]',
        textSecondary: 'text-[#6e5033]',
        accent: '#965a1e',
        badgeBg: 'bg-[#ebd5b3]',
        badgeText: 'text-[#61360c]',
        goldGlow: 'rgba(184, 149, 98, 0.4)'
      };
    }
    if (theme === 'elemental') {
      const elementalMap: Record<TemperamentType, {
        bg: string;
        cardBg: string;
        border: string;
        borderColor: string;
        innerBorderColor: string;
        textPrimary: string;
        textSecondary: string;
        accent: string;
        badgeBg: string;
        badgeText: string;
        goldGlow: string;
      }> = {
        koleris: {
          bg: 'from-[#1c0a08] via-[#2c100c] to-[#170705]',
          cardBg: '#220c09',
          border: 'border-red-700/60',
          borderColor: '#b91c1c',
          innerBorderColor: '#f87171',
          textPrimary: 'text-red-50',
          textSecondary: 'text-red-200/80',
          accent: '#ef4444',
          badgeBg: 'bg-red-950/80',
          badgeText: 'text-red-300',
          goldGlow: 'rgba(239, 68, 68, 0.35)'
        },
        sanguinis: {
          bg: 'from-[#1a1204] via-[#291b05] to-[#140e03]',
          cardBg: '#231705',
          border: 'border-amber-600/60',
          borderColor: '#d97706',
          innerBorderColor: '#fbbf24',
          textPrimary: 'text-amber-50',
          textSecondary: 'text-amber-200/80',
          accent: '#f59e0b',
          badgeBg: 'bg-amber-950/80',
          badgeText: 'text-amber-300',
          goldGlow: 'rgba(245, 158, 11, 0.35)'
        },
        flegmatis: {
          bg: 'from-[#05171a] via-[#07242a] to-[#041215]',
          cardBg: '#082025',
          border: 'border-cyan-700/60',
          borderColor: '#0e7490',
          innerBorderColor: '#22d3ee',
          textPrimary: 'text-cyan-50',
          textSecondary: 'text-cyan-200/80',
          accent: '#06b6d4',
          badgeBg: 'bg-cyan-950/80',
          badgeText: 'text-cyan-300',
          goldGlow: 'rgba(6, 182, 212, 0.35)'
        },
        melankolis: {
          bg: 'from-[#120a1f] via-[#1d1033] to-[#0d0717]',
          cardBg: '#180d2b',
          border: 'border-purple-700/60',
          borderColor: '#7e22ce',
          innerBorderColor: '#c084fc',
          textPrimary: 'text-purple-50',
          textSecondary: 'text-purple-200/80',
          accent: '#a855f7',
          badgeBg: 'bg-purple-950/80',
          badgeText: 'text-purple-300',
          goldGlow: 'rgba(168, 85, 247, 0.35)'
        }
      };
      return elementalMap[result.dominantMizaj] || elementalMap.sanguinis;
    }
    // Default Obsidian Dark Luxury
    return {
      bg: 'from-stone-950 via-stone-900 to-black',
      cardBg: '#14120e',
      border: 'border-amber-500/40',
      borderColor: '#d97706',
      innerBorderColor: '#f59e0b',
      textPrimary: 'text-stone-100',
      textSecondary: 'text-stone-300/80',
      accent: '#f59e0b',
      badgeBg: 'bg-amber-500/10',
      badgeText: 'text-amber-300',
      goldGlow: 'rgba(245, 158, 11, 0.3)'
    };
  };

  const themeColors = getThemeColors();

  // Helper icon for element
  const renderElementIcon = () => {
    switch (result.dominantMizaj) {
      case 'koleris':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'flegmatis':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'melankolis':
        return <Mountain className="w-4 h-4 text-purple-400" />;
      case 'sanguinis':
      default:
        return <Wind className="w-4 h-4 text-amber-400" />;
    }
  };

  // Draw full high-resolution Canvas for PNG export
  const renderCardToCanvas = async (targetCanvas: HTMLCanvasElement): Promise<void> => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1080;
    if (format === 'story') {
      width = 1080;
      height = 1920;
    } else if (format === 'landscape') {
      width = 1200;
      height = 675;
    }

    targetCanvas.width = width;
    targetCanvas.height = height;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (theme === 'parchment') {
      bgGrad.addColorStop(0, '#fbf4e6');
      bgGrad.addColorStop(0.5, '#f7ebd4');
      bgGrad.addColorStop(1, '#ebd8b7');
    } else if (theme === 'elemental') {
      if (result.dominantMizaj === 'koleris') {
        bgGrad.addColorStop(0, '#1a0806');
        bgGrad.addColorStop(0.5, '#2c0f0b');
        bgGrad.addColorStop(1, '#150604');
      } else if (result.dominantMizaj === 'flegmatis') {
        bgGrad.addColorStop(0, '#041518');
        bgGrad.addColorStop(0.5, '#07242a');
        bgGrad.addColorStop(1, '#031013');
      } else if (result.dominantMizaj === 'melankolis') {
        bgGrad.addColorStop(0, '#11091e');
        bgGrad.addColorStop(0.5, '#1e0f36');
        bgGrad.addColorStop(1, '#0c0615');
      } else {
        bgGrad.addColorStop(0, '#191104');
        bgGrad.addColorStop(0.5, '#281a05');
        bgGrad.addColorStop(1, '#130d03');
      }
    } else {
      bgGrad.addColorStop(0, '#0f0e0c');
      bgGrad.addColorStop(0.5, '#171410');
      bgGrad.addColorStop(1, '#080807');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Borders
    const padding = format === 'story' ? 44 : 36;
    ctx.strokeStyle = themeColors.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Inner thin border
    ctx.strokeStyle = themeColors.innerBorderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding + 10, padding + 10, width - (padding + 10) * 2, height - (padding + 10) * 2);

    // Corner Ornaments
    const drawCorner = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = themeColors.innerBorderColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 0);
      ctx.lineTo(26, 8);
      ctx.lineTo(8, 8);
      ctx.lineTo(8, 26);
      ctx.lineTo(0, 26);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(14, 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCorner(padding + 14, padding + 14, 0);
    drawCorner(width - padding - 14, padding + 14, Math.PI / 2);
    drawCorner(width - padding - 14, height - padding - 14, Math.PI);
    drawCorner(padding + 14, height - padding - 14, (Math.PI * 3) / 2);

    // Header Calligraphy & Title
    ctx.textAlign = 'center';
    ctx.fillStyle = theme === 'parchment' ? '#36220f' : '#fbbf24';
    ctx.font = 'bold 22px serif';
    ctx.fillText('فِرَاسَةُ الإِمَامِ الرَّازِي • ILMU TABIAT & WATAK KLASIK', width / 2, padding + 54);

    ctx.fillStyle = theme === 'parchment' ? '#784d24' : '#e5e7eb';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('KARTU KARAKTER & TEMPERAMEN', width / 2, padding + 100);

    ctx.fillStyle = theme === 'parchment' ? '#966a3b' : '#9ca3af';
    ctx.font = '16px sans-serif';
    ctx.fillText('Berdasarkan Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi (554-606 H)', width / 2, padding + 130);

    // Horizontal Separator Line
    ctx.strokeStyle = theme === 'parchment' ? '#c7a778' : 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding + 60, padding + 146);
    ctx.lineTo(width - padding - 60, padding + 146);
    ctx.stroke();

    // Subject Avatar / Photo & Info
    const avatarY = padding + (format === 'story' ? 240 : 210);
    const avatarRadius = format === 'story' ? 70 : 60;
    const avatarX = format === 'landscape' ? padding + 120 : width / 2;

    // Draw Avatar
    let avatarLoaded = false;
    if (result.imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
              img,
              avatarX - avatarRadius,
              avatarY - avatarRadius,
              avatarRadius * 2,
              avatarRadius * 2
            );
            ctx.restore();
            avatarLoaded = true;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = result.imageUrl!;
        });
      } catch {
        avatarLoaded = false;
      }
    }

    if (!avatarLoaded) {
      // Monogram circle
      ctx.fillStyle = theme === 'parchment' ? '#eed6b3' : 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme === 'parchment' ? '#784d24' : '#fbbf24';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(result.subjectName.charAt(0).toUpperCase(), avatarX, avatarY);
      ctx.textBaseline = 'alphabetic';
    }

    // Avatar ring
    ctx.strokeStyle = themeColors.borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Subject Name & Details
    const nameY = format === 'landscape' ? avatarY - 20 : avatarY + avatarRadius + 40;
    const infoX = format === 'landscape' ? padding + 230 : width / 2;
    ctx.textAlign = format === 'landscape' ? 'left' : 'center';

    ctx.fillStyle = theme === 'parchment' ? '#2b1a0b' : '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(result.subjectName, infoX, nameY);

    ctx.fillStyle = theme === 'parchment' ? '#784d24' : '#d1d5db';
    ctx.font = '18px sans-serif';
    const subStage = result.ageStage ? `${result.ageStage} • ` : '';
    const hijriInfo = toHijri(result.timestamp);
    const dateFormatted = new Date(result.timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillText(`${subStage}${dateFormatted} (${hijriInfo.formatted})`, infoX, nameY + 28);

    // Dominant Temperament Hero Box
    const boxY = format === 'story' ? 440 : format === 'landscape' ? 280 : 370;
    const boxWidth = format === 'landscape' ? width - padding * 2 - 40 : width - padding * 2 - 80;
    const boxX = (width - boxWidth) / 2;
    const boxHeight = format === 'story' ? 240 : 180;

    // Box background
    ctx.fillStyle = theme === 'parchment' ? '#f2e2c8' : 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = themeColors.innerBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
    ctx.fill();
    ctx.stroke();

    // Box Header
    ctx.textAlign = 'left';
    ctx.fillStyle = theme === 'parchment' ? '#683e18' : '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TEMPERAMEN DOMINAN (AL-MIZAJ AL-GHALIB)', boxX + 28, boxY + 36);

    ctx.fillStyle = theme === 'parchment' ? '#241406' : '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(mizaj.indonesianName, boxX + 28, boxY + 76);

    ctx.fillStyle = theme === 'parchment' ? '#784d24' : '#9ca3af';
    ctx.font = 'italic 18px serif';
    ctx.fillText(mizaj.arabicName, boxX + 28, boxY + 104);

    // Element & Status details on right side of hero box
    ctx.textAlign = 'right';
    const rightColX = boxX + boxWidth - 28;
    ctx.fillStyle = theme === 'parchment' ? '#683e18' : '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('UNSUR & KESEIMBANGAN', rightColX, boxY + 36);

    ctx.fillStyle = theme === 'parchment' ? '#331d0b' : '#f3f4f6';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(mizaj.elements, rightColX, boxY + 70);

    ctx.fillStyle = result.iTidalStatus.includes('Seimbang')
      ? (theme === 'parchment' ? '#166534' : '#34d399')
      : (theme === 'parchment' ? '#991b1b' : '#f87171');
    ctx.font = '16px sans-serif';
    ctx.fillText(result.iTidalStatus, rightColX, boxY + 100);

    // Mizaj Score Bar in Box
    const scoreBarY = boxY + boxHeight - 40;
    const scoreBarW = boxWidth - 56;
    ctx.fillStyle = theme === 'parchment' ? '#e2cdb0' : 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(boxX + 28, scoreBarY, scoreBarW, 12, 6);
    ctx.fill();

    const domScore = result.mizajScores[result.dominantMizaj] || 50;
    ctx.fillStyle = themeColors.accent;
    ctx.beginPath();
    ctx.roundRect(boxX + 28, scoreBarY, (scoreBarW * domScore) / 100, 12, 6);
    ctx.fill();

    // Natural Inclination & Character Strengths
    const section2Y = boxY + boxHeight + (format === 'story' ? 50 : 36);

    ctx.textAlign = 'left';
    ctx.fillStyle = theme === 'parchment' ? '#5a3411' : '#fbbf24';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TABIAT ALAMI & KECENDERUNGAN JIWA', boxX, section2Y);

    // Natural inclination wrapped text
    ctx.fillStyle = theme === 'parchment' ? '#291807' : '#e5e7eb';
    ctx.font = '20px sans-serif';
    const inclination = result.overallSummary.naturalInclination;
    const maxTextWidth = boxWidth;

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      let lineCount = 0;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
          lineCount++;
          if (lineCount >= maxLines - 1) {
            ctx.fillText(words.slice(n).join(' ').slice(0, 70) + '...', x, currentY);
            return currentY + lineHeight;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lineHeight;
    };

    const nextY = wrapText(inclination, boxX, section2Y + 34, maxTextWidth, 28, 2);

    // Pillar Strengths Badges
    const pillsY = nextY + 16;
    ctx.fillStyle = theme === 'parchment' ? '#5a3411' : '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('PILAR AKHLAK UTAMA:', boxX, pillsY);

    let currentPillX = boxX + 200;
    const strengths = result.overallSummary.primaryStrengths.slice(0, 3);
    strengths.forEach((str) => {
      ctx.font = 'bold 15px sans-serif';
      const textWidth = ctx.measureText(str).width;
      const pillW = textWidth + 24;

      ctx.fillStyle = theme === 'parchment' ? '#eedbbd' : 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = themeColors.innerBorderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentPillX, pillsY - 18, pillW, 26, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme === 'parchment' ? '#5c330b' : '#fef3c7';
      ctx.fillText(str, currentPillX + 12, pillsY);
      currentPillX += pillW + 12;
    });

    // Story extra section: Classical Advice
    let footerStartY = pillsY + 70;
    if (format === 'story') {
      const adviceBoxY = pillsY + 60;
      const adviceBoxH = 220;

      ctx.fillStyle = theme === 'parchment' ? '#f5e8d3' : 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = themeColors.innerBorderColor;
      ctx.beginPath();
      ctx.roundRect(boxX, adviceBoxY, boxWidth, adviceBoxH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme === 'parchment' ? '#5a3411' : '#fbbf24';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PETUAH JIWA & RIYADHAH IMAM AR-RAZI', boxX + 24, adviceBoxY + 36);

      ctx.fillStyle = theme === 'parchment' ? '#331d0b' : '#d1d5db';
      ctx.font = 'italic 19px serif';
      wrapText(
        `« ${result.overallSummary.spiritualAdvice} »`,
        boxX + 24,
        adviceBoxY + 72,
        boxWidth - 48,
        28,
        4
      );

      footerStartY = adviceBoxY + adviceBoxH + 40;
    }

    // Bottom Footer: Link to Application & Real QR Code
    const footerH = 120;
    const footerY = height - padding - footerH - 10;

    // Draw QR Code
    if (qrCodeDataUrl) {
      try {
        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => {
            const qrSize = 100;
            const qrX = width - padding - qrSize - 40;
            const qrY = footerY + 10;

            // QR white/parchment background plate
            ctx.fillStyle = theme === 'parchment' ? '#ffffff' : '#1c1917';
            ctx.strokeStyle = themeColors.borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 12);
            ctx.fill();
            ctx.stroke();

            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            resolve();
          };
          qrImg.onerror = () => resolve();
          qrImg.src = qrCodeDataUrl;
        });
      } catch (e) {
        console.error('Failed to draw QR image on canvas:', e);
      }
    }

    // App Link & Attribution text
    ctx.textAlign = 'left';
    ctx.fillStyle = theme === 'parchment' ? '#38220f' : '#fbbf24';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Coba Analisis Firasat Wajah Anda:', boxX, footerY + 32);

    ctx.fillStyle = theme === 'parchment' ? '#784d24' : '#ffffff';
    ctx.font = 'bold 17px monospace';
    const displayUrl = appUrl.length > 55 ? `${appUrl.slice(0, 52)}...` : appUrl;
    ctx.fillText(displayUrl, boxX, footerY + 62);

    ctx.fillStyle = theme === 'parchment' ? '#996f47' : '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.fillText('Aplikasi Fisiognomi Karakter Klasik Al-Firasat AI • Ar-Razi', boxX, footerY + 92);
  };

  // Trigger Download PNG
  const handleDownloadImage = async () => {
    setIsExporting(true);
    sound.playClick();
    try {
      const offscreenCanvas = document.createElement('canvas');
      await renderCardToCanvas(offscreenCanvas);
      const dataUrl = offscreenCanvas.toDataURL('image/png', 0.95);

      const cleanName = result.subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `kartu-karakter-${cleanName}-${format}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting character card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    sound.playClick();
    try {
      const offscreenCanvas = document.createElement('canvas');
      await renderCardToCanvas(offscreenCanvas);

      offscreenCanvas.toBlob(async (blob) => {
        if (!blob) return;
        if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 3000);
          } catch {
            // Fallback to text copy
            handleCopyShareText();
          }
        } else {
          handleCopyShareText();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error copying image:', err);
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    sound.playClick();
    setIsExporting(true);
    try {
      const offscreenCanvas = document.createElement('canvas');
      await renderCardToCanvas(offscreenCanvas);

      offscreenCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `kartu-karakter-${result.subjectName}.png`, {
          type: 'image/png'
        });

        const shareData: ShareData = {
          title: `Kartu Karakter Firasat: ${result.subjectName}`,
          text: `Hasil Analisis Firasat Imam Ar-Razi untuk ${result.subjectName}. Tipe Temperamen: ${mizaj.indonesianName}. Pelajari tabiat dan fisiognomi klasik di tautan berikut:`,
          url: appUrl
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            ...shareData,
            files: [file]
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } else {
          await navigator.share(shareData);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        }
      });
    } catch (err) {
      console.log('User cancelled or share error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy social media caption text with app link
  const handleCopyShareText = () => {
    sound.playClick();
    const formattedPost = `✨ HASIL ANALISIS FIRASAT AR-RAZI ✨
👤 Subjek: ${result.subjectName}
🏛️ Temperamen Dominan: ${mizaj.indonesianName} (${mizaj.arabicName})
🌿 Unsur Alam: ${mizaj.elements}
⚖️ Status Keseimbangan: ${result.iTidalStatus}

🌟 Tabiat & Karakter Alami:
"${result.overallSummary.naturalInclination}"

💎 Pilar Kekuatan Jiwa:
${result.overallSummary.primaryStrengths.map(s => `• ${s}`).join('\n')}

📜 Nasihat Riyadhah Imam Ar-Razi:
« ${result.overallSummary.spiritualAdvice} »

🔍 Coba analisis firasat wajah Anda secara langsung:
🔗 ${appUrl}

#AlFirasat #FirasatArRazi #FisiognomiKlasik #CharacterCard #ArRazi`;

    navigator.clipboard.writeText(formattedPost);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Direct Social Share URLs
  const shareTextEncoded = encodeURIComponent(
    `✨ Kartu Karakter Firasat Imam Ar-Razi: ${result.subjectName}\nTemperamen: ${mizaj.indonesianName}\nTabiat: "${result.overallSummary.naturalInclination}"\n\nAnalisis wajah Anda di sini:`
  );
  const shareUrlEncoded = encodeURIComponent(appUrl);

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareTextEncoded}%20${shareUrlEncoded}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${shareTextEncoded}&url=${shareUrlEncoded}&hashtags=AlFirasat,ArRazi,FisiognomiKlasik`;
  const telegramShareUrl = `https://t.me/share/url?url=${shareUrlEncoded}&text=${shareTextEncoded}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl bg-stone-900 border border-amber-900/50 shadow-2xl p-4 sm:p-7 space-y-6 text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Bagikan Analisis
                </span>
                <span className="text-xs text-stone-400">Kartu Karakter Sosial Media</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
                Ringkasan Visual & Kartu Watak
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Format & Theme Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950/70 p-4 rounded-2xl border border-stone-800/80">
          {/* Format Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Format Ukuran Kartu</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setFormat('square');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  format === 'square'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <Square className="w-4 h-4 mb-1" />
                <span>Kotak 1:1</span>
                <span className="text-[10px] text-stone-500">Feed / Post</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setFormat('story');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  format === 'story'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-1" />
                <span>Story 9:16</span>
                <span className="text-[10px] text-stone-500">IG & Status</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setFormat('landscape');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  format === 'landscape'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <ImageIcon className="w-4 h-4 mb-1" />
                <span>Banner 16:9</span>
                <span className="text-[10px] text-stone-500">X / Web Card</span>
              </button>
            </div>
          </div>

          {/* Theme Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Gaya Estetika Visual</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setTheme('obsidian');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'obsidian'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-amber-400 mb-1" />
                <span>Obsidian Emas</span>
                <span className="text-[10px] text-stone-500">Royal Dark</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setTheme('parchment');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'parchment'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#f7ebd4] border border-[#a87f4c] mb-1" />
                <span>Parchment</span>
                <span className="text-[10px] text-stone-500">Naskah Klasik</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setTheme('elemental');
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'elemental'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 mb-1" />
                <span>Warna Mizaj</span>
                <span className="text-[10px] text-stone-500">Unsur Alam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Card Preview Box */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-stone-400 mb-2 flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pratinjau Kartu Karakter yang Akan Dibagikan:</span>
          </div>

          <div
            className={`w-full max-w-lg transition-all duration-300 rounded-3xl p-5 sm:p-6 shadow-2xl border ${themeColors.border} bg-gradient-to-b ${themeColors.bg} relative overflow-hidden`}
            style={{
              boxShadow: `0 20px 40px -10px ${themeColors.goldGlow}`
            }}
          >
            {/* Islamic Ornamental Arches & Corner Accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400/50 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400/50 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400/50 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400/50 rounded-br-lg pointer-events-none" />

            {/* Card Header */}
            <div className="text-center pb-3 border-b border-amber-500/20">
              <span className="text-[10px] tracking-widest font-bold uppercase text-amber-400 font-arabic">
                فِرَاسَةُ الإِمَامِ الرَّازِي • ILMU TABIAT & WATAK
              </span>
              <h3 className={`text-base font-bold font-title tracking-wide ${themeColors.textPrimary} mt-0.5`}>
                KARTU KARAKTER AL-FIRASAT
              </h3>
            </div>

            {/* Subject Profile Section */}
            <div className="flex items-center gap-3.5 my-3.5">
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt={result.subjectName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xl shrink-0">
                  {result.subjectName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className={`text-lg font-bold font-title truncate ${themeColors.textPrimary}`}>
                  {result.subjectName}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-400">
                  {result.ageStage && <span>{result.ageStage} •</span>}
                  <span>
                    {new Date(result.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">
                    {toHijri(result.timestamp).formatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Dominant Mizaj Hero Box */}
            <div className={`p-3.5 rounded-2xl border border-amber-500/20 ${themeColors.badgeBg} space-y-2 mb-3.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {renderElementIcon()}
                  <span className={`text-xs font-bold uppercase tracking-wider ${themeColors.badgeText}`}>
                    {mizaj.indonesianName}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {result.iTidalStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-300">
                <span>Unsur: <strong className="text-amber-300">{mizaj.elements}</strong></span>
                <span className="font-arabic text-amber-400/90 text-sm">{mizaj.arabicName}</span>
              </div>

              {/* Progress Bar of Mizaj */}
              <div className="w-full bg-stone-900/60 h-2 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all"
                  style={{ width: `${result.mizajScores[result.dominantMizaj] || 60}%` }}
                />
              </div>
            </div>

            {/* Tabiat & Strengths */}
            <div className="space-y-2 mb-3.5 text-xs">
              <p className={`line-clamp-2 leading-relaxed ${themeColors.textSecondary}`}>
                <span className="font-semibold text-amber-400">Tabiat Alami: </span>
                {result.overallSummary.naturalInclination}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.overallSummary.primaryStrengths.slice(0, 3).map((st, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-stone-900/80 border border-amber-500/30 text-amber-300 text-[11px] font-medium"
                  >
                    ★ {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Spiritual Advice Quote */}
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] italic text-stone-300/90 line-clamp-2 mb-3">
              « {result.overallSummary.spiritualAdvice} »
            </div>

            {/* Card Footer with Link & QR Code */}
            <div className="flex items-center justify-between pt-2.5 border-t border-amber-500/20 text-[10px]">
              <div>
                <span className="block text-amber-400 font-semibold">Coba Analisis Wajah Anda di:</span>
                <span className="font-mono text-stone-400 text-[10px] break-all">
                  {appUrl.slice(0, 36)}...
                </span>
                <span className="block text-stone-500 text-[9px] mt-0.5">
                  Kitab Al-Firasat • Imam Fakhruddin Ar-Razi
                </span>
              </div>

              {qrCodeDataUrl ? (
                <div className="p-1 rounded-lg bg-white/95 border border-amber-400/40 shrink-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400 shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Native Share, Download HD, Copy Image, Copy Text */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Download HD PNG */}
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses Kartu...' : 'Unduh Gambar PNG'}</span>
            </button>

            {/* Native Web Share */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                disabled={isExporting}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Langsung</span>
              </button>
            )}

            {/* Copy Image to Clipboard */}
            <button
              onClick={handleCopyImage}
              className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-all cursor-pointer"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Gambar Disalin!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Salin Gambar</span>
                </>
              )}
            </button>

            {/* Copy Text & Link */}
            <button
              onClick={handleCopyShareText}
              className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-all cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Teks Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Salin Teks & Link</span>
                </>
              )}
            </button>
          </div>

          {/* Direct Social Media Channels */}
          <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-stone-400 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Bagikan Cepat ke Media Sosial:</span>
            </span>

            <div className="flex items-center gap-2">
              {/* WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Bagikan ke WhatsApp"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/40 hover:bg-emerald-900 text-emerald-300 text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Bagikan ke Twitter / X"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700 hover:bg-stone-750 text-stone-200 text-xs font-medium transition-colors"
              >
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span>X / Twitter</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Bagikan ke Telegram"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/70 border border-sky-600/40 hover:bg-sky-900 text-sky-300 text-xs font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Bagikan ke Facebook"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/70 border border-blue-600/40 hover:bg-blue-900 text-blue-300 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Facebook</span>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Bagikan ke LinkedIn"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-600/40 hover:bg-indigo-900 text-indigo-300 text-xs font-medium transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-indigo-400" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Resolution Export */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
