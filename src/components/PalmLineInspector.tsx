import React, { useState } from 'react';
import { 
  Hand, 
  Sparkles, 
  Info, 
  Heart, 
  Brain, 
  Activity, 
  Layers, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind,
  Check,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { sound } from '../services/sound';

export type PalmHandSide = 'right' | 'left';
export type PalmLineKey = 'life' | 'head' | 'heart' | 'texture';

export interface PalmLineOption {
  label: string;
  arabicName: string;
  description: string;
  indication: string;
  mizajTendency: 'sanguinis' | 'koleris' | 'melankolis' | 'flegmatis';
  kitabRef: string;
}

export interface PalmFeatureCategory {
  id: PalmLineKey;
  name: string;
  arabicName: string;
  icon: React.ReactNode;
  rightMeaning: string;
  leftMeaning: string;
  options: PalmLineOption[];
}

export const PALM_CATEGORIES: PalmFeatureCategory[] = [
  {
    id: 'life',
    name: 'Garis Kehidupan & Fisik (Khathth al-Hayah)',
    arabicName: 'خط الحياة والأصل',
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    rightMeaning: 'Aktualisasi stamina, etos kerja lahiriah, dan daya tahan tubuh dalam menghadapi keletihan fisik nyata.',
    leftMeaning: 'Kekuatan vitalitas bawaan lahir (al-hararah al-ghariziyyah), ketahanan konstitusi jasmani, dan cadangan energi fitrah.',
    options: [
      {
        label: 'Panjang, Tebal & Melengkung Luas Melingkari Ibu Jari',
        arabicName: 'طويل غليظ مستدير',
        description: 'Lengkungan kokoh tanpa jeda, warna kemerahan segar, mencakup area bukit ibu jari secara lapang.',
        indication: 'Vitalitas jasmani prima, stamina tinggi, optimis, berani mengambil risiko, tabah saat menghadapi beban berat.',
        mizajTendency: 'sanguinis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda-Tanda Kekuatan Vitalitas Fisik & Urat Tangan (hal. 182-184)'
      },
      {
        label: 'Tegas, Dalam, Sedikit Lurus Menuju Pangkal Pergelangan',
        arabicName: 'غائر مستقيم قوي',
        description: 'Garis tajam bagai guratan pedang, warna kemerahan menyala tegas.',
        indication: 'Tekad baja, reaktif, memiliki dorongan aksi yang membara, tidak mudah menyerah sebelum tujuan tercapai.',
        mizajTendency: 'koleris',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda Keberanian & Daya Tahan Gerak Tubuh'
      },
      {
        label: 'Garis Halus dengan Banyak Cabang Kecil Menyilang',
        arabicName: 'دقيق كثير التشعب',
        description: 'Guratan garis tipis berlapis menyerupai anyaman halus di beberapa titik.',
        indication: 'Peka terhadap keletihan, membutuhkan manajemen istirahat teratur, daya observasi waspada, pemikir cermat.',
        mizajTendency: 'melankolis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Pengaruh Dingin-Kering pada Telapak & Jari Tangan'
      },
      {
        label: 'Garis Lebar, Dangkal & Lembut Menghilang di Ujung',
        arabicName: 'عريض لين سطحي',
        description: 'Garis tampak rata dan tidak terlalu cekung, berpadu dengan bantalan telapak yang tebal lembut.',
        indication: 'Tenang, cinta kenyamanan, tidak menyukai tekanan terburu-buru, pemulihan energi bertahap namun stabil.',
        mizajTendency: 'flegmatis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda Dingin-Lembap pada Anggota Gerak'
      }
    ]
  },
  {
    id: 'head',
    name: 'Garis Akal & Pola Pikir (Khathth ar-Ra\'s)',
    arabicName: 'خط الرأس والعقل',
    icon: <Brain className="w-4 h-4 text-indigo-400" />,
    rightMeaning: 'Penerapan nalar praktis, pengambilan keputusan duniawi, logika pemecahan masalah, dan kepemimpinan strategis.',
    leftMeaning: 'Daya abstraksi pemikiran alami, intuisi hikmah, imajinasi batiniah, dan kecerdasan filosofis bawaan.',
    options: [
      {
        label: 'Lurus Menyeberang Telapak Tangan dengan Tegas',
        arabicName: 'مستقيم قاطع للراحة',
        description: 'Garis melintang horisontal tegas dari tepi telapak hingga mendekati sisi luar.',
        indication: 'Pola pikir realistis, berbasis data empiris, tidak mudah terbuai angan-angan, keputusan mantap dan berwibawa.',
        mizajTendency: 'koleris',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Hubungan Bentuk Tangan dengan Kekuatan Nalar & Logika'
      },
      {
        label: 'Melengkung Anggun Menuju Bukit Bawah Telapak (Bukit Qamar)',
        arabicName: 'منحنٍ إلى أسفل الراحة',
        description: 'Lengkungan lembut mengarah ke sudut bawah telapak, menunjukkan perpaduan logika dan rasa.',
        indication: 'Kreativitas luhur, kaya imajinasi estetika, mampu menangkap makna tersirat, bijaksana dalam memberi nasihat.',
        mizajTendency: 'sanguinis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Daya Cipta & Kelembutan Daya Pikir'
      },
      {
        label: 'Garis Sangat Panjang, Dalam, Disertai Cabang Dua di Ujung (Garpu Hikmah)',
        arabicName: 'طويل ذو شعبتين في آخره',
        description: 'Ujung garis terbelah dua simetris, satu menuju atas dan satu menuju bawah.',
        indication: 'Kecerdasan diplomatis tinggi, mampu menimbang dua perspektif sekaligus, jeli melihat celah dan solusi alternatif.',
        mizajTendency: 'melankolis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda Kecerdasan Bertingkat & Ketelitian Berpikir'
      },
      {
        label: 'Garis Pendek Berhenti Tepat di Bawah Jari Tengah',
        arabicName: 'قصير ينتهي عند الوسطى',
        description: 'Garis akal tidak terlalu panjang, ringkas dan terkonsentrasi di tengah telapak.',
        indication: 'Praktis, to-the-point, menyukai eksekusi langsung dibanding perdebatan teori yang berbelit-belit.',
        mizajTendency: 'flegmatis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Kecenderungan Sikap Spontan & Praktis'
      }
    ]
  },
  {
    id: 'heart',
    name: 'Garis Kalbu & Emosi (Khathth al-Qalb)',
    arabicName: 'خط القلب والمشاعر',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    rightMeaning: 'Ekspresi cinta kasih kepada sesama, keadilan dalam bermuamalah, dan kendali amarah dalam relasi sosial.',
    leftMeaning: 'Kedalaman empati batiniah, keterikatan batin dengan yang dicintai, serta kepekaan rasa nurani terhadap kebenaran.',
    options: [
      {
        label: 'Melengkung Naik Menuju Bawah Jari Telunjuk (Bukit Kemuliaan)',
        arabicName: 'صاعد إلى أصل السبابة',
        description: 'Garis anggun menanjak ke arah pangkal telunjuk dengan lengkungan yang jernih.',
        indication: 'Jiwa mulia (Nubl an-Nafs), menjunjung tinggi etika kehormatan, setia, pemaaf, dan adil dalam menilai orang lain.',
        mizajTendency: 'sanguinis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Akhlak Mulia & Ketulusan Hati'
      },
      {
        label: 'Lurus Mendekati Pangkal Jari Tengah Tanpa Banyak Lengkungan',
        arabicName: 'مستقيم إلى أصل الوسطى',
        description: 'Garis mendatar tegak lurus, membatasi ranah emosi agar tidak menguasai pertimbangan akal.',
        indication: 'Rasional dalam urusan perasaan, mandiri, tidak mudah goyah oleh pujian maupun celaan, tegas menjaga batasan pribadi.',
        mizajTendency: 'koleris',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Pengendalian Syahwat & Emosi Menurut Kaidah Tarjih'
      },
      {
        label: 'Bercabang Tiga Bagai Trisula di Ujung Atas',
        arabicName: 'ذو ثلاث شعب في أعلاه',
        description: 'Ujung garis mekar menjadi tiga ranting halus di antara telunjuk dan jari tengah.',
        indication: 'Keseimbangan ideal antara cinta, akal sehat, dan kepedulian sosial. Simbol hati yang lapang dan mudah beradaptasi.',
        mizajTendency: 'sanguinis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Sifat Manusia Mu\'tadil (Paling Seimbang Tabiatnya)'
      },
      {
        label: 'Garis Dalam Berwarna Gelap dengan Guratan Halus Berantai',
        arabicName: 'عميق داكن متسلسل',
        description: 'Garis tampak berbobot dan menahan banyak resonansi batin.',
        indication: 'Sangat setia dan mendalam perasaannya, namun mudah memendam beban emosi di dalam hati jika merasa disalahpahami.',
        mizajTendency: 'melankolis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Peka Rasa & Daya Simpan Rahasia (Kitman as-Sirr)'
      }
    ]
  },
  {
    id: 'texture',
    name: 'Bentuk & Tekstur Telapak Tangan (Hay\'ah al-Kaff)',
    arabicName: 'هيئة الكف وملمسها',
    icon: <Hand className="w-4 h-4 text-amber-400" />,
    rightMeaning: 'Karakter interaksi fisik tangan kanan dalam berkarya, berjabat tangan, dan bertransaksi.',
    leftMeaning: 'Materi unsur dasar humor tubuh (panas/dingin/kering/lembap) yang mendasari tabiat pembawaan.',
    options: [
      {
        label: 'Telapak Padat, Tebal & Terasa Hangat Sedang (Mu\'tadil Lahim)',
        arabicName: 'معتدل اللحم والحرارة',
        description: 'Otot telapak proporsional kenyal, warna kulit cerah kemerahan, jemari lurus lentur.',
        indication: 'Karakter seimbang (Al-Mizaj al-Mu\'tadil), tangkas bertindak, berjiwa lapang, disenangi pergaulan.',
        mizajTendency: 'sanguinis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Keserasian Bentuk Telapak Tangan yang Terpuji'
      },
      {
        label: 'Telapak Keras, Berotot Kekar, Terasa Panas-Kering',
        arabicName: 'صلب حار يابس',
        description: 'Kulit telapak liat bertekstur kuat, bantalan otot menonjol tegas, cengkeraman mantap.',
        indication: 'Pemberani, pekerja keras, gigih menghadapi tantangan berat, bersemangat membela prinsip yang diyakini.',
        mizajTendency: 'koleris',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Ciri Fisik Orang-Orang Pemberani (Ahl asy-Syaja\'ah)'
      },
      {
        label: 'Telapak Ramping, Jemari Panjang Beruas Jelas, Terasa Sejuk-Kering',
        arabicName: 'نحيف طويل الأصابع بارد يابس',
        description: 'Jemari ramping anggun dengan buku-buku jari terlihat nyata, garis-garis tangan terukir tajam.',
        indication: 'Pemikir analitis, teliti dalam perincian kecil, menyukai kebersihan dan keteraturan, tekun mendalami ilmu.',
        mizajTendency: 'melankolis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda-Tanda Ketelitian & Keahlian Menulis'
      },
      {
        label: 'Telapak Berdaging Lembut, Bantalan Tebal, Terasa Sejuk-Lembap',
        arabicName: 'لين سميك بارد رطب',
        description: 'Telapak terasa empuk bagai bantal halus, kulit halus lembut dan mudah berkeringat dingin.',
        indication: 'Penyabar, cinta kedamaian, tidak menyukai permusuhan, santun, pendengar yang baik bagi keluhan sesama.',
        mizajTendency: 'flegmatis',
        kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda Kelembutan Watak & Ketenangan Jiwa'
      }
    ]
  }
];

interface PalmLineInspectorProps {
  onSelectOption?: (side: PalmHandSide, categoryId: PalmLineKey, optionIndex: number) => void;
  selectedSelections?: {
    right: Record<PalmLineKey, number>;
    left: Record<PalmLineKey, number>;
  };
}

export const PalmLineInspector: React.FC<PalmLineInspectorProps> = ({
  onSelectOption,
  selectedSelections
}) => {
  const [activeSide, setActiveSide] = useState<PalmHandSide>('right');
  const [activeCategory, setActiveCategory] = useState<PalmLineKey>('life');

  const [localSelections, setLocalSelections] = useState<{
    right: Record<PalmLineKey, number>;
    left: Record<PalmLineKey, number>;
  }>(selectedSelections || {
    right: { life: 0, head: 0, heart: 0, texture: 0 },
    left: { life: 0, head: 0, heart: 0, texture: 0 }
  });

  const currentCategory = PALM_CATEGORIES.find(c => c.id === activeCategory) || PALM_CATEGORIES[0];
  const currentSelectionIdx = localSelections[activeSide][activeCategory] ?? 0;
  const currentOption = currentCategory.options[currentSelectionIdx] || currentCategory.options[0];

  const handleChooseOption = (optionIdx: number) => {
    sound.playLockPing();
    const next = {
      ...localSelections,
      [activeSide]: {
        ...localSelections[activeSide],
        [activeCategory]: optionIdx
      }
    };
    setLocalSelections(next);
    if (onSelectOption) {
      onSelectOption(activeSide, activeCategory, optionIdx);
    }
  };

  const handleSwitchSide = (side: PalmHandSide) => {
    sound.playClick();
    setActiveSide(side);
  };

  const handleSwitchCategory = (catId: PalmLineKey) => {
    sound.playClick();
    setActiveCategory(catId);
  };

  // Helper colors for mizaj tendency
  const getMizajColor = (mizaj: string) => {
    switch (mizaj) {
      case 'koleris': return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'melankolis': return 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40';
      case 'flegmatis': return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      default: return 'text-red-400 bg-red-950/60 border-red-500/40';
    }
  };

  return (
    <div className="rounded-3xl bg-stone-900/90 border border-amber-500/30 p-5 sm:p-6 space-y-6 shadow-2xl">
      
      {/* Top Header & Right/Left Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Hand className="w-4 h-4 text-amber-400" />
            <span>Firasat Garis Telapak Tangan • Kitab Al-Firasat Ar-Razi</span>
          </div>
          <h3 className="text-xl font-bold font-title text-stone-100 flex items-center gap-2">
            <span>Analisis Telapak Tangan</span>
            <span className="font-arabic text-amber-400 text-base font-normal">
              {activeSide === 'right' ? 'اليَدُ اليُمْنَى' : 'اليَدُ اليُسْرَى'}
            </span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {activeSide === 'right' 
              ? 'Tangan Kanan: Mengungkapkan potensi aksi, realisasi ikhtiar nyata, dan etos ketegasan lahiriah.'
              : 'Tangan Kiri: Mengungkapkan tabiat asal (fitrah batin), kepekaan nurani, dan kecenderungan intuisi spiritual.'}
          </p>
        </div>

        {/* Right vs Left Toggle Pills */}
        <div className="flex p-1 bg-stone-950 rounded-2xl border border-stone-800 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => handleSwitchSide('right')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSide === 'right'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Tangan Kanan (Aksi & Amal)</span>
          </button>
          <button
            onClick={() => handleSwitchSide('left')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSide === 'left'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5 transform -scale-x-100" />
            <span>Tangan Kiri (Fitrah Batin)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Palm Diagram (Left) & Line Feature Selector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Visual Palm Diagram & Category Badges (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Interactive Palm SVG Graphic with Animated Highlighting */}
          <div className="relative aspect-square max-h-80 mx-auto w-full rounded-2xl bg-stone-950/80 border border-stone-800 p-4 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Background subtle radial aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* SVG Hand Outline & 3 Lines */}
            <svg 
              viewBox="0 0 200 220" 
              className={`w-full h-full max-h-72 transition-transform duration-300 drop-shadow-xl ${
                activeSide === 'left' ? 'scale-x-[-1]' : ''
              }`}
            >
              {/* Palm Silhouette */}
              <path
                d="M 60 190 C 50 160 40 130 40 100 C 40 85 45 75 52 75 C 58 75 62 82 65 95 C 68 70 73 50 82 50 C 90 50 94 65 95 85 C 98 60 105 45 114 45 C 122 45 125 60 126 88 C 130 75 137 68 144 68 C 152 68 154 80 152 105 C 150 135 158 150 150 180 C 145 198 120 205 100 205 C 80 205 65 200 60 190 Z"
                fill="rgba(38, 38, 38, 0.6)"
                stroke={activeCategory === 'texture' ? '#f59e0b' : '#52525b'}
                strokeWidth={activeCategory === 'texture' ? '2.5' : '1.5'}
                className="transition-all duration-300 cursor-pointer"
                onClick={() => handleSwitchCategory('texture')}
              />

              {/* Thumb silhouette */}
              <path
                d="M 60 160 C 40 155 25 140 22 120 C 20 108 28 102 36 108 C 45 115 52 130 60 145 Z"
                fill="rgba(38, 38, 38, 0.6)"
                stroke="#52525b"
                strokeWidth="1.2"
              />

              {/* Garis Kehidupan (Life Line) - wraps around thumb */}
              <path
                d="M 52 118 C 50 138 58 165 80 185"
                fill="none"
                stroke={activeCategory === 'life' ? '#10b981' : 'rgba(16, 185, 129, 0.4)'}
                strokeWidth={activeCategory === 'life' ? '4.5' : '2'}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:stroke-emerald-400"
                onClick={() => handleSwitchCategory('life')}
              />

              {/* Garis Akal (Head Line) - cuts across middle */}
              <path
                d="M 50 116 C 75 122 110 132 142 142"
                fill="none"
                stroke={activeCategory === 'head' ? '#6366f1' : 'rgba(99, 102, 241, 0.4)'}
                strokeWidth={activeCategory === 'head' ? '4.5' : '2'}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:stroke-indigo-400"
                onClick={() => handleSwitchCategory('head')}
              />

              {/* Garis Kalbu (Heart Line) - upper palm below fingers */}
              <path
                d="M 148 112 C 120 102 90 98 75 88"
                fill="none"
                stroke={activeCategory === 'heart' ? '#f43f5e' : 'rgba(244, 63, 94, 0.4)'}
                strokeWidth={activeCategory === 'heart' ? '4.5' : '2'}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:stroke-rose-400"
                onClick={() => handleSwitchCategory('heart')}
              />

              {/* Interactive Label Markers */}
              <circle cx="68" cy="155" r={activeCategory === 'life' ? '5' : '3'} fill="#10b981" />
              <circle cx="100" cy="128" r={activeCategory === 'head' ? '5' : '3'} fill="#6366f1" />
              <circle cx="110" cy="102" r={activeCategory === 'heart' ? '5' : '3'} fill="#f43f5e" />
            </svg>

            {/* Side Indicator Badge */}
            <div className="absolute bottom-2 left-3 text-[10px] text-stone-500 font-mono">
              Mode: <span className="text-amber-400 font-bold">{activeSide === 'right' ? 'Kanan (Al-Yamin)' : 'Kiri (Asy-Syimal)'}</span>
            </div>
          </div>

          {/* Category Tabs Selection */}
          <div className="grid grid-cols-2 gap-2">
            {PALM_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSwitchCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-800 border-amber-500/60 shadow-md text-stone-100'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {cat.icon}
                    <span className="text-xs font-bold truncate">{cat.name.split(' (')[0]}</span>
                  </div>
                  <span className="text-[10px] font-arabic text-amber-400/80 block">
                    {cat.arabicName}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Column: Detailed Options & Interpretation Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header Card for Active Category */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-800">
                  {currentCategory.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-100">
                    {currentCategory.name}
                  </h4>
                  <span className="text-xs font-arabic text-amber-400/90">
                    {currentCategory.arabicName}
                  </span>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 text-stone-400 border border-stone-800 font-mono">
                {activeSide === 'right' ? 'Sisi Kanan' : 'Sisi Kiri'}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed pt-1">
              {activeSide === 'right' ? currentCategory.rightMeaning : currentCategory.leftMeaning}
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
              Pilih Ciri Garis yang Paling Sesuai:
            </span>

            {currentCategory.options.map((opt, idx) => {
              const isChosen = currentSelectionIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleChooseOption(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isChosen
                      ? 'bg-amber-950/25 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-stone-950/50 hover:bg-stone-900 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isChosen
                            ? 'bg-amber-500 border-amber-500 text-stone-950'
                            : 'border-stone-600'
                        }`}>
                          {isChosen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <h5 className={`text-xs font-bold ${isChosen ? 'text-amber-200' : 'text-stone-200'}`}>
                          {opt.label}
                        </h5>
                      </div>

                      <p className="text-[11px] text-stone-400 pl-6 leading-relaxed">
                        {opt.description}
                      </p>

                      <div className="pl-6 pt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getMizajColor(opt.mizajTendency)}`}>
                          Condong {opt.mizajTendency}
                        </span>
                        <span className="text-[10px] text-stone-500 italic">
                          Indikasi: {opt.indication.slice(0, 60)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kitab Insight Reference Box */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block font-semibold mb-0.5">
                Kaidah Kitab Al-Firasat (Imam Fakhruddin Ar-Razi):
              </strong>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                "{currentOption.indication}"
              </p>
              <span className="text-[10px] text-amber-400/80 mt-1 block font-mono">
                Rujukan: {currentOption.kitabRef}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
