// Google Sheets Integration Service for Al-Firasat AI
// Provides automated export, sheet creation, and synchronization for profiles & analysis records
import { FirasatAnalysisResult, SubjectProfile } from '../types/firasat';

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  exportedProfilesCount: number;
  exportedHistoryCount: number;
}

/**
 * Fetch spreadsheet metadata to get sheet titles and IDs
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca spreadsheet (${res.status})`);
  }
  return res.json();
}

/**
 * Create a new Google Spreadsheet for Al-Firasat AI
 */
export async function createFirasatSpreadsheet(accessToken: string, title?: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string; profileSheetId: number; historySheetId: number }> {
  const sheetTitle = title || `Al-Firasat AI - Basis Data Analisis Karakter (${new Date().toLocaleDateString('id-ID')})`;
  
  const body = {
    properties: {
      title: sheetTitle
    },
    sheets: [
      {
        properties: {
          title: 'Profil Subjek',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: 'Riwayat Analisis Firasat',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat Google Spreadsheet (${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const profileSheetId = data.sheets?.[0]?.properties?.sheetId ?? 0;
  const historySheetId = data.sheets?.[1]?.properties?.sheetId ?? 1;

  // Format header row style with amber/gold styling
  try {
    await applyHeaderStyling(accessToken, spreadsheetId, [profileSheetId, historySheetId]);
  } catch (styleErr) {
    console.warn('Formatting spreadsheet headers non-fatal:', styleErr);
  }

  return { spreadsheetId, spreadsheetUrl, profileSheetId, historySheetId };
}

/**
 * Apply elegant classical amber styling to header rows
 */
async function applyHeaderStyling(accessToken: string, spreadsheetId: string, sheetIds: number[]) {
  const requests = sheetIds.map(sheetId => ({
    repeatCell: {
      range: {
        sheetId: sheetId,
        startRowIndex: 0,
        endRowIndex: 1
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.96, green: 0.82, blue: 0.44 }, // warm amber
          textFormat: {
            bold: true,
            fontSize: 10,
            foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 }
          },
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
    }
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });
}

/**
 * Export Subject Profiles to "Profil Subjek" sheet tab
 */
export async function exportProfilesToSheet(
  accessToken: string,
  spreadsheetId: string,
  profiles: SubjectProfile[],
  sheetTitle: string = 'Profil Subjek'
) {
  const headers = [
    'ID Profil',
    'Nama Subjek',
    'Kategori Relasi',
    'Tahapan Usia',
    'Jumlah Pemindaian',
    'Tanggal Registrasi',
    'Analisis Terakhir',
    'Interval Pantau (Hari)',
    'Jadwal Evaluasi Berikutnya',
    'Catatan Karakter'
  ];

  const rows = profiles.map(p => [
    p.id,
    p.name,
    p.category,
    p.ageStage || 'Paruh Baya (Kuhulah)',
    p.analysisCount || 0,
    p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : '-',
    p.lastAnalysisDate ? new Date(p.lastAnalysisDate).toLocaleDateString('id-ID') : 'Belum Pernah',
    p.monitoringIntervalDays || 14,
    p.nextReviewDate ? new Date(p.nextReviewDate).toLocaleDateString('id-ID') : '-',
    p.notes || ''
  ]);

  const values = [headers, ...rows];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menyimpan data Profil ke Google Sheets (${res.status})`);
  }

  return res.json();
}

/**
 * Export Analysis History to "Riwayat Analisis Firasat" sheet tab
 */
export async function exportHistoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  history: FirasatAnalysisResult[],
  sheetTitle: string = 'Riwayat Analisis Firasat'
) {
  const headers = [
    'ID Analisis',
    'Nama Subjek',
    'Tanggal Pemindaian',
    'Mizaj Dominan',
    'Status Keseimbangan (I\'tidal)',
    'Sanguinis (%)',
    'Koleris (%)',
    'Melankolis (%)',
    'Flegmatis (%)',
    'Ciri Fisik Teramati',
    'Kekuatan Utama',
    'Potensi Kelemahan',
    'Kecenderungan Alami',
    'Nasihat Spiritual & Tazkiyah',
    'Metodologi Kitab Ar-Razi'
  ];

  const rows = history.map(item => {
    const organFeatures = (item.features || [])
      .map(f => `${f.organ} (${f.arabicName}): ${f.observation} -> ${f.traitIndication}`)
      .join('; ');

    const strengths = (item.overallSummary?.primaryStrengths || []).join(', ');
    const weaknesses = (item.overallSummary?.potentialWeaknesses || []).join(', ');

    return [
      item.id,
      item.subjectName,
      item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-',
      item.dominantMizaj?.toUpperCase() || '-',
      item.iTidalStatus || '-',
      item.mizajScores?.sanguinis ?? 0,
      item.mizajScores?.koleris ?? 0,
      item.mizajScores?.melankolis ?? 0,
      item.mizajScores?.flegmatis ?? 0,
      organFeatures,
      strengths,
      weaknesses,
      item.overallSummary?.naturalInclination || '-',
      item.overallSummary?.spiritualAdvice || '-',
      item.overallSummary?.tarjihNote || item.classicalQuote?.indonesianTranslation || '-'
    ];
  });

  const values = [headers, ...rows];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menyimpan data Riwayat Firasat ke Google Sheets (${res.status})`);
  }

  return res.json();
}

/**
 * High-level synchronization: creates or updates a Google Sheet with all data
 */
export async function syncAllToGoogleSheets(
  accessToken: string,
  profiles: SubjectProfile[],
  history: FirasatAnalysisResult[],
  existingSpreadsheetId?: string
): Promise<GoogleSheetsExportResult> {
  let targetId = existingSpreadsheetId?.trim();
  let spreadsheetUrl = '';
  let sheetTitle = 'Al-Firasat AI - Basis Data Karakter';

  if (!targetId) {
    const created = await createFirasatSpreadsheet(accessToken);
    targetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
  } else {
    // Read existing metadata to confirm tab names
    const details = await getSpreadsheetDetails(accessToken, targetId);
    sheetTitle = details.properties?.title || sheetTitle;
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetId}/edit`;
  }

  // Export both datasets
  await exportProfilesToSheet(accessToken, targetId, profiles);
  await exportHistoryToSheet(accessToken, targetId, history);

  return {
    spreadsheetId: targetId,
    spreadsheetUrl,
    title: sheetTitle,
    exportedProfilesCount: profiles.length,
    exportedHistoryCount: history.length
  };
}

/**
 * Extract clean spreadsheet ID from input (either raw ID or full Google Sheets URL)
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export interface AutoSyncSettings {
  enabled: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  lastSyncTimestamp?: string;
}

/**
 * Get Auto-Sync settings from localStorage
 */
export function getAutoSyncSettings(): AutoSyncSettings {
  if (typeof window === 'undefined') {
    return { enabled: false, spreadsheetId: '', spreadsheetUrl: '', spreadsheetTitle: '' };
  }
  try {
    const enabled = localStorage.getItem('alfirasat_sheets_autosync_enabled') === 'true';
    const spreadsheetId = localStorage.getItem('alfirasat_sheets_autosync_id') || '';
    const spreadsheetUrl = localStorage.getItem('alfirasat_sheets_autosync_url') || '';
    const spreadsheetTitle = localStorage.getItem('alfirasat_sheets_autosync_title') || '';
    const lastSyncTimestamp = localStorage.getItem('alfirasat_sheets_autosync_last_time') || undefined;
    return { enabled, spreadsheetId, spreadsheetUrl, spreadsheetTitle, lastSyncTimestamp };
  } catch {
    return { enabled: false, spreadsheetId: '', spreadsheetUrl: '', spreadsheetTitle: '' };
  }
}

/**
 * Save Auto-Sync settings to localStorage
 */
export function saveAutoSyncSettings(settings: Partial<AutoSyncSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof settings.enabled === 'boolean') {
      localStorage.setItem('alfirasat_sheets_autosync_enabled', settings.enabled ? 'true' : 'false');
    }
    if (settings.spreadsheetId !== undefined) {
      localStorage.setItem('alfirasat_sheets_autosync_id', settings.spreadsheetId);
    }
    if (settings.spreadsheetUrl !== undefined) {
      localStorage.setItem('alfirasat_sheets_autosync_url', settings.spreadsheetUrl);
    }
    if (settings.spreadsheetTitle !== undefined) {
      localStorage.setItem('alfirasat_sheets_autosync_title', settings.spreadsheetTitle);
    }
    if (settings.lastSyncTimestamp !== undefined) {
      localStorage.setItem('alfirasat_sheets_autosync_last_time', settings.lastSyncTimestamp);
    }
  } catch (e) {
    console.error('Failed to save auto sync settings:', e);
  }
}

/**
 * Ensure 'Al-Firasat Records' sheet tab exists in target spreadsheet. If not, create it with header styling.
 */
export async function ensureDedicatedRecordsSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = 'Al-Firasat Records'
): Promise<number> {
  const details = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const existingSheet = (details.sheets || []).find(
    (s: any) => (s.properties?.title || '').trim().toLowerCase() === sheetTitle.trim().toLowerCase()
  );

  if (existingSheet && existingSheet.properties?.sheetId !== undefined) {
    return existingSheet.properties.sheetId;
  }

  // Create new sheet tab via batchUpdate
  const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetTitle,
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        }
      ]
    })
  });

  if (!addSheetRes.ok) {
    const err = await addSheetRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat tab lembar '${sheetTitle}' (${addSheetRes.status})`);
  }

  const addSheetData = await addSheetRes.json();
  const newSheetId = addSheetData.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

  // Format header row style with amber/gold styling
  try {
    await applyHeaderStyling(accessToken, spreadsheetId, [newSheetId]);
  } catch (styleErr) {
    console.warn('Formatting dedicated sheet headers non-fatal:', styleErr);
  }

  // Write header row
  const headers = [
    'ID Analisis',
    'Nama Subjek',
    'Waktu Pemindaian',
    'Mizaj Dominan',
    'Status Keseimbangan',
    'Sanguinis (%)',
    'Koleris (%)',
    'Melankolis (%)',
    'Flegmatis (%)',
    'Ciri Fisik Teramati',
    'Kekuatan Utama',
    'Potensi Kelemahan',
    'Kecenderungan Alami',
    'Nasihat Spiritual & Tazkiyah',
    'Kutipan Kitab Ar-Razi'
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1:O1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [headers] })
  });

  return newSheetId;
}

/**
 * Append a single analysis record to the dedicated 'Al-Firasat Records' sheet
 */
export async function appendAnalysisRecordToDedicatedSheet(
  accessToken: string,
  spreadsheetId: string,
  record: FirasatAnalysisResult,
  sheetTitle: string = 'Al-Firasat Records'
): Promise<{ spreadsheetId: string; updatedRange: string }> {
  // Ensure the sheet exists and is formatted
  await ensureDedicatedRecordsSheet(accessToken, spreadsheetId, sheetTitle);

  // Format record row
  const organFeatures = (record.features || [])
    .map(f => `${f.organ} (${f.arabicName || ''}): ${f.observation} -> ${f.traitIndication}`)
    .join('; ');

  const strengths = (record.overallSummary?.primaryStrengths || []).join(', ');
  const weaknesses = (record.overallSummary?.potentialWeaknesses || []).join(', ');

  const row = [
    record.id,
    record.subjectName || 'Subjek Anonim',
    record.timestamp ? new Date(record.timestamp).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
    record.dominantMizaj?.toUpperCase() || 'DAMARWIY',
    record.iTidalStatus || 'Mu\'tadil (Seimbang)',
    record.mizajScores?.sanguinis ?? 0,
    record.mizajScores?.koleris ?? 0,
    record.mizajScores?.melankolis ?? 0,
    record.mizajScores?.flegmatis ?? 0,
    organFeatures,
    strengths,
    weaknesses,
    record.overallSummary?.naturalInclination || '-',
    record.overallSummary?.spiritualAdvice || '-',
    record.overallSummary?.tarjihNote || record.classicalQuote?.indonesianTranslation || '-'
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menambahkan rekaman ke Google Sheets (${res.status})`);
  }

  const data = await res.json();
  const updatedRange = data.updates?.updatedRange || '';

  // Update last sync timestamp
  saveAutoSyncSettings({ lastSyncTimestamp: new Date().toISOString() });

  return { spreadsheetId, updatedRange };
}

export interface SheetImportPreview {
  sheetName: string;
  totalRows: number;
  records: FirasatAnalysisResult[];
  isProfilesSheet: boolean;
  importedProfiles?: SubjectProfile[];
}

/**
 * Fetch and parse data from a chosen sheet tab in Google Sheets
 */
export async function readSpreadsheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<SheetImportPreview> {
  const range = `'${encodeURIComponent(sheetName)}'!A1:Z500`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca isi lembar kerja '${sheetName}' (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    return {
      sheetName,
      totalRows: 0,
      records: [],
      isProfilesSheet: false
    };
  }

  const headerRow: string[] = (rows[0] || []).map((h: any) => String(h).trim().toLowerCase());

  // Check if this sheet is a Profiles sheet or History sheet
  const isProfilesSheet = headerRow.some(h => h.includes('kategori') || h.includes('interval') || h.includes('tahapan usia'));

  if (isProfilesSheet) {
    const nameCol = headerRow.findIndex(h => h.includes('nama'));
    const catCol = headerRow.findIndex(h => h.includes('kategori') || h.includes('relasi'));
    const ageCol = headerRow.findIndex(h => h.includes('usia') || h.includes('tahapan'));
    const notesCol = headerRow.findIndex(h => h.includes('catatan') || h.includes('karakter'));
    const idCol = headerRow.findIndex(h => h.includes('id'));

    const importedProfiles: SubjectProfile[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const name = row[nameCol >= 0 ? nameCol : 1] || `Subjek ${i}`;
      if (!String(name).trim()) continue;

      const profile: SubjectProfile = {
        id: String(row[idCol >= 0 ? idCol : 0] || `prof-imp-${Date.now()}-${i}`).trim(),
        name: String(name).trim(),
        category: (row[catCol >= 0 ? catCol : 2] || 'Lainnya') as any,
        ageStage: (row[ageCol >= 0 ? ageCol : 3] || 'Paruh Baya (Kuhulah)') as any,
        notes: String(row[notesCol >= 0 ? notesCol : 9] || 'Diimpor dari arsip Google Sheets').trim(),
        createdAt: new Date().toISOString(),
        analysisCount: 1,
        monitoringIntervalDays: 14,
        nextReviewDate: new Date(Date.now() + 14 * 86400000).toISOString()
      };
      importedProfiles.push(profile);
    }

    return {
      sheetName,
      totalRows: importedProfiles.length,
      records: [],
      isProfilesSheet: true,
      importedProfiles
    };
  }

  // Parse History / Records
  const idCol = headerRow.findIndex(h => h.includes('id'));
  const nameCol = headerRow.findIndex(h => h.includes('nama') || h.includes('subjek'));
  const dateCol = headerRow.findIndex(h => h.includes('tanggal') || h.includes('waktu') || h.includes('date'));
  const mizajCol = headerRow.findIndex(h => h.includes('mizaj') || h.includes('temperamen'));
  const statusCol = headerRow.findIndex(h => h.includes('i\'tidal') || h.includes('keseimbangan') || h.includes('status'));
  const sangCol = headerRow.findIndex(h => h.includes('sanguinis') || h.includes('darah') || h.includes('damawiy'));
  const cholCol = headerRow.findIndex(h => h.includes('koleris') || h.includes('empedu kuning') || h.includes('safrawiy'));
  const melanCol = headerRow.findIndex(h => h.includes('melankolis') || h.includes('empedu hitam') || h.includes('sawdawiy'));
  const phlegCol = headerRow.findIndex(h => h.includes('flegmatis') || h.includes('dahak') || h.includes('balghamiy'));
  const featCol = headerRow.findIndex(h => h.includes('ciri') || h.includes('fisik') || h.includes('organ'));
  const strengthCol = headerRow.findIndex(h => h.includes('kekuatan') || h.includes('kelebihan'));
  const weakCol = headerRow.findIndex(h => h.includes('kelemahan') || h.includes('potensi'));
  const inclCol = headerRow.findIndex(h => h.includes('kecenderungan') || h.includes('alami'));
  const adviceCol = headerRow.findIndex(h => h.includes('nasihat') || h.includes('tazkiyah') || h.includes('spiritual'));
  const quoteCol = headerRow.findIndex(h => h.includes('kitab') || h.includes('metodologi') || h.includes('ar-razi') || h.includes('kutipan'));

  const parsedRecords: FirasatAnalysisResult[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const subjectName = String(row[nameCol >= 0 ? nameCol : 1] || `Subjek Arsip ${i}`).trim();
    if (!subjectName) continue;

    // Normalize mizaj dominant
    const rawMizaj = String(row[mizajCol >= 0 ? mizajCol : 3] || '').toLowerCase();
    let dominantMizaj: 'sanguinis' | 'koleris' | 'melankolis' | 'flegmatis' = 'sanguinis';
    if (rawMizaj.includes('safrawiy') || rawMizaj.includes('koleris') || rawMizaj.includes('kuning')) dominantMizaj = 'koleris';
    else if (rawMizaj.includes('sawdawiy') || rawMizaj.includes('melankolis') || rawMizaj.includes('hitam')) dominantMizaj = 'melankolis';
    else if (rawMizaj.includes('balghamiy') || rawMizaj.includes('flegmatis') || rawMizaj.includes('dahak')) dominantMizaj = 'flegmatis';
    else dominantMizaj = 'sanguinis';

    // Parse scores
    const sang = Number(row[sangCol >= 0 ? sangCol : 5]) || 35;
    const chol = Number(row[cholCol >= 0 ? cholCol : 6]) || 25;
    const melan = Number(row[melanCol >= 0 ? melanCol : 7]) || 20;
    const phleg = Number(row[phlegCol >= 0 ? phlegCol : 8]) || 20;

    // Parse features string
    const featStr = String(row[featCol >= 0 ? featCol : 9] || '');
    const featuresList = featStr.split(';').map(f => f.trim()).filter(Boolean);
    const parsedFeatures = featuresList.length > 0 ? featuresList.map((fItem, fIdx) => {
      const parts = fItem.split('->');
      const organPart = parts[0]?.split(':') || [];
      const organ = organPart[0]?.trim() || `Organ ${fIdx + 1}`;
      const observation = organPart[1]?.trim() || fItem;
      const traitIndication = parts[1]?.trim() || 'Karakteristik khas naskah Al-Firasat';
      return {
        organ,
        arabicName: 'عضو',
        observation,
        kitabRef: 'Bab Pembahasan Fisiognomi Imam Fakhruddin Ar-Razi',
        traitIndication,
        humorEffect: 'Keseimbangan Unsur Humoral',
        confidence: 90
      };
    }) : [
      {
        organ: 'Raut Wajah Menyeluruh',
        arabicName: 'الوجه',
        observation: 'Proporsi geometris wajah dan ekspresi terarsip dari lembar kerja Google Sheets',
        kitabRef: 'Naskah Al-Firasat Ar-Razi',
        traitIndication: 'Karakter selaras dengan catatan historis',
        humorEffect: 'Keseimbangan Unsur Humoral',
        confidence: 92
      }
    ];

    const rawStrengths = String(row[strengthCol >= 0 ? strengthCol : 10] || '');
    const primaryStrengths = rawStrengths ? rawStrengths.split(',').map(s => s.trim()).filter(Boolean) : ['Integritas tinggi', 'Kematangan akal budi'];

    const rawWeaknesses = String(row[weakCol >= 0 ? weakCol : 11] || '');
    const potentialWeaknesses = rawWeaknesses ? rawWeaknesses.split(',').map(s => s.trim()).filter(Boolean) : ['Waspada terhadap fluktuasi emosi'];

    const naturalInclination = String(row[inclCol >= 0 ? inclCol : 12] || 'Karakter seimbang yang mencerminkan tabiat bawaan.');
    const spiritualAdvice = String(row[adviceCol >= 0 ? adviceCol : 13] || 'Jaga zikir, tafakkur, dan adab muamalah.');
    const quoteNote = String(row[quoteCol >= 0 ? quoteCol : 14] || 'Istidlal bil-ahwal azh-zhahirah alal-ahwal al-bathinah.');

    const recId = String(row[idCol >= 0 ? idCol : 0] || `hist-imp-${Date.now()}-${i}`).trim();
    const rawDate = row[dateCol >= 0 ? dateCol : 2];
    let timestamp = new Date().toISOString();
    if (rawDate) {
      const parsedD = new Date(rawDate);
      if (!isNaN(parsedD.getTime())) timestamp = parsedD.toISOString();
    }

    const rawStatus = String(row[statusCol >= 0 ? statusCol : 4] || '');
    const iTidalStatus: 'Mu\'tadil (Seimbang)' | 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)' = 
      rawStatus.toLowerCase().includes('ghairu') 
        ? 'Ghairu Mu\'tadil (Condong ke Panas/Kering/Lembap/Dingin)' 
        : 'Mu\'tadil (Seimbang)';

    parsedRecords.push({
      id: recId,
      subjectName,
      timestamp,
      sourceType: 'sample',
      dominantMizaj,
      iTidalStatus,
      mizajScores: {
        sanguinis: sang,
        koleris: chol,
        melankolis: melan,
        flegmatis: phleg
      },
      features: parsedFeatures,
      overallSummary: {
        primaryStrengths,
        potentialWeaknesses,
        naturalInclination,
        tarjihNote: quoteNote,
        spiritualAdvice
      },
      classicalQuote: {
        chapter: 'Arsip Firasat Historis Google Sheets',
        arabicText: 'إن كان حسن الشكل كان معتدل المزاج فصاحبه نبيل النفس',
        indonesianTranslation: quoteNote,
        context: 'Diimpor dari arsip Google Sheets pengguna.'
      }
    });
  }

  return {
    sheetName,
    totalRows: parsedRecords.length,
    records: parsedRecords,
    isProfilesSheet: false
  };
}

