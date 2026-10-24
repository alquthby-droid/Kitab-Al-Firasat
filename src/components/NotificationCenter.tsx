import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react';
import { PeriodicNotification, SubjectProfile } from '../types/firasat';
import { scheduleNotification, updateNotificationStatus } from '../services/api';
import { sound } from '../services/sound';

interface NotificationCenterProps {
  notifications: PeriodicNotification[];
  profiles: SubjectProfile[];
  onRefreshData: () => void;
  onNavigateToScanProfile: (profile: SubjectProfile) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  profiles,
  onRefreshData,
  onNavigateToScanProfile
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || 'manual');
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [intervalDays, setIntervalDays] = useState<number>(14);
  const [customNote, setCustomNote] = useState<string>('Evaluasi berkala kestabilan karakter dan ketenangan raut wajah.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestBrowserNotification = async () => {
    sound.playClick();
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        let perm: NotificationPermission = 'default';
        try {
          perm = await Notification.requestPermission();
          setNotificationPermission(perm);
        } catch (permErr) {
          console.warn('Notification permission request restricted in iframe:', permErr);
          setNotificationPermission('denied');
        }

        if (perm === 'granted') {
          setPermissionNotice('Notifikasi peramban berhasil diaktifkan!');
          try {
            new Notification('Notifikasi Al-Firasat Diaktifkan', {
              body: 'Anda akan menerima pengingat berkala untuk meninjau perkembangan karakter subjek.',
              icon: '/favicon.ico'
            });
          } catch {
            // fallback handled
          }
        } else {
          setPermissionNotice('Notifikasi peramban dibatasi oleh izin peramban/iframe, namun sistem pengingat otomatis dalam aplikasi senantiasa aktif!');
        }
      } else {
        setPermissionNotice('Sistem pengingat dalam aplikasi (suara & peringatan jatuh tempo) senantiasa aktif otomatis.');
      }
      setTimeout(() => setPermissionNotice(null), 5500);
    } catch (err) {
      console.warn('Notification setup notice:', err);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const prof = profiles.find(p => p.id === selectedProfileId);
    const finalName = prof ? prof.name : (customSubjectName.trim() || 'Subjek Pemantauan');
    const finalProfId = prof ? prof.id : 'custom-' + Date.now();

    setIsSubmitting(true);
    try {
      await scheduleNotification({
        profileId: finalProfId,
        profileName: finalName,
        days: intervalDays,
        title: `Pemantauan Firasat: ${finalName}`,
        message: customNote
      });
      setShowAddModal(false);
      setCustomSubjectName('');
      onRefreshData();
      sound.playLockPing();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteNotif = async (id: string) => {
    try {
      await updateNotificationStatus(id, 'completed');
      onRefreshData();
      sound.playSuccessChime();
    } catch (err) {
      console.error('Failed to update notification:', err);
    }
  };

  const handleDismissNotif = async (id: string) => {
    try {
      await updateNotificationStatus(id, 'dismissed');
      onRefreshData();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const pendingNotifs = notifications.filter(n => n.status === 'pending');
  const pastNotifs = notifications.filter(n => n.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Sistem Pengingat Berkala Al-Firasat</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-title text-stone-100">
            Pemantauan Perkembangan Profil Karakter
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Karakter manusia bersifat dinamis dan dapat berkembang melalui riyadhah budi pekerti, usia, dan kebiasaan. 
            Atur pengingat berkala untuk mengevaluasi kembali profil individu secara objektif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notificationPermission !== 'granted' ? (
            <button
              onClick={requestBrowserNotification}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Izinkan Notifikasi Peramban</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Notifikasi Peramban Aktif</span>
            </span>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Pasang Pengingat Baru</span>
          </button>
        </div>
      </div>

      {/* Permission Feedback Notice */}
      {permissionNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{permissionNotice}</span>
          </div>
          <button onClick={() => setPermissionNotice(null)} className="text-stone-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ar-Razi Insight Card */}
      <div className="rounded-2xl bg-amber-950/20 border border-amber-800/30 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-stone-300 leading-relaxed">
          <h4 className="font-bold text-amber-300 text-sm">
            Landasan Pemantauan Berkala Menurut Kitab Al-Firasat:
          </h4>
          <p>
            Dalam Pasal Keempat dan Bab II, Imam Fakhruddin Ar-Razi menguraikan bahwa pengaruh usia, 
            kebiasaan (al-adat), latihan mental (riyadhah an-nafs), dan lingkungan dapat mengubah ekspresi lahiriah. 
            Seseorang yang dahulunya reaktif pemarah dapat menjadi tenang seiring bertambahnya ilmu dan hikmah, 
            sehingga pemantauan berkala (14–30 hari) sangat dianjurkan untuk mendeteksi kemajuan akhlak.
          </p>
        </div>
      </div>

      {/* Active Pending Reminders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Jadwal Evaluasi yang Menunggu ({pendingNotifs.length})</span>
          </h3>
          <span className="text-xs text-stone-500">Tersinkronisasi dengan Basis Data</span>
        </div>

        {pendingNotifs.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-stone-900/40 border border-stone-800 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-stone-200">Semua Jadwal Pemantauan Selesai</h4>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Tidak ada evaluasi firasat yang jatuh tempo saat ini. Anda dapat menjadwalkan pengingat baru kapan saja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingNotifs.map((item) => {
              const due = new Date(item.dueDate);
              const now = new Date();
              const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = diffDays < 0;
              const isToday = diffDays === 0;

              const matchedProfile = profiles.find(p => p.id === item.profileId);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-md space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOverdue 
                            ? 'bg-red-950 text-red-400 border border-red-800' 
                            : isToday 
                            ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            : 'bg-stone-800 text-stone-300'
                        }`}>
                          {isOverdue ? `Terlewat ${Math.abs(diffDays)} Hari` : isToday ? 'Jatuh Tempo Hari Ini' : `${diffDays} Hari Lagi`}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100 mt-1.5">
                          {item.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDismissNotif(item.id)}
                        title="Tutup Pengingat"
                        className="text-stone-600 hover:text-stone-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>Jatuh tempo: {due.toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigateToScanProfile(matchedProfile || {
                        id: item.profileId,
                        name: item.profileName,
                        category: 'Lainnya',
                        notes: item.message || '',
                        createdAt: new Date().toISOString(),
                        analysisCount: 0,
                        monitoringIntervalDays: 14
                      })}
                      className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pindai Ulang Sekarang</span>
                    </button>

                    <button
                      onClick={() => handleCompleteNotif(item.id)}
                      className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tandai Selesai</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed / History of Notifications */}
      {pastNotifs.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-800">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Riwayat Pemantauan Selesai ({pastNotifs.length})
          </h4>
          <div className="space-y-2">
            {pastNotifs.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-stone-950 border border-stone-800/60 flex items-center justify-between text-xs text-stone-400 opacity-70"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-stone-300">{item.title}</span>
                  <span className="text-[10px] text-stone-500">
                    ({new Date(item.dueDate).toLocaleDateString('id-ID')})
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-emerald-400">
                  {item.status === 'completed' ? 'Selesai Dievaluasi' : 'Dilewati'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-title text-stone-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Atur Pemantauan Karakter Berkala</span>
            </h3>

            <form onSubmit={handleCreateReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Pilih Subjek yang Dipantau
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                  <option value="manual">+ Masukkan Nama Subjek Baru / Manual</option>
                </select>
              </div>

              {(selectedProfileId === 'manual' || profiles.length === 0) && (
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nama Subjek Pemantauan
                  </label>
                  <input
                    type="text"
                    required
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    placeholder="Contoh: Zaid bin Tsabit / Mitra Bisnis..."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Interval Pengamatan Ulang
                </label>
                <select
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200"
                >
                  <option value={7}>7 Hari (Pemantauan Intensif / Pasca Latihan)</option>
                  <option value={14}>14 Hari (Standar Firasat Imam Ar-Razi)</option>
                  <option value={30}>30 Hari (Evaluasi 1 Bulan / Perkembangan Jiwa)</option>
                  <option value={60}>60 Hari (Pemantauan Jangka Panjang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Fokus Pengamatan Karakter
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Contoh: Amati ketenangan raut wajah, sorot mata saat berdiskusi, dan pengendalian emosi..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Pemantauan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
