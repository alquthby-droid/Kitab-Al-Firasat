// Firasat of the Day Dataset
// Potongan teks literatur autentik dari naskah Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi (554-606 H)
// Lengkap dengan teks Arab, terjemahan Indonesia, konteks bab, hikmah akal budi, dan amalan riyadhah akhlak harian.

export interface DailyFirasatItem {
  id: string;
  topic: string;
  arabicText: string;
  indonesianTranslation: string;
  chapter: string;
  chapterId?: string;
  organBadge?: string;
  mizajBadge?: string;
  keyInsight: string;
  spiritualRiyadhah: string;
  context: string;
}

export const DAILY_FIRASAT_ITEMS: DailyFirasatItem[] = [
  {
    id: 'fotd-1',
    topic: 'Kaidah Emas Keseimbangan Bentuk Fisik & Jiwa (Al-I\'tidâl)',
    arabicText: 'إن كان حسن الشكل كان معتدل المزاج فصاحبه نبيل النفس سديد الرأي',
    indonesianTranslation: 'Jika bentuk fisiknya serasi dan temperamennya seimbang, maka pemiliknya memiliki jiwa yang luhur dan pandangan yang tepat.',
    chapter: 'Pembahasan Pertama: Kaidah Pokok Ilmu Firasat Ilmiah',
    chapterId: 'ch-wajah',
    organBadge: 'Raut Wajah & Postur',
    mizajBadge: 'Al-Mizaj al-Mu\'tadil (Seimbang)',
    keyInsight: 'Keserasian fisik mencerminkan keadilan (i\'tidal) campuran 4 unsur humoral dalam tubuh, yang melahirkan kelembutan budi pekerti dan ketenangan daya pikir.',
    spiritualRiyadhah: 'Amalkan sifat tawassuth (moderat): hindari berlebih-lebihan dalam makan, berbicara, dan emosi agar ruh senantiasa jernih.',
    context: 'Imam Ar-Razi merumuskan bahwa firasat sejati senantiasa bertolak dari pencarian titik tengah yang ideal.'
  },
  {
    id: 'fotd-2',
    topic: 'Petunjuk Sorot Mata Campuran Madu-Kebiruan (Asy-Syahlah)',
    arabicText: 'أفضل ألوان العين: الشهلة؛ لأنها لون متوسط بين السواد وبين الزrقة والخضرة، فصاحبها نبيل كريم',
    indonesianTranslation: 'Sebaik-baik warna mata adalah asy-syahlah (campuran madu dan kebiruan teduh); karena ia warna pertengahan antara hitam pekat dan biru-kehijauan, dan pemiliknya berjiwa mulia nan pemurah.',
    chapter: 'Pembahasan Ketiga, Pasal 3: Petunjuk Mata (Dalâ\'il al-\'Ain)',
    chapterId: 'ch-mata',
    organBadge: 'Mata (\'Ain)',
    mizajBadge: 'Damawiy / Mu\'tadil',
    keyInsight: 'Mata adalah cermin ruh paling transparan. Keseimbangan warna iris menandakan temperamen dingin dan panas yang seimbang sempurna di dalam rongga otak.',
    spiritualRiyadhah: 'Tundukkan pandangan (ghadhdhul bashar) dari hal tercela dan perbanyak pandangan tafakkur merenungi kebesaran ciptaan Ilahi.',
    context: 'Ar-Razi memuji warna mata syahlah sebagaimana sorot mata singa yang tenang dan waspada tanpa kepanikan.'
  },
  {
    id: 'fotd-3',
    topic: 'Keluasan Dahi dan Ketenangan Berpikir',
    arabicText: 'شكل الرأس المعتدل أن يكون له نتوء من قدام ونتوء من خلف، وجبهته معتدلة البسط لا مقطبة ولا ملساء',
    indonesianTranslation: 'Bentuk kepala yang seimbang adalah yang memiliki tonjolan depan dan belakang proporsional, serta dahinya terbentang wajar—tidak mengerut kaku dan tidak licin tanpa ekspresi.',
    chapter: 'Pembahasan Ketiga, Pasal 1: Petunjuk Dahi (Dalâ\'il al-Jabhah)',
    chapterId: 'ch-dahi',
    organBadge: 'Dahi (Jabhah)',
    mizajBadge: 'Keseimbangan Akal (Dihniy)',
    keyInsight: 'Dahi adalah kubah pelindung otak bagian depan (al-quwwah al-mufakkirah). Proporsi dahi yang wajar menandakan daya tangkap ide yang jernih dan daya ingat yang kokoh.',
    spiritualRiyadhah: 'Gunakan dahi untuk bersujud panjang dalam shalat malam, menenangkan panas pikiran dan mengikis kesombongan intelektual.',
    context: 'Naskah klasik menegaskan dahi yang terlalu licin menandakan minimnya rasa malu, sementara terlalu berkerut menandakan kemarahan tertahan.'
  },
  {
    id: 'fotd-4',
    topic: 'Rahasia Tempo Bicara dan Kematangan Budi',
    arabicText: 'من كان كلامه بطيئا فهو وقور صبور، لأن استئناء النطق يدل على تروي العقل وغلظ الروح',
    indonesianTranslation: 'Barangsiapa yang tutur katanya tertata perlahan dan tenang, maka ia orang yang berwibawa dan penyabar, sebab ketenangan berucap menandakan pertimbangan akal yang matang.',
    chapter: 'Pembahasan Ketiga, Pasal 8: Petunjuk Suara (Ash-Shawt wa al-Kalam)',
    chapterId: 'ch-leher-suara',
    organBadge: 'Suara & Lisan',
    mizajBadge: 'Al-Waqar wa ash-Shabr',
    keyInsight: 'Kecepatan ucapan mencerminkan desakan uap panas dari jantung. Orang yang menahan lisannya membuktikan kepemimpinan akal atas hawa nafsunya.',
    spiritualRiyadhah: 'Terapkan jeda 2 detik sebelum merespons perkataan orang lain; pastikan ucapan Anda mengandung kebenaran atau pilihlah diam.',
    context: 'Bab Ash-Shawt dalam Kitab Al-Firasat mengaitkan kehangatan nada suara dengan keberanian sejati dan perlindungan.'
  },
  {
    id: 'fotd-5',
    topic: 'Kaidah Istidlal: Mengapa Firasat Bukan Ramalan Gaib',
    arabicText: 'الفراسة الاستدلال بالأحوال الظاهرة على الأخلاق الباطنة، وليست ادعاء لعلم الغيب المحظور',
    indonesianTranslation: 'Firasat ilmiah adalah penarikan kesimpulan sifat batin dari gejala lahiriah nyata, bukan pengakuan mengetahui hal gaib yang diharamkan syariat.',
    chapter: 'Muqaddimah: Hakikat dan Dalil Syariat Ilmu Firasat',
    organBadge: 'Epistemologi',
    mizajBadge: 'Hukum Syar\'i',
    keyInsight: 'Hubungan antara fisik dan karakter berlandaskan sunnatullah hukum kausalitas penciptaan. Sifat bawaan (thabi\'ah) adalah kecenderungan, bukan takdir mutlak yang tak bisa diubah.',
    spiritualRiyadhah: 'Latihlah prasangka baik (husnuzhan) kepada sesama muslim; jadikan firasat sebagai panduan memahami orang lain, bukan mencap buruk mereka.',
    context: 'Imam Ar-Razi membedakan secara tegas antara firasat rasional ulama dengan perdukunan (kahanah) atau astrologi (nijamah).'
  },
  {
    id: 'fotd-6',
    topic: 'Petunjuk Hidung Lengkung Elang: Kepemimpinan Mulia',
    arabicText: 'من كان أنفه مقوسا يشبه منقار العقاب فنفسه نبيلة همته عالية لا يرضى بالدون',
    indonesianTranslation: 'Barangsiapa yang batang hidungnya melengkung luhur laksana paruh burung rajawali, maka jiwanya mulia, cita-citanya tinggi, dan ia pantang menyerah pada kerendahan.',
    chapter: 'Pembahasan Ketiga, Pasal 4: Petunjuk Hidung (Dalâ\'il al-Anf)',
    chapterId: 'ch-hidung',
    organBadge: 'Hidung (Anf)',
    mizajBadge: 'Himmah \'Aliyah',
    keyInsight: 'Hidung menghubungkan rongga dada dengan hawa luar. Lengkungan elang mengindikasikan kelapangan sirkulasi napas penopang ketahanan mengambil keputusan krusial.',
    spiritualRiyadhah: 'Arahkan ambisi tinggi (himmah) demi kemaslahatan umat dan ilmu, bukan demi pamer kedudukan atau merendahkan orang lain.',
    context: 'Dikutip dari pengamatan watak satwa pemberani dan raja-raja yang adil dalam tradisi naskah Ar-Razi.'
  },
  {
    id: 'fotd-7',
    topic: 'Karakter Bibir Tipis Lembut dan Simetris',
    arabicText: 'من كان شفتاه دقيقتين مسترخيتين تنطبقان بحسن هندام فنفسه نبيلة فصيح اللسان',
    indonesianTranslation: 'Barangsiapa kedua bibirnya tipis lembut dan menutup rapat secara simetris, maka jiwanya luhur, fasih ucapannya, serta pandai memelihara rahasia.',
    chapter: 'Pembahasan Ketiga, Pasal 5: Petunjuk Mulut dan Bibir',
    chapterId: 'ch-mulut-bibir',
    organBadge: 'Bibir & Mulut',
    mizajBadge: 'Al-Hifzh wa ash-Shamt',
    keyInsight: 'Kemampuan menutup bibir dengan tenang menandakan kendali otot ekspresi yang kuat—tanda seseorang mampu menjaga amanah ucapan.',
    spiritualRiyadhah: 'Amalkan adab menutupi aib saudara muslim dan jagalah lisan dari ghibah serta perkataan sia-sia sepanjang hari.',
    context: 'Ar-Razi memuji orang yang rapi susunan mulutnya karena mencerminkan keteraturan tabiat internal.'
  },
  {
    id: 'fotd-8',
    topic: 'Keseimbangan Daun Telinga dan Daya Simpan Ilmu',
    arabicText: 'الأذن المعتدلة تدل على حسن الفهم ونبالة النفس؛ فإن كانت كبيرة جاد حفظه لسعة مجاري الدماغ',
    indonesianTranslation: 'Daun telinga yang proporsional menandakan pemahaman yang baik dan budi yang luhur; jika ukurannya lapang, maka kuat daya ingatnya karena luasnya wadah otak.',
    chapter: 'Pembahasan Ketiga, Pasal 6: Petunjuk Telinga (Dalâ\'il al-Udzun)',
    chapterId: 'ch-telinga',
    organBadge: 'Telinga (Udzun)',
    mizajBadge: 'Quwwat al-Hifzh',
    keyInsight: 'Telinga adalah pintu masuk ilmu wahyu dan hikmah. Keindahan bentuk telinga menandakan kesiapan jiwa untuk menyimak kebenaran dengan seksama.',
    spiritualRiyadhah: 'Jadikan telinga Anda penikmat lantunan Al-Qur\'an dan nasihat para guru; hindari mendengarkan musik yang melalaikan hati.',
    context: 'Kitab Al-Firasat mengaitkan daun telinga dengan ketajaman daya hafalan (al-quwwah al-hafizhah).'
  },
  {
    id: 'fotd-9',
    topic: 'Petunjuk Garis Hidup Telapak Tangan (Khathth al-Hayah)',
    arabicText: 'الكف وما فيه من الخطوط والأسارير يدل على مزاج القلب والكبد، واليمنى أمارة العمل واليسرى أمارة الجبلة',
    indonesianTranslation: 'Telapak tangan beserta guratan garisnya menunjukkan kondisi temperamen jantung dan hati. Tangan kanan adalah tanda amal perbuatan, sedangkan tangan kiri tanda fitrah bawaan.',
    chapter: 'Pembahasan Ketiga, Pasal 9: Petunjuk Garis Tangan (Khuthûth al-Kaff)',
    chapterId: 'ch-tangan-garis',
    organBadge: 'Telapak Tangan',
    mizajBadge: 'Al-Amal wa al-Jibillah',
    keyInsight: 'Garis tangan terbentuk dari gerak biologis dan sirkulasi darah alami sejak dalam rahim. Garis yang dalam dan tegas menandakan ketahanan etos kerja nyata.',
    spiritualRiyadhah: 'Perbanyak sedekah dengan tangan kanan secara tersembunyi hingga tangan kiri tidak menyadarinya demi memurnikan keikhlasan.',
    context: 'Imam Ar-Razi mengkaji perbedaan tangan kanan sebagai instrumen ikhtiar dan tangan kiri sebagai potensi bawaan.'
  },
  {
    id: 'fotd-10',
    topic: 'Obat Ruhani untuk Watak Koleris (Al-Mizaj ash-Safrawiy)',
    arabicText: 'علاج الغضب كسر حدة الحرارة بالماء البارد والتفكر في عواقب الخصومة، فإن الحلم زين العقل',
    indonesianTranslation: 'Obat dari amarah adalah memecah gelombang panas dengan air wudhu sejuk serta merenungkan akibat buruk pertikaian, karena kelembutan hati adalah perhiasan akal.',
    chapter: 'Pembahasan Kedua: Tinjauan 4 Mizaj dan Pengobatan Akhlak',
    organBadge: 'Tazkiyatun Nafs',
    mizajBadge: 'Koleris (Safrawiy)',
    keyInsight: 'Unsur api (panas-kering) pada watak koleris menghasilkan tekad baja, namun rentan tergelincir pada kesombongan bila tidak dibasahi dengan kesabaran.',
    spiritualRiyadhah: 'Jika Anda merasa tersulut marah hari ini, segeralah berwudhu dengan air dingin dan ubahlah posisi tubuh Anda (duduk atau berbaring).',
    context: 'Panduan riyadhah akhlak Imam Fakhruddin Ar-Razi yang bersumber dari petunjuk Nabi Muhammad SAW.'
  },
  {
    id: 'fotd-11',
    topic: 'Rambut Tebal dan Uap Panas di Kepala',
    arabicText: 'كثرة الشعر تدل على كثرة البخار الدخاني الصاعد من حرارة القلب إلى الرأس، وصاحبه شجاع مقدام',
    indonesianTranslation: 'Lebatnya pertumbuhan rambut menandakan banyaknya uap hangat yang naik dari panasnya jantung menuju kepala, dan pemiliknya biasanya berjiwa pemberani serta pantang mundur.',
    chapter: 'Pembahasan Ketiga, Pasal 10: Petunjuk Rambut (Dalâ\'il asy-Sya\'r)',
    organBadge: 'Rambut (Sya\'r)',
    mizajBadge: 'Syaja\'ah (Keberanian)',
    keyInsight: 'Materi pembentuk rambut adalah residu uap alami tubuh. Vitalitas metabolisme yang aktif memicu tumbuhnya rambut lebat dan energi fisik berlimpah.',
    spiritualRiyadhah: 'Salurkan keberanian alami untuk membela keadilan dan melindungi yang lemah, bukan untuk bertindak gegabah tanpa pertimbangan syariat.',
    context: 'Kajian klasik Ar-Razi mengenai hubungan pertumbuhan folikel rambut dengan kehangatan suhu darah.'
  },
  {
    id: 'fotd-12',
    topic: 'Kaidah Tarjih Saat Gejala Fisik Saling Bertolak Belakang',
    arabicText: 'إذا تعارضت العلامات فالعمدة على العين ثم القلب، فإن العين لا تكذب والصوت رسول الفؤاد',
    indonesianTranslation: 'Apabila tanda-tanda fisik tampak bertentangan satu sama lain, maka rujukan utama yang diutamakan adalah pandangan mata kemudian getaran suara, sebab mata tak berdusta dan suara adalah utusan isi dada.',
    chapter: 'Bab Pokok Tarjih: Kaidah Menimbang Sinyal Berlawanan',
    chapterId: 'ch-mata',
    organBadge: 'Metodologi Tarjih',
    mizajBadge: 'Kaidah Ar-Razi',
    keyInsight: 'Mata dan suara adalah dua organ yang paling langsung digerakkan oleh ruh hewani dan ruh insani tanpa bisa dibuat-buat dalam durasi panjang.',
    spiritualRiyadhah: 'Latihlah kejujuran batin: pastikan apa yang Anda tampakkan di hadapan manusia selaras dengan niat terdalam di hadapan Allah Ta\'ala.',
    context: 'Prinsip tarjih paling masyhur dari Imam Fakhruddin Ar-Razi ketika menganalisis percampuran temperamen kompleks.'
  }
];

/**
 * Return the Firasat of the Day based on the current calendar date
 * Uses date hash to provide a consistent daily quote that advances at midnight
 */
export function getDailyFirasat(date: Date = new Date()): DailyFirasatItem {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Deterministic seed based on date
  const dateHash = (year * 372 + month * 31 + day) % DAILY_FIRASAT_ITEMS.length;
  return DAILY_FIRASAT_ITEMS[dateHash];
}

/**
 * Return a random item different from the current one
 */
export function getRandomFirasat(currentItemId?: string): DailyFirasatItem {
  const candidates = currentItemId 
    ? DAILY_FIRASAT_ITEMS.filter(item => item.id !== currentItemId)
    : DAILY_FIRASAT_ITEMS;
  
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || DAILY_FIRASAT_ITEMS[0];
}
