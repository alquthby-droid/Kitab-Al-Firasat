import React from 'react';
import { 
  Scan, 
  SlidersHorizontal, 
  BookOpen, 
  Database, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Info,
  Sun,
  Moon,
  Mic,
  GitCompare,
  TrendingUp,
  HelpCircle,
  Target,
  FileSpreadsheet,
  Rocket
} from 'lucide-react';
import { sound } from '../services/sound';
import { OfflineStatusBadge } from './OfflineStatusBadge';

export type ActiveTab = 'scanner' | 'challenge' | 'manual' | 'trends' | 'compare' | 'database' | 'notifications' | 'library';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingNotificationsCount: number;
  hasGeminiKey: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAbout: () => void;
  onOpenVoiceModal: () => void;
  onOpenOnboardingTour?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenDeployGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingNotificationsCount,
  hasGeminiKey,
  theme,
  onToggleTheme,
  onOpenAbout,
  onOpenVoiceModal,
  onOpenOnboardingTour,
  onOpenGoogleSheets,
  onOpenDeployGuide
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const navItems = [
    { id: 'scanner' as ActiveTab, label: 'Pemindai Wajah & Tangan', icon: Scan },
    { id: 'challenge' as ActiveTab, label: 'Mode Tantangan', icon: Target },
    { id: 'manual' as ActiveTab, label: 'Fitur & Telapak Tangan', icon: SlidersHorizontal },
    { id: 'trends' as ActiveTab, label: 'Tren & Prediksi Mizaj', icon: TrendingUp },
    { id: 'compare' as ActiveTab, label: 'Kecocokan & Komparasi', icon: GitCompare },
    { id: 'database' as ActiveTab, label: 'Basis Data', icon: Database },
    { id: 'notifications' as ActiveTab, label: 'Pemantauan', icon: Bell, badge: pendingNotificationsCount },
    { id: 'library' as ActiveTab, label: 'Kitab Ar-Razi', icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-amber-950/30 bg-stone-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('scanner')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                <span className="font-arabic text-amber-400 text-xl font-bold">ف</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-title text-base sm:text-lg tracking-wider font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                  AL-FIRASAT AI
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400/90 bg-amber-500/10">
                  Ar-Razi (554-606 H)
                </span>
              </div>
              <p className="text-[11px] text-stone-400 line-clamp-1">
                Fisiognomi Karakter Klasik & Analisis Suara Interaktif
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-stone-950 bg-amber-400 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* IndexedDB Offline Cache Badge */}
            <OfflineStatusBadge />

            {/* Google Sheets Sync Button */}
            {onOpenGoogleSheets && (
              <button
                onClick={onOpenGoogleSheets}
                title="Integrasi & Sinkronisasi Google Sheets"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>
            )}

            {/* Deployment Guide Modal Button */}
            {onOpenDeployGuide && (
              <button
                onClick={onOpenDeployGuide}
                title="Panduan Deployment Otomatis Gratis (Vercel, Firebase, Render)"
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Deploy Gratis</span>
              </button>
            )}

            {/* Quick Voice Analysis Button */}
            <button
              onClick={onOpenVoiceModal}
              title="Analisis Firasat dari Segi Suara & Tutur Kata"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Uji Suara</span>
            </button>

            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Beralih ke Mode Terang (Parchment Baca)' : 'Beralih ke Mode Gelap'}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-900 border border-stone-800 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Nyalakan Suara Efek' : 'Bisukan Suara Efek'}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-900 border border-stone-800 transition-colors cursor-pointer"
              aria-label="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Interactive Onboarding Tour Button */}
            {onOpenOnboardingTour && (
              <button
                onClick={onOpenOnboardingTour}
                title="Panduan Interaktif & Tur Fitur Utama"
                className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-900 border border-stone-800 transition-colors cursor-pointer"
                aria-label="Panduan Tur"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* About / Guide Button */}
            <button
              onClick={onOpenAbout}
              title="Tentang Kitab & Panduan Firasat"
              className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-900 border border-stone-800 transition-colors cursor-pointer"
              aria-label="Tentang Kitab"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-stone-900 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center flex-1 min-w-[55px] py-1.5 px-1 rounded-md text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold text-stone-950 bg-amber-400 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 truncate max-w-[55px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
