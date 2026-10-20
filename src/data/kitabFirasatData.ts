import { KitabChapter, TemperamentType } from '../types/firasat';

export interface MizajInfo {
  type: TemperamentType;
  indonesianName: string;
  arabicName: string;
  elements: string;
  humor: string;
  qualities: string;
  physicalSigns: string[];
  mentalTraits: string[];
  instinctiveBehaviors: string[];
  colorSkin: string;
  spiritualRemedy: string;
}

export const MIZAJ_DATA: Record<TemperamentType, MizajInfo> = {
  sanguinis: {
    type: 'sanguinis',
    indonesianName: 'Sanguinis (Panas-Lembap)',
    arabicName: 'المزاج الدموي (الحار الرطب)',
    elements: 'Udara (Hawa) / Musim Semi',
    humor: 'Darah (Dam)',
    qualities: 'Hangat & Basah / Lembap (Har-Rathb)',
    physicalSigns: [
      'Tubuh kuat, dada lapang, urat nadi lebar dan berdenyut teratur',
      'Wajah kemerah-merahan (humrah) berseri',
      'Rambut lebat, hitam pekat, pertumbuhan tubuh cepat',
      'Daging berotot cukup banyak, lemak sedang'
    ],
    mentalTraits: [
      'Cerdas, pintar, sangat lancar berbicara dan tangkas berfikir',
      'Ceria, mudah berteman, optimis menyambut kabar baik',
      'Mudah bosan jika rutinitas monoton, cepat menerima dan beralih ide baru',
      'Sangat menyukai pujian, penghormatan, dan kemuliaan'
    ],
    instinctiveBehaviors: [
      'Pemberani, heroik, memiliki inisiatif tinggi',
      'Nafsu makan dan gairah hidup tinggi',
      'Cenderung pemurah, bersahabat, namun bisa tergesa-gesa'
    ],
    colorSkin: 'Kemerah-merahan segar (Ahmaru al-lawn)',
    spiritualRemedy: 'Latihan konsistensi (istiqamah), mengendalikan keinginan instan, dan menyeimbangkan dengan tafakkur hening.'
  },
  koleris: {
    type: 'koleris',
    indonesianName: 'Koleris (Panas-Kering)',
    arabicName: 'المزاج الصفراوي (الحار اليابس)',
    elements: 'Api (Nar) / Musim Panas',
    humor: 'Empedu Kuning (Ash-Shafra\')',
    qualities: 'Panas & Kering (Har-Yabis)',
    physicalSigns: [
      'Sendi dan tulang kokoh, urat nadi tampak tegas dan berdenyut cepat',
      'Tubuh padat ramping/kurus bertulang kuat',
      'Rambut cepat tumbuh, hitam pekat, cenderung botak di usia lanjut',
      'Kulit terasa hangat dan agak kesat disentuh'
    ],
    mentalTraits: [
      'Pemikir tajam, fokus tinggi, daya ingat kuat terhadap tujuan',
      'Tegas dalam mengambil keputusan, benci keragu-raguan',
      'Bila tertekan atau diprovokasi cepat tersulut amarah (quwwah al-ghadhab)',
      'Memiliki tekad membaja dan keteguhan tak tergoyahkan'
    ],
    instinctiveBehaviors: [
      'Sangat pemberani hingga nekat (tahawwur)',
      'Tidak mudah gentar di hadapan bahaya',
      'Cenderung dominan, menyukai kepemimpinan dan kompetisi'
    ],
    colorSkin: 'Kecokelatan atau kemerahan bersinar (Asmar / Hararah)',
    spiritualRemedy: 'Riyadhah meredam marah (hilm & shabr), banyak berwudhu air sejuk, mendengarkan nasihat dengan rendah hati.'
  },
  melankolis: {
    type: 'melankolis',
    indonesianName: 'Melankolis (Dingin-Kering)',
    arabicName: 'المزاج السوداوي (البارد اليابس)',
    elements: 'Tanah (Ardh) / Musim Gugur',
    humor: 'Empedu Hitam (As-Sauda\')',
    qualities: 'Dingin & Kering (Barid-Yabis)',
    physicalSigns: [
      'Postur tubuh cenderung kurus, kulit kering atau pucat kekuningan',
      'Mata tajam dengan sorot fokus menatap ke satu arah',
      'Bibir tipis tertutup rapat, gerakan tubuh tenang dan terukur',
      'Rambut relatif sedikit dan tumbuh lambat'
    ],
    mentalTraits: [
      'Daya simpan memori (al-quwwah al-hafizhah) luar biasa kuat',
      'Sangat teliti, sistematis, kritis terhadap rincian sekecil apa pun',
      'Cenderung waspada, berhati-hati, sering mengantisipasi bahaya tersembunyi',
      'Mudah cemas, merenung dalam, terkadang larut dalam kesedihan (huzn)'
    ],
    instinctiveBehaviors: [
      'Hemat, menghargai aset/harta demi rasa aman',
      'Tidak mudah percaya pada ucapan manis tanpa bukti nyata',
      'Menyukai kesendirian dan ketenangan dalam bekerja'
    ],
    colorSkin: 'Pucat, agak gelap kusam, atau kekuningan dingin',
    spiritualRemedy: 'Menumbuhkan prasangka baik (husnuzhan), bersyukur, bersedekah secara teratur, dan bergaul dengan orang yang ceria.'
  },
  flegmatis: {
    type: 'flegmatis',
    indonesianName: 'Flegmatis (Dingin-Lembap)',
    arabicName: 'المزاج البلغمي (البارد الرطب)',
    elements: 'Air (Ma\') / Musim Dingin',
    humor: 'Lendir / Flegma (Al-Balgham)',
    qualities: 'Dingin & Lembap / Basah (Barid-Rathb)',
    physicalSigns: [
      'Tubuh berisi, berlemak lembut, persendian lentur',
      'Kulit putih pucat atau bersih dingin, jarang berbulu lebat',
      'Kelopak mata agak tebal, gerakan mata santai dan lamban',
      'Suara lembut perlahan, napas teratur dan tenang'
    ],
    mentalTraits: [
      'Penyabar, cinta kedamaian, sangat menghindari konflik',
      'Pemaaf, bertutur kata sopan, setia dan mudah memaklumi orang lain',
      'Berpikir santai, tidak terburu-buru, terkadang lambat mengambil inisiatif',
      'Mudah mengantuk atau merasa rileks dalam situasi santai'
    ],
    instinctiveBehaviors: [
      'Stabil, tidak mudah marah, pendengar yang baik',
      'Suka kenyamanan rumah dan kebersamaan bersahaja',
      'Cenderung pasif jika tidak diberi dorongan motivasi'
    ],
    colorSkin: 'Putih bersih atau kuning gading lembut (Abyadh)',
    spiritualRemedy: 'Melatih kedisiplinan gerak fisik, meningkatkan antusiasme ibadah dan amal, serta menetapkan target yang menantang.'
  }
};

export const KITAB_CHAPTERS: KitabChapter[] = [
  {
    id: 'ch-dahi',
    number: 1,
    title: 'Petunjuk dari Bentuk Dahi (Dalâ\'il al-Jabhah)',
    arabicTitle: 'دلائل الجبهة',
    part: 'Pembahasan Ketiga',
    summary: 'Dahi adalah tempat bagi otak bagian depan yang mengendalikan indra pengamatan, memori, dan kejernihan pemikiran.',
    classicalTextSnippet: 'من كان مقطبا لجبهته، مائلا إلى البسط فهو غضوب لأن جبهة الرجل الغضبان هكذا يكون...',
    rules: [
      {
        id: 'dahi-1',
        physicalFeature: 'Dahi berkerut dan cenderung rata',
        characterDeduction: 'Cenderung pemarah dan reaktif ketika terusik',
        arabicQuote: 'من كان مقطبا لجبهته، مائلا إلى البسط فهو غضوب',
        explanation: 'Kondisi ini menyerupai raut orang yang sedang menahan kemarahan. Tabiat bawaan memperlihatkan bentuk yang selalu siap bertarung atau berselisih.',
        animalMetaphor: 'Singa yang sedang terprovokasi'
      },
      {
        id: 'dahi-2',
        physicalFeature: 'Dahi berukuran kecil / sempit',
        characterDeduction: 'Kurang luas pemahamannya dan mudah terserang kelupaan',
        arabicQuote: 'من كانت جبهته صغيرة فهو جاهل',
        explanation: 'Otak bagian depan berukuran lebih kecil dari ukuran seimbang, sehingga menyulitkan proses abstraksi ide dan penyimpanan memori mendalam.',
      },
      {
        id: 'dahi-3',
        physicalFeature: 'Dahi berukuran besar dan lebar',
        characterDeduction: 'Cenderung lamban/santai, namun jika panas otaknya tinggi bisa menjadi sangat keras',
        arabicQuote: 'من كانت جبهته عظيمة فهو كسلان، وغضوب',
        explanation: 'Ukuran dahi yang terlalu besar menandakan banyaknya materi pembentuk atau hawa panas internal yang meluaskan rongga kepala.',
      },
      {
        id: 'dahi-4',
        physicalFeature: 'Dahi dengan banyak kerutan bertingkat',
        characterDeduction: 'Congkak, gemar menyombongkan kelebihan yang dimilikinya',
        arabicQuote: 'من كانت جبهته كثيرة العضوية فهو صَلِف',
        explanation: 'Salif adalah orang yang memuji dirinya melebihi apa yang ada pada dirinya karena kagum berlebih pada ego sendiri.',
      },
      {
        id: 'dahi-5',
        physicalFeature: 'Dahi rata licin tanpa kerutan sedikit pun',
        characterDeduction: 'Suka membuat masalah, pengacau, atau keras kepala',
        arabicQuote: 'من كانت جبهته منبسطة لا غضون بها فهو مشاغب',
        explanation: 'Ketiadaan kerutan alami menandakan minimnya kekhidmatan jiwa atau rasa malu yang menahan seseorang dari tindakan sembrono.',
      },
      {
        id: 'dahi-6',
        physicalFeature: 'Dahi proporsional (menonjol depan-belakang, rata samping)',
        characterDeduction: 'Sangat cerdas, berpikiran matang, berimbang (Al-Mizaj al-Mu\'tadil)',
        arabicQuote: 'شكل الرأس المعتدل أن يكون له نتوء من قدام ونتوء من خلف',
        explanation: 'Inilah bentuk ideal (i\'tidal) yang dipuji Imam Fakhruddin Ar-Razi sebagai wadah akal budi terbaik.',
      }
    ]
  },
  {
    id: 'ch-alis',
    number: 2,
    title: 'Petunjuk dari Alis Mata (Dalâ\'il al-Hâjib)',
    arabicTitle: 'دلائل الحاجب',
    part: 'Pembahasan Ketiga',
    summary: 'Alis mencerminkan kadar uap asap (maddah dukhaniyyah) dan dominasi cairan empedu hitam atau panas dalam kepala.',
    rules: [
      {
        id: 'alis-1',
        physicalFeature: 'Bulu alis lebat dan tebal hitam',
        characterDeduction: 'Sering berduka, sensitif, pemikir dalam, tutur kata terkadang tajam',
        arabicQuote: 'الحاجب الكثير الشعر يكون صاحبه كثير الهم والحزن، غث الكلام',
        explanation: 'Bulu alis terbentuk dari sisa penguapan otak; lebatnya bulu menandakan banyaknya materi empedu hitam yang mendatangkan kesedihan dan kehati-hatian.',
      },
      {
        id: 'alis-2',
        physicalFeature: 'Alis miring dari hidung ke bawah, dan ujung pelipis naik ke atas',
        characterDeduction: 'Congkak, keras kepala, dan kurang mendalam daya pikirnya',
        arabicQuote: 'إن كان حاجبه يميل من ناحية الأنف إلى أسفل ومن ناحية الصدغ إلى فوق فإنه صَلِف أبله',
        explanation: 'Sudut kemiringan ini mencerminkan ketidakseimbangan gerak otot ekspresi yang dipicu arogansi bawaan.',
      },
      {
        id: 'alis-3',
        physicalFeature: 'Alis melengkung terbelah tajam di tengah',
        characterDeduction: 'Waspada tinggi, pandai bersilat kata atau menyembunyikan maksud',
        arabicQuote: 'إذا كان الحاجب مشقوقا أو معوجا',
        explanation: 'Bentuk ini sering ditemukan pada orang yang banyak menyusun strategi atau berhati-hati dalam pergaulan.',
      }
    ]
  },
  {
    id: 'ch-mata',
    number: 3,
    title: 'Petunjuk dari Bentuk, Sorot, dan Warna Mata (Dalâ\'il al-\'Ain)',
    arabicTitle: 'دلائل العين',
    part: 'Pembahasan Ketiga',
    summary: 'Mata adalah jendela jiwa paling jujur dan memiliki sepuluh sudut tinjau utama menurut Ar-Razi.',
    rules: [
      {
        id: 'mata-1',
        physicalFeature: 'Mata berukuran besar dan lebar',
        characterDeduction: 'Santai, pemalas, lembut, lambat bereaksi',
        arabicQuote: 'من عظمت عينه فهو كسلان؛ مأخوذة من مشابهة أعين الثيران',
        animalMetaphor: 'Kerbau / Lembu',
        explanation: 'Mata besar menandakan dominasi kelembapan di bagian kepala, sehingga menghasilkan kelembutan tapi kurang gesit.'
      },
      {
        id: 'mata-2',
        physicalFeature: 'Mata melotot / menonjol keluar (Jahizhah)',
        characterDeduction: 'Banyak bicara, kurang rasa malu, tergesa-gesa',
        arabicQuote: 'من كان عيناه جاحظتين فهو جاهل مهذار؛ مأخوذة من مشابهة الحمار والكلب',
        animalMetaphor: 'Keledai & Anjing',
        explanation: 'Penonjolan bola mata mencerminkan hawa internal yang mendesak ke luar tanpa kontrol ketenangan.'
      },
      {
        id: 'mata-3',
        physicalFeature: 'Mata agak cekung berwibawa (Gha\'iratan qalilan)',
        characterDeduction: 'Jiwa mulia, berani, fokus, memiliki pandangan tajam',
        arabicQuote: 'من كان عيناه غائرتين قليلا فنفسه نبيلة؛ مأخوذة من الأسد',
        animalMetaphor: 'Singa (Al-Asad)',
        explanation: 'Sedikit cekung menunjukkan kekokohan tulang pelipis dan kekuatan saraf otak yang mengendalikan pandangan.'
      },
      {
        id: 'mata-4',
        physicalFeature: 'Mata bergerak cepat, lincah, dan tajam (Katsir al-Harakah)',
        characterDeduction: 'Banyak akal, cerdas, waspada, namun bisa lihai berdalih',
        arabicQuote: 'من كان عيناه تتحركان بسرعة وحدة فهو مكار محتال',
        explanation: 'Gerak cepat bola mata berasal dari panas dan keringnya cairan otak, menggerakkan indra dengan kecepatan kilat.'
      },
      {
        id: 'mata-5',
        physicalFeature: 'Mata berwarna campuran madu-kebiruan (Syahlah / Syahla\')',
        characterDeduction: 'Karakter paling mulia, seimbang, luhur, dan ideal',
        arabicQuote: 'أفضل ألوان العين: الشهلة؛ لأنها لون متوسط بين السواد وبين الزرقة والخضرة',
        animalMetaphor: 'Mata Singa dan Burung Elang',
        explanation: 'Warna syahlah berada tepat di pertengahan antara dingin dan panas, mencerminkan kesempurnaan temperamen manusia mulia.'
      },
      {
        id: 'mata-6',
        physicalFeature: 'Mata kemerah-merahan bagai bara api',
        characterDeduction: 'Pemberani heroik, namun mudah terbakar amarah',
        arabicQuote: 'إذا كانت العين حمراء مثل الجمر فصاحبها غضوب مقدام',
        explanation: 'Menandakan dominasi unsur darah dan panas yang mengisi pembuluh sekitar selaput mata.'
      }
    ]
  },
  {
    id: 'ch-hidung',
    number: 4,
    title: 'Petunjuk dari Bentuk Hidung (Dalâ\'il al-Anf)',
    arabicTitle: 'دلائل الأنف',
    part: 'Pembahasan Ketiga',
    summary: 'Hidung menghubungkan rongga napas dengan dada dan jantung, menunjukkan keberanian, syahwat, dan temperamen.',
    rules: [
      {
        id: 'hidung-1',
        physicalFeature: 'Ujung hidung lancip (Taraf al-Anf Daqiq)',
        characterDeduction: 'Suka berdebat/berselisih, peragu, mudah meremehkan hal kecil',
        arabicQuote: 'من كان طرف الأنف منه دقيقا فهو محب للخصومة طياش خفيف؛ مأخوذ من الكلب',
        animalMetaphor: 'Anjing',
        explanation: 'Ketipisan ujung hidung menunjukkan kekurangan materi darah penopang ketenangan jiwa.'
      },
      {
        id: 'hidung-2',
        physicalFeature: 'Hidung melengkung bagai paruh elang (Aquiline Nose)',
        characterDeduction: 'Jiwa mulia, berwibawa, ambisius, memiliki kepemimpinan alami',
        arabicQuote: 'من كان أنفه مقوسا فنفسه نبيلة؛ مأخوذ من العقاب',
        animalMetaphor: 'Burung Elang / Rajawali',
        explanation: 'Lengkungan elang adalah tanda klasik raja-raja dan panglima yang berani mengambil tanggung jawab besar.'
      },
      {
        id: 'hidung-3',
        physicalFeature: 'Hidung dengan lubang napas lebar dan mengembang',
        characterDeduction: 'Pemberani, bernapas lega, mudah terpancing emosi jika direndahkan',
        arabicQuote: 'من كان أنفه شديد الانتفاخ فهو غضوب',
        explanation: 'Rongga napas yang luas menandakan jantung yang berhawa panas dan paru-paru yang membutuhkan sirkulasi cepat.'
      },
      {
        id: 'hidung-4',
        physicalFeature: 'Pangkal hidung pesek/rendah dan ujung melebar',
        characterDeduction: 'Gairah hidup dan syahwat besar, santai dalam pergaulan',
        arabicQuote: 'من كان أفطس فهو شبِق؛ مأخوذ من الإبل',
        animalMetaphor: 'Unta',
        explanation: 'Karakter fisik yang menandakan dominasi unsur biologis reproduktif yang kuat.'
      }
    ]
  },
  {
    id: 'ch-mulut-bibir',
    number: 5,
    title: 'Petunjuk dari Mulut, Bibir, dan Gigi (Dalâ\'il al-Fam wa ash-Syafah)',
    arabicTitle: 'دلائل الفم والشفة واللسان',
    part: 'Pembahasan Ketiga',
    summary: 'Mulut mencerminkan selera, hasrat kejiwaan, dan kemampuan artikulasi komunikasi.',
    rules: [
      {
        id: 'mulut-1',
        physicalFeature: 'Mulut berukuran lebar dan lapang',
        characterDeduction: 'Pemberani, vokal, memiliki nafsu dan tekad besar',
        arabicQuote: 'من كان واسع الفم فهو نهم شجاع؛ يشبه الأسد',
        animalMetaphor: 'Singa',
        explanation: 'Keluasan mulut berasal dari terbukanya jalur energi panas dari dada menuju tenggorokan.'
      },
      {
        id: 'mulut-2',
        physicalFeature: 'Bibir tipis, lemas, dan menutup rapat dengan anggun',
        characterDeduction: 'Berjiwa halus, cermat bertutur kata, bermartabat',
        arabicQuote: 'من كان شفتاه دقيقتين مسترخيتين... فنفسه نبيلة؛ مأخوذ من الأسد',
        explanation: 'Menunjukkan kontrol saraf wajah yang seimbang antara kemauan akal dan ekspresi lahiriah.'
      },
      {
        id: 'mulut-3',
        physicalFeature: 'Bibir tebal menggelambir ke bawah (terutama bibir bawah)',
        characterDeduction: 'Keras watak, bebal, sulit dinasihati',
        arabicQuote: 'من كان غليظ الشفة فهو أحمق غليظ الطبع، لاسيما إذا كانت متدلية؛ مأخوذ من الحمير',
        animalMetaphor: 'Keledai',
        explanation: 'Bibir tebal kendur menandakan dominasi lendir lembap yang berlebihan di wajah.'
      },
      {
        id: 'mulut-4',
        physicalFeature: 'Gigi taring panjang dan kokoh',
        characterDeduction: 'Gigih, rakus terhadap tujuan, memiliki daya serang tinggi',
        arabicQuote: 'من كان طويل الأنياب قويها فهو نهم شرير',
        animalMetaphor: 'Binatang Pemangsa',
        explanation: 'Ciri fisik yang melambangkan ketahanan bertahan hidup dan keagresifan alami.'
      }
    ]
  },
  {
    id: 'ch-telinga',
    number: 6,
    title: 'Petunjuk dari Bentuk dan Daun Telinga (Dalâ\'il al-Udzun)',
    arabicTitle: 'دلائل الأذن',
    part: 'Pembahasan Ketiga',
    summary: 'Telinga adalah pintu gerbang pendengaran yang terhubung langsung dengan rongga otak dan ketajaman daya simpan memori (al-quwwah al-hafizhah).',
    rules: [
      {
        id: 'telinga-1',
        physicalFeature: 'Telinga sedang dan proporsional (Mu\'tadilah)',
        characterDeduction: 'Cerdas, pemahaman baik, amanah menjaga rahasia, berbudi luhur',
        arabicQuote: 'الأذن المعتدلة تدل على حسن الفهم ونبالة النفس واعتدال المزاج',
        animalMetaphor: 'Singa',
        explanation: 'Bentuk telinga yang serasi mencerminkan keseimbangan cairan dan ketajaman daya tangkap indra pendengaran.'
      },
      {
        id: 'telinga-2',
        physicalFeature: 'Telinga besar dan terbuka lebar (Udznun Kabir)',
        characterDeduction: 'Daya simpan ingatan kuat (quwwat al-hifzh), sabar menyimak, berpemahaman luas',
        arabicQuote: 'من كانت أذنه كبيرة فهو جيد الحفظ؛ لأن كبر الأذن يدل على كبر الدماغ وسعته',
        animalMetaphor: 'Gajah / Keledai',
        explanation: 'Keluasan daun telinga menurut Ar-Razi mengindikasikan volume tengkorak dan kapasitas otak bagian memori yang memadai.'
      },
      {
        id: 'telinga-3',
        physicalFeature: 'Telinga kecil dan ramping (Udznun Shaghir)',
        characterDeduction: 'Cepat tanggap namun mudah lupa, lincah, tergesa-gesa mengambil kesimpulan',
        arabicQuote: 'من كانت أذنه صغيرة فهو رديء الحفظ، خفيف الطبع؛ مأخوذ من القرد',
        animalMetaphor: 'Kera',
        explanation: 'Kecilnya telinga mengindikasikan keterbatasan ruang penyimpanan memori atau keringnya cairan penyerap.'
      },
      {
        id: 'telinga-4',
        physicalFeature: 'Daun telinga tebal berdaging lembut (Lahim al-Udzn)',
        characterDeduction: 'Tenang, stabil, tidak mudah panik menghadapi kabar mengejutkan',
        arabicQuote: 'من كانت أذنه غليظة كثيرة اللحم فهو صبور ثابت الجأش',
        animalMetaphor: 'Banteng',
        explanation: 'Tebalnya jaringan daging menandakan peredaran flegma/darah yang melimpah sehingga meredam gejolak emosi mendadak.'
      },
      {
        id: 'telinga-5',
        physicalFeature: 'Telinga tipis, pipih, dan merapat ke tengkorak (Raqiqah Mulshaqah)',
        characterDeduction: 'Sangat sensitif terhadap intonasi dan kritik, waspada, analitis kritis',
        arabicQuote: 'الأذن الرقيقة تدل على حدة الحس وسرعة التأثر',
        explanation: 'Sensitivitas tinggi pada getaran suara menandakan saraf pendengaran yang tipis dan peka menerima impuls.'
      }
    ]
  },
  {
    id: 'ch-wajah',
    number: 7,
    title: 'Petunjuk dari Bentuk dan Garis Wajah (Dalâ\'il al-Wajh)',
    arabicTitle: 'دلائل الوجه',
    part: 'Pembahasan Ketiga',
    summary: 'Keseluruhan raut muka merangkum sirkulasi darah, kejernihan ruh, dan keseimbangan 4 unsur.',
    rules: [
      {
        id: 'wajah-1',
        physicalFeature: 'Wajah rupawan, cerah, dan proporsional (Hasan al-Wajh)',
        characterDeduction: 'Cerminan kebaikan batin dan akhlak luhur',
        arabicQuote: 'اطلبوا الحوائج عند حسان الوجوه',
        explanation: 'Imam Ar-Razi mengutip hadits dan kaidah bahwa keserasian bentuk lahiriah biasanya sejalan dengan kebersihan tabiat batiniah.'
      },
      {
        id: 'wajah-2',
        physicalFeature: 'Wajah tirus, kurus, bergaris tegas',
        characterDeduction: 'Cermat, pemikir teliti, banyak menimbang segala perkara',
        arabicQuote: 'من كان نحيف الوجه فهو مهتم بالأمور، لأن كثرة الأفكار توجب اليبوسة',
        explanation: 'Aktivitas berpikir yang intens mengonsumsi energi tubuh dan menyebabkan sifat kering (al-yubusah) yang meniruskan pipi.'
      },
      {
        id: 'wajah-3',
        physicalFeature: 'Wajah gemuk berdaging tebal (Lahim al-Wajh)',
        characterDeduction: 'Santai, kurang peka terhadap isyarat halus, menyukai kemudahan',
        arabicQuote: 'من كان لحيم الوجه فهو كسلان جاهل؛ مأخوذ من الثيران',
        animalMetaphor: 'Kerbau',
        explanation: 'Banyaknya lemak dan daging di wajah menandakan kurangnya ketajaman sirkulasi saraf sensorik.'
      },
      {
        id: 'wajah-4',
        physicalFeature: 'Wajah memanjang berlebih',
        characterDeduction: 'Cenderung kurang pemalu dan berbicara apa adanya tanpa tedeng aling-aling',
        arabicQuote: 'من كان طويل الوجه فهو وقح؛ مأخوذ من الكلب',
        animalMetaphor: 'Anjing',
        explanation: 'Proporsi vertikal berlebih diasosiasikan dengan desakan agresivitas yang tidak direm oleh rasa segan.'
      }
    ]
  },
  {
    id: 'ch-leher-suara',
    number: 8,
    title: 'Petunjuk dari Leher, Suara, dan Gerakan (Al-\'Unuq wa ash-Shawt)',
    arabicTitle: 'دلائل العنق والصوت والحركات',
    part: 'Pembahasan Ketiga',
    summary: 'Leher adalah saluran penghubung otak ke jantung, sedangkan suara mencerminkan kapasitas dada dan suhu jiwa.',
    rules: [
      {
        id: 'leher-1',
        physicalFeature: 'Leher tebal berotot dan tegap',
        characterDeduction: 'Kuat, perkasa, pemberani, tahan banting',
        arabicQuote: 'من كان عنقه غليظا فهو قوى بطاش؛ مأخوذ من الذكر',
        explanation: 'Mencerminkan kekuatan saraf tulang belakang dan keberanian yang berpusat pada jantung.'
      },
      {
        id: 'leher-2',
        physicalFeature: 'Leher sedang proporsional',
        characterDeduction: 'Berjiwa mulia, adil, cerdas',
        arabicQuote: 'من كان عنقه معتدلا فنفسه نبيلة؛ مأخوذ من الأسد',
        animalMetaphor: 'Singa',
        explanation: 'Keseimbangan bentuk leher adalah tanda i\'tidal (kesempurnaan).'
      },
      {
        id: 'suara-1',
        physicalFeature: 'Suara berat, mantap, dan lantang (Jahir)',
        characterDeduction: 'Pemberani, berwibawa, berjiwa pelindung',
        arabicQuote: 'الصوت العظيم الغليظ الثقيل يدل على قوة الحرارة والشجاعة',
        explanation: 'Panasnya jantung memperlebar rongga dada dan paru-paru sehingga menghasilkan resonansi vokal yang dalam.'
      },
      {
        id: 'suara-2',
        physicalFeature: 'Bicara pelan, tertata, dan berirama',
        characterDeduction: 'Penyabar, berakhlak mulia, berwawasan luas',
        arabicQuote: 'من كان كلامه بطيئا فهو وقور صبور',
        explanation: 'Pengendalian tempo bicara menandakan akal yang memimpin emosi dan nafsu.'
      }
    ]
  },
  {
    id: 'ch-tangan-garis',
    number: 9,
    title: 'Petunjuk dari Garis Telapak Tangan Kanan & Kiri (Dalâ\'il Khuthûth al-Kaff)',
    arabicTitle: 'دلائل خطوط الكف واليدين',
    part: 'Pembahasan Ketiga',
    summary: 'Telapak tangan dan urat-urat lahiriah mencerminkan sirkulasi panas alami (al-hararah al-ghariziyyah), ketajaman akal, serta etos kerja. Tangan kanan memancarkan aksi nyata (al-amal), sedangkan tangan kiri memancarkan fitrah batiniah (al-jibillah).',
    classicalTextSnippet: 'الكف وما فيه من الخطوط والأسارير يدل على مزاج القلب والكبد والدماغ، واليمنى أمارة الفعل واليسرى أمارة الجبلة...',
    rules: [
      {
        id: 'tangan-1',
        physicalFeature: 'Garis Kehidupan (Khathth al-Hayah) panjang, tebal, melengkung luas melingkari ibu jari',
        characterDeduction: 'Vitalitas jasmani prima, stamina tinggi, optimis, berani mengambil risiko, tabah menghadapi keletihan',
        arabicQuote: 'طول خط الحياة واستدارته حول الإبهام يدل على قوة الحرارة الغريزية وفضل الشجاعة',
        animalMetaphor: 'Singa',
        explanation: 'Lengkungan kokoh tanpa jeda mencerminkan kekuatan jantung dan hati yang menyuplai energi hidup segar ke seluruh anggota badan.'
      },
      {
        id: 'tangan-2',
        physicalFeature: 'Garis Akal (Khathth al-Aql) lurus, tajam menembus tengah telapak',
        characterDeduction: 'Pikiran logis, realistis, pragmatis, cepat mengambil keputusan praktis dan tidak mudah bimbang',
        arabicQuote: 'استقامة خط العقل في وسط الكف تدل على جودة التمييز وقوة الرأي',
        explanation: 'Jalur lurus menunjukkan saraf pemikiran yang langsung menghubungkan pertimbangan nalar dengan tindakan tanpa distorsi fantasi berlebih.'
      },
      {
        id: 'tangan-3',
        physicalFeature: 'Garis Kalbu (Khathth al-Qalb) melengkung anggun menuju pangkal telunjuk',
        characterDeduction: 'Berjiwa ksatria, setia kawan, penuh empati, menghargai ikatan persaudaraan dan cinta kebenaran',
        arabicQuote: 'انعطاف خط القلب نحو السبابة علامة النبالة ووفاء العهد',
        animalMetaphor: 'Kuda Ras Murni (Al-Faras)',
        explanation: 'Arah lengkungan ke bukit telunjuk diasosiasikan dengan hasrat kemuliaan, kehormatan moral, dan kelapangan dada.'
      },
      {
        id: 'tangan-4',
        physicalFeature: 'Perbedaan Tangan Kanan (Aksi Nyata) vs Tangan Kiri (Fitrah Batin)',
        characterDeduction: 'Kanan menunjukkan apa yang diusahakan dan dibiasakan, Kiri menunjukkan potensi bawaan lahir',
        arabicQuote: 'اليد اليمنى مظهر الكسب والاعتياد، واليد اليسرى مظهر الفطرة والسريرة',
        explanation: 'Bila garis tangan kanan lebih kokoh daripada kiri, subjek berhasil mendidik dirinya melebihi modal bawaan awalnya; sebaliknya jika kiri lebih kuat, terdapat potensi fitrah yang belum sepenuhnya diaktualisasikan.'
      },
      {
        id: 'tangan-5',
        physicalFeature: 'Tekstur telapak kokoh berserat urat jelas, terasa hangat-kering',
        characterDeduction: 'Disiplin tinggi, pantang menyerah, pekerja keras yang ulet dan berdaya kepemimpinan kuat',
        arabicQuote: 'صلابة الكف واعتدال حرارتها يدل على الصبر على الشدائد ومحبة العمل',
        animalMetaphor: 'Rajawali',
        explanation: 'Kepadatan otot telapak dan kehangatan suhu kulit merupakan tanda dominasi empedu kuning dan darah yang terarah pada aktivitas produktif.'
      }
    ]
  }
];

export const GLOSSARY_TERMS = [
  {
    term: 'Firâsah (الفراسة)',
    status: 'Masyru\' (Dianjurkan / Ilmu Terpuji)',
    definition: 'Istidlal bil-ahwal azh-zhahirah \'alal-ahwal al-bathinah — penarikan kesimpulan atas sifat/karakter batiniah melalui pengamatan tanda-tanda lahiriah yang nyata.',
    source: 'Kitab Al-Firasat & Syarh Faidh al-Qadir'
  },
  {
    term: 'Qiyâfah (القيافة)',
    status: 'Masyru\' (Diakui dalam Syariat)',
    definition: 'Teknik identifikasi fisik; terbagi dua: Qiyafah al-Atsar (melacak jejak kaki/kuku di tanah) dan Qiyafah al-Basyar (mengidentifikasi garis nasab anak berdasarkan kemiripan kulit & sendi fisik, seperti suku Mudlij).',
    source: 'Sunnah Nabi & Riwayat Suku Bani Mudlij'
  },
  {
    term: 'Riyâfah (الريافة)',
    status: 'Mubah (Keahlian Alamiah)',
    definition: 'Keahlian mendeteksi sumber mata air yang tersembunyi di dalam tanah melalui aroma tanah, vegetasi sekitar, dan hembusan angin.',
    source: 'Kearifan Geografi Klasik'
  },
  {
    term: 'Zakânah (الزكانة)',
    status: 'Masyru\'',
    definition: 'Dugaan tajam yang tepat karena kejernihan pikiran dan intuisi tajam mukmin.',
    source: 'Kamus Mu\'jam al-Wasith'
  },
  {
    term: 'Kahanah (الكهانة)',
    status: 'Haram (Dilarang Mutlak)',
    definition: 'Klaim mengetahui perkara gaib di masa depan dan rahasia takdir melalui bantuan bisikan jin atau setan.',
    source: 'Hadits Riwayat Muslim'
  },
  {
    term: '‘Irâfah (العرافة)',
    status: 'Haram',
    definition: 'Klaim ramalan perkara tersembunyi seperti mengetahui letak barang curian atau orang hilang menggunakan cara mistik non-ilmiah.',
    source: 'Kaidah Fikih'
  },
  {
    term: 'Nijâmah / Astrologi (النجامة)',
    status: 'Haram',
    definition: 'Meyakini bintang-bintang memiliki pengaruh gaib terhadap nasib baik, sial, atau watak seseorang (berbeda dengan astronomi/ilmu falak petunjuk arah yang halal).',
    source: 'Penegasan Imam Ar-Razi & QS Al-An\'am: 97'
  },
  {
    term: 'Tathayyur (التطير)',
    status: 'Haram / Syirik Ashghar',
    definition: 'Meramal kesialan atau keberuntungan berdasarkan arah terbang burung, kedutan mata, atau posisi tahi lalat.',
    source: 'Hadits: "Ath-Thiyarah syirkun"'
  }
];

export const SAMPLE_PORTRAITS = [
  {
    id: 'sample-1',
    name: 'Ahmad Al-Manshur (Tipe Cendekiawan Seimbang)',
    gender: 'Laki-laki',
    dominantMizaj: 'sanguinis' as TemperamentType,
    mizajScores: { sanguinis: 45, koleris: 25, melankolis: 20, flegmatis: 10 },
    iTidalStatus: 'Mu\'tadil (Seimbang)' as const,
    description: 'Dahi proporsional menonjol depan-belakang, mata syahlah jernih menatap tenang, hidung elang elok, bibir tipis tertutup rapat.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    tags: ['Cendekiawan', 'Seimbang', 'Mu\'tadil', 'Mulia']
  },
  {
    id: 'sample-2',
    name: 'Zaid Al-Faris (Tipe Ksatria Tegas & Pemberani)',
    gender: 'Laki-laki',
    dominantMizaj: 'koleris' as TemperamentType,
    mizajScores: { sanguinis: 20, koleris: 55, melankolis: 15, flegmatis: 10 },
    iTidalStatus: 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)' as const,
    description: 'Dahi bergaris tegas, mata berbinar tajam dengan urat kemerahan, hidung berlubang lebar, rahang kukuh, leher berotot tebal.',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    tags: ['Pemberani', 'Pemimpin', 'Tegas', 'Koleris']
  },
  {
    id: 'sample-3',
    name: 'Maryam Al-Hikmah (Tipe Peneliti & Pemikir Teliti)',
    gender: 'Perempuan',
    dominantMizaj: 'melankolis' as TemperamentType,
    mizajScores: { sanguinis: 15, koleris: 15, melankolis: 50, flegmatis: 20 },
    iTidalStatus: 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)' as const,
    description: 'Wajah tirus cermat, dahi tinggi luas, sorot mata fokus dalam, alis tertata rapi, ekspresi penuh perenungan.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    tags: ['Teliti', 'Pemikir', 'Memori Kuat', 'Melankolis']
  },
  {
    id: 'sample-4',
    name: 'Utsman Al-Halim (Tipe Penyejuk & Diplomat Damai)',
    gender: 'Laki-laki',
    dominantMizaj: 'flegmatis' as TemperamentType,
    mizajScores: { sanguinis: 25, koleris: 10, melankolis: 15, flegmatis: 50 },
    iTidalStatus: 'Mu\'tadil (Seimbang)' as const,
    description: 'Wajah teduh berpipa lembut, mata ramah bersahabat, bibir menyungging senyum alami, tutur kata pelan berwibawa.',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    tags: ['Penyabar', 'Damai', 'Pemaaf', 'Flegmatis']
  },
  {
    id: 'sample-palm-right',
    name: 'Telapak Tangan Kanan (Al-Yad al-Yumna - Amal & Kepemimpinan)',
    gender: 'Laki-laki / Universal',
    dominantMizaj: 'sanguinis' as TemperamentType,
    mizajScores: { sanguinis: 48, koleris: 26, melankolis: 16, flegmatis: 10 },
    iTidalStatus: 'Mu\'tadil (Seimbang)' as const,
    description: 'Garis kehidupan (Khathth al-Hayah) tebal kokoh melingkari ibu jari, garis akal (Khathth al-Aql) lurus membelah tengah telapak, bantalan otot kenyal hangat.',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
    tags: ['Telapak Kanan', 'Amal Lahiriah', 'Garis Hayah & Aql', 'Kitab Ar-Razi'],
    scanTarget: 'palm_right'
  },
  {
    id: 'sample-palm-left',
    name: 'Telapak Tangan Kiri (Al-Yad al-Yusra - Fitrah Batin & Spiritualitas)',
    gender: 'Perempuan / Universal',
    dominantMizaj: 'melankolis' as TemperamentType,
    mizajScores: { sanguinis: 20, koleris: 15, melankolis: 42, flegmatis: 23 },
    iTidalStatus: 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)' as const,
    description: 'Garis kalbu (Khathth al-Qalb) melengkung lembut ke pangkal telunjuk, garis akal mengalir halus ke bukit bulan, tekstur telapak ramping bersih.',
    imageUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=500&auto=format&fit=crop&q=80',
    tags: ['Telapak Kiri', 'Fitrah Batin', 'Garis Kalbu', 'Intuisi Nurani'],
    scanTarget: 'palm_left'
  }
];
