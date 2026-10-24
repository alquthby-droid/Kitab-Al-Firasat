import jsPDF from 'jspdf';
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';
import { MIZAJ_DATA } from '../data/kitabFirasatData';
import { toHijri } from './hijriCalendar';

export interface CompatibilityAnalysisData {
  overallPercentage: number;
  harmonyStatus: string;
  arabicStatus: string;
  elementHarmonyScore: number;
  intellectHarmonyScore: number;
  emotionalBalanceScore: number;
  partnershipSynergyScore: number;
  summaryTitle: string;
  summaryBody: string;
  partnershipTip: string;
  communicationTip: string;
  tarjihPrinciple: string;
}

/**
 * Helper to draw authentic Islamic manuscript ornamental border on any page
 * Includes triple-lined gold filigree frame, 8-point geometric star rosettes (Khatam),
 * arabesque corner brackets, midpoint side medallions, and mihrab crests.
 */
export const drawIslamicManuscriptBorder = (
  docInstance: jsPDF,
  pageNum: number,
  total: number
) => {
  const pageWidth = docInstance.internal.pageSize.getWidth();
  const pageHeight = docInstance.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const x1 = margin - 6;
  const y1 = margin - 6;
  const w = contentWidth + 12;
  const h = pageHeight - (margin * 2) + 12;

  // Outer primary border (gold amber-700)
  docInstance.setDrawColor(180, 83, 9);
  docInstance.setLineWidth(0.85);
  docInstance.rect(x1, y1, w, h);

  // Middle gold accent border (amber-500)
  docInstance.setDrawColor(245, 158, 11);
  docInstance.setLineWidth(0.35);
  docInstance.rect(x1 + 1.8, y1 + 1.8, w - 3.6, h - 3.6);

  // Inner subtle border (amber-800)
  docInstance.setDrawColor(146, 64, 14);
  docInstance.setLineWidth(0.2);
  docInstance.rect(x1 + 3.2, y1 + 3.2, w - 6.4, h - 6.4);

  // Corner Islamic Arabesque Motifs with 8-point geometric star diamond (Khatam / Rub el Hizb)
  const drawCornerArabesque = (cx: number, cy: number, flipX: number, flipY: number) => {
    docInstance.setDrawColor(217, 119, 6);
    docInstance.setFillColor(254, 243, 199);
    docInstance.setLineWidth(0.35);

    // Diagonal corner bracket lines
    docInstance.line(cx, cy + 9 * flipY, cx + 9 * flipX, cy);
    docInstance.line(cx, cy + 12 * flipY, cx + 12 * flipX, cy);
    docInstance.line(cx + 2 * flipX, cy + 14 * flipY, cx + 14 * flipX, cy + 2 * flipY);

    // Islamic 8-point geometric star diamond at corner junction
    const sx = cx + 5 * flipX;
    const sy = cy + 5 * flipY;
    const r = 2.4;
    docInstance.setFillColor(217, 119, 6);
    docInstance.triangle(sx, sy - r, sx + r * 0.7, sy, sx - r * 0.7, sy, 'F');
    docInstance.triangle(sx, sy + r, sx + r * 0.7, sy, sx - r * 0.7, sy, 'F');
    docInstance.triangle(sx - r, sy, sx, sy + r * 0.7, sx, sy - r * 0.7, 'F');
    docInstance.triangle(sx + r, sy, sx, sy + r * 0.7, sx, sy - r * 0.7, 'F');

    // Central star gold core
    docInstance.setFillColor(254, 243, 199);
    docInstance.circle(sx, sy, 0.65, 'F');

    // Filigree accent dots
    docInstance.setFillColor(217, 119, 6);
    docInstance.circle(cx + 7.5 * flipX, cy + 2 * flipY, 0.45, 'F');
    docInstance.circle(cx + 2 * flipX, cy + 7.5 * flipY, 0.45, 'F');
    docInstance.circle(cx + 11 * flipX, cy + 3.5 * flipY, 0.35, 'F');
    docInstance.circle(cx + 3.5 * flipX, cy + 11 * flipY, 0.35, 'F');
    docInstance.circle(cx + 15 * flipX, cy + 2 * flipY, 0.3, 'F');
    docInstance.circle(cx + 2 * flipX, cy + 15 * flipY, 0.3, 'F');
  };

  drawCornerArabesque(x1 + 1.8, y1 + 1.8, 1, 1);         // Top-Left
  drawCornerArabesque(x1 + w - 1.8, y1 + 1.8, -1, 1);     // Top-Right
  drawCornerArabesque(x1 + 1.8, y1 + h - 1.8, 1, -1);     // Bottom-Left
  drawCornerArabesque(x1 + w - 1.8, y1 + h - 1.8, -1, -1); // Bottom-Right

  // Side Midpoint Arabesque Medallions (Left & Right margins)
  const drawSideMedallion = (x: number, y: number) => {
    docInstance.setFillColor(217, 119, 6);
    docInstance.setDrawColor(180, 83, 9);
    docInstance.setLineWidth(0.25);
    docInstance.triangle(x, y - 3.5, x + 2.5, y, x - 2.5, y, 'FD');
    docInstance.triangle(x, y + 3.5, x + 2.5, y, x - 2.5, y, 'FD');
    docInstance.circle(x, y - 5, 0.5, 'F');
    docInstance.circle(x, y + 5, 0.5, 'F');
    docInstance.setFillColor(254, 243, 199);
    docInstance.circle(x, y, 0.7, 'F');
  };

  drawSideMedallion(x1 + 1.8, y1 + h / 2);
  drawSideMedallion(x1 + w - 1.8, y1 + h / 2);

  // Top Center Arabesque Crest Motif
  const topMidX = x1 + w / 2;
  const topY = y1 + 1.8;
  docInstance.setDrawColor(217, 119, 6);
  docInstance.setFillColor(254, 243, 199);
  docInstance.setLineWidth(0.3);
  docInstance.triangle(topMidX - 7, topY, topMidX + 7, topY, topMidX, topY + 3, 'FD');
  docInstance.circle(topMidX, topY + 1.5, 0.7, 'F');
  docInstance.circle(topMidX - 9, topY, 0.45, 'F');
  docInstance.circle(topMidX + 9, topY, 0.45, 'F');
  docInstance.circle(topMidX - 14, topY, 0.35, 'F');
  docInstance.circle(topMidX + 14, topY, 0.35, 'F');

  // Bottom Center Arabesque Divider above footer
  const botMidX = x1 + w / 2;
  const botY = y1 + h - 1.8;
  docInstance.triangle(botMidX - 7, botY, botMidX + 7, botY, botMidX, botY - 3, 'FD');
  docInstance.circle(botMidX, botY - 1.5, 0.7, 'F');
  docInstance.circle(botMidX - 9, botY, 0.45, 'F');
  docInstance.circle(botMidX + 9, botY, 0.45, 'F');
  docInstance.circle(botMidX - 14, botY, 0.35, 'F');
  docInstance.circle(botMidX + 14, botY, 0.35, 'F');
};

/**
 * Generates official Firasat Character Analysis PDF Report
 * Features authentic Islamic manuscript borders, biometric face scan capture,
 * 4 humors distribution, classical organ deductions, and spiritual advice.
 */
export function generateFirasatPDF(
  result: FirasatAnalysisResult, 
  profile?: SubjectProfile | null,
  capturedScreenshotUrl?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const mizaj = MIZAJ_DATA[result.dominantMizaj] || MIZAJ_DATA.sanguinis;
  const hijri = toHijri(result.timestamp);

  // Helper to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Al-Firasat AI • Berdasarkan Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi (554-606 H) • ${hijri.formatted}`,
      margin,
      pageHeight - 9
    );
    doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin - 24, pageHeight - 9);
  };

  // --- HEADER SECTION ---
  doc.setFillColor(24, 24, 27); // Dark zinc/stone
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(margin, y + 24.5, contentWidth, 1.5, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(251, 191, 36); // amber-300
  doc.text('LAPORAN RESMI ANALISIS KARAKTER AL-FIRASAT', margin + 6, y + 7.5);

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(254, 243, 199);
  doc.text('Kitab Al-Firasat • Imam Fakhruddin Ar-Razi (554 - 606 H)', margin + 6, y + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(214, 211, 209);
  doc.text(`Penanggalan Hijriah: ${hijri.formattedWithDay}`, margin + 6, y + 19.5);

  doc.setFontSize(7.5);
  doc.setTextColor(180, 175, 170);
  doc.text(`ID Analisis: ${result.id}`, pageWidth - margin - 46, y + 13.5);
  doc.text(`Sistem: Al-Firasat AI v2.4`, pageWidth - margin - 46, y + 19.5);

  y += 32;

  // --- SUBJECT METADATA CARD (WITH BIOMETRIC FACE SCAN CAPTURE) ---
  const imgToEmbed = capturedScreenshotUrl || result.imageUrl;
  const cardHeight = imgToEmbed ? 38 : 34;

  doc.setFillColor(250, 249, 246);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'S');

  if (imgToEmbed) {
    // Left: Embed captured screenshot / face photo in gold-framed medallion
    const imgX = margin + 3.5;
    const imgY = y + 3.5;
    const imgW = 31;
    const imgH = 31;

    doc.setFillColor(24, 24, 27);
    doc.rect(imgX, imgY, imgW, imgH, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.rect(imgX, imgY, imgW, imgH, 'S');
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.2);
    doc.rect(imgX + 1, imgY + 1, imgW - 2, imgH - 2, 'S');

    let imageEmbedded = false;
    try {
      if (imgToEmbed.startsWith('data:')) {
        const format = imgToEmbed.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(imgToEmbed, format, imgX + 1.2, imgY + 1.2, imgW - 2.4, imgH - 2.4);
        imageEmbedded = true;
      }
    } catch (e) {
      console.warn('Could not embed image into PDF:', e);
    }

    if (!imageEmbedded) {
      doc.setFillColor(39, 39, 42);
      doc.rect(imgX + 1.2, imgY + 1.2, imgW - 2.4, imgH - 2.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11);
      doc.text((result.subjectName || 'S').charAt(0).toUpperCase(), imgX + (imgW / 2), imgY + (imgH / 2) + 4.5, { align: 'center' });
    }

    // Center column: Profile details
    const textLeftX = margin + 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 27, 24);
    doc.text(`Subjek: ${result.subjectName}`, textLeftX, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(80, 75, 70);
    doc.text(`Kategori: ${profile?.category || 'Umum'}`, textLeftX, y + 12);
    doc.text(`Waktu: ${new Date(result.timestamp).toLocaleDateString('id-ID')}`, textLeftX, y + 17.5);
    doc.text(`Usia: ${result.ageStage || profile?.ageStage || 'Paruh Baya (Kuhulah)'}`, textLeftX, y + 23);
    doc.text(`Sumber: ${result.sourceType === 'camera' ? 'Kamera Live' : result.sourceType === 'manual' ? 'Pemeriksaan Manual' : 'Sampel Firasat'}`, textLeftX, y + 28.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(180, 83, 9);
    doc.text(`Bukti: Tangkapan Layar Biometrik`, textLeftX, y + 34);

    // Right column: Dominant Temperament & Balance
    const midX = margin + 104;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`Temperamen: ${mizaj.indonesianName.split(' (')[0]}`, midX, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(75, 70, 65);
    doc.text(`Unsur / Sifat: ${mizaj.elements}`, midX, y + 12);
    doc.text(`Kualitas Humor: ${mizaj.qualities}`, midX, y + 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(result.iTidalStatus.includes('Seimbang') ? 22 : 185, result.iTidalStatus.includes('Seimbang') ? 101 : 28, result.iTidalStatus.includes('Seimbang') ? 52 : 28);
    doc.text(`Status: ${result.iTidalStatus}`, midX, y + 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(110, 105, 100);
    const summaryText = (result.overallSummary.naturalInclination || 'Karakter seimbang').slice(0, 46);
    doc.text(`Karakter: "${summaryText}..."`, midX, y + 29);
    if (result.palmAnalysis) {
      doc.setTextColor(13, 148, 136);
      doc.text(`+Analisis Garis Telapak (Kanan-Kiri)`, midX, y + 34);
    }
  } else {
    // Normal 2 columns without image
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 27, 24);
    doc.text(`Subjek: ${result.subjectName}`, margin + 6, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 75, 70);
    doc.text(`Kategori: ${profile?.category || 'Umum'}`, margin + 6, y + 13.5);
    doc.text(`Waktu Perekaman: ${new Date(result.timestamp).toLocaleString('id-ID')}`, margin + 6, y + 19.5);
    doc.text(`Tahapan Usia: ${result.ageStage || profile?.ageStage || 'Paruh Baya (Kuhulah)'}`, margin + 6, y + 25.5);
    doc.text(`Sifat Alami Bawaan: ${result.overallSummary.naturalInclination || 'Karakter seimbang'}`, margin + 6, y + 31);

    const midX = margin + (contentWidth / 2) + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`Temperamen Dominan: ${mizaj.indonesianName.split(' (')[0]}`, midX, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 70, 65);
    doc.text(`Unsur / Sifat Alami: ${mizaj.elements}`, midX, y + 13.5);
    doc.text(`Kualitas Humor: ${mizaj.qualities}`, midX, y + 19.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(result.iTidalStatus.includes('Seimbang') ? 22 : 185, result.iTidalStatus.includes('Seimbang') ? 101 : 28, result.iTidalStatus.includes('Seimbang') ? 52 : 28);
    doc.text(`Status Keseimbangan (I'tidal): ${result.iTidalStatus}`, midX, y + 25.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 105, 100);
    if (profile?.notes) {
      const truncatedNote = profile.notes.length > 55 ? `${profile.notes.slice(0, 52)}...` : profile.notes;
      doc.text(`Catatan Profil: "${truncatedNote}"`, midX, y + 31);
    } else {
      doc.text(`Sumber Analisis: ${result.sourceType === 'camera' ? 'Pemindaian Kamera' : result.sourceType === 'manual' ? 'Pemeriksaan Fitur Manual' : 'Uji Komparasi'}`, midX, y + 31);
    }
  }

  y += cardHeight + 5;

  // --- 4 MIZAJ DISTRIBUTION SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 24);
  doc.text('1. Distribusi 4 Cairan Tubuh & Temperamen (Al-Akhlath Al-Arba\'ah)', margin, y);
  y += 4.5;

  const colW = contentWidth / 4;
  const mizajBoxes = [
    { name: 'Sanguinis (Darah)', val: result.mizajScores?.sanguinis || 0, sub: 'Panas & Lembap', col: [220, 38, 38] },
    { name: 'Koleris (Shafra)', val: result.mizajScores?.koleris || 0, sub: 'Panas & Kering', col: [217, 119, 6] },
    { name: 'Melankolis (Sauda)', val: result.mizajScores?.melankolis || 0, sub: 'Dingin & Kering', col: [79, 70, 229] },
    { name: 'Flegmatis (Balgham)', val: result.mizajScores?.flegmatis || 0, sub: 'Dingin & Lembap', col: [8, 145, 178] }
  ];

  mizajBoxes.forEach((box, i) => {
    const bx = margin + i * colW;
    doc.setFillColor(248, 247, 245);
    doc.roundedRect(bx, y, colW - 2, 17, 1.8, 1.8, 'F');
    doc.setDrawColor(225, 220, 215);
    doc.roundedRect(bx, y, colW - 2, 17, 1.8, 1.8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(box.col[0], box.col[1], box.col[2]);
    doc.text(`${box.name}`, bx + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${box.val}%`, bx + colW - 14, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(115, 110, 105);
    doc.text(box.sub, bx + 3, y + 10);

    // Progress bar
    doc.setFillColor(230, 228, 225);
    doc.rect(bx + 3, y + 12.5, colW - 8, 1.8, 'F');
    doc.setFillColor(box.col[0], box.col[1], box.col[2]);
    doc.rect(bx + 3, y + 12.5, (colW - 8) * (Math.min(100, Math.max(0, box.val)) / 100), 1.8, 'F');
  });

  y += 22;

  // --- DETAILED FIRASAT FINDINGS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 24);
  doc.text('2. Temuan Firasat Organ Fisik (Dalâ\'il al-A\'dha\' - Kitab Al-Firasat)', margin, y);
  y += 4.5;

  // Table header
  doc.setFillColor(240, 238, 235);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(215, 210, 205);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 55, 50);
  doc.text('Organ Fisik', margin + 3, y + 4.8);
  doc.text('Ciri Fisik Teramati', margin + 32, y + 4.8);
  doc.text('Watak & Indikasi Batiniah', margin + 92, y + 4.8);
  doc.text('Keyakinan', margin + 144, y + 4.8);
  doc.text('Rujukan Kitab', margin + 158, y + 4.8);
  y += 7;

  // Organ feature rows
  result.features.forEach((feat, idx) => {
    // Check page break
    if (y > pageHeight - 28) {
      doc.addPage();
      y = margin;

      // Repeat table header on new page
      doc.setFillColor(240, 238, 235);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(215, 210, 205);
      doc.rect(margin, y, contentWidth, 7, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 55, 50);
      doc.text('Organ Fisik', margin + 3, y + 4.8);
      doc.text('Ciri Fisik Teramati', margin + 32, y + 4.8);
      doc.text('Watak & Indikasi Batiniah', margin + 92, y + 4.8);
      doc.text('Keyakinan', margin + 144, y + 4.8);
      doc.text('Rujukan Kitab', margin + 158, y + 4.8);
      y += 7;
    }

    const rowH = 10.5;
    const rowBg = idx % 2 === 0 ? 255 : 249;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(235, 230, 225);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

    // Organ name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(feat.organ, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 115, 110);
    const latinName = feat.organ === 'Dahi' ? 'Al-Jabhah' :
      feat.organ === 'Alis' ? 'Al-Hajib' :
      feat.organ === 'Mata' ? "Al-'Ain" :
      feat.organ === 'Hidung' ? 'Al-Anf' :
      feat.organ.includes('Bibir') || feat.organ.includes('Mulut') ? 'Al-Fam' :
      feat.organ === 'Telinga' ? 'Al-Udzun' :
      feat.organ === 'Wajah' ? 'Al-Wajh' :
      feat.organ.includes('Kanan') ? 'Al-Kaff al-Yumna' :
      feat.organ.includes('Kiri') ? 'Al-Kaff al-Yusra' :
      feat.organ.includes('Tangan') ? 'Al-Kaff wa Khuthuth' :
      'Ash-Shawt';
    doc.text(latinName, margin + 3, y + 8.2);

    // Observation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(45, 40, 35);
    const obsLines = doc.splitTextToSize(feat.observation, 58);
    doc.text(obsLines[0] || '', margin + 32, y + 4.2);
    if (obsLines[1]) doc.text(obsLines[1], margin + 32, y + 8);

    // Trait deduction
    const traitLines = doc.splitTextToSize(feat.traitIndication, 50);
    doc.text(traitLines[0] || '', margin + 92, y + 4.2);
    if (traitLines[1]) doc.text(traitLines[1], margin + 92, y + 8);

    // Confidence
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text(`${feat.confidence || 88}%`, margin + 144, y + 5.5);

    // Reference
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 105, 100);
    const refLines = doc.splitTextToSize(feat.kitabRef || 'Pasal Ar-Razi', 26);
    doc.text(refLines[0] || '', margin + 158, y + 4.2);
    if (refLines[1]) doc.text(refLines[1], margin + 158, y + 7.8);

    y += rowH;
  });

  y += 5;

  // --- PALM LINES (KHUTHUTH AL-KAFF) SPECIAL SECTION (IF PRESENT) ---
  if (result.palmAnalysis) {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 27, 24);
    doc.text('2b. Firasat Garis Telapak Tangan Kanan & Kiri (Khuthuth al-Kaffain)', margin, y);
    y += 4;

    const halfPalmCol = (contentWidth - 4) / 2;

    // Right Hand (Al-Yad al-Yumna - Amal)
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(margin, y, halfPalmCol, 26, 1.8, 1.8, 'F');
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(margin, y, halfPalmCol, 26, 1.8, 1.8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(180, 83, 9);
    doc.text('Tangan Kanan (Al-Yad al-Yumna) • Amal Lahiriah', margin + 3.5, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(55, 50, 45);
    doc.text(`• Garis Hayah: ${result.palmAnalysis.rightHand.lifeLine.slice(0, 42)}`, margin + 3.5, y + 9.5);
    doc.text(`• Garis Akal: ${result.palmAnalysis.rightHand.headLine.slice(0, 42)}`, margin + 3.5, y + 14.5);
    doc.text(`• Tekstur: ${result.palmAnalysis.rightHand.texture.slice(0, 42)}`, margin + 3.5, y + 19.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(146, 64, 14);
    doc.text(`Indikasi: ${result.palmAnalysis.rightHand.mizajIndication.slice(0, 45)}`, margin + 3.5, y + 23.5);

    // Left Hand (Al-Yad al-Yusra - Fitrah)
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin + halfPalmCol + 4, y, halfPalmCol, 26, 1.8, 1.8, 'F');
    doc.setDrawColor(94, 234, 212);
    doc.roundedRect(margin + halfPalmCol + 4, y, halfPalmCol, 26, 1.8, 1.8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(13, 148, 136);
    doc.text('Tangan Kiri (Al-Yad al-Yusra) • Fitrah Batiniah', margin + halfPalmCol + 7.5, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(45, 55, 50);
    doc.text(`• Garis Hayah: ${result.palmAnalysis.leftHand.lifeLine.slice(0, 42)}`, margin + halfPalmCol + 7.5, y + 9.5);
    doc.text(`• Garis Akal: ${result.palmAnalysis.leftHand.headLine.slice(0, 42)}`, margin + halfPalmCol + 7.5, y + 14.5);
    doc.text(`• Tekstur: ${result.palmAnalysis.leftHand.texture.slice(0, 42)}`, margin + halfPalmCol + 7.5, y + 19.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(15, 118, 110);
    doc.text(`Indikasi: ${result.palmAnalysis.leftHand.mizajIndication.slice(0, 45)}`, margin + halfPalmCol + 7.5, y + 23.5);

    y += 30;
  }

  // Check page overflow before synthesis section
  if (y > pageHeight - 75) {
    doc.addPage();
    y = margin;
  }

  // --- CHARACTER SYNTHESIS, TARJIH & RIYADHAH SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 24);
  doc.text('3. Sintesis Watak, Kaidah Tarjih & Nasihat Riyadhah Jiwa', margin, y);
  y += 4.5;

  const halfCol = (contentWidth - 4) / 2;

  // Strengths Box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, halfCol, 27, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, halfCol, 27, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('Potensi & Kekuatan Karakter Utama:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 50, 45);
  result.overallSummary.primaryStrengths.slice(0, 3).forEach((str, i) => {
    doc.text(`• ${str}`, margin + 4, y + 11.5 + i * 5);
  });

  // Potential Vulnerabilities Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + halfCol + 4, y, halfCol, 27, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(margin + halfCol + 4, y, halfCol, 27, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('Titik Rawan / Kecenderungan Alami Bawaan:', margin + halfCol + 8, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 50, 40);
  result.overallSummary.potentialWeaknesses.slice(0, 3).forEach((weak, i) => {
    doc.text(`• ${weak}`, margin + halfCol + 8, y + 11.5 + i * 5);
  });

  y += 31;

  // Tarjih & Spiritual Advice Box
  doc.setFillColor(250, 249, 246);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  doc.setDrawColor(225, 220, 215);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('Kaidah Tarjih Ar-Razi yang Diterapkan:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(50, 45, 40);
  const tarjihLines = doc.splitTextToSize(result.overallSummary.tarjihNote || 'Tanda organ sentral dimenangkan saat terjadi pertentangan sinyal.', contentWidth - 8);
  doc.text(tarjihLines.slice(0, 2), margin + 4, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 40, 35);
  doc.text('Bimbingan Riyadhah Akhlak (Tazkiyatun Nafs):', margin + 4, y + 17.5);

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(70, 65, 60);
  const adviceLines = doc.splitTextToSize(`« ${result.overallSummary.spiritualAdvice} »`, contentWidth - 8);
  doc.text(adviceLines.slice(0, 2), margin + 4, y + 21.5);

  y += 29;

  // Classical Quote & Scientific Validation Note
  if (y > pageHeight - 35) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 98, 7);
  doc.text('Prinsip Etika Kitab Al-Firasat Imam Fakhruddin Ar-Razi:', margin + 4, y + 5.5);

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(55, 50, 45);
  const quoteText = result.classicalQuote?.indonesianTranslation ||
    'Firasat adalah metode penarikan kesimpulan atas karakter batiniah melalui pengamatan tanda-tanda fisik lahiriah yang nyata.';
  const quoteLines = doc.splitTextToSize(`"${quoteText}"`, contentWidth - 8);
  doc.text(quoteLines.slice(0, 2), margin + 4, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 110, 105);
  doc.text(
    'Catatan Metodologis: Firasat membaca potensi bawaan alami (thabi\'iyyah). Kebaikan sejati senantiasa disempurnakan melalui taqwa, ilmu, dan riyadhah pembiasaan adab.',
    margin + 4,
    y + 19
  );

  // Add authentic Islamic manuscript borders & footers across all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawIslamicManuscriptBorder(doc, i, totalPages);
    addFooter(i, totalPages);
  }

  // Trigger Save
  const safeSubject = result.subjectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Firasat_${safeSubject}_${result.id.slice(-6)}.pdf`;
  doc.save(filename);
}

/**
 * Generates official Ar-Razi Compatibility & Character Alignment PDF Report
 * Features full authentic Islamic manuscript borders, 4-pillar scores,
 * humoral dynamics, practical guidelines, and classical tarjih ethics.
 */
export function generateCompatibilityPDF(
  profA: SubjectProfile,
  profB: SubjectProfile,
  scanA: FirasatAnalysisResult,
  scanB: FirasatAnalysisResult,
  compData: CompatibilityAnalysisData
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const hijri = toHijri(new Date().toISOString());

  // Helper to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Al-Firasat AI • Analisis Keselarasan Karakter Berdasarkan Prinsip Firasat Imam Ar-Razi • ${hijri.formatted}`,
      margin,
      pageHeight - 9
    );
    doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin - 24, pageHeight - 9);
  };

  // --- HEADER SECTION (PAGE 1) ---
  doc.setFillColor(24, 24, 27); // Dark zinc/stone
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(margin, y + 25.5, contentWidth, 1.5, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(251, 191, 36); // amber-300
  doc.text('LAPORAN RESMI ANALISIS KECOCOKAN & SINERGI TABIAT', margin + 6, y + 7.5);

  doc.setFont('times', 'italic');
  doc.setFontSize(8.8);
  doc.setTextColor(254, 243, 199);
  doc.text('Berdasarkan Prinsip Firasat Imam Fakhruddin Ar-Razi (Kitab Al-Firasat, 554-606 H)', margin + 6, y + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(214, 211, 209);
  doc.text(`Penanggalan Hijriah: ${hijri.formattedWithDay}`, margin + 6, y + 19.5);

  doc.setFontSize(7.5);
  doc.setTextColor(180, 175, 170);
  doc.text(`Metode: Komparasi 4 Akhlath & 6 Dimensi`, pageWidth - margin - 62, y + 13.5);
  doc.text(`Status Dokumen: Naskah Otentik Klasik`, pageWidth - margin - 62, y + 19.5);

  y += 33;

  // --- TWO PROFILES COMPARISON CARDS ---
  const halfCol = (contentWidth - 4) / 2;

  // Profil A Card
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, y, halfCol, 28, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, halfCol, 28, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`Subjek Pertama: ${profA.name}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 60, 50);
  doc.text(`Kategori: ${profA.category || 'Profil A'}`, margin + 4, y + 11.5);
  doc.text(`Mizaj Dominan: ${scanA?.dominantMizaj?.toUpperCase() || 'SANGUINIS'}`, margin + 4, y + 16.5);
  doc.text(`Status: ${scanA?.iTidalStatus || "Mu'tadil (Seimbang)"}`, margin + 4, y + 21.5);

  // Profil B Card
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin + halfCol + 4, y, halfCol, 28, 2, 2, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(margin + halfCol + 4, y, halfCol, 28, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202);
  doc.text(`Subjek Kedua: ${profB.name}`, margin + halfCol + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 75);
  doc.text(`Kategori: ${profB.category || 'Profil B'}`, margin + halfCol + 8, y + 11.5);
  doc.text(`Mizaj Dominan: ${scanB?.dominantMizaj?.toUpperCase() || 'KOLERIS'}`, margin + halfCol + 8, y + 16.5);
  doc.text(`Status: ${scanB?.iTidalStatus || "Mu'tadil (Seimbang)"}`, margin + halfCol + 8, y + 21.5);

  y += 33;

  // --- OVERALL COMPATIBILITY PERCENTAGE GAUGE BANNER ---
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S');

  // Percentage badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(251, 191, 36);
  doc.text(`${compData.overallPercentage}%`, margin + 8, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PERSENTASE KESELARASAN KARAKTER (Tawafuq al-Akhlaq)', margin + 48, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(254, 243, 199);
  doc.text(`Status: ${compData.harmonyStatus}`, margin + 48, y + 18);

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(214, 211, 209);
  doc.text(`"Kaidah Imam Ar-Razi: Harmoni batiniah terwujud ketika unsur-unsur saling mengisi dan menyempurnakan."`, margin + 48, y + 25);

  y += 37;

  // --- 4 PILLARS DETAILED BREAKDOWN BOXES ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 24);
  doc.text('1. Pengukuran 4 Pilar Keselarasan Firasat Klasik', margin, y);
  y += 4.5;

  const pillarW = contentWidth / 4;
  const pillars = [
    { title: 'Keseimbangan Mizaj', score: compData.elementHarmonyScore, sub: 'Harmoni 4 Cairan', col: [217, 119, 6] },
    { title: 'Nalar & Komunikasi', score: compData.intellectHarmonyScore, sub: 'Akal & Fashahah', col: [79, 70, 229] },
    { title: 'Emosional & Sabar', score: compData.emotionalBalanceScore, sub: 'Qalb & Hilm', col: [16, 185, 129] },
    { title: 'Sinergi Kerja Sama', score: compData.partnershipSynergyScore, sub: "Ta'awun & Eksekusi", col: [225, 29, 72] }
  ];

  pillars.forEach((p, idx) => {
    const px = margin + idx * pillarW;
    doc.setFillColor(250, 249, 246);
    doc.roundedRect(px, y, pillarW - 2, 21, 1.8, 1.8, 'F');
    doc.setDrawColor(225, 220, 215);
    doc.roundedRect(px, y, pillarW - 2, 21, 1.8, 1.8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(p.col[0], p.col[1], p.col[2]);
    doc.text(p.title, px + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${p.score}%`, px + pillarW - 16, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(110, 105, 100);
    doc.text(p.sub, px + 3, y + 11);

    // Progress bar
    doc.setFillColor(230, 228, 225);
    doc.rect(px + 3, y + 14.5, pillarW - 8, 2, 'F');
    doc.setFillColor(p.col[0], p.col[1], p.col[2]);
    doc.rect(px + 3, y + 14.5, (pillarW - 8) * (p.score / 100), 2, 'F');
  });

  y += 26;

  // --- CLASSICAL COMMENTARY & DYNAMICS ---
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`Interpretasi Kitab Al-Firasat: ${compData.summaryTitle}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(45, 40, 35);
  const bodyLines = doc.splitTextToSize(compData.summaryBody, contentWidth - 8);
  doc.text(bodyLines.slice(0, 4), margin + 4, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text('Kunci Sukses Kemitraan:', margin + 4, y + 27);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.3);
  doc.setTextColor(60, 50, 40);
  const tipLines = doc.splitTextToSize(compData.partnershipTip, contentWidth - 8);
  doc.text(tipLines.slice(0, 2), margin + 4, y + 31.5);

  y += 42;

  // --- SITUATIONAL APPLICATION & TARJIH ETHICS (PAGE 2 IF NEEDED) ---
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Kaidah Tarjih Imam Ar-Razi Saat Terjadi Perbedaan Pandangan:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(51, 65, 85);
  const tarjihLines = doc.splitTextToSize(
    compData.tarjihPrinciple || 
    'Apabila dua pihak berselisih dalam tempo atau cara bertindak, maka dahulukan musyawarah berlandaskan tanda-tanda yang paling kuat (at-tarjih bi al-aqwa) dan pertahankan kelapangan dada.',
    contentWidth - 8
  );
  doc.text(tarjihLines.slice(0, 3), margin + 4, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Rekomendasi Komunikasi Sehari-hari:', margin + 4, y + 21.5);

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  const commLines = doc.splitTextToSize(compData.communicationTip || 'Gunakan intonasi yang tenang dan hargai sudut pandang fitrah masing-masing.', contentWidth - 8);
  doc.text(commLines.slice(0, 2), margin + 4, y + 26);

  y += 36;

  // Classical Quote
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

  doc.setFont('times', 'italic');
  doc.setFontSize(7.8);
  doc.setTextColor(120, 53, 15);
  doc.text('« الْمَرْءُ مِرْآةُ أَخِيهِ، وَالتَّنَاسُبُ فِي الطِّبَاعِ يُوجِبُ الْمَحَبَّةَ وَدَوَامَ الِاتِّفَاقِ »', margin + 6, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text('"Seseorang adalah cermin bagi saudaranya, dan keselarasan tabiat melahirkan kasih sayang serta kesinambungan kesepahaman." — Imam Fakhruddin Ar-Razi', margin + 6, y + 12);

  // Apply authentic Islamic manuscript borders & footers across all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawIslamicManuscriptBorder(doc, i, totalPages);
    addFooter(i, totalPages);
  }

  // Trigger Save
  const safeA = profA.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeB = profB.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Analisis_Kecocokan_${safeA}_dan_${safeB}.pdf`;
  doc.save(filename);
}
