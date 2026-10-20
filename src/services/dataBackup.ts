// Local JSON Data Backup & Restore Service for Kitab Al-Firasat
import { SubjectProfile, FirasatAnalysisResult } from '../types/firasat';
import { saveProfile, saveHistory } from './api';
import { indexedDbCache } from './indexedDbCache';

export interface FirasatBackupPackage {
  appName: string;
  version: string;
  exportedAt: string;
  stats: {
    profilesCount: number;
    historyCount: number;
  };
  profiles: SubjectProfile[];
  history: FirasatAnalysisResult[];
}

/**
 * Exports current profiles and history to a downloadable JSON backup file
 */
export function exportBackupToJson(
  profiles: SubjectProfile[],
  history: FirasatAnalysisResult[]
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `backup-kitab-firasat-${timestamp}.json`;

  const backupData: FirasatBackupPackage = {
    appName: 'Kitab Al-Firasat Analysis Studio',
    version: '2.4.0',
    exportedAt: new Date().toISOString(),
    stats: {
      profilesCount: profiles.length,
      historyCount: history.length
    },
    profiles,
    history
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores imported JSON backup data to local database and cache
 */
export async function importBackupFromJson(
  jsonText: string
): Promise<{ success: boolean; profilesCount: number; historyCount: number; message: string }> {
  try {
    const parsed = JSON.parse(jsonText);

    // Validate expected structure
    const rawProfiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
    const rawHistory = Array.isArray(parsed.history) ? parsed.history : [];

    if (rawProfiles.length === 0 && rawHistory.length === 0) {
      throw new Error('Berkas JSON tidak memiliki data profil atau riwayat analisis yang valid.');
    }

    let importedProfiles = 0;
    let importedHistory = 0;

    // Save profiles
    for (const p of rawProfiles) {
      if (p.name) {
        try {
          await saveProfile(p);
          importedProfiles++;
        } catch (e) {
          console.warn('Failed to restore profile:', p.name, e);
        }
      }
    }

    // Save history
    for (const h of rawHistory) {
      if (h.subjectName && h.dominantMizaj) {
        try {
          await saveHistory(h);
          importedHistory++;
        } catch (e) {
          console.warn('Failed to restore history record:', h.subjectName, e);
        }
      }
    }

    // Update local cache
    await indexedDbCache.cacheProfiles(rawProfiles);
    await indexedDbCache.cacheHistory(rawHistory);

    return {
      success: true,
      profilesCount: importedProfiles,
      historyCount: importedHistory,
      message: `Berhasil memulihkan ${importedProfiles} profil dan ${importedHistory} riwayat analisis dari berkas cadangan JSON.`
    };
  } catch (err: any) {
    console.error('Import backup failed:', err);
    return {
      success: false,
      profilesCount: 0,
      historyCount: 0,
      message: err.message || 'Format berkas JSON cadangan tidak valid atau rusak.'
    };
  }
}
