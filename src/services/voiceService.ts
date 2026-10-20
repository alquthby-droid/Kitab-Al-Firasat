// Voice Service: Text-to-Speech (TTS) Narration & Microphone Voice Firasat Analysis
// Based on Kitab Al-Firasat by Imam Fakhruddin Ar-Razi (Bab Ash-Shawt wal-Kalam)

export interface VocalAnalysisResult {
  pitchCategory: 'rendah' | 'sedang' | 'tinggi'; // jahir / mutawassith / rafi'
  tempoCategory: 'lambat' | 'sedang' | 'cepat';  // buth'i / mu'tadil / sari'
  volumeCategory: 'lantang' | 'sedang' | 'pelan';
  toneQuality: 'bergema' | 'lembut' | 'parau' | 'tajam';
  measuredFrequencyHz?: number;
  firasatDeduction: {
    character: string;
    arabicQuote: string;
    explanation: string;
    dominantMizajTendency: 'koleris' | 'sanguinis' | 'melankolis' | 'flegmatis';
    strengths: string[];
    cautions: string[];
  };
}

class VoiceManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private onStateChangeListeners: Array<(state: { isSpeaking: boolean; isPaused: boolean; text: string }) => void> = [];
  private currentText: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Subscribe to playback changes
  public subscribe(cb: (state: { isSpeaking: boolean; isPaused: boolean; text: string }) => void) {
    this.onStateChangeListeners.push(cb);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== cb);
    };
  }

  private notify() {
    const state = {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      text: this.currentText
    };
    this.onStateChangeListeners.forEach(cb => cb(state));
  }

  // Speak Indonesian text with optimal voice
  public speak(text: string, lang: 'id-ID' | 'ar-SA' = 'id-ID', rate: number = 0.95, pitch: number = 1.0) {
    if (!this.synth) return;

    // Stop current speech
    this.stop();

    // Clean text of markdown / symbols for clean reading
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    this.currentText = cleanText;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try finding natural Indonesian voice
    const voices = this.synth.getVoices();
    const indonesianVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = '';
      this.notify();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = '';
      this.notify();
    }
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      text: this.currentText
    };
  }
}

export const voiceReader = new VoiceManager();

// Classical Kitab Al-Firasat Vocal Interpretation Rules
export function evaluateVoiceFirasat(
  pitch: 'rendah' | 'sedang' | 'tinggi',
  tempo: 'lambat' | 'sedang' | 'cepat',
  volume: 'lantang' | 'sedang' | 'pelan',
  tone: 'bergema' | 'lembut' | 'parau' | 'tajam',
  measuredHz?: number
): VocalAnalysisResult {
  let character = '';
  let arabicQuote = '';
  let explanation = '';
  let dominantMizajTendency: 'koleris' | 'sanguinis' | 'melankolis' | 'flegmatis' = 'sanguinis';
  const strengths: string[] = [];
  const cautions: string[] = [];

  // Deep resonant pitch (Jahir / Ghalizh)
  if (pitch === 'rendah' && (volume === 'lantang' || tone === 'bergema')) {
    character = 'Pemberani, Berwibawa Tinggi, Teguh Pendirian, dan Berjiwa Pemimpin';
    arabicQuote = 'الصوت العظيم الغليظ الثقيل يدل على قوة الحرارة والشجاعة';
    explanation = 'Menurut Imam Ar-Razi, suara berat dan bergema menunjukkan luasnya kapasitas rongga dada, kekuatan jantung, dan dominasi unsur panas (al-hararah). Menyerupai auman singa, pribadi ini memiliki naluri pelindung dan pantang mundur menghadapi rintangan.';
    dominantMizajTendency = 'koleris';
    strengths.push('Wibawa alami yang didengar orang banyak', 'Keteguhan sikap saat mengambil keputusan sulit', 'Berani menanggung risiko kepemimpinan');
    cautions.push('Waspadai nada bicara yang terkesan mengintimidasi atau menekan', 'Perlu melatih kelembutan intonasi saat menasehati');
  } 
  // Calm, measured, moderate tempo (Kalam Waqur / Mu'tadil)
  else if (tempo === 'lambat' || (pitch === 'sedang' && tone === 'lembut')) {
    character = 'Penyabar (Halim), Bijaksana, Penuh Kehati-hatian, dan Menjaga Martabat';
    arabicQuote = 'من كان كلامه بطيئا فهو وقور صبور ذو عقل راجح';
    explanation = 'Pengendalian ritme kata menandakan akal budi yang menguasai hawa nafsu. Menurut naskah Al-Firasat, orang yang bertutur kata tenang tanpa terburu-buru memiliki kestabilan cairan tubuh (I\'tidal Mizaj), tidak mudah terpancing emosi sesaat.';
    dominantMizajTendency = 'flegmatis';
    strengths.push('Ketenangan jiwa dalam memediasi konflik', 'Kata-kata penuh bobot dan kehati-hatian', 'Mampu menjadi pendengar yang empatik');
    cautions.push('Jangan terlalu lamban dalam situasi yang menuntut ketegasan kilat', 'Ungkapkan gagasan secara lebih lugas bila diperlukan');
  } 
  // Fast, lively, melodic cadence (Kalam Sari' Fasih)
  else if (tempo === 'cepat' || (pitch === 'sedang' && volume === 'lantang')) {
    character = 'Cepat Tanggap, Fasih Bertutur, Kreatif, dan Penuh Antusiasme Sosial';
    arabicQuote = 'الفصاحة وسرعة اللفظ تدل على جودة حفظ اللسان وخفة الروح';
    explanation = 'Darah yang hangat dan bergolak (Sanguinis) memicu kelincahan lidah dan percepatan ide. Imam Ar-Razi menggarisbawahi bahwa kefasihan ini memudahkan diplomasi, persuasi, dan keceriaan dalam pergaulan umum.';
    dominantMizajTendency = 'sanguinis';
    strengths.push('Keahlian komunikasi publik yang memikat', 'Daya tangkap ide yang gesit dan ceria', 'Mudah mencairkan suasana kaku');
    cautions.push('Hindari berbicara mendahului pertimbangan matang', 'Perhatikan agar tidak memotong pembicaraan lawan bicara');
  } 
  // High pitch, sharp, or delicate (Shawt Daqiq / Rafî')
  else if (pitch === 'tinggi' || tone === 'tajam') {
    character = 'Sangat Peka, Cermat Mengamati Rincian, Waspada, dan Kritis';
    arabicQuote = 'دقة الصوت تدل على اليبوسة ودقة الفطنة وشدة التحرز';
    explanation = 'Suara yang meninggi atau berfrekuensi tinggi diasosiasikan dengan unsur dingin-kering (Melankolis) atau kering-panas. Ini mencerminkan saraf yang sensitif, ketajaman intuisi membaca ketidakberesan, dan kehati-hatian tingkat tinggi.';
    dominantMizajTendency = 'melankolis';
    strengths.push('Ketajaman analisis terhadap detail yang luput dari orang lain', 'Kepekaan estetika dan kecermatan kerja', 'Kewaspadaan menjaga amanah');
    cautions.push('Kelola rasa cemas agar tidak berlebihan mencurigai niat orang', 'Latih pernapasan diafragma agar suara lebih rileks');
  } 
  // Default balanced
  else {
    character = 'Seimbang, Fleksibel, Adaptif, dan Menyenangkan';
    arabicQuote = 'اعتدال الصوت دلالة على اعتدال المزاج وسلامة الصدر';
    explanation = 'Kombinasi suara yang tidak terlalu keras dan tidak terlalu lirih merupakan tanda I\'tidal (keseimbangan alami). Kepribadian ini dapat menempatkan diri secara luwes di berbagai lingkungan.';
    dominantMizajTendency = 'sanguinis';
    strengths.push('Kemampuan beradaptasi dengan berbagai karakter', 'Keseimbangan antara logika dan empati');
    cautions.push('Pertahankan prinsip ketika menghadapi desakan kompromi');
  }

  return {
    pitchCategory: pitch,
    tempoCategory: tempo,
    volumeCategory: volume,
    toneQuality: tone,
    measuredFrequencyHz: measuredHz,
    firasatDeduction: {
      character,
      arabicQuote,
      explanation,
      dominantMizajTendency,
      strengths,
      cautions
    }
  };
}
