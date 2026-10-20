import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  UserCheck, 
  Scroll, 
  ChevronDown, 
  ChevronUp,
  Bookmark,
  Heart,
  Droplets,
  Flame,
  Mountain,
  Wind,
  Volume2,
  VolumeX,
  Play,
  Square,
  Database,
  HardDriveDownload,
  CheckCircle2
} from 'lucide-react';
import { KITAB_CHAPTERS, GLOSSARY_TERMS, MIZAJ_DATA } from '../data/kitabFirasatData';
import { sound } from '../services/sound';
import { voiceReader } from '../services/voiceService';
import { indexedDbCache } from '../services/indexedDbCache';

export const KitabLibrary: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'mukadimah' | 'organs' | 'mizaj' | 'glossary' | 'biography'>('mukadimah');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrganId, setSelectedOrganId] = useState<string>('all');
  const [expandedChapterId, setExpandedChapterId] = useState<string>('ch-mata');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [chapters, setChapters] = useState(KITAB_CHAPTERS);
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(true);
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(!indexedDbCache.isOnline());

  React.useEffect(() => {
    // Load from IndexedDB cache
    indexedDbCache.getKitabChapters().then(cachedList => {
      if (cachedList && cachedList.length > 0) {
        setChapters(cachedList);
      }
    });

    // Subscribe to online/offline changes
    const unsubOnline = indexedDbCache.subscribeOnlineStatus((online) => {
      setIsNetworkOffline(!online);
    });

    const unsubVoice = voiceReader.subscribe((st) => {
      setIsSpeaking(st.isSpeaking && !st.isPaused);
      if (!st.isSpeaking) {
        setCurrentPlayingId(null);
      }
    });

    return () => {
      unsubOnline();
      unsubVoice();
      voiceReader.stop();
    };
  }, []);

  const handleReadText = (id: string, text: string) => {
    sound.playClick();
    if (isSpeaking && currentPlayingId === id) {
      voiceReader.stop();
      setCurrentPlayingId(null);
    } else {
      setCurrentPlayingId(id);
      voiceReader.speak(text);
    }
  };

  const filteredChapters = chapters.filter(ch => {
    if (selectedOrganId !== 'all' && ch.id !== selectedOrganId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = ch.title.toLowerCase().includes(q) || ch.summary.toLowerCase().includes(q);
    const rulesMatch = ch.rules.some(r => 
      r.physicalFeature.toLowerCase().includes(q) || 
      r.characterDeduction.toLowerCase().includes(q) ||
      r.explanation.toLowerCase().includes(q)
    );
    return titleMatch || rulesMatch;
  });

  const filteredGlossary = GLOSSARY_TERMS.filter(term => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return term.term.toLowerCase().includes(q) || 
      term.definition.toLowerCase().includes(q) ||
      term.status.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* IndexedDB Offline Cache Banner */}
      <div className={`p-3.5 px-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isNetworkOffline 
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
          : 'bg-stone-900/80 border-amber-900/30 text-stone-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-1.5 text-stone-100">
              <span>Penyimpanan Lokal IndexedDB Aktif</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Akses Offline Siap
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Seluruh 17 Bab Kitab Al-Firasat, tabel Mizaj, dan kaidah tafsir tersimpan di IndexedDB peramban Anda. Anda tetap dapat membaca dan mencari referensi meskipun tanpa sambungan internet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tersinkronisasi</span>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Kutubut Turats Al-Islami</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
            Perpustakaan Kitab Al-Firasat
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Panduan interpretasi mendalam, rujukan dalil, 17 bab organ tubuh, kaidah tarjih, dan 
            biografi Syaikhul Islam Fakhruddin Ar-Razi (554–606 H).
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex flex-wrap p-1 bg-stone-900 border border-stone-800 rounded-xl gap-1">
          <button
            onClick={() => setActiveSection('mukadimah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'mukadimah'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Kaidah & Dalil
          </button>
          <button
            onClick={() => setActiveSection('organs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'organs'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            17 Bab Organ
          </button>
          <button
            onClick={() => setActiveSection('mizaj')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'mizaj'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            4 Mizaj & Keseimbangan
          </button>
          <button
            onClick={() => setActiveSection('glossary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'glossary'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Glosarium Syar'i
          </button>
          <button
            onClick={() => setActiveSection('biography')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'biography'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Tentang Ar-Razi
          </button>
        </div>
      </div>

      {/* SECTION 1: MUKADIMAH, DALIL, DAN KAIDAH TARJIH */}
      {activeSection === 'mukadimah' && (
        <div className="space-y-6">
          {/* Card Dalil Quran */}
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Scroll className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold font-title text-stone-100">
                Dalil-Dalil Syariat tentang Keutamaan Ilmu Firasat
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  QS. Al-Hijr [15]: 75
                </span>
                <p className="font-arabic text-amber-200 text-lg text-right">
                  إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّلْمُتَوَسِّمِينَ
                </p>
                <p className="text-xs text-stone-300 italic">
                  "Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi orang-orang yang memperhatikan tanda-tanda (al-mutawassimûn / ahli firasat)."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  QS. Al-Baqarah [2]: 273
                </span>
                <p className="font-arabic text-amber-200 text-lg text-right">
                  تَعْرِفُهُم بِسِيمَاهُمْ لَا يَسْأَلُونَ النَّاسَ إِلْحَافًا
                </p>
                <p className="text-xs text-stone-300 italic">
                  "Engkau mengenal mereka dari ciri-ciri lahiriahnya (sîmâhum); mereka tidak meminta-minta kepada orang lain secara mendesak."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  QS. Muhammad [47]: 30
                </span>
                <p className="font-arabic text-amber-200 text-lg text-right">
                  وَلَتَعْرِفَنَّهُمْ فِي لَحْنِ الْقَوْلِ
                </p>
                <p className="text-xs text-stone-300 italic">
                  "Dan engkau benar-benar akan mengenal mereka dari nada bicaranya (lahn al-qawl)."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Hadits Riwayat Al-Bukhari & At-Tirmidzi
                </span>
                <p className="font-arabic text-amber-200 text-lg text-right">
                  اتَّقُوا فِرَاسَةَ الْمُؤْمِنِ فَإِنَّهُ يَنْظُرُ بِنُورِ اللَّهِ
                </p>
                <p className="text-xs text-stone-300 italic">
                  "Takutlah kalian terhadap firasat seorang mukmin, karena sesungguhnya ia melihat dengan cahaya Allah."
                </p>
              </div>
            </div>
          </div>

          {/* 2 Jenis Firasat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> 1. Firasat Imaniyyah / Ilahiyyah
              </span>
              <h4 className="text-sm font-bold text-stone-100">Cahaya Ilahi di Kalbu Mukmin</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Firasat yang tiba-tiba muncul di hati tanpa perlu tanda-tanda fisik lahiriah yang diraba. 
                Ini bersumber dari kesucian jiwa, kedekatan kepada Allah, dan istiqamah. 
                Firasat jenis ini adalah anugerah murni (mauhibah ilahiyyah) yang tidak dapat dipelajari secara teknis kurikulum.
              </p>
              <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                Contoh: Ketajaman firasat Abu Bakar Ash-Shiddiq terhadap Sayyidina Umar ra., dan firasat putri Nabi Syu'aib terhadap Nabi Musa as.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> 2. Firasat Khalqiyyah (Fisiognomi Medis)
              </span>
              <h4 className="text-sm font-bold text-stone-100">Membaca Watak dari Bentuk Fisik</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Ilmu yang disusun oleh para dokter dan ulama untuk menarik kesimpulan atas keadaan batiniah melalui pengamatan kondisi lahiriah tubuh. 
                Firasat inilah yang menjadi fokus utama Kitab Fakhruddin Ar-Razi dan <span className="text-emerald-400 font-semibold">bisa dipelajari serta diajarkan secara rasional</span>.
              </p>
              <div className="text-[11px] text-emerald-300/80 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                Membahas 17 anggota tubuh, proporsi kepala, dahi, mata, hidung, warna kulit, suara, tawa, dan cara berjalan.
              </div>
            </div>
          </div>

          {/* Rambu-rambu Penarikan Kesimpulan & Kaidah Tarjih */}
          <div className="rounded-2xl bg-stone-900 border border-amber-900/40 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold font-title text-stone-100">
                Rambu-Rambu Penarikan Kesimpulan (Pasal Ketujuh Ar-Razi)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-bold text-amber-400 block text-sm">1. Bukan Kepastian Mutlak</span>
                <p className="leading-relaxed">
                  Satu atau dua tanda fisik bukan merupakan vonis mutlak (qath'i), melainkan hanya dugaan awal (zhann). 
                  Semakin banyak tanda fisik yang saling berkesesuaian, semakin kuat dugaan tersebut mendekati kepastian.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-bold text-amber-400 block text-sm">2. Kaidah Tarjih (Organ Asal)</span>
                <p className="leading-relaxed">
                  Jika terjadi kontradiksi (misal: tanda mata menunjukkan penakut, namun dada dan bahu menunjukkan pemberani), 
                  maka tanda dari organ asal yang lebih dekat dengan sumber watak dimenangkan. Keberanian berpusat di jantung dan dada!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-bold text-amber-400 block text-sm">3. Tabiat vs Latihan Budi (Riyadhah)</span>
                <p className="leading-relaxed">
                  Kisah Ahli Hikmah Aflimun dan Raja: Tanda fisik hanya membaca tabiat alami bawaan (thabi'iyyah). 
                  Manusia yang berakal dan bertakwa mampu menundukkan tabiat buruk melalui latihan budi pekerti dan syariat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 17 BAB ORGAN TUBUH */}
      {activeSection === 'organs' && (
        <div className="space-y-4">
          {/* Organ Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Cari organ, bentuk fisik, atau karakter (misal: dahi, singa, cerdas, pemarah)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <select
              value={selectedOrganId}
              onChange={(e) => setSelectedOrganId(e.target.value)}
              className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200"
            >
              <option value="all">Semua Organ Kitab</option>
              {KITAB_CHAPTERS.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.title}</option>
              ))}
            </select>
          </div>

          {/* Chapter Accordion Cards */}
          <div className="space-y-3">
            {filteredChapters.map((ch) => {
              const isExpanded = expandedChapterId === ch.id;
              return (
                <div
                  key={ch.id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedChapterId(isExpanded ? '' : ch.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-stone-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                        {ch.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-100 font-title">{ch.title}</h4>
                          <span className="font-arabic text-amber-400 text-sm hidden sm:inline">{ch.arabicTitle}</span>
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-1">{ch.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-amber-400/80 font-mono hidden sm:inline">
                        {ch.rules.length} Kaidah
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-stone-800/80 space-y-4 animate-in fade-in">
                      {/* Audio Narration Bar for Chapter */}
                      <div className="flex items-center justify-between bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-xs text-stone-300 font-medium">Dengarkan pembacaan naskah bab ini:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = `${ch.title}. ${ch.summary}. ${ch.rules.map(r => `${r.physicalFeature}: pertanda watak ${r.characterDeduction}. ${r.explanation}`).join('. ')}`;
                            handleReadText(ch.id, text);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            isSpeaking && currentPlayingId === ch.id
                              ? 'bg-amber-400 text-stone-950 shadow-md animate-pulse'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isSpeaking && currentPlayingId === ch.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{isSpeaking && currentPlayingId === ch.id ? 'Hentikan Audio' : 'Dengarkan Bab Ini (TTS)'}</span>
                        </button>
                      </div>

                      {ch.classicalTextSnippet && (
                        <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-right">
                          <span className="text-[10px] text-stone-500 font-mono block text-left mb-1">Naskah Asli Arab (Matn):</span>
                          <p className="font-arabic text-amber-300/90 text-sm leading-relaxed">{ch.classicalTextSnippet}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ch.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-2 hover:border-amber-500/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-stone-200">
                                {rule.physicalFeature}
                              </span>
                              {rule.animalMetaphor && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-medium whitespace-nowrap">
                                  {rule.animalMetaphor}
                                </span>
                              )}
                            </div>

                            {rule.arabicQuote && (
                              <p className="font-arabic text-amber-400 text-xs text-right">
                                "{rule.arabicQuote}"
                              </p>
                            )}

                            <div className="text-xs text-amber-200/90 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                              <span className="font-semibold text-amber-400">Watak Batiniah: </span>
                              {rule.characterDeduction}
                            </div>

                            <p className="text-[11px] text-stone-400 leading-relaxed">
                              {rule.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: 4 MIZAJ & KESEIMBANGAN */}
      {activeSection === 'mizaj' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-xs text-stone-300 leading-relaxed">
            <h3 className="text-base font-bold font-title text-stone-100 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>Konsep 4 Cairan Tubuh (Al-Akhlâth Al-Arba\'ah) & Keseimbangan Jiwa</span>
            </h3>
            <p>
              Imam Fakhruddin Ar-Razi menjelaskan bahwa kepribadian manusia (mizaj) bertumpu pada dominasi 4 cairan tubuh: 
              darah (sanguis), empedu kuning (chole), empedu hitam (melanchole), dan lendir (phlegma). 
              Manusia paling mulia adalah yang berada pada derajat <strong>Mizaj Mu'tadil (Seimbang)</strong>, 
              di mana sifat panas, dingin, lembap, dan kering berada dalam proporsi ideal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(MIZAJ_DATA) as (keyof typeof MIZAJ_DATA)[]).map((key) => {
              const item = MIZAJ_DATA[key];
              return (
                <div
                  key={item.type}
                  className="rounded-2xl bg-stone-900 border border-stone-800 p-5 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {item.elements}
                        </span>
                        <h4 className="text-base font-bold text-stone-100 font-title">{item.indonesianName}</h4>
                      </div>
                      <span className="font-arabic text-amber-400 text-base">{item.arabicName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                      <div><span className="text-stone-500">Cairan:</span> {item.humor}</div>
                      <div><span className="text-stone-500">Sifat:</span> {item.qualities}</div>
                      <div className="col-span-2"><span className="text-stone-500">Warna Kulit:</span> {item.colorSkin}</div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-stone-200 block mb-1">Ciri Fisik Lahiriah:</span>
                      <ul className="text-xs text-stone-400 space-y-1">
                        {item.physicalSigns.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-stone-200 block mb-1">Watak Mental & Batiniah:</span>
                      <ul className="text-xs text-stone-400 space-y-1">
                        {item.mentalTraits.map((m, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-800/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Riyâdhah & Penyeimbang Spiritual:
                    </span>
                    <p className="text-xs text-stone-300 italic">{item.spiritualRemedy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: GLOSARIUM SYAR'I */}
      {activeSection === 'glossary' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-100 font-title">
                Glosarium Istilah Firasat & Batasan Syariat
              </h3>
              <p className="text-xs text-stone-400">
                Pembeda tegas antara ilmu firasat ilmiah yang dibolehkan Islam dengan perkara ramalan gaib yang diharamkan.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Masyru' (Halal)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800">
                Haram (Terlarang)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGlossary.map((item, idx) => {
              const isHaram = item.status.toLowerCase().includes('haram');
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isHaram 
                      ? 'bg-red-950/15 border-red-900/40 text-stone-200' 
                      : 'bg-stone-950 border-stone-800 text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold font-title text-amber-300">
                      {item.term}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHaram 
                        ? 'bg-red-900/60 text-red-200 border border-red-700' 
                        : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed mb-2">
                    {item.definition}
                  </p>

                  <span className="text-[10px] text-stone-500 font-mono block border-t border-stone-800/60 pt-1.5">
                    Sumber: {item.source}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: BIOGRAFI IMAM FAKHRUDDIN AR-RAZI */}
      {activeSection === 'biography' && (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Biografi Sang Pelopor Fisiognomi Rasional
              </span>
              <h3 className="text-2xl font-bold font-title text-stone-100 mt-1">
                Al-Imam Fakhruddin Ar-Razi (554 - 606 H / 1150 - 1210 M)
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Muhammad bin Umar bin Hasan bin Husain at-Taimi al-Bakri (Keturunan Sayyidina Abu Bakar Ash-Shiddiq)
              </p>
            </div>
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-center">
              <span className="text-xs text-stone-500 block">Dilahirkan di</span>
              <span className="text-sm font-bold text-amber-300">Kota Ray, Iran</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-stone-300 space-y-3 leading-relaxed">
            <p>
              Imam Fakhruddin ar-Razi dikenal dengan julukan <em>Syaikhul Islam</em>, <em>Ibnu al-Khatib ar-Ray</em>, 
              dan <em>Abu Abdillah</em>. Beliau adalah mujaddid abad ke-6 Hijriyah yang menguasai ilmu tafsir, filsafat, 
              ilmu kalam, kedokteran, geometri, dan bahasa Arab serta Persia secara fasih.
            </p>
            <p>
              Karyanya yang paling termasyhur di bidang tafsir adalah <em>Mafâtîh al-Ghaib</em> (Kunci-Kunci Alam Gaib) 
              sebanyak delapan jilid besar. Kitab <em>Al-Firâsah</em> ditulis beliau untuk meletakkan fondasi ilmiah 
              fisiognomi yang bersih dari khurafat ramalan bintang dan sihir, menjadikannya rujukan terawal sebelum 
              para ilmuwan Barat seperti Gerolamo Cardano (1501-1576 M) dan Cesare Lombroso meneliti kaitan fisik dan perilaku.
            </p>
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200">
              <span className="font-bold text-amber-300 block mb-1">Apresiasi Dr. Alexis Carrel (Peraih Nobel Fisiologi):</span>
              "Bentuk-bentuk wajah itu mencerminkan berbagai hal yang paling dasar dari aktivitas perasaan tersembunyi. 
              Dalam 'buku yang terbuka' ini manusia bukan hanya bisa membaca sifat terpuji, kecerdasan, dan kepandiran, 
              tetapi juga struktur tubuh dan disposisi kesehatan orang tersebut."
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
