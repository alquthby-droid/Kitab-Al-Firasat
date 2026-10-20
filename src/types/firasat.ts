export type TemperamentType = 'sanguinis' | 'koleris' | 'melankolis' | 'flegmatis';

export interface MizajDistribution {
  sanguinis: number; // 0 - 100
  koleris: number;   // 0 - 100
  melankolis: number;// 0 - 100
  flegmatis: number; // 0 - 100
}

export interface OrganFeatureAnalysis {
  organ: string;            // e.g. "Dahi", "Mata", "Alis", "Hidung", "Bibir & Mulut", "Wajah", "Leher", "Suara & Tutur"
  arabicName: string;       // e.g. "الجبهة", "العين", "الصوت", etc.
  observation: string;      // What physical trait was observed (e.g. "Dahi berkerut dan cenderung rata")
  kitabRef: string;         // Chapter & rule in Kitab (e.g. "Pembahasan 3, Pasal 1 (hal. 162)")
  associatedAnimal?: string;// e.g. "Singa", "Elang", "Kera", "Kerbau"
  traitIndication: string;  // Character deduced (e.g. "Cenderung pemarah saat tertekan")
  humorEffect: string;      // e.g. "Dominasi unsur Panas (Hararah)"
  confidence: number;       // 0 - 100%
}

export interface VoiceTraitData {
  pitch: 'berat_rendah' | 'sedang' | 'tinggi_melengking';
  tempo: 'lambat_tertata' | 'sedang' | 'cepat_tergesa';
  loudness: 'lantang_tebal' | 'sedang' | 'lirih_halus';
  breath: 'panas_lapang' | 'teratur' | 'berat_tersendat';
  traitSummary: string;
  arabicReference: string;
  kitabReference: string;
}

export interface PalmHandDetail {
  lifeLine: string;
  headLine: string;
  heartLine: string;
  texture: string;
  mizajIndication: string;
}

export interface PalmAnalysisData {
  rightHand: PalmHandDetail;
  leftHand: PalmHandDetail;
  summary: string;
}

export interface FirasatAnalysisResult {
  id: string;
  profileId?: string;
  subjectName: string;
  timestamp: string;
  imageUrl?: string;
  sourceType: 'camera' | 'upload' | 'sample' | 'manual';
  dominantMizaj: TemperamentType;
  mizajScores: MizajDistribution;
  iTidalStatus: 'Mu\'tadil (Seimbang)' | 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)';
  ageStage?: 'Pertumbuhan' | 'Remaja' | 'Paruh Baya (Kuhulah)' | 'Usia Lanjut (Syaikhukhah)';
  features: OrganFeatureAnalysis[];
  voiceAnalysis?: VoiceTraitData;
  palmAnalysis?: PalmAnalysisData;
  overallSummary: {
    primaryStrengths: string[];
    potentialWeaknesses: string[];
    naturalInclination: string;
    tarjihNote: string;           // Principle of tarjih applied when signals conflict
    spiritualAdvice: string;      // Riyadhah & tazkiyatun nafs guidance
  };
  classicalQuote: {
    chapter: string;
    arabicText: string;
    indonesianTranslation: string;
    context: string;
  };
  notes?: string;
}

export interface SubjectProfile {
  id: string;
  name: string;
  category: 'Keluarga' | 'Rekan Kerja' | 'Partner Bisnis' | 'Murid/Binaan' | 'Sahabat' | 'Diri Sendiri' | 'Lainnya';
  avatarUrl?: string;
  ageStage?: 'Pertumbuhan' | 'Remaja' | 'Paruh Baya (Kuhulah)' | 'Usia Lanjut (Syaikhukhah)' | string;
  notes: string;
  createdAt: string;
  lastAnalysisDate?: string;
  analysisCount: number;
  monitoringIntervalDays: number; // default 14 or 30 days
  nextReviewDate?: string;
}

export interface PeriodicNotification {
  id: string;
  profileId: string;
  profileName: string;
  scheduledDate: string;
  dueDate: string;
  title: string;
  message: string;
  status: 'pending' | 'completed' | 'dismissed';
  createdAt: string;
}

export interface KitabChapter {
  id: string;
  number: number;
  title: string;
  arabicTitle: string;
  part: 'Pembahasan Pertama' | 'Pembahasan Kedua' | 'Pembahasan Ketiga' | 'Glosarium & Kaidah';
  summary: string;
  classicalTextSnippet?: string;
  rules: {
    id: string;
    physicalFeature: string;
    characterDeduction: string;
    arabicQuote?: string;
    explanation: string;
    animalMetaphor?: string;
  }[];
}
