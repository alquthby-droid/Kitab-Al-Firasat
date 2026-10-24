import { FirasatAnalysisResult, TemperamentType } from '../types/firasat';

export interface PredictiveHorizonPoint {
  horizonDays: number;
  label: string;
  dateStr: string;
  isProjected: boolean;
  sanguinis: number;
  koleris: number;
  melankolis: number;
  flegmatis: number;
  itidal: number;
  predictedDominant: TemperamentType;
  confidenceScore: number; // 0 - 100%
  // Upper and lower confidence bounds for I'tidal
  itidalUpper: number;
  itidalLower: number;
}

export interface HumorVelocity {
  humor: TemperamentType;
  label: string;
  currentScore: number;
  projectedScore: number;
  monthlyDelta: number; // change per 30 days
  trendDirection: 'rising' | 'falling' | 'stable';
  classicalSignificance: string;
  humorColor: string;
}

export interface EarlyWarningRisk {
  level: 'optimal' | 'moderate' | 'elevated';
  humor: TemperamentType;
  title: string;
  symptoms: string[];
  kitabReference: string;
  preventativePrescription: string;
}

export type InterventionType = 'natural' | 'riyadhah_sabar' | 'tafakkur_ilmu' | 'tekanan_stres' | 'tabrid_istirahat';

export interface PredictiveAnalysisReport {
  profileName: string;
  historicalSessionsCount: number;
  observationSpanDays: number;
  forecastHorizonDays: number;
  confidenceScore: number;
  currentDominant: TemperamentType;
  projectedDominant: TemperamentType;
  currentItidal: number;
  projectedItidal: number;
  itidalTrajectory: 'improving' | 'declining' | 'stable';
  daysToOptimalItidal: number | null; // null if already >= 75% or declining
  timelineData: PredictiveHorizonPoint[];
  velocities: HumorVelocity[];
  earlyWarnings: EarlyWarningRisk[];
  preventativeRoadmap: {
    phase: string;
    targetDays: string;
    focusAkhlak: string;
    recommendedActions: string[];
    classicalDietAndEnvironment: string;
  }[];
  arRaziPredictiveVerdict: {
    summary: string;
    arabicAphorism: string;
    translation: string;
    sourceChapter: string;
  };
}

const HUMOR_CONFIG: Record<TemperamentType, { label: string; element: string; color: string }> = {
  sanguinis: { label: 'Sanguinis (Darah)', element: 'Udara (Panas-Lembap)', color: '#f59e0b' },
  koleris: { label: 'Koleris (Empedu Kuning)', element: 'Api (Panas-Kering)', color: '#ef4444' },
  melankolis: { label: 'Melankolis (Empedu Hitam)', element: 'Tanah (Dingin-Kering)', color: '#8b5cf6' },
  flegmatis: { label: 'Flegmatis (Lendir)', element: 'Air (Dingin-Lembap)', color: '#06b6d4' }
};

/**
 * Calculates linear regression slope (units per day) with recency weighting.
 */
function calculateWeightedSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  let sumWXX = 0;
  let sumWXY = 0;

  const minX = points[0].x;
  const maxX = points[n - 1].x;
  const span = Math.max(1, maxX - minX);

  points.forEach((p, idx) => {
    // Recent points get exponentially higher weights (up to 2.5x)
    const weight = Math.exp((idx / (n - 1)) * 0.9);
    sumW += weight;
    sumWX += weight * p.x;
    sumWY += weight * p.y;
    sumWXX += weight * p.x * p.x;
    sumWXY += weight * p.x * p.y;
  });

  const denominator = sumW * sumWXX - sumWX * sumWX;
  if (Math.abs(denominator) < 1e-6) return 0;
  return (sumW * sumWXY - sumWX * sumWY) / denominator;
}

/**
 * Computes I'tidal score from four humors based on Ar-Razi's equilibrium principle.
 */
export function calculateItidalScore(sanguinis: number, koleris: number, melankolis: number, flegmatis: number): number {
  const variance =
    Math.abs(sanguinis - 25) +
    Math.abs(koleris - 25) +
    Math.abs(melankolis - 25) +
    Math.abs(flegmatis - 25);
  return Math.max(25, Math.min(98, Math.round(100 - variance * 0.7)));
}

/**
 * Main Predictive Engine: generates complete forecast report from history.
 */
export function generateMizajPrediction(
  history: FirasatAnalysisResult[],
  profileName: string = 'Subjek',
  horizonDays: number = 60,
  intervention: InterventionType = 'natural'
): PredictiveAnalysisReport {
  // Sort ascending by date
  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const n = sorted.length;
  const now = new Date();
  const latestDate = n > 0 ? new Date(sorted[n - 1].timestamp) : now;
  const firstDate = n > 0 ? new Date(sorted[0].timestamp) : now;
  const spanDays = Math.max(1, Math.round((latestDate.getTime() - firstDate.getTime()) / 86400000));

  // Determine latest scores
  let latestScores = { sanguinis: 40, koleris: 25, melankolis: 20, flegmatis: 15 };
  if (n > 0) {
    latestScores = { ...sorted[n - 1].mizajScores };
  }

  // Calculate slopes per day for each humor
  const slopes: Record<TemperamentType, number> = {
    sanguinis: 0,
    koleris: 0,
    melankolis: 0,
    flegmatis: 0
  };

  if (n >= 2) {
    const types: TemperamentType[] = ['sanguinis', 'koleris', 'melankolis', 'flegmatis'];
    types.forEach((t) => {
      const points = sorted.map((item) => ({
        x: (new Date(item.timestamp).getTime() - firstDate.getTime()) / 86400000,
        y: item.mizajScores[t] || 25
      }));
      slopes[t] = calculateWeightedSlope(points);
    });
  } else if (n === 1) {
    // If only 1 observation, predict natural mild convergence toward Mu'tadil equilibrium
    slopes.sanguinis = (35 - latestScores.sanguinis) / 90;
    slopes.koleris = (25 - latestScores.koleris) / 90;
    slopes.melankolis = (20 - latestScores.melankolis) / 90;
    slopes.flegmatis = (20 - latestScores.flegmatis) / 90;
  }

  // Adjust slopes based on active intervention simulation
  let interventionModifier: Record<TemperamentType, number> = {
    sanguinis: 0,
    koleris: 0,
    melankolis: 0,
    flegmatis: 0
  };

  if (intervention === 'riyadhah_sabar') {
    // Restrains fire, promotes forbearance
    interventionModifier.koleris = -0.15;
    interventionModifier.sanguinis = 0.08;
    interventionModifier.flegmatis = 0.07;
  } else if (intervention === 'tafakkur_ilmu') {
    // Nurtures wisdom and clarity, reduces dark melancholy
    interventionModifier.melankolis = -0.12;
    interventionModifier.sanguinis = 0.1;
    interventionModifier.koleris = 0.02;
  } else if (intervention === 'tekanan_stres') {
    // Chronic stress escalates choleric flare & melancholic rumination
    interventionModifier.koleris = 0.18;
    interventionModifier.melankolis = 0.12;
    interventionModifier.sanguinis = -0.15;
    interventionModifier.flegmatis = -0.15;
  } else if (intervention === 'tabrid_istirahat') {
    // Cools excess heat, increases phlegmatic/sanguine lubrication
    interventionModifier.koleris = -0.18;
    interventionModifier.flegmatis = 0.12;
    interventionModifier.sanguinis = 0.06;
  }

  // Confidence calculation: more sessions + longer span = higher confidence (up to 95%)
  let baseConfidence = 55;
  if (n === 1) baseConfidence = 50;
  else if (n === 2) baseConfidence = 70;
  else if (n === 3) baseConfidence = 82;
  else baseConfidence = Math.min(95, 85 + (n - 3) * 2.5);

  // Build combined chronological timeline: Historical Points + Projected Future Points
  const timelineData: PredictiveHorizonPoint[] = [];

  // 1. Add historical actuals
  sorted.forEach((item, idx) => {
    const d = new Date(item.timestamp);
    const itidal = calculateItidalScore(
      item.mizajScores.sanguinis,
      item.mizajScores.koleris,
      item.mizajScores.melankolis,
      item.mizajScores.flegmatis
    );
    timelineData.push({
      horizonDays: Math.round((d.getTime() - latestDate.getTime()) / 86400000),
      label: `Sesi ${idx + 1}`,
      dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      isProjected: false,
      sanguinis: item.mizajScores.sanguinis,
      koleris: item.mizajScores.koleris,
      melankolis: item.mizajScores.melankolis,
      flegmatis: item.mizajScores.flegmatis,
      itidal,
      predictedDominant: item.dominantMizaj,
      confidenceScore: 100,
      itidalUpper: itidal,
      itidalLower: itidal
    });
  });

  // If no history exists, inject a current reference baseline
  if (n === 0) {
    const itidal = calculateItidalScore(
      latestScores.sanguinis,
      latestScores.koleris,
      latestScores.melankolis,
      latestScores.flegmatis
    );
    timelineData.push({
      horizonDays: 0,
      label: 'Hari Ini (Estimasi)',
      dateStr: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      isProjected: false,
      sanguinis: latestScores.sanguinis,
      koleris: latestScores.koleris,
      melankolis: latestScores.melankolis,
      flegmatis: latestScores.flegmatis,
      itidal,
      predictedDominant: 'sanguinis',
      confidenceScore: 50,
      itidalUpper: itidal,
      itidalLower: itidal
    });
  }

  // 2. Add future horizon projection steps
  // We project at intervals: +14 days, +30 days, +60 days, +90 days (bounded by horizonDays)
  const steps = [14, 30, 45, 60, 90].filter((d) => d <= Math.max(30, horizonDays));
  if (!steps.includes(horizonDays)) {
    steps.push(horizonDays);
    steps.sort((a, b) => a - b);
  }

  steps.forEach((daysAhead) => {
    const futureDate = new Date(latestDate.getTime() + daysAhead * 86400000);
    const dateLabel = `+${daysAhead} Hari (${futureDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })})`;

    // Raw extrapolation
    const rawSan = Math.max(
      5,
      latestScores.sanguinis + (slopes.sanguinis + interventionModifier.sanguinis) * daysAhead
    );
    const rawKol = Math.max(
      5,
      latestScores.koleris + (slopes.koleris + interventionModifier.koleris) * daysAhead
    );
    const rawMel = Math.max(
      5,
      latestScores.melankolis + (slopes.melankolis + interventionModifier.melankolis) * daysAhead
    );
    const rawFleg = Math.max(
      5,
      latestScores.flegmatis + (slopes.flegmatis + interventionModifier.flegmatis) * daysAhead
    );

    const sum = rawSan + rawKol + rawMel + rawFleg;
    let normSan = Math.round((rawSan / sum) * 100);
    let normKol = Math.round((rawKol / sum) * 100);
    let normMel = Math.round((rawMel / sum) * 100);
    let normFleg = Math.round((rawFleg / sum) * 100);

    // Adjust rounding difference
    const diff = 100 - (normSan + normKol + normMel + normFleg);
    normSan += diff;

    // Determine predicted dominant
    let dominant: TemperamentType = 'sanguinis';
    let maxVal = normSan;
    if (normKol > maxVal) {
      dominant = 'koleris';
      maxVal = normKol;
    }
    if (normMel > maxVal) {
      dominant = 'melankolis';
      maxVal = normMel;
    }
    if (normFleg > maxVal) {
      dominant = 'flegmatis';
      maxVal = normFleg;
    }

    const itidal = calculateItidalScore(normSan, normKol, normMel, normFleg);

    // Uncertainty increases with time
    const uncertainty = Math.min(18, Math.round((daysAhead / 90) * 14) + (n <= 1 ? 8 : 2));
    const stepConfidence = Math.max(40, baseConfidence - Math.round((daysAhead / 90) * 12));

    timelineData.push({
      horizonDays: daysAhead,
      label: dateLabel,
      dateStr: futureDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      isProjected: true,
      sanguinis: normSan,
      koleris: normKol,
      melankolis: normMel,
      flegmatis: normFleg,
      itidal,
      predictedDominant: dominant,
      confidenceScore: stepConfidence,
      itidalUpper: Math.min(99, itidal + uncertainty),
      itidalLower: Math.max(20, itidal - uncertainty)
    });
  });

  // Calculate Humor Velocities & Deltas
  const targetHorizonPoint = timelineData[timelineData.length - 1];
  const types: TemperamentType[] = ['sanguinis', 'koleris', 'melankolis', 'flegmatis'];

  const velocities: HumorVelocity[] = types.map((t) => {
    const cur = latestScores[t] || 25;
    const proj = targetHorizonPoint[t];
    const totalDelta = proj - cur;
    const monthlyDelta = Math.round((totalDelta / Math.max(1, horizonDays)) * 30 * 10) / 10;

    let dir: 'rising' | 'falling' | 'stable' = 'stable';
    if (monthlyDelta >= 1.5) dir = 'rising';
    else if (monthlyDelta <= -1.5) dir = 'falling';

    let sig = '';
    if (t === 'koleris') {
      sig =
        dir === 'rising'
          ? 'Peningkatan unsur api (panas-kering); waspadai gejolak amarah dan kelelahan jantung.'
          : dir === 'falling'
          ? 'Peredaman unsur api; jiwa batiniah semakin tenang dan bijak dalam bertindak.'
          : 'Elemen api terjaga dalam intensitas stabil.';
    } else if (t === 'sanguinis') {
      sig =
        dir === 'rising'
          ? 'Pertambahan unsur darah (panas-lembap); meningkatkan optimisme, sosialitas, dan keceriaan.'
          : dir === 'falling'
          ? 'Penurunan kelincahan sanguinis; fokus batin lebih mengarah ke refleksi diri.'
          : 'Daya hidup sanguinis seimbang dan bersahabat.';
    } else if (t === 'melankolis') {
      sig =
        dir === 'rising'
          ? 'Akumulasi materi tanah (dingin-kering); meningkatkan daya analisis namun rawan overthinking.'
          : dir === 'falling'
          ? 'Beban pikiran dan keraguan berkurang; hati terasa lebih lapang dan bebas was-was.'
          : 'Kedalaman nalar melankolis berjalan wajar.';
    } else {
      sig =
        dir === 'rising'
          ? 'Dominasi unsur lendir/air (dingin-lembap); menenangkan saraf namun perlu menjaga kebugaran.'
          : dir === 'falling'
          ? 'Vitalitas gerak meningkat; keluar dari zona pasif dan kelesuan.'
          : 'Kelenturan flegmatis terjaga stabil.';
    }

    return {
      humor: t,
      label: HUMOR_CONFIG[t].label,
      currentScore: cur,
      projectedScore: proj,
      monthlyDelta,
      trendDirection: dir,
      classicalSignificance: sig,
      humorColor: HUMOR_CONFIG[t].color
    };
  });

  // Early Warning & Risk Analysis
  const earlyWarnings: EarlyWarningRisk[] = [];
  const projKol = targetHorizonPoint.koleris;
  const projMel = targetHorizonPoint.melankolis;
  const projFleg = targetHorizonPoint.flegmatis;
  const projSan = targetHorizonPoint.sanguinis;

  if (projKol >= 38) {
    earlyWarnings.push({
      level: projKol >= 48 ? 'elevated' : 'moderate',
      humor: 'koleris',
      title: 'Kecenderungan Gejolak Koleris (Al-Mirrah Ash-Shafra\')',
      symptoms: [
        'Pandangan mata menajam dan mudah tersinggung saat ide didebat',
        'Detak nadi teraba cepat dan rasa haus di sore hari',
        'Dorongan tergesa-gesa dalam mengambil keputusan penting'
      ],
      kitabReference: 'Kitab Al-Firasat, Bab Tanda-Tanda Panas Kering & Kaidah Tarjih Organ (hal. 128)',
      preventativePrescription:
        'Lakukan Tabrid (pendinginan): konsumsi buah tin, air rebusan delima, perbanyak jeda diam (ash-shamt) sebelum menjawab sanggahan.'
    });
  }

  if (projMel >= 32) {
    earlyWarnings.push({
      level: projMel >= 42 ? 'elevated' : 'moderate',
      humor: 'melankolis',
      title: 'Akumulasi Gelap Melankolis (Al-Khalth Al-Aswad)',
      symptoms: [
        'Kerutan ganda di antara dua alis saat merenung',
        'Kecurigaan atau kewaspadaan berlebihan terhadap orang sekitar',
        'Rasa berat di pundak dan kesulitan memulai hal baru'
      ],
      kitabReference: 'At-Tibb Ar-Ruhani & Kitab Al-Firasat, Bab Ghuluw Al-Fikr (hal. 142)',
      preventativePrescription:
        'Tadabbur alam terbuka hijau, interaksi dengan kawan berjiwa humoris ceria (inbisath), dan sedekah tersembunyi untuk melenyapkan kegelisahan batin.'
    });
  }

  if (projFleg >= 35) {
    earlyWarnings.push({
      level: 'moderate',
      humor: 'flegmatis',
      title: 'Kelesuan Air Dingin Flegmatis (Al-Balgham)',
      symptoms: [
        'Gerak langkah melambat dan enggan mengambil inisiatif',
        'Kelopak mata tampak berat di pagi hari',
        'Mudah menunda penyelesaian tugas yang menuntut ketegasan'
      ],
      kitabReference: 'Kitab Al-Firasat, Bab Al-Kusul wa Burudah Al-Mizaj (hal. 150)',
      preventativePrescription:
        'Tingkatkan aktivitas fisik pagi hari, konsumsi madu hangat dengan perasan jahe, serta tetapkan tenggat waktu ketat.'
    });
  }

  if (earlyWarnings.length === 0) {
    earlyWarnings.push({
      level: 'optimal',
      humor: 'sanguinis',
      title: 'Keseimbangan Tabiat Luhur (I\'tidal Al-Mizaj)',
      symptoms: [
        'Raut wajah berseri teduh dan sorot pandang tenang berwibawa',
        'Kapasitas adaptasi prima dalam berbagai kondisi sosial',
        'Harmoni antara daya nalar, ketabahan, dan kelembutan tutur'
      ],
      kitabReference: 'Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi, Bab Al-Mizaj Al-Mu\'tadil (hal. 156)',
      preventativePrescription:
        'Pertahankan kontinuitas ibadah, tafakkur syukur harian, dan pantau evaluasi berkala setiap 30 hari untuk menjaga kesucian firasat.'
    });
  }

  // Current vs Projected Summary
  const currentItidal = calculateItidalScore(
    latestScores.sanguinis,
    latestScores.koleris,
    latestScores.melankolis,
    latestScores.flegmatis
  );
  const projectedItidal = targetHorizonPoint.itidal;
  let itidalTrajectory: 'improving' | 'declining' | 'stable' = 'stable';
  if (projectedItidal - currentItidal >= 3) itidalTrajectory = 'improving';
  else if (currentItidal - projectedItidal >= 3) itidalTrajectory = 'declining';

  // Calculate days to reach optimal I'tidal (>= 75%)
  let daysToOptimalItidal: number | null = null;
  if (currentItidal >= 75) {
    daysToOptimalItidal = 0; // already optimal
  } else if (itidalTrajectory === 'improving') {
    const dailyGain = (projectedItidal - currentItidal) / horizonDays;
    if (dailyGain > 0) {
      daysToOptimalItidal = Math.max(7, Math.round((75 - currentItidal) / dailyGain));
    }
  }

  // Preventative Action Roadmap
  const preventativeRoadmap = [
    {
      phase: 'Fase I: Penyelarasan Fondasi (Hari 1 - 14)',
      targetDays: '14 Hari',
      focusAkhlak: 'Al-Hilm (Kesabaran Menahan Emosi)',
      recommendedActions: [
        'Evaluasi reaksi spontan saat menerima kritik atau kendala kerja.',
        'Latihan bernapas dalam dan jeda 5 detik sebelum menanggapi perdebatan.',
        'Waktu tidur teratur sebelum tengah malam untuk menjaga kelembapan otak.'
      ],
      classicalDietAndEnvironment: 'Minum air putih bersuhu sejuk alami, kurangi rempah menyengat dan gorengan kering.'
    },
    {
      phase: 'Fase II: Konsolidasi Riyadhah (Hari 15 - 45)',
      targetDays: '30 Hari Lanjutan',
      focusAkhlak: 'Al-Hikmah & Al-Iffah (Pengendalian Kehendak)',
      recommendedActions: [
        'Alokasikan 15 menit harian untuk muhasabah dan pencatatan refleksi diri.',
        'Perluas ruang kolaborasi dengan rekan berkarakter seimbang (mu\'tadil).',
        'Tinjau kembali target jangka panjang tanpa tergesa-gesa.'
      ],
      classicalDietAndEnvironment: 'Aromaterapi minyak mawar atau cendana lembut di ruang istirahat.'
    },
    {
      phase: 'Fase III: Pemantapan I\'tidal (Hari 46 - 90)',
      targetDays: 'Kuartal Penuh',
      focusAkhlak: 'Al-Adl (Keadilan Sikap & Kematangan Jiwa)',
      recommendedActions: [
        'Lakukan pemindaian wajah & telapak tangan ulang untuk memverifikasi tren proyeksi.',
        'Amati apakah garis lembut di kening dan sudut bibir tampak semakin rileks.',
        'Bagikan pengalaman positif kepada tim untuk menjaga resonansi kebaikan.'
      ],
      classicalDietAndEnvironment: 'Kombinasi nutrisi berimbang antara unsur basah segar dan biji-bijian penopang stamina.'
    }
  ];

  // Imam Fakhruddin Ar-Razi Verdict
  const currentDominant = sorted.length > 0 ? sorted[sorted.length - 1].dominantMizaj : 'sanguinis';
  const projectedDominant = targetHorizonPoint.predictedDominant;

  const arRaziPredictiveVerdict = {
    summary:
      itidalTrajectory === 'improving'
        ? `Proyeksi menunjukkan perkembangan positif. Tabiat subjek diprediksi bergerak mendekati tingkat Al-Mizaj al-Mu'tadil dalam ${horizonDays} hari ke depan dengan penguatan unsur harmonis.`
        : itidalTrajectory === 'declining'
        ? `Terdapat sinyal pergeseran menuju ketidakseimbangan (${projectedDominant}). Imam Ar-Razi menekankan pentingnya intervensi riyadhah akhlak sejak dini sebelum watak membeku menjadi tabiat permanen.`
        : `Dinamika karakter subjek diproyeksikan sangat stabil dan konsisten. Pertahankan pola disiplin harian untuk memelihara integritas tabiat batiniah.`,
    arabicAphorism: 'المزاج تابع للعادة، والعادة طبيعة ثانية تُكتسب بالتدريب',
    translation:
      'Temperamen mengikuti kebiasaan, dan kebiasaan adalah tabiat kedua yang dapat ditempa melalui latihan dan disiplin batin.',
    sourceChapter: 'Imam Fakhruddin Ar-Razi, At-Tibb Ar-Ruhani (Pasal Perubahan Karakter Melalui Ikhtiar)'
  };

  return {
    profileName,
    historicalSessionsCount: n,
    observationSpanDays: spanDays,
    forecastHorizonDays: horizonDays,
    confidenceScore: Math.round(baseConfidence),
    currentDominant,
    projectedDominant,
    currentItidal,
    projectedItidal,
    itidalTrajectory,
    daysToOptimalItidal,
    timelineData,
    velocities,
    earlyWarnings,
    preventativeRoadmap,
    arRaziPredictiveVerdict
  };
}
