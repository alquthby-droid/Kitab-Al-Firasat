import { FirasatAnalysisResult, TemperamentType } from '../types/firasat';

export interface ChallengePortrait {
  id: string;
  name: string;
  arabicTitle: string;
  ageStage: string;
  imageUrl: string;
  dominantMizaj: TemperamentType;
  iTidalStatus: string;
  mizajScores: {
    sanguinis: number;
    koleris: number;
    melankolis: number;
    flegmatis: number;
  };
  observableClues: {
    dahi: string;
    mata: string;
    hidung: string;
    bibir: string;
    raut: string;
  };
  pedagogicalReasoning: {
    coreConcept: string;
    kitabChapter: string;
    arabicQuote: string;
    quoteTranslation: string;
    humorDynamics: string;
  };
  fullAnalysisResult: FirasatAnalysisResult;
}

export const CHALLENGE_PORTRAITS: ChallengePortrait[] = [
  {
    id: 'ch-sanguinis-1',
    name: 'Ahmad Al-Manshur',
    arabicTitle: 'أحمد المنصور • النبيل المعتدل',
    ageStage: 'Paruh Baya (Kuhulah)',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'sanguinis',
    iTidalStatus: "Mu'tadil (Seimbang)",
    mizajScores: { sanguinis: 48, koleris: 24, melankolis: 18, flegmatis: 10 },
    observableClues: {
      dahi: 'Dahi proporsional menonjol seimbang di bagian depan-belakang, bebas kerutan tegang.',
      mata: 'Sorot mata syahlah (pertengahan madu jernih), menatap tenang dan berwibawa.',
      hidung: 'Batang hidung lurus simetris dengan lengkungan luhur elang elok.',
      bibir: 'Bibir menutup rapat teratur, sudut simetris menandakan fasih dalam bertutur.',
      raut: 'Wajah berseri segar (Hasan al-Wajh) dengan sirkulasi darah yang harmonis.'
    },
    pedagogicalReasoning: {
      coreConcept: 'Keselarasan antara kelapangan dahi dan kejernihan sorot mata syahlah adalah ciri khas utama temperamen Sanguinis Seimbang (Al-Mizaj al-Mu\'tadil).',
      kitabChapter: 'Kitab Al-Firasat, Bab II: Tanda-Tanda Manusia Ideal',
      arabicQuote: 'أفضل ألوان العين: الشهلة، تدل على كمال العقل وحسن الخلق واعتدال المزاج',
      quoteTranslation: 'Warna mata yang paling utama adalah asy-syahlah (jernih bertabur madu), menandakan kesempurnaan akal, keluhuran akhlak, dan keseimbangan temperamen.',
      humorDynamics: 'Unsur darah (Damawi) yang hangat dan lembap mengalir lancar ke rongga otak depan tanpa kelebihan empedu panas.'
    },
    fullAnalysisResult: {
      id: 'res-ch-1',
      subjectName: 'Ahmad Al-Manshur',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'sanguinis',
      iTidalStatus: "Mu'tadil (Seimbang)",
      ageStage: 'Paruh Baya (Kuhulah)',
      mizajScores: { sanguinis: 48, koleris: 24, melankolis: 18, flegmatis: 10 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Dahi proporsional dengan kelapangan merata',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Cerdas sempurna, daya abstraksi jernih',
          humorEffect: 'Kehangatan seimbang',
          confidence: 95
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Sorot mata syahlah berwibawa',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Singa & Elang',
          traitIndication: 'Jiwa mulia, kepemimpinan bijaksana',
          humorEffect: 'Pertengahan panas-dingin',
          confidence: 96
        }
      ],
      overallSummary: {
        primaryStrengths: ['Komunikasi diplomatis prima', 'Kecerdasan emosional stabil', 'Daya analisis seimbang'],
        potentialWeaknesses: ['Kadang terlalu perfeksionis terhadap keselarasan lingkungan'],
        naturalInclination: 'Karakter mu\'tadil yang mampu memimpin dengan hikmah dan kebijaksanaan.',
        tarjihNote: 'Kaidah Tarjih Ar-Razi: Ketenangan mata syahlah memperkuat kelapangan dahi.',
        spiritualAdvice: 'Pertahankan wirid tafakkur dan sedekah tersembunyi.'
      },
      classicalQuote: {
        chapter: 'Bab Kepribadian Mu\'tadil',
        arabicText: 'إن كان حسن الشكل كان معتدل المزاج فصاحبه نبيل النفس سديد الرأي',
        indonesianTranslation: 'Jika bentuk fisiknya serasi dan temperamennya seimbang, maka pemiliknya berjiwa luhur dan tepat pandangannya.',
        context: 'Penegasan Imam Ar-Razi mengenai keserasian fisik yang memantulkan keadilan batin.'
      }
    }
  },
  {
    id: 'ch-koleris-1',
    name: 'Zaid Al-Faris',
    arabicTitle: 'زيد الفارس • الشجاع الغضوب',
    ageStage: 'Pemuda Gagah (Syabab)',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'koleris',
    iTidalStatus: 'Koleris Ghalib (Tegas & Aktif)',
    mizajScores: { sanguinis: 18, koleris: 56, melankolis: 16, flegmatis: 10 },
    observableClues: {
      dahi: 'Dahi bergaris tegas dengan sedikit kerutan fokus di antara dua alis (qaththab al-jabhah).',
      mata: 'Sorot mata tajam menancap berkilat, sedikit cekung berwibawa laksana singa.',
      hidung: 'Batang hidung kokoh dengan lubang hidung yang agak mengembang.',
      bibir: 'Rahang dan bibir mengatup kuat, sudut bibir tegas tidak mudah goyah.',
      raut: 'Garis wajah tegas bersegi dengan leher kokoh berotot.'
    },
    pedagogicalReasoning: {
      coreConcept: 'Sorot mata tajam berkilat yang dipadukan dengan dahi berkerut tegas dan rahang kukuh adalah tanda klasik dominasi empedu kuning panas-kering (Koleris / Shafrawi).',
      kitabChapter: 'Kitab Al-Firasat, Pasal Mata & Dahi Terprovokasi',
      arabicQuote: 'من كانت عينه غائرة قليلا، مع حدة نظر، فهو شجاع مأخوذ من الأسد',
      quoteTranslation: 'Barangsiapa matanya agak cekung disertai ketajaman pandangan, maka ia adalah seorang pemberani yang meniru tabiat singa.',
      humorDynamics: 'Kadar empedu kuning (Al-Khilth ash-Shafrawi) yang dominan memicu lonjakan energi cepat, ketegasan memimpin, dan keberanian bertindak.'
    },
    fullAnalysisResult: {
      id: 'res-ch-2',
      subjectName: 'Zaid Al-Faris',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'koleris',
      iTidalStatus: "Ghairu Mu'tadil (Condong ke Panas/Kering/Lembap/Dingin)",
      ageStage: 'Remaja',
      mizajScores: { sanguinis: 18, koleris: 56, melankolis: 16, flegmatis: 10 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Dahi bergaris tegas siap bertindak',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Tegas, cepat reaktif, berjiwa pejuang',
          humorEffect: 'Panas-Kering dominan',
          confidence: 94
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Sorot tajam cekung singa',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Singa (Al-Asad)',
          traitIndication: 'Keberanian tanpa ragu, kepemimpinan lapangan',
          humorEffect: 'Empedu kuning berkobar',
          confidence: 97
        }
      ],
      overallSummary: {
        primaryStrengths: ['Keberanian mengambil risiko', 'Ketegasan komando', 'Kecepatan eksekusi target'],
        potentialWeaknesses: ['Mudah tersulut amarah bila dihalangi', 'Kurang sabar mendengarkan detail'],
        naturalInclination: 'Karakter pejuang lapangan dan pelindung yang tangguh di masa krisis.',
        tarjihNote: 'Kaidah Tarjih: Bentuk rahang dan sorot mata menegaskan tabiat Koleris aktif.',
        spiritualAdvice: 'Latihlah menahan amarah dengan berwudhu air dingin dan memperbanyak diam saat emosi.'
      },
      classicalQuote: {
        chapter: 'Bab Tanda-Tanda Keberanian & Panas Jantung',
        arabicText: 'دلت حدة البصر وسعة الصدر على قوة الحرارة والنجدة والشجاعة',
        indonesianTranslation: 'Ketajaman pandangan mata dan kelapangan dada menunjukkan kuatnya panas internal, kesiapan menolong, dan keberanian.',
        context: 'Penetapan korelasi fisik ksatria dalam tradisi fisiognomi Imam Ar-Razi.'
      }
    }
  },
  {
    id: 'ch-melankolis-1',
    name: 'Maryam Al-Hikmah',
    arabicTitle: 'مريم الحكمة • المفكرة الدقيقة',
    ageStage: 'Dewasa Matang (Kuhulah)',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'melankolis',
    iTidalStatus: 'Melankolis Ghalib (Teliti & Mendalam)',
    mizajScores: { sanguinis: 14, koleris: 16, melankolis: 54, flegmatis: 16 },
    observableClues: {
      dahi: 'Dahi tinggi, lapang, dan lurus ke atas mencerminkan ruang memori belakang yang luas.',
      mata: 'Sorot mata fokus mendalam, kelopak mata kokoh menahan tatapan yang menganalisis.',
      hidung: 'Tulang hidung ramping tegas dan teratur.',
      bibir: 'Bibir tipis bergaris cermat, terkatup hati-hati dalam bicara.',
      raut: 'Wajah tirus dengan kontur tulang pipi jelas dan raut perenungan (Tafakkur).'
    },
    pedagogicalReasoning: {
      coreConcept: 'Dahi tinggi lapang berpadu dengan wajah tirus dan sorot mata analitis mendalam menunjukkan dominasi empedu hitam dingin-kering (Melankolis / Saudawi).',
      kitabChapter: 'Kitab Al-Firasat, Pasal Daya Ingat & Ketelitian Nalar',
      arabicQuote: 'من كانت جبهته مرتفعة مستقيمة وعيناه راسختان، فهو قوي الحفظ دقيق النظر',
      quoteTranslation: 'Barangsiapa dahinya tinggi tegak dan kedua matanya menancap tenang, maka ia memiliki daya ingat yang kuat dan pandangan yang teliti.',
      humorDynamics: 'Empedu hitam (Al-Khilth as-Saudawi) yang dingin dan kering memberikan daya tahan konsentrasi tinggi, ketelitian detail, dan kecermatan riset.'
    },
    fullAnalysisResult: {
      id: 'res-ch-3',
      subjectName: 'Maryam Al-Hikmah',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'melankolis',
      iTidalStatus: "Ghairu Mu'tadil (Condong ke Panas/Kering/Lembap/Dingin)",
      ageStage: 'Paruh Baya (Kuhulah)',
      mizajScores: { sanguinis: 14, koleris: 16, melankolis: 54, flegmatis: 16 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Dahi tinggi lurus dengan daya tampung akal luas',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Kekuatan memori prima, daya simpan ilmu mendalam',
          humorEffect: 'Dingin-Kering terpusat',
          confidence: 96
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Sorot mata tajam merenung ke dalam',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Burung Hantu & Elang Peneliti',
          traitIndication: 'Cermat, tidak mudah tertipu tampilan lahir',
          humorEffect: 'Materi empedu hitam tertata',
          confidence: 95
        }
      ],
      overallSummary: {
        primaryStrengths: ['Ketelitian riset tingkat tinggi', 'Daya ingat luar biasa', 'Kehati-hatian dalam mengambil keputusan'],
        potentialWeaknesses: ['Cenderung cemas berlebih', 'Mudah terjebak dalam kerumitan detail'],
        naturalInclination: 'Karakter ilmuwan, analis strategis, dan pengawas mutu yang teliti.',
        tarjihNote: 'Kaidah Tarjih: Bentuk bibir tipis dan dahi tinggi memperkuat deduksi Melankolis.',
        spiritualAdvice: 'Lakukan olahraga teratur dan perbanyak interaksi ramah untuk menghangatkan kekeringan jiwa.'
      },
      classicalQuote: {
        chapter: 'Bab Al-Quwwah al-Hafizhah (Kekuatan Menghafal)',
        arabicText: 'اليبس يحفظ الأشكال، والرطوبة تسهل قبولها، فصاحب اليبس أحفظ',
        indonesianTranslation: 'Keringnya materi menjaga bentuk, sedangkan kelembapan memudahkan penerimaan. Maka pemilik tabiat kering lebih kuat daya ingatnya.',
        context: 'Dalil ilmiah Imam Ar-Razi mengenai keunggulan daya ingat tabiat kering/melankolis.'
      }
    }
  },
  {
    id: 'ch-flegmatis-1',
    name: 'Utsman Al-Halim',
    arabicTitle: 'عثمان الحليم • الصبور السليم',
    ageStage: 'Paruh Baya (Kuhulah)',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'flegmatis',
    iTidalStatus: 'Flegmatis Mu\'tadil (Penyabar & Damai)',
    mizajScores: { sanguinis: 22, koleris: 10, melankolis: 16, flegmatis: 52 },
    observableClues: {
      dahi: 'Dahi bulat mulus dengan transisi lembut tanpa sudut tajam.',
      mata: 'Mata bersorot teduh, kelopak mata agak tebal, gerakan mata tenang santai.',
      hidung: 'Ujung hidung membulat lembut dengan lubang napas yang tenang teratur.',
      bibir: 'Bibir penuh berisi dengan senyum teduh alami yang menenangkan.',
      raut: 'Wajah berisi lembut (Rathb) mencerminkan kestabilan emosi dan sifat pemaaf.'
    },
    pedagogicalReasoning: {
      coreConcept: 'Sorot mata teduh santai yang dipadukan dengan raut muka berisi lembut dan garis bibir bersahabat adalah tanda dominasi lendir dingin-lembap (Flegmatis / Balghami).',
      kitabChapter: 'Kitab Al-Firasat, Pasal Sifat Al-Hilm & Pemaaf',
      arabicQuote: 'من كانت عيناه رطبتين بطيئتي الحركة، فهو حليم صبور سليم الصدر',
      quoteTranslation: 'Barangsiapa kedua matanya lembap dan lambat gerakannya, maka ia adalah orang yang santun, penyabar, dan berlapang dada.',
      humorDynamics: 'Cairan flegma (Al-Khilth al-Balghami) yang dingin dan lembap meredam gejolak amarah, menciptakan keteduhan batin, dan menjaga keharmonisan hubungan.'
    },
    fullAnalysisResult: {
      id: 'res-ch-4',
      subjectName: 'Utsman Al-Halim',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'flegmatis',
      iTidalStatus: "Mu'tadil (Seimbang)",
      ageStage: 'Paruh Baya (Kuhulah)',
      mizajScores: { sanguinis: 22, koleris: 10, melankolis: 16, flegmatis: 52 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Dahi bulat mulus tanpa sudut kaku',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Penyabar, cinta kedamaian, tidak suka perdebatan',
          humorEffect: 'Lembap dingin terkendali',
          confidence: 92
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Sorot mata tenang teduh santai',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Rusa & Lembu Jinak',
          traitIndication: 'Pemaaf, lapang dada, pendengar setia',
          humorEffect: 'Keseimbangan cairan flegma',
          confidence: 94
        }
      ],
      overallSummary: {
        primaryStrengths: ['Kesabaran luar biasa', 'Kecakapan rekonsiliasi dan mediasi', 'Kestabilan emosional dalam tekanan'],
        potentialWeaknesses: ['Terkadang menunda keputusan penting', 'Kurang bersemangat dalam kompetisi keras'],
        naturalInclination: 'Karakter juru damai, pendengar bijak, dan penyejuk dalam organisasi.',
        tarjihNote: 'Kaidah Tarjih: Kelembutan kelopak mata dan keteduhan senyum konsisten dengan tabiat Flegmatis.',
        spiritualAdvice: 'Tetapkan target ibadah dan aktivitas harian yang jelas untuk membangkitkan semangat inisiatif.'
      },
      classicalQuote: {
        chapter: 'Bab Al-Hilm wa ash-Shabr (Kelapangan Dada & Kesabaran)',
        arabicText: 'سكون العين ولين الأطراف يدل على الحلم وسلامة الباطن',
        indonesianTranslation: 'Ketenangan pandangan mata dan kelembutan raut wajah menunjukkan kelapangan dada dan kebersihan batin.',
        context: 'Nasihat Imam Ar-Razi tentang rahasia ketenangan jiwa seorang mukmin sejati.'
      }
    }
  },
  {
    id: 'ch-sanguinis-2',
    name: 'Layla Az-Zahra',
    arabicTitle: 'ليلى الزهراء • الفصيحة المشرقة',
    ageStage: 'Dewasa Muda (Syabab)',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'sanguinis',
    iTidalStatus: "Mu'tadil (Seimbang)",
    mizajScores: { sanguinis: 50, koleris: 20, melankolis: 16, flegmatis: 14 },
    observableClues: {
      dahi: 'Dahi proporsional dengan lengkungan atas yang anggun simetris.',
      mata: 'Mata berbinar ramah, sudut mata tersenyum alami dengan sorot komunikatif.',
      hidung: 'Hidung proporsional elok dan selaras dengan bentuk pipi.',
      bibir: 'Bibir tipis simetris mengalirkan rona senyum fasih.',
      raut: 'Wajah berseri memancarkan kehangatan dan kebaikan budi pekerti.'
    },
    pedagogicalReasoning: {
      coreConcept: 'Ekspresi berseri-seri dengan sorot mata komunikatif yang berpadu dengan dahi simetris mencerminkan dominasi darah murni (Sanguinis / Damawi) yang hangat dan bersahabat.',
      kitabChapter: 'Kitab Al-Firasat, Bab Tutur Kata & Rona Wajah',
      arabicQuote: 'إشراق الوجه وحسن التبسم يدل على كرم النفس ولين الجانب وسرعة الإدراك',
      quoteTranslation: 'Kecemerlangan wajah dan keindahan senyuman menunjukkan kedermawanan jiwa, kelembutan pergaulan, dan kecepatan daya tangkap.',
      humorDynamics: 'Kehangatan dan kelembapan darah (Ad-Dam) menghasilkan watak ramah, mudah bergaul, berjiwa seni, dan pandai mencairkan suasana.'
    },
    fullAnalysisResult: {
      id: 'res-ch-5',
      subjectName: 'Layla Az-Zahra',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'sanguinis',
      iTidalStatus: "Mu'tadil (Seimbang)",
      ageStage: 'Remaja',
      mizajScores: { sanguinis: 50, koleris: 20, melankolis: 16, flegmatis: 14 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Dahi proporsional simetris berseri',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Kecerdasan sosial tinggi, mudah beradaptasi',
          humorEffect: 'Kehangatan alami',
          confidence: 94
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Mata ramah komunikatif berbinar',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Rusa Kencana',
          traitIndication: 'Cepat tanggap, komunikator ulung',
          humorEffect: 'Darah segar beredar lancar',
          confidence: 95
        }
      ],
      overallSummary: {
        primaryStrengths: ['Kemampuan diplomasi dan komunikasi publik', 'Daya tarik interpersonal tinggi', 'Optimisme membangkitkan semangat'],
        potentialWeaknesses: ['Mudah terdistraksi oleh banyak hal baru', 'Perlu konsistensi hingga akhir proyek'],
        naturalInclination: 'Karakter duta, pendidik, dan juru bicara yang menceriakan lingkungan.',
        tarjihNote: 'Kaidah Tarjih: Rona wajah berseri selaras dengan kelancaran artikulasi bibir.',
        spiritualAdvice: 'Fokuskan energi sosial untuk dakwah dan amal kebaikan yang berkesinambungan.'
      },
      classicalQuote: {
        chapter: 'Bab Rona Wajah & Kedermawanan Jiwa',
        arabicText: 'طلاقة الوجه برهان صفاء السريرة ومحبة الخير للناس',
        indonesianTranslation: 'Keceriaan raut wajah adalah bukti kemurnian isi hati dan kecintaan untuk menebar kebaikan kepada sesama.',
        context: 'Prinsip Ar-Razi tentang raut muka yang mencerminkan ketulusan batin.'
      }
    }
  },
  {
    id: 'ch-koleris-2',
    name: 'Tariq Al-Batal',
    arabicTitle: 'طارق البطل • المقدام الحازم',
    ageStage: 'Pemuda (Syabab)',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    dominantMizaj: 'koleris',
    iTidalStatus: 'Koleris Ghalib (Tegas & Aktif)',
    mizajScores: { sanguinis: 15, koleris: 58, melankolis: 17, flegmatis: 10 },
    observableClues: {
      dahi: 'Dahi bergaris tegas mendatar dengan tulang pelipis kokoh.',
      mata: 'Sorot mata menatap lurus tajam tanpa kedip ragu.',
      hidung: 'Batang hidung tegap lurus menonjolkan keberanian fisik.',
      bibir: 'Bibir tegas menutup rapat dengan rahang berkarakter baja.',
      raut: 'Kontur muka tegas bertekstur kencang mencerminkan etos juang tanpa kompromi.'
    },
    pedagogicalReasoning: {
      coreConcept: 'Sorot mata tajam tanpa ragu yang diimbangi tulang pelipis kokoh dan bibir mengatup rapat mencirikan kepemimpinan komando Koleris murni.',
      kitabChapter: 'Kitab Al-Firasat, Pasal Ketegasan & Kekuatan Tindakan',
      arabicQuote: 'ثبوت البصر مع قوة الفك يدل على العزيمة الماضية والشجاعة الفائقة',
      quoteTranslation: 'Kemantapan pandangan mata disertai kekuatan rahang menunjukkan tekad yang membara dan keberanian yang tinggi.',
      humorDynamics: 'Hawa panas kering empedu kuning mendorong pengambilan inisiatif instan saat orang lain ragu-ragu.'
    },
    fullAnalysisResult: {
      id: 'res-ch-6',
      subjectName: 'Tariq Al-Batal',
      timestamp: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
      sourceType: 'sample',
      dominantMizaj: 'koleris',
      iTidalStatus: "Ghairu Mu'tadil (Condong ke Panas/Kering/Lembap/Dingin)",
      ageStage: 'Remaja',
      mizajScores: { sanguinis: 15, koleris: 58, melankolis: 17, flegmatis: 10 },
      features: [
        {
          organ: 'Dahi',
          arabicName: 'الجبهة',
          observation: 'Tulang pelipis kokoh dan dahi tegas',
          kitabRef: 'Pembahasan 3, Pasal 1',
          traitIndication: 'Tekad membaja, pantang mundur',
          humorEffect: 'Panas-Kering dominan',
          confidence: 95
        },
        {
          organ: 'Mata',
          arabicName: 'العين',
          observation: 'Tatapan mantap tanpa ragu',
          kitabRef: 'Pembahasan 3, Pasal 3',
          associatedAnimal: 'Rajawali Perkasa',
          traitIndication: 'Fokus sasaran tinggi, kepemimpinan taktis',
          humorEffect: 'Empedu kuning berkobar',
          confidence: 96
        }
      ],
      overallSummary: {
        primaryStrengths: ['Ketegasan luar biasa', 'Keberanian menghadapi tantangan ekstrem', 'Disiplin tinggi'],
        potentialWeaknesses: ['Sukar menerima kritik bila sedang bersemangat', 'Kecenderungan mendominasi pembicaraan'],
        naturalInclination: 'Karakter komandan, kapten ekspedisi, dan eksekutor misi berat.',
        tarjihNote: 'Kaidah Tarjih: Keserasian rahang kukuh dan tatapan tajam menegaskan watak Koleris.',
        spiritualAdvice: 'Asahlah kelembutan hati dengan banyak berinteraksi dengan anak yatim dan kaum dhuafa.'
      },
      classicalQuote: {
        chapter: 'Bab Keberanian Memimpin',
        arabicText: 'صاحب المرة الصفراء أسرع الناس غضبا وأقواهم إقداما عند الشدائد',
        indonesianTranslation: 'Pemilik empedu kuning adalah manusia paling cepat tergerak jiwanya dan paling kuat keberaniannya saat menghadapi mara bahaya.',
        context: 'Deskripsi tabiat ksatria sejati dalam naskah Al-Firasat.'
      }
    }
  }
];
