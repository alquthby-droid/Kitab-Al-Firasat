import { FirasatAnalysisResult, SubjectProfile, PeriodicNotification } from '../types/firasat';

export interface StatsOverview {
  totalAnalyses: number;
  totalProfiles: number;
  pendingNotifs: number;
  mizajCounts: Record<string, number>;
}

export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { status: 'offline', hasGeminiKey: false };
  }
}

export async function analyzeFace(payload: {
  imageBase64?: string;
  manualTraits?: Record<string, string>;
  subjectName?: string;
  ageStage?: string;
  scanTarget?: 'face' | 'palm_right' | 'palm_left';
}): Promise<FirasatAnalysisResult> {
  const res = await fetch('/api/analyze-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal memproses analisis wajah');
  }

  return await res.json();
}

export async function getProfiles(): Promise<SubjectProfile[]> {
  const res = await fetch('/api/profiles');
  if (!res.ok) throw new Error('Gagal memuat profil');
  return await res.json();
}

export async function saveProfile(profile: Partial<SubjectProfile>): Promise<SubjectProfile> {
  const res = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error('Gagal menyimpan profil');
  return await res.json();
}

export async function deleteProfile(id: string): Promise<void> {
  const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus profil');
}

export async function getHistory(profileId?: string): Promise<FirasatAnalysisResult[]> {
  const url = profileId ? `/api/history?profileId=${encodeURIComponent(profileId)}` : '/api/history';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat riwayat');
  return await res.json();
}

export async function saveHistory(record: FirasatAnalysisResult): Promise<FirasatAnalysisResult> {
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!res.ok) throw new Error('Gagal menyimpan hasil analisis');
  return await res.json();
}

export async function deleteHistory(id: string): Promise<void> {
  const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus riwayat');
}

export async function getNotifications(): Promise<PeriodicNotification[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Gagal memuat notifikasi');
  return await res.json();
}

export async function scheduleNotification(payload: {
  profileId: string;
  profileName: string;
  days?: number;
  dueDate?: string;
  title?: string;
  message?: string;
}): Promise<PeriodicNotification> {
  const res = await fetch('/api/notifications/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Gagal menjadwalkan pemantauan berkala');
  return await res.json();
}

export async function updateNotificationStatus(id: string, status: 'completed' | 'dismissed'): Promise<PeriodicNotification> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Gagal memperbarui notifikasi');
  return await res.json();
}

export async function getStats(): Promise<StatsOverview> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Gagal memuat statistik');
  return await res.json();
}
