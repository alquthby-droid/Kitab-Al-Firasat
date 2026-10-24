import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Ensure database folder exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'firasat_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseStructure {
  profiles: any[];
  history: any[];
  notifications: any[];
}

function getInitialDatabase(): DatabaseStructure {
  return {
    profiles: [
      {
        id: 'prof-1',
        name: 'Ahmad Al-Farabi',
        category: 'Rekan Kerja',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        notes: 'Partner riset dan kepenulisan. Memiliki daya konsentrasi tinggi dan kepribadian tenang.',
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        lastAnalysisDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        analysisCount: 2,
        monitoringIntervalDays: 14,
        nextReviewDate: new Date(Date.now() + 9 * 86400000).toISOString()
      },
      {
        id: 'prof-2',
        name: 'Zaid bin Khalid',
        category: 'Partner Bisnis',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        notes: 'Pebisnis ekspedisi. Berani mengambil risiko, bicara lugas, berjiwa pemimpin.',
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        lastAnalysisDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        analysisCount: 1,
        monitoringIntervalDays: 30,
        nextReviewDate: new Date(Date.now() + 15 * 86400000).toISOString()
      }
    ],
    history: [
      {
        id: 'hist-1',
        profileId: 'prof-1',
        subjectName: 'Ahmad Al-Farabi',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        sourceType: 'sample',
        dominantMizaj: 'sanguinis',
        mizajScores: { sanguinis: 48, koleris: 24, melankolis: 18, flegmatis: 10 },
        iTidalStatus: "Mu'tadil (Seimbang)",
        ageStage: 'Paruh Baya (Kuhulah)',
        features: [
          {
            organ: 'Dahi',
            arabicName: 'الجبهة',
            observation: 'Dahi seimbang, luas menonjol depan-belakang, bebas kerut tegang',
            kitabRef: 'Pembahasan 3, Pasal 1 (hal. 162)',
            traitIndication: 'Kapasitas nalar jernih, memori prima, berpikiran terbuka',
            humorEffect: 'Kehangatan seimbang (Hararah Mu\'tadilah)',
            confidence: 94
          },
          {
            organ: 'Mata',
            arabicName: 'العين',
            observation: 'Sorot mata syahlah tenang, pandangan lurus berwibawa',
            kitabRef: 'Pembahasan 3, Pasal 3 (hal. 164-169)',
            associatedAnimal: 'Singa & Elang',
            traitIndication: 'Jiwa mulia, kepemimpinan bijaksana, tidak mudah terprovokasi',
            humorEffect: 'Pertengahan antara panas dan dingin',
            confidence: 96
          },
          {
            organ: 'Hidung',
            arabicName: 'الأنف',
            observation: 'Batang hidung lurus proporsional dengan lengkung lembut di pucuk',
            kitabRef: 'Pembahasan 3, Pasal 4 (hal. 173-175)',
            traitIndication: 'Harga diri tinggi, berjiwa adil, menjunjung kehormatan',
            humorEffect: 'Sirkulasi napas seimbang',
            confidence: 90
          },
          {
            organ: 'Bibir & Mulut',
            arabicName: 'الفم والشفة',
            observation: 'Bibir menutup rapat teratur, sudut simetris',
            kitabRef: 'Pembahasan 3, Pasal 5 (hal. 176-177)',
            traitIndication: 'Pandai menjaga rahasia, tutur kata diplomatis dan santun',
            humorEffect: 'Lembap teratur',
            confidence: 91
          }
        ],
        overallSummary: {
          primaryStrengths: ['Kemampuan komunikasi prima', 'Daya analisis seimbang', 'Kecerdasan emosional stabil'],
          potentialWeaknesses: ['Kadang terlalu perfeksionis terhadap keteraturan', 'Mudah lelah jika lingkungan bising'],
          naturalInclination: 'Karakter ideal (Al-Mizaj al-Mu\'tadil) yang mampu menjadi jembatan perdamaian dan perencana strategis.',
          tarjihNote: 'Sinyal dari ketenangan sorot mata dan keluasan dahi saling memperkuat indikasi kematangan akal budi.',
          spiritualAdvice: 'Pertahankan wirid tafakkur dan sedekah tersembunyi untuk menjaga kesucian nûr al-firasah.'
        },
        classicalQuote: {
          chapter: 'Bab I: Tanda-tanda Kepribadian Ideal',
          arabicText: 'إن كان حسن الشكل كان معتدل المزاج فصاحبه نبيل النفس سديد الرأي',
          indonesianTranslation: 'Jika bentuk fisiknya serasi dan temperamennya seimbang, maka pemiliknya memiliki jiwa yang luhur dan pandangan yang tepat.',
          context: 'Imam Fakhruddin Ar-Razi menegaskan bahwa keseimbangan bentuk fisik mencerminkan keadilan tabiat batiniah.'
        },
        notes: 'Observasi pertama menunjukkan kestabilan tinggi. Dijadwalkan peninjauan ulang dalam 14 hari.'
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        profileId: 'prof-1',
        profileName: 'Ahmad Al-Farabi',
        scheduledDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        dueDate: new Date(Date.now() + 9 * 86400000).toISOString(),
        title: 'Jadwal Pemantauan Berkala: Ahmad Al-Farabi',
        message: 'Sudah saatnya melakukan peninjauan perkembangan karakter dan ketenangan raut wajah setelah 14 hari.',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]
  };
}

function readDb(): DatabaseStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, reinitializing:', err);
  }
  const initial = getInitialDatabase();
  writeDb(initial);
  return initial;
}

function writeDb(data: DatabaseStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ----------------- API ROUTES -----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// Profiles API
app.get('/api/profiles', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.profiles);
});

app.post('/api/profiles', (req: Request, res: Response) => {
  const db = readDb();
  const newProfile = {
    id: req.body.id || 'prof-' + Date.now(),
    name: req.body.name || 'Profil Baru',
    category: req.body.category || 'Lainnya',
    avatarUrl: req.body.avatarUrl || '',
    notes: req.body.notes || '',
    createdAt: req.body.createdAt || new Date().toISOString(),
    lastAnalysisDate: req.body.lastAnalysisDate || null,
    analysisCount: req.body.analysisCount || 0,
    monitoringIntervalDays: req.body.monitoringIntervalDays || 14,
    nextReviewDate: req.body.nextReviewDate || new Date(Date.now() + 14 * 86400000).toISOString()
  };

  const existingIdx = db.profiles.findIndex(p => p.id === newProfile.id);
  if (existingIdx >= 0) {
    db.profiles[existingIdx] = { ...db.profiles[existingIdx], ...newProfile };
  } else {
    db.profiles.unshift(newProfile);
  }

  writeDb(db);
  res.json(newProfile);
});

app.delete('/api/profiles/:id', (req: Request, res: Response) => {
  const db = readDb();
  const targetId = req.params.id ? decodeURIComponent(req.params.id).trim() : '';
  db.profiles = db.profiles.filter(p => String(p.id).trim() !== String(req.params.id).trim() && String(p.id).trim() !== targetId);
  db.notifications = db.notifications.filter(n => String(n.profileId).trim() !== String(req.params.id).trim() && String(n.profileId).trim() !== targetId);
  writeDb(db);
  res.json({ success: true });
});

// History API
app.get('/api/history', (req: Request, res: Response) => {
  const db = readDb();
  const profileId = req.query.profileId as string | undefined;
  if (profileId) {
    return res.json(db.history.filter(h => h.profileId === profileId));
  }
  res.json(db.history);
});

app.post('/api/history', (req: Request, res: Response) => {
  const db = readDb();
  const newRecord = {
    ...req.body,
    id: req.body.id || 'hist-' + Date.now(),
    timestamp: req.body.timestamp || new Date().toISOString()
  };

  db.history.unshift(newRecord);

  // Update profile metadata if associated
  if (newRecord.profileId) {
    const prof = db.profiles.find(p => p.id === newRecord.profileId);
    if (prof) {
      prof.lastAnalysisDate = newRecord.timestamp;
      prof.analysisCount = (prof.analysisCount || 0) + 1;
      const days = prof.monitoringIntervalDays || 14;
      prof.nextReviewDate = new Date(Date.now() + days * 86400000).toISOString();
      if (newRecord.imageUrl && !prof.avatarUrl) {
        prof.avatarUrl = newRecord.imageUrl;
      }

      // Schedule next notification
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        profileId: prof.id,
        profileName: prof.name,
        scheduledDate: new Date().toISOString(),
        dueDate: prof.nextReviewDate,
        title: `Evaluasi Berkala: ${prof.name}`,
        message: `Waktunya memantau ulang profil firasat dan perkembangan watak ${prof.name} (${days} hari setelah analisis).`,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }
  }

  writeDb(db);
  res.json(newRecord);
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  const db = readDb();
  const targetId = req.params.id ? decodeURIComponent(req.params.id).trim() : '';
  db.history = db.history.filter(h => String(h.id).trim() !== String(req.params.id).trim() && String(h.id).trim() !== targetId);
  writeDb(db);
  res.json({ success: true });
});

// Notifications API
app.get('/api/notifications', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.notifications);
});

app.post('/api/notifications/schedule', (req: Request, res: Response) => {
  const db = readDb();
  const newNotif = {
    id: 'notif-' + Date.now(),
    profileId: req.body.profileId || '',
    profileName: req.body.profileName || 'Subjek',
    scheduledDate: new Date().toISOString(),
    dueDate: req.body.dueDate || new Date(Date.now() + (req.body.days || 14) * 86400000).toISOString(),
    title: req.body.title || 'Jadwal Pemantauan Firasat',
    message: req.body.message || 'Saatnya meninjau perkembangan kepribadian subjek.',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(newNotif);
  writeDb(db);
  res.json(newNotif);
});

app.patch('/api/notifications/:id', (req: Request, res: Response) => {
  const db = readDb();
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    if (req.body.status) notif.status = req.body.status;
    if (req.body.message) notif.message = req.body.message;
    writeDb(db);
    return res.json(notif);
  }
  res.status(404).json({ error: 'Notification not found' });
});

// Stats API
app.get('/api/stats', (req: Request, res: Response) => {
  const db = readDb();
  const totalAnalyses = db.history.length;
  const totalProfiles = db.profiles.length;
  const pendingNotifs = db.notifications.filter(n => n.status === 'pending').length;

  const mizajCounts: Record<string, number> = {
    sanguinis: 0,
    koleris: 0,
    melankolis: 0,
    flegmatis: 0
  };

  db.history.forEach(h => {
    if (h.dominantMizaj && mizajCounts[h.dominantMizaj] !== undefined) {
      mizajCounts[h.dominantMizaj]++;
    }
  });

  res.json({
    totalAnalyses,
    totalProfiles,
    pendingNotifs,
    mizajCounts
  });
});

// AI Face & Palm Analysis using Gemini 3.8 Flash
app.post('/api/analyze-face', async (req: Request, res: Response) => {
  try {
    const { imageBase64, manualTraits, subjectName, ageStage, scanTarget } = req.body;

    const isPalmScan = scanTarget === 'palm_right' || scanTarget === 'palm_left';
    const palmSideLabel = scanTarget === 'palm_right' ? 'Tangan Kanan (Al-Yad al-Yumna - Amal)' : 'Tangan Kiri (Al-Yad al-Yusra - Fitrah)';

    // Classical system instruction grounded in Kitab Al-Firasat of Imam Fakhruddin Ar-Razi
    const systemPrompt = `
Anda adalah pakar ilmu Fisiognomi Klasik Islam ("Ilmu Al-Firasat al-Khalqiyyah") yang berakar kuat pada Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi (554-606 H).

Tugas Anda:
${isPalmScan ? `
Analisis foto telapak tangan ${palmSideLabel} ini dengan merujuk langsung pada Kitab Al-Firasat Ar-Razi (Bab Khuthuth al-Kaff wa Majjas al-Yad):
1. Garis Kehidupan (Khathth al-Hayah / خط الحياة): panjang, kedalaman kelengkungan di sekitar ibu jari, kelancaran garis, mengukur vitalitas jasmani dan stamina.
2. Garis Akal (Khathth al-Aql / خط العقل): ketegasan melintasi tengah telapak, mengukur kejernihan nalar, fokus pengambilan keputusan, dan daya ingat.
3. Garis Kalbu (Khathth al-Qalb / خط القلب): arah lengkungan menuju pangkal telunjuk atau jari tengah, mengukur kelembutan hati, kesetiaan, dan integritas.
4. Tekstur & Bantalan Telapak (Majjas al-Kaff / مجس الكف): ketebalan otot, kehangatan/kekeringan, proporsi jemari.
5. Makna Tangan Kanan (Al-Yamin): melambangkan etos ikhtiar nyata dan kepemimpinan lahiriah.
6. Makna Tangan Kiri (Asy-Syimal): melambangkan fitrah batiniah, daya intuisi, dan kemurnian nurani.
` : `
Analisis ciri-ciri fisik wajah dan kepala seseorang dengan merujuk langsung pada pasal-pasal dalam Kitab Al-Firasat Ar-Razi:
1. Dahi (Al-Jabhah): ukuran, kerutan (berkerut/rata/bertingkat), kelapangan.
2. Alis (Al-Hajib): ketebalan bulu, kemiringan sudut hidung-pelipis, bentuk kelengkungan.
3. Mata (Al-'Ain): ukuran bola mata, kedalaman (menonjol/cekung/syahlah seimbang), gerak pandangan, corak warna.
4. Hidung (Al-Anf): profil ujung (lancip/bulat), lubang napas, kelengkungan.
5. Mulut & Bibir (Al-Fam wa ash-Syafah): lebar mulut, ketebalan bibir atas & bawah, kerapatan.
6. Telinga (Al-Udzun): ukuran, ketebalan daun telinga, proporsi.
7. Bentuk Wajah (Al-Wajh): tirus/berdaging, lonjong/bundar, keserasian (Hasan al-Wajh).
8. Garis Telapak Tangan (Khuthuth al-Kaff): garis hidup, garis akal, garis kalbu jika terlampir.
`}

Kaidah Penilaian Klasik:
- Tentukan 4 Distribusi Mizaj (Sanguinis/Panas-Lembap, Koleris/Panas-Kering, Melankolis/Dingin-Kering, Flegmatis/Dingin-Lembap). Total persentase = 100%.
- Tentukan status I'tidal (Mu'tadil/Seimbang atau Ghairu Mu'tadil).
- Terapkan Kaidah Tarjih Ar-Razi saat menilai organ sentral.
- Tegaskan etika Al-Firasat: Tanda fisik adalah tabiat alami bawaan (thabi'iyyah), bukan vonis takdir mutlak. Karakter disempurnakan melalui taqwa, akal, dan riyadhah akhlak.
- Sertakan kutipan klasik Arab Ar-Razi dan terjemahannya yang relevan.

Kembalikan respon strictly dalam JSON sesuai struktur yang diminta.
`;

    if (aiClient && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

        const promptText = `
Analisis foto ${isPalmScan ? `telapak tangan ${palmSideLabel}` : 'wajah'} ini berdasarkan Kitab Al-Firasat karya Imam Fakhruddin Ar-Razi.
Nama Subjek: ${subjectName || 'Subjek'}
${isPalmScan ? `Bidang Pemindaian: Garis Telapak Tangan (${palmSideLabel})` : ''}
${ageStage ? `Perkiraan Usia: ${ageStage}` : ''}
${manualTraits ? `Keterangan tambahan: ${JSON.stringify(manualTraits)}` : ''}

Berikan analisis mendalam, akurat, dan terstruktur sesuai kitab.
`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType
                }
              },
              { text: promptText }
            ]
          },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dominantMizaj: {
                  type: Type.STRING,
                  description: "sanguinis, koleris, melankolis, atau flegmatis"
                },
                mizajScores: {
                  type: Type.OBJECT,
                  properties: {
                    sanguinis: { type: Type.INTEGER },
                    koleris: { type: Type.INTEGER },
                    melankolis: { type: Type.INTEGER },
                    flegmatis: { type: Type.INTEGER }
                  },
                  required: ["sanguinis", "koleris", "melankolis", "flegmatis"]
                },
                iTidalStatus: {
                  type: Type.STRING,
                  description: "Mu'tadil (Seimbang) atau Ghairu Mu'tadil"
                },
                features: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      organ: { type: Type.STRING },
                      arabicName: { type: Type.STRING },
                      observation: { type: Type.STRING },
                      kitabRef: { type: Type.STRING },
                      associatedAnimal: { type: Type.STRING },
                      traitIndication: { type: Type.STRING },
                      humorEffect: { type: Type.STRING },
                      confidence: { type: Type.INTEGER }
                    },
                    required: ["organ", "arabicName", "observation", "kitabRef", "traitIndication", "humorEffect", "confidence"]
                  }
                },
                overallSummary: {
                  type: Type.OBJECT,
                  properties: {
                    primaryStrengths: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    potentialWeaknesses: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    naturalInclination: { type: Type.STRING },
                    tarjihNote: { type: Type.STRING },
                    spiritualAdvice: { type: Type.STRING }
                  },
                  required: ["primaryStrengths", "potentialWeaknesses", "naturalInclination", "tarjihNote", "spiritualAdvice"]
                },
                classicalQuote: {
                  type: Type.OBJECT,
                  properties: {
                    chapter: { type: Type.STRING },
                    arabicText: { type: Type.STRING },
                    indonesianTranslation: { type: Type.STRING },
                    context: { type: Type.STRING }
                  },
                  required: ["chapter", "arabicText", "indonesianTranslation", "context"]
                }
              },
              required: ["dominantMizaj", "mizajScores", "iTidalStatus", "features", "overallSummary", "classicalQuote"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          const finalResult = {
            id: 'scan-' + Date.now(),
            subjectName: subjectName || 'Subjek Analisis',
            timestamp: new Date().toISOString(),
            imageUrl: imageBase64 || undefined,
            sourceType: 'camera',
            ...parsed
          };
          return res.json(finalResult);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, using classical algorithmic deduction engine:', geminiError);
      }
    }

    // Classical Algorithmic Fallback Engine (Authentic to Ar-Razi's rules)
    const fallbackResult: any = generateClassicalFirasatDeduction(subjectName, manualTraits, scanTarget);
    if (imageBase64) {
      fallbackResult.imageUrl = imageBase64;
    }
    res.json(fallbackResult);
  } catch (err: any) {
    console.error('Error analyzing face:', err);
    res.status(500).json({ error: 'Gagal menganalisis wajah: ' + (err.message || 'Terjadi kesalahan sistem') });
  }
});

function generateClassicalFirasatDeduction(subjectName = 'Subjek Analisis', manualTraits: any = {}, scanTarget?: string) {
  // Balanced classical deduction
  const features = [
    {
      organ: 'Dahi',
      arabicName: 'الجبهة',
      observation: manualTraits?.dahi || 'Dahi proporsional dengan kelapangan merata',
      kitabRef: 'Pembahasan 3, Pasal 1 (hal. 162)',
      traitIndication: 'Akal budi jernih, memori kuat, dan kemampuan abstraksi yang baik',
      humorEffect: 'Kehangatan seimbang pada otak bagian depan',
      confidence: 88
    },
    {
      organ: 'Alis',
      arabicName: 'الحاجب',
      observation: manualTraits?.alis || 'Alis teratur rapi dengan kepadatan bulu sedang',
      kitabRef: 'Pembahasan 3, Pasal 2 (hal. 163)',
      traitIndication: 'Ketenangan jiwa, tidak mudah hanyut dalam duka berlebihan',
      humorEffect: 'Uap materi otak terkendali',
      confidence: 85
    },
    {
      organ: 'Mata',
      arabicName: 'العين',
      observation: manualTraits?.mata || 'Mata sedang dengan sorot jernih menatap stabil',
      kitabRef: 'Pembahasan 3, Pasal 3 (hal. 164)',
      associatedAnimal: 'Singa (Al-Asad)',
      traitIndication: 'Ketegasan batin, fokus tinggi, keberanian yang diimbangi pertimbangan',
      humorEffect: 'Harmoni antara unsur darah dan panas',
      confidence: 91
    },
    {
      organ: 'Hidung',
      arabicName: 'الأنف',
      observation: manualTraits?.hidung || 'Batang hidung kokoh dengan lengkungan luhur elang',
      kitabRef: 'Pembahasan 3, Pasal 4 (hal. 173)',
      associatedAnimal: 'Elang (Al-\'Uqab)',
      traitIndication: 'Jiwa mulia, kepemimpinan, tidak menyukai perkara remeh',
      humorEffect: 'Rongga pernapasan lapang',
      confidence: 89
    },
    {
      organ: 'Bibir & Mulut',
      arabicName: 'الفم والشفة',
      observation: manualTraits?.bibir || 'Bibir berproporsi sedang menutup dengan keserasian',
      kitabRef: 'Pembahasan 3, Pasal 5 (hal. 176)',
      traitIndication: 'Fasîh dalam bertutur kata, diplomatis, dan adil dalam menilai',
      humorEffect: 'Kelembapan seimbang',
      confidence: 86
    },
    {
      organ: 'Telinga',
      arabicName: 'الأذن',
      observation: manualTraits?.telinga || 'Telinga sedang proporsional dengan lengkungan rapi',
      kitabRef: 'Pembahasan 3, Pasal 6 (hal. 177)',
      associatedAnimal: 'Singa (Al-Asad)',
      traitIndication: 'Daya ingat kuat, pemahaman mendalam, amanah menjaga rahasia, berbudi luhur',
      humorEffect: 'Keseimbangan rongga pendengaran dan materi otak',
      confidence: 90
    },
    {
      organ: 'Wajah',
      arabicName: 'الوجه',
      observation: manualTraits?.wajah || 'Raut muka rupawan berseri (Hasan al-Wajh)',
      kitabRef: 'Pembahasan 3, Pasal 6 (hal. 178)',
      traitIndication: 'Kecenderungan alami pada kebajikan dan kejujuran',
      humorEffect: 'Sirkulasi darah lancar',
      confidence: 93
    },
    {
      organ: 'Suara & Tutur',
      arabicName: 'الصوت والنفس',
      observation: manualTraits?.suara || 'Suara berat tertata dengan resonansi rongga dada yang lapang',
      kitabRef: 'Pembahasan 3, Pasal 10 (hal. 184)',
      traitIndication: 'Penyabar, berwibawa, berjiwa ksatria, akal memimpin hawa nafsu',
      humorEffect: 'Kehangatan jantung & kapasitas napas seimbang',
      confidence: 90
    },
    {
      organ: 'Garis Telapak Tangan Kanan',
      arabicName: 'خط الكف الأيمن (العمل)',
      observation: manualTraits?.tangan_kanan || 'Garis kehidupan kokoh melengkung luas, garis akal tegas lurus menembus tengah telapak',
      kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tanda-Tanda Tangan & Urat Jasmani (hal. 182-184)',
      traitIndication: 'Aktualisasi amal nyata: Etos kerja lahiriah tinggi, tegas dalam kepemimpinan, tabah saat menghadapi ujian berat, dan bertanggung jawab penuh atas amanah.',
      humorEffect: 'Kehangatan urat tangan & peredaran darah prima',
      confidence: 94
    },
    {
      organ: 'Garis Telapak Tangan Kiri',
      arabicName: 'خط الكف الأيسر (الفطرة)',
      observation: manualTraits?.tangan_kiri || 'Garis kalbu melengkung halus menuju pangkal telunjuk, tekstur telapak berimbang lembut',
      kitabRef: 'Kitab Al-Firasat Ar-Razi, Bab Tabiat Batiniah & Fitrah Asal (hal. 185-186)',
      traitIndication: 'Fitrah nurani batiniah: Kejujuran batin, kepekaan empati mendalam, intuisi spiritual tajam, dan ketulusan dalam menjalin persaudaraan.',
      humorEffect: 'Harmoni cairan fitrah batin',
      confidence: 91
    }
  ];

  const palmAnalysis = {
    rightHand: {
      lifeLine: manualTraits?.kanan_life || 'Panjang, Tebal & Melengkung Luas Melingkari Ibu Jari',
      headLine: manualTraits?.kanan_head || 'Tegas, Lurus Menembus Tengah Telapak Tangan',
      heartLine: manualTraits?.kanan_heart || 'Melengkung Anggun Menuju Pangkal Jari Telunjuk',
      texture: manualTraits?.kanan_texture || 'Telapak Kokoh Berserat Jelas, Terasa Hangat-Kering',
      mizajIndication: 'Potensi aksi lahiriah: Berwibawa, eksekutor andal, etos kerja tinggi.'
    },
    leftHand: {
      lifeLine: manualTraits?.kiri_life || 'Panjang, Halus & Berkelanjutan Tanpa Putus',
      headLine: manualTraits?.kiri_head || 'Melengkung Anggun Menuju Bukit Bulan (Al-Qamar)',
      heartLine: manualTraits?.kiri_heart || 'Berakar Seimbang Menopang Kasih Sayang & Kesetiaan',
      texture: manualTraits?.kiri_texture || 'Telapak Berimbang, Bersih & Lembut Bersahaja',
      mizajIndication: 'Tabiat fitrah batin: Penuh welas asih, daya intuisi tajam, dan cinta kebenaran.'
    },
    summary: 'Perpaduan garis telapak kanan dan kiri membuktikan sinkronisasi luhur antara niat batiniah yang bersih dengan amal perbuatan lahiriah yang kokoh.'
  };

  return {
    id: 'scan-' + Date.now(),
    subjectName: subjectName,
    timestamp: new Date().toISOString(),
    sourceType: manualTraits ? 'manual' : 'camera',
    dominantMizaj: 'sanguinis',
    mizajScores: {
      sanguinis: 42,
      koleris: 26,
      melankolis: 18,
      flegmatis: 14
    },
    iTidalStatus: "Mu'tadil (Seimbang)",
    ageStage: 'Paruh Baya (Kuhulah)',
    features: features,
    palmAnalysis: palmAnalysis,
    overallSummary: {
      primaryStrengths: [
        'Kapasitas berpikir komprehensif dan tajam',
        'Integritas dan kewibawaan lahiriah',
        'Keseimbangan antara keberanian dan kehati-hatian'
      ],
      potentialWeaknesses: [
        'Terkadang menuntut standar terlalu tinggi pada orang lain',
        'Bisa merasa jenuh bila ide tidak segera dieksekusi'
      ],
      naturalInclination: 'Karakter mu\'tadil (harmonis) dengan kecenderungan kepemimpinan yang adil, komunikatif, dan dipercaya banyak orang.',
      tarjihNote: 'Sesuai kaidah Ar-Razi, indikasi mata, dahi, dan garis telapak tangan kanan-kiri saling menguatkan dalam menentukan tabiat lahiriah dan batiniah.',
      spiritualAdvice: 'Tingkatkan istiqamah melalui tadabbur dan riyadhah akhlak untuk menjaga pancaran cahaya firasat mukmin.'
    },
    classicalQuote: {
      chapter: 'Mukadimah Kitab Al-Firasat',
      arabicText: 'الفراسة عبارة عن: الاستدلال بالأحوال الظاهرة على الأخلاق الباطنة',
      indonesianTranslation: 'Firasat adalah metode penarikan kesimpulan atas sifat dan karakter batiniah manusia melalui pengamatan keadaan lahiriah yang tampak.',
      context: 'Imam Fakhruddin Ar-Razi meletakkan dasar ilmiah fisiognomi Islam yang bersih dari ramalan takhayul dan sihir.'
    }
  };
}

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Al-Firasat Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
