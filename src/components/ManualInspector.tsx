import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  RotateCcw, 
  Layers, 
  ArrowRight,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Hand
} from 'lucide-react';
import { FirasatAnalysisResult } from '../types/firasat';
import { analyzeFace } from '../services/api';
import { sound } from '../services/sound';
import { Face3DViewer, OrganFeatureId } from './Face3DViewer';
import { PalmLineInspector, PalmHandSide, PalmLineKey, PALM_CATEGORIES } from './PalmLineInspector';

interface ManualInspectorProps {
  onAnalysisComplete: (result: FirasatAnalysisResult) => void;
}

interface FeatureOption {
  label: string;
  description: string;
  indication: string;
  mizajTendency: 'sanguinis' | 'koleris' | 'melankolis' | 'flegmatis';
  arabicRef?: string;
}

interface OrganGroup {
  id: string;
  name: string;
  arabicName: string;
  options: FeatureOption[];
}

const ORGAN_OPTIONS: OrganGroup[] = [
  {
    id: 'dahi',
    name: 'Bentuk Dahi (Al-Jabhah)',
    arabicName: 'الجبهة',
    options: [
      {
        label: 'Proporsional & Rata Berimbang (Mu\'tadil)',
        description: 'Menonjol seimbang di depan-belakang, rata pada sisi-sisinya',
        indication: 'Cerdas sempurna, berpikiran matang, berjiwa adil & bijaksana',
        mizajTendency: 'sanguinis',
        arabicRef: 'شكل الرأس المعتدل'
      },
      {
        label: 'Berkerut & Cenderung Datar Tegas',
        description: 'Tampak kerutan alami yang menyerupai raut tegang/serius',
        indication: 'Cenderung pemarah, berjiwa pejuang, reaktif terhadap provokasi',
        mizajTendency: 'koleris',
        arabicRef: 'من كان مقطبا لجبهته فهو غضوب'
      },
      {
        label: 'Berukuran Kecil / Sempit',
        description: 'Jarak antara alis dan batas rambut sangat pendek',
        indication: 'Kurang luas pemahaman, daya ingat terbatas, berpikiran sempit',
        mizajTendency: 'flegmatis',
        arabicRef: 'من كانت جبهته صغيرة فهو جاهل'
      },
      {
        label: 'Berukuran Sangat Besar & Lebar',
        description: 'Dahi sangat lapang melengkung ke luar',
        indication: 'Cenderung lamban/santai, namun jika panas otak berlebih bisa keras',
        mizajTendency: 'flegmatis',
        arabicRef: 'من كانت جبهته عظيمة فهو كسلان'
      },
      {
        label: 'Banyak Kerutan Bertingkat-tingkat',
        description: 'Guratan kerut tampak berlapis-lapis walau tidak sedang berekspresi',
        indication: 'Congkak, gemar menyombongkan kelebihan dan membanggakan diri',
        mizajTendency: 'melankolis',
        arabicRef: 'من كانت جبهته كثيرة العضوية فهو صَلِف'
      },
      {
        label: 'Rata Licin Tanpa Kerutan Sama Sekali',
        description: 'Permukaan dahi mulus kencang tanpa lekuk ekspresif',
        indication: 'Keras kepala, suka membuat onar atau perdebatan sengit',
        mizajTendency: 'koleris',
        arabicRef: 'من كانت جبهته منبسطة فهو مشاغب'
      }
    ]
  },
  {
    id: 'alis',
    name: 'Bentuk & Lebat Alis (Al-Hâjib)',
    arabicName: 'الحاجب',
    options: [
      {
        label: 'Teratur Seimbang & Rapi',
        description: 'Tebal bulu sedang, melengkung lembut mengikuti lekuk tulang mata',
        indication: 'Keseimbangan akal dan rasa, emosi stabil',
        mizajTendency: 'sanguinis'
      },
      {
        label: 'Bulu Lebat Hitam Pekat',
        description: 'Bulu alis sangat rapat dan tebal gelap',
        indication: 'Sering duka/sedih, berhati-hati, peka, tutur kata terkadang pedas',
        mizajTendency: 'melankolis',
        arabicRef: 'كثير الهم والحزن'
      },
      {
        label: 'Miring ke Bawah Dekat Hidung, Naik di Pelipis',
        description: 'Ujung pangkal alis menukik ke hidung, ujung luar terangkat tajam',
        indication: 'Congkak, keras watak, dan kurang mendalam daya pikirnya',
        mizajTendency: 'koleris',
        arabicRef: 'صَلِف أبله'
      },
      {
        label: 'Alis Tipis dan Lembut',
        description: 'Bulu alis halus dan jarang',
        indication: 'Perasa, lembut tabiat, kurang tahan menghadapi benturan keras',
        mizajTendency: 'flegmatis'
      }
    ]
  },
  {
    id: 'mata',
    name: 'Sorot & Karakter Mata (Al-\'Ain)',
    arabicName: 'العين',
    options: [
      {
        label: 'Warna Syahlah (Pertengahan Madu-Kebiruan)',
        description: 'Sorot jernih berwibawa, warna seimbang pertengahan hitam-biru',
        indication: 'Karakter paling mulia, seimbang, luhur, tajam pandangan',
        mizajTendency: 'sanguinis',
        arabicRef: 'أفضل ألوان العين: الشهلة'
      },
      {
        label: 'Agak Cekung Berwibawa (Gha\'irah Qalilan)',
        description: 'Kelopak kokoh, bola mata agak masuk ke dalam dengan tatapan mantap',
        indication: 'Jiwa ksatria, berani, fokus tinggi bagaikan singa',
        mizajTendency: 'koleris',
        arabicRef: 'نفسه نبيلة؛ مأخوذة من الأسد'
      },
      {
        label: 'Mata Besar & Bersorot Lembut (Katsir al-Balgham)',
        description: 'Bola mata lebar dan gerakan santai bagai lembu',
        indication: 'Santai, cinta kenyamanan, lambat terkejut, pemaaf',
        mizajTendency: 'flegmatis',
        arabicRef: 'مشابهة أعين الثيران'
      },
      {
        label: 'Menonjol / Melotot Keluar (Jahizhah)',
        description: 'Bola mata terdesak ke luar dari rongga mata',
        indication: 'Banyak bicara, kurang rasa malu, tergesa-gesa mengambil keputusan',
        mizajTendency: 'sanguinis',
        arabicRef: 'جاهل مهذار'
      },
      {
        label: 'Mata Bergerak Cepat & Lincah (Katsir al-Harakah)',
        description: 'Pupil mata selalu berputar aktif dan waspada',
        indication: 'Banyak strategi, waspada tinggi, lihai berdalih, cerdik',
        mizajTendency: 'melankolis',
        arabicRef: 'مكار محتال'
      },
      {
        label: 'Mata Kemerah-merahan Bagai Bara Api',
        description: 'Selaput mata tampak urat kemerahan menyala',
        indication: 'Pemberani heroik, namun sangat cepat terbakar amarah',
        mizajTendency: 'koleris',
        arabicRef: 'غضوب مقدام'
      }
    ]
  },
  {
    id: 'hidung',
    name: 'Bentuk Hidung (Al-Anf)',
    arabicName: 'الأنف',
    options: [
      {
        label: 'Melengkung Bagai Paruh Elang (Aquiline)',
        description: 'Batang hidung tegas dengan lengkung mulia di bagian atas',
        indication: 'Jiwa luhur, berwibawa, ambisi besar, pemimpin sejati',
        mizajTendency: 'sanguinis',
        arabicRef: 'أنفه مقوسا فنفسه نبيلة؛ مأخوذ من العقاب'
      },
      {
        label: 'Lurus Proporsional & Halus',
        description: 'Pangkal dan ujung berimbang simetris',
        indication: 'Karakter seimbang, adil, dapat dipercaya',
        mizajTendency: 'sanguinis'
      },
      {
        label: 'Lubang Napas Lebar & Mengembang',
        description: 'Cuping hidung tebal dan berongga besar saat bernapas',
        indication: 'Pemberani, bernapas lega, gampang tersulut emosi jika dipojokkan',
        mizajTendency: 'koleris',
        arabicRef: 'شديد الانتفاخ فهو غضوب'
      },
      {
        label: 'Ujung Hidung Lancip & Tipis',
        description: 'Pucuk hidung mengerucut tajam',
        indication: 'Suka berdebat, peragu, meremehkan hal kecil bagai anjing',
        mizajTendency: 'melankolis',
        arabicRef: 'محب للخصومة طياش خفيف'
      },
      {
        label: 'Pangkal Pesek & Melebar di Bawah',
        description: 'Batang hidung rendah dengan cuping melebar',
        indication: 'Gairah biologis besar, santai dalam pergaulan hidup',
        mizajTendency: 'flegmatis',
        arabicRef: 'أفطس فهو شبِق'
      }
    ]
  },
  {
    id: 'mulut',
    name: 'Mulut & Bibir (Al-Fam wa ash-Syafah)',
    arabicName: 'الفم والشفة',
    options: [
      {
        label: 'Bibir Tipis Menutup Rapat & Lembut',
        description: 'Garis bibir simetris menutup dengan keanggunan',
        indication: 'Berjiwa halus, cermat bertutur, bermartabat tinggi',
        mizajTendency: 'sanguinis',
        arabicRef: 'دقيقتين مسترخيتين فنفسه نبيلة'
      },
      {
        label: 'Mulut Berukuran Lebar & Lapang',
        description: 'Bukaan mulut lebar saat berbicara',
        indication: 'Pemberani, suara vokal, tekad dan nafsu besar bagai singa',
        mizajTendency: 'koleris',
        arabicRef: 'واسع الفم فهو نهم شجاع'
      },
      {
        label: 'Bibir Tebal Menggelambir Menggantung',
        description: 'Bibir bawah tebal dan condong turun',
        indication: 'Keras watak, bebal, sulit menerima masukan baru',
        mizajTendency: 'flegmatis',
        arabicRef: 'غليظ الشفة فهو أحمق غليظ الطبع'
      },
      {
        label: 'Bibir Kering & Pucat Dingin',
        description: 'Warna bibir pudar dengan tekstur agak kering',
        indication: 'Banyak menyimpan rahasia, teliti, kritis, hemat bicara',
        mizajTendency: 'melankolis'
      }
    ]
  },
  {
    id: 'telinga',
    name: 'Bentuk & Daun Telinga (Al-Udzun)',
    arabicName: 'الأذن',
    options: [
      {
        label: 'Sedang & Proporsional (Mu\'tadilah)',
        description: 'Melengkung rapi, simetris, daun telinga lentur seimbang',
        indication: 'Cerdas sempurna, pemahaman baik, amanah menjaga rahasia, berbudi luhur',
        mizajTendency: 'sanguinis',
        arabicRef: 'الأذن المعتدلة تدل على حسن الفهم ونبالة النفس واعتدال المزاج'
      },
      {
        label: 'Telinga Besar & Terbuka Lebar (Udznun Kabir)',
        description: 'Daun telinga lapang, liang telinga lebar dan dalam',
        indication: 'Daya ingat kuat (al-quwwah al-hafizhah), tekun menyimak, pemahaman luas & mendalam',
        mizajTendency: 'melankolis',
        arabicRef: 'من كانت أذنه كبيرة فهو جيد الحفظ؛ يدل على كبر الدماغ'
      },
      {
        label: 'Telinga Kecil & Ramping (Udznun Shaghir)',
        description: 'Daun telinga mungil merapat ke kepala',
        indication: 'Cepat tanggap namun mudah lupa, lincah, tergesa-gesa mengambil kesimpulan',
        mizajTendency: 'koleris',
        arabicRef: 'من كانت أذنه صغيرة فهو رديء الحفظ خفيف الطبع'
      },
      {
        label: 'Daun Telinga Tebal Berdaging (Lahim al-Udzn)',
        description: 'Cuping bawah tebal berisi, berdaging lembut',
        indication: 'Tenang, stabil, sabar, tidak mudah panik menghadapi kabar mendadak',
        mizajTendency: 'flegmatis',
        arabicRef: 'أذنه غليظة كثيرة اللحم صبور ثابت الجأش'
      },
      {
        label: 'Telinga Tipis, Rata & Rapat (Raqiqah Mulshaqah)',
        description: 'Daun telinga tipis berserat halus menempel rapat ke pelipis',
        indication: 'Sangat sensitif terhadap intonasi kata dan kritik, kritis, berhati-hati',
        mizajTendency: 'melankolis',
        arabicRef: 'الأذن الرقيقة تدل على حدة الحس وسرعة التأثر'
      }
    ]
  },
  {
    id: 'wajah',
    name: 'Kontur Keseluruhan Wajah (Al-Wajh)',
    arabicName: 'الوجه',
    options: [
      {
        label: 'Rupawan & Berseri Simetris (Hasan al-Wajh)',
        description: 'Garis wajah proporsional memancarkan keteduhan',
        indication: 'Kecenderungan alami pada kebajikan dan kejujuran budi',
        mizajTendency: 'sanguinis',
        arabicRef: 'حسان الوجوه'
      },
      {
        label: 'Tirus, Kurus, Bergaris Tegas',
        description: 'Pipi ramping tanpa timbunan lemak, garis rahang jelas',
        indication: 'Cermat, pemikir teliti, banyak menimbang segala urusan',
        mizajTendency: 'melankolis',
        arabicRef: 'نحيف الوجه فهو مهتم بالأمور'
      },
      {
        label: 'Gemuk Berdaging Tebal (Lahim)',
        description: 'Pipi tembam tebal dengan daging lembut',
        indication: 'Santai, kurang peka pada isyarat halus, menyukai kesenangan',
        mizajTendency: 'flegmatis',
        arabicRef: 'لحيم الوجه فهو كسلان'
      },
      {
        label: 'Wajah Kemerahan Bersinar Hangat',
        description: 'Warna kulit kemerahan mengilat tegas',
        indication: 'Pemberani, enerjik, memiliki gairah aksi yang menyala',
        mizajTendency: 'koleris'
      }
    ]
  },
  {
    id: 'suara',
    name: 'Karakter Suara, Napas & Tutur Kata (Ash-Shawt wa al-Kalam)',
    arabicName: 'الصوت والنفس والكلام',
    options: [
      {
        label: 'Suara Berat, Tebal & Lantang (Jahir)',
        description: 'Beresonansi dalam dari rongga dada yang lapang, terdengar tegap',
        indication: 'Pemberani, berwibawa, berjiwa ksatria, panas tubuh dan jantung lapang',
        mizajTendency: 'koleris',
        arabicRef: 'الصوت العظيم الغليظ الثقيل يدل على قوة الحرارة والشجاعة'
      },
      {
        label: 'Tutur Kata Pelan, Tenang & Berirama (Waqur)',
        description: 'Artikulasi teratur tanpa tergesa-gesa, intonasi teduh',
        indication: 'Penyabar, berakhlak mulia, berwibawa tinggi, akal memimpin nafsu',
        mizajTendency: 'flegmatis',
        arabicRef: 'من كان كلامه بطيئا فهو صبور ذو وقار'
      },
      {
        label: 'Bicara Cepat & Nada Tinggi (Sari\' \'Ali)',
        description: 'Kalimat meluncur deras dan mudah meninggi saat terdesak',
        indication: 'Gegabah, cepat tersulut amarah, kurang sabar menimbang perkara',
        mizajTendency: 'koleris',
        arabicRef: 'من كان كلامه عاليا سريعا فهو غضوب'
      },
      {
        label: 'Suara Kecil, Lirih & Halus (Daqiq)',
        description: 'Volume pelan, lembut, dan terdengar hati-hati',
        indication: 'Cenderung pemalu, santun, perasa, dominan sifat dingin',
        mizajTendency: 'flegmatis',
        arabicRef: 'الصوت الصغير يدل على البرودة'
      },
      {
        label: 'Suara Jernih Kering & Napas Panjang (Shafi Thawil)',
        description: 'Vokal tegas bersih tanpa serak, desah napas dalam dan tenang',
        indication: 'Tekun, daya ingat kuat, berpendirian teguh, tidak mudah goyah',
        mizajTendency: 'melankolis',
        arabicRef: 'الصوت الصافي يدل على اليبس والنفس الطويل'
      }
    ]
  },
  {
    id: 'tangan_kanan',
    name: 'Garis Telapak Tangan Kanan (Al-Kaff al-Yumna: Aksi & Amal)',
    arabicName: 'الكف اليمنى',
    options: [
      {
        label: 'Garis Kehidupan & Akal Tegas Seimbang Melengkung Luas',
        description: 'Guratan garis tangan kanan tebal, terang, tanpa jeda, bantalan kenyal',
        indication: 'Etos kerja prima, tekad baja dalam beramal, kepemimpinan nyata, berani mengeksekusi visi',
        mizajTendency: 'sanguinis',
        arabicRef: 'خطوط اليد اليمنى تدل على العمل الظاهر والشجاعة'
      },
      {
        label: 'Garis Akal Lurus Tajam Menyeberang dengan Telapak Kuat Berotot',
        description: 'Garis lurus memotong horisontal tegas dengan telapak tangan liat bersuhu hangat',
        indication: 'Pola aksi cepat, tegas, komando lugas, tidak kompromi dengan kelemahan',
        mizajTendency: 'koleris',
        arabicRef: 'صلابة الكف وقوة الخطوط تدل على الغلبة والإقدام'
      },
      {
        label: 'Garis-garis Ramping Terukir Dalam Disertai Ujung Bercabang Dua (Garpu Hikmah)',
        description: 'Garis tangan kanan berukir sangat teliti dengan cabang garpu hikmah',
        indication: 'Strategi matang sebelum bertindak, cermat memperhitungkan risiko, teliti dalam dokumen & perjanjian',
        mizajTendency: 'melankolis',
        arabicRef: 'دقة خطوط اليد تدل على الحزم وتدبير الأمور'
      },
      {
        label: 'Garis Dangkal Lembut dengan Telapak Tangan Tebal Empuk',
        description: 'Bantalan telapak tangan empuk dan garis tampak tenang tidak bergejolak',
        indication: 'Metode kerja santai namun teratur, menghindari perselisihan, sabar melayani orang banyak',
        mizajTendency: 'flegmatis',
        arabicRef: 'لين الكف يدل على الحلم ومسالمة الناس'
      }
    ]
  },
  {
    id: 'tangan_kiri',
    name: 'Garis Telapak Tangan Kiri (Al-Kaff al-Yusra: Fitrah & Batin)',
    arabicName: 'الكف اليسرى',
    options: [
      {
        label: 'Garis Kalbu Anggun Menanjak ke Bawah Telunjuk (Kemuliaan Batin)',
        description: 'Garis batiniah telapak tangan kiri melengkung jernih ke bukit kemuliaan jiwa',
        indication: 'Kemuliaan nurani (Nubl an-Nafs), ketulusan niat, intuisi tajam, mudah memaafkan kesalahan sesama',
        mizajTendency: 'sanguinis',
        arabicRef: 'اليسرى تدل على السريرة والفطرة الباطنة'
      },
      {
        label: 'Garis Kalbu Lurus Mandiri dengan Bukit Ibu Jari Menonjol Bersemangat',
        description: 'Garis kalbu kiri mendatar kokoh memisahkan pertimbangan logika dari badai emosi',
        indication: 'Kemandirian batin, tidak bergantung pada belas kasihan manusia, berpendirian teguh memegang prinsip',
        mizajTendency: 'koleris',
        arabicRef: 'استواء خط القلب يدل على الصرامة وعزة النفس'
      },
      {
        label: 'Garis-Garis Halus Anyaman Banyak Memusat ke Garis Akal',
        description: 'Garis-garis intuisi halus di tangan kiri membentuk jalinan perenungan mendalam',
        indication: 'Daya simpan rahasia sangat kuat (Kitman as-Sirr), perenung hakikat, peka menangkap getaran batin orang lain',
        mizajTendency: 'melankolis',
        arabicRef: 'تشعب الخطوط يدل على كتمان الأسرار ودقة الفهم'
      },
      {
        label: 'Garis Sederhana Bersih dengan Kelembutan Alami yang Teduh',
        description: 'Garis tangan kiri tampak sederhana tanpa kerutan rumit yang menggelisahkan',
        indication: 'Ketenangan batiniah alami, bebas dari dendam dan kecemburuan, menerima takdir dengan lapang dada',
        mizajTendency: 'flegmatis',
        arabicRef: 'سكون النفس وسلامة الصدر'
      }
    ]
  }
];

export const ManualInspector: React.FC<ManualInspectorProps> = ({
  onAnalysisComplete
}) => {
  const [subjectName, setSubjectName] = useState<string>('');
  const [activeOrganId, setActiveOrganId] = useState<OrganFeatureId>('dahi');
  const [inspectorMode, setInspectorMode] = useState<'face_3d' | 'palm_lines' | 'both'>('face_3d');
  const [selections, setSelections] = useState<Record<string, number>>({
    dahi: 0,
    alis: 0,
    mata: 0,
    hidung: 0,
    mulut: 0,
    telinga: 0,
    wajah: 0,
    suara: 0
  });

  const [palmSelections, setPalmSelections] = useState<{
    right: Record<PalmLineKey, number>;
    left: Record<PalmLineKey, number>;
  }>({
    right: { life: 0, head: 0, heart: 0, texture: 0 },
    left: { life: 0, head: 0, heart: 0, texture: 0 }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Compute live Mizaj estimation based on both facial organ and palm selections
  const calculatedMizaj = useMemo(() => {
    const scores = { sanguinis: 0, koleris: 0, melankolis: 0, flegmatis: 0 };
    let total = 0;

    // 1. Tally facial organs
    ORGAN_OPTIONS.forEach(organ => {
      const selectedIndex = selections[organ.id] ?? 0;
      const opt = organ.options[selectedIndex];
      if (opt) {
        scores[opt.mizajTendency] += 1;
        total += 1;
      }
    });

    // 2. Tally palm line categories for both right and left hands
    PALM_CATEGORIES.forEach(cat => {
      const rightIdx = palmSelections.right[cat.id] ?? 0;
      const rightOpt = cat.options[rightIdx];
      if (rightOpt) {
        scores[rightOpt.mizajTendency] += 1;
        total += 1;
      }

      const leftIdx = palmSelections.left[cat.id] ?? 0;
      const leftOpt = cat.options[leftIdx];
      if (leftOpt) {
        scores[leftOpt.mizajTendency] += 1;
        total += 1;
      }
    });

    if (total === 0) total = 1;

    const percentages = {
      sanguinis: Math.round((scores.sanguinis / total) * 100),
      koleris: Math.round((scores.koleris / total) * 100),
      melankolis: Math.round((scores.melankolis / total) * 100),
      flegmatis: Math.round((scores.flegmatis / total) * 100)
    };

    // Sort to find dominant
    let dominant: 'sanguinis' | 'koleris' | 'melankolis' | 'flegmatis' = 'sanguinis';
    let max = -1;
    (Object.keys(percentages) as (keyof typeof percentages)[]).forEach(k => {
      if (percentages[k] > max) {
        max = percentages[k];
        dominant = k;
      }
    });

    const isBalanced = max <= 45;

    return {
      percentages,
      dominant,
      isBalanced
    };
  }, [selections, palmSelections]);

  const handleSelect = (organId: string, optionIndex: number) => {
    sound.playLockPing();
    setActiveOrganId(organId as OrganFeatureId);
    setSelections(prev => ({
      ...prev,
      [organId]: optionIndex
    }));
  };

  const handlePalmSelectOption = (side: PalmHandSide, categoryId: PalmLineKey, optionIndex: number) => {
    setPalmSelections(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [categoryId]: optionIndex
      }
    }));
  };

  const handleReset = () => {
    sound.playClick();
    setSelections({
      dahi: 0,
      alis: 0,
      mata: 0,
      hidung: 0,
      mulut: 0,
      telinga: 0,
      wajah: 0,
      suara: 0
    });
    setPalmSelections({
      right: { life: 0, head: 0, heart: 0, texture: 0 },
      left: { life: 0, head: 0, heart: 0, texture: 0 }
    });
    setActiveOrganId('dahi');
  };

  const handleRunManualAnalysis = async () => {
    setIsLoading(true);
    sound.playLockPing();

    try {
      const manualTraits: Record<string, string> = {};
      ORGAN_OPTIONS.forEach(organ => {
        const idx = selections[organ.id] ?? 0;
        manualTraits[organ.id] = organ.options[idx]?.label || '';
      });

      // Include detailed Palm traits (Right and Left hand)
      const rightTraitsArray: string[] = [];
      const leftTraitsArray: string[] = [];

      PALM_CATEGORIES.forEach(cat => {
        const rightIdx = palmSelections.right[cat.id] ?? 0;
        const rightOpt = cat.options[rightIdx];
        if (rightOpt) {
          const catShort = cat.name.split(' (')[0];
          rightTraitsArray.push(`${catShort}: ${rightOpt.label}`);
          manualTraits[`kanan_${cat.id}`] = rightOpt.label;
        }

        const leftIdx = palmSelections.left[cat.id] ?? 0;
        const leftOpt = cat.options[leftIdx];
        if (leftOpt) {
          const catShort = cat.name.split(' (')[0];
          leftTraitsArray.push(`${catShort}: ${leftOpt.label}`);
          manualTraits[`kiri_${cat.id}`] = leftOpt.label;
        }
      });

      manualTraits['tangan_kanan'] = rightTraitsArray.join('; ');
      manualTraits['tangan_kiri'] = leftTraitsArray.join('; ');

      const res = await analyzeFace({
        manualTraits,
        subjectName: subjectName.trim() || 'Subjek Pemeriksaan Manual'
      });

      sound.playSuccessChime();
      onAnalysisComplete(res);
    } catch (err) {
      console.error('Failed to run manual analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Pemeriksa Interaktif Ciri Fisik</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
            Kalkulator & Penguji Firasat Organ
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Pilih karakteristik spesifik pada setiap bagian wajah untuk mengamati bagaimana Imam Fakhruddin Ar-Razi 
            mendeduksi temperamen (mizaj) dan tabiat batiniah seseorang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Pilihan</span>
          </button>
        </div>
      </div>

      {/* Live Temperament Gauge Widget */}
      <div className="rounded-2xl bg-stone-900/90 border border-amber-500/30 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
              Perkiraan Live Temperamen Berdasarkan Pilihan
            </span>
            <h3 className="text-lg font-bold font-title text-stone-100 capitalize mt-0.5">
              Mizaj Dominan: <span className="text-amber-300">{calculatedMizaj.dominant}</span>
            </h3>
            <span className="text-xs text-stone-400">
              Status: {calculatedMizaj.isBalanced ? "Mu'tadil (Relatif Seimbang)" : "Ghairu Mu'tadil (Terdapat Dominasi Kuat)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Nama Subjek (Opsional)"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/60"
            />
            <button
              onClick={handleRunManualAnalysis}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Menghitung...' : 'Generasikan Laporan Lengkap'}</span>
            </button>
          </div>
        </div>

        {/* 4 Meter Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
            <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-red-500" /> Sanguinis</span>
              <span>{calculatedMizaj.percentages.sanguinis}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${calculatedMizaj.percentages.sanguinis}%` }} />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Darah • Panas & Lembap</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-amber-500" /> Koleris</span>
              <span>{calculatedMizaj.percentages.koleris}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${calculatedMizaj.percentages.koleris}%` }} />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Empedu Kuning • Panas & Kering</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5"><Mountain className="w-3.5 h-3.5 text-indigo-400" /> Melankolis</span>
              <span>{calculatedMizaj.percentages.melankolis}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${calculatedMizaj.percentages.melankolis}%` }} />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Empedu Hitam • Dingin & Kering</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-cyan-400" /> Flegmatis</span>
              <span>{calculatedMizaj.percentages.flegmatis}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${calculatedMizaj.percentages.flegmatis}%` }} />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Lendir • Dingin & Lembap</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs: Face 3D vs Palm Lines vs Combined */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-2 pl-2">
          <span className="text-xs font-bold text-stone-300">Pilih Bidang Analisis:</span>
        </div>
        <div className="flex flex-wrap p-1 bg-stone-950 rounded-xl border border-stone-800 gap-1 shadow-inner">
          <button
            onClick={() => {
              sound.playClick();
              setInspectorMode('face_3d');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              inspectorMode === 'face_3d'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Wajah & Kepala (3D WebGL)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setInspectorMode('palm_lines');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              inspectorMode === 'palm_lines'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Garis Telapak Tangan (Kanan & Kiri)</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
              inspectorMode === 'palm_lines' ? 'bg-stone-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              Ar-Razi
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setInspectorMode('both');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              inspectorMode === 'both'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tinjauan Terpadu</span>
          </button>
        </div>
      </div>

      {/* Palm Line Inspector Section */}
      {(inspectorMode === 'palm_lines' || inspectorMode === 'both') && (
        <div className="space-y-4">
          <PalmLineInspector 
            onSelectOption={handlePalmSelectOption}
            selectedSelections={palmSelections}
          />
        </div>
      )}

      {/* Interactive 3D Face Model Visualization & Organ Selectors */}
      {(inspectorMode === 'face_3d' || inspectorMode === 'both') && (
        <div className="space-y-6">
          <div className="space-y-3">
        {/* Organ Switcher Ribbon */}
        <div className="p-3 rounded-2xl bg-stone-900/90 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sorot Organ pada Model 3D:</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ORGAN_OPTIONS.map((organ) => {
              const isActive = activeOrganId === organ.id;
              const isTelinga = organ.id === 'telinga';
              return (
                <button
                  key={organ.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveOrganId(organ.id as OrganFeatureId);
                    const el = document.getElementById(`organ-section-${organ.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold'
                      : isTelinga
                      ? 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/50'
                      : 'bg-stone-950/80 hover:bg-stone-850 text-stone-300 border-stone-800'
                  }`}
                >
                  <span>{organ.name.split(' (')[0]}</span>
                  {isTelinga && !isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400 text-stone-950 font-bold uppercase">
                      Baru
                    </span>
                  )}
                  <span className="font-arabic text-[11px] opacity-80">{organ.arabicName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D WebGL Face Model Component */}
        <Face3DViewer
          activeOrganId={activeOrganId}
          onSelectOrgan={(orgId) => {
            setActiveOrganId(orgId);
            const el = document.getElementById(`organ-section-${orgId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      </div>

      {/* Organ Option Selectors */}
      <div className="space-y-6">
        {ORGAN_OPTIONS.map((organ) => {
          const selectedIdx = selections[organ.id] ?? 0;
          const isOrganActive = activeOrganId === organ.id;

          return (
            <div 
              key={organ.id} 
              id={`organ-section-${organ.id}`}
              className={`rounded-2xl transition-all duration-300 p-5 space-y-3 border ${
                isOrganActive
                  ? 'bg-stone-900/90 border-amber-500/80 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : 'bg-stone-900/60 border-stone-800/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-2.5 gap-2">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm sm:text-base font-bold text-stone-100 font-title flex items-center gap-2">
                    <span>{organ.name}</span>
                    {organ.id === 'telinga' && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Kitab Ar-Razi
                      </span>
                    )}
                  </h4>
                  <span className="font-arabic text-amber-400 text-lg">
                    {organ.arabicName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isOrganActive ? (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Sedang Disorot pada Model 3D</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveOrganId(organ.id as OrganFeatureId);
                      }}
                      className="text-[11px] font-semibold text-stone-400 hover:text-amber-300 bg-stone-950/60 hover:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-800 transition-colors cursor-pointer"
                    >
                      Sorot di Model 3D
                    </button>
                  )}
                  <span className="text-[11px] text-stone-400 font-medium">
                    {organ.options.length} Ragam Bentuk
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {organ.options.map((opt, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(organ.id, idx)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-100 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-stone-200'}`}>
                            {opt.label}
                          </span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                            opt.mizajTendency === 'koleris' ? 'bg-amber-950 text-amber-400' :
                            opt.mizajTendency === 'melankolis' ? 'bg-indigo-950 text-indigo-400' :
                            opt.mizajTendency === 'flegmatis' ? 'bg-cyan-950 text-cyan-400' :
                            'bg-red-950 text-red-400'
                          }`}>
                            {opt.mizajTendency}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-snug">
                          {opt.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-800/60">
                        <p className="text-[10px] text-amber-200/90 leading-tight">
                          <span className="font-semibold text-amber-400">Watak: </span>
                          {opt.indication}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      )}
    </div>
  );
};
