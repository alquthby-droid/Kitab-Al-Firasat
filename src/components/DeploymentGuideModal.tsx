import React, { useState } from 'react';
import {
  X,
  Rocket,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FileCode,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Globe,
  Layers,
  Flame,
  Cloud,
  ArrowRight,
  Server,
  Zap,
  Info
} from 'lucide-react';
import { sound } from '../services/sound';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlatformTab = 'vercel' | 'firebase' | 'render' | 'aistudio';

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<PlatformTab>('vercel');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Interactive Checklist State
  const [checklist, setChecklist] = useState({
    buildPassed: true,
    apiKeyReady: true,
    repoCreated: false,
    spaConfigReady: false
  });

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    sound.playClick();
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const vercelJsonCode = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const firebaseJsonCode = `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}`;

  const githubActionFirebaseCode = `name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Dependencies
        run: npm ci
      - name: Build Application
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '\${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '\${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-stone-900 border border-amber-900/40 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-800 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center text-stone-950">
              <Rocket className="w-5 h-5 text-stone-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-title text-stone-100">
                  Panduan Deployment Otomatis Gratis
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase">
                  100% Free Tier
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Cara mempublikasikan aplikasi Al-Firasat AI secara publik ke Vercel, Firebase Hosting, atau Render.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-4 border-b border-stone-800 bg-stone-950/50 overflow-x-auto">
          {[
            { id: 'vercel' as PlatformTab, label: 'Vercel', icon: Zap, badge: 'Tercepat & Terpopuler' },
            { id: 'firebase' as PlatformTab, label: 'Firebase Hosting', icon: Flame, badge: 'Google Cloud CDN' },
            { id: 'render' as PlatformTab, label: 'Render.com', icon: Server, badge: 'Full-Stack Express' },
            { id: 'aistudio' as PlatformTab, label: 'AI Studio Live', icon: Globe, badge: 'Langsung Aktif' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-400 font-normal">
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-stone-300">
          {/* TAB 1: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Deployment Otomatis ke Vercel via GitHub</span>
                  </h4>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Vercel menyediakan paket gratis permanen (*Hobby Plan*) dengan domain HTTPS kustom gratis
                    (<code className="text-amber-300">nama-app.vercel.app</code>), edge caching global, serta auto-deploy setiap kali Anda melakukan <code className="text-amber-300">git push</code>.
                  </p>
                </div>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <span>Buka Vercel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Steps Timeline */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>Push Kode ke GitHub Repository</span>
                  </div>
                  <p className="text-stone-400 text-[11px] pl-7">
                    Simpan kode proyek ini ke akun GitHub Anda. Jika belum, Anda dapat mengunduh berkas proyek atau melakukan clone lalu push ke repository GitHub (bisa berstatus Private atau Public).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
                    <span>Tambahkan Konfigurasi SPA (`vercel.json`)</span>
                  </div>
                  <p className="text-stone-400 text-[11px] pl-7">
                    Agar rute dan navigasi React Single Page Application tidak mengalami galat 404 saat pengguna melakukan <i>refresh</i>, buat file <code className="text-amber-300">vercel.json</code> di root proyek:
                  </p>
                  <div className="pl-7 pt-1">
                    <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-3 font-mono text-[11px] text-stone-300 overflow-x-auto">
                      <button
                        onClick={() => handleCopy(vercelJsonCode, 'vercelJson')}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedSnippet === 'vercelJson' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet === 'vercelJson' ? 'Tersalin' : 'Salin vercel.json'}</span>
                      </button>
                      <pre>{vercelJsonCode}</pre>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
                    <span>Import Repository di Dashboard Vercel</span>
                  </div>
                  <div className="text-stone-400 text-[11px] pl-7 space-y-1.5">
                    <p>1. Di dashboard Vercel, klik tombol <strong>"Add New..." &rarr; "Project"</strong>.</p>
                    <p>2. Pilih repository GitHub aplikasi Al-Firasat AI Anda dan klik <strong>"Import"</strong>.</p>
                    <p>3. Di bagian <strong>Build and Output Settings</strong>, pastikan:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-stone-300">
                      <li><strong>Framework Preset:</strong> Vite</li>
                      <li><strong>Build Command:</strong> <code className="text-amber-300">npm run build</code></li>
                      <li><strong>Output Directory:</strong> <code className="text-amber-300">dist</code></li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">4</span>
                    <span>Atur Environment Variables (Kunci Gemini)</span>
                  </div>
                  <p className="text-stone-400 text-[11px] pl-7">
                    Buka menu <strong>Environment Variables</strong> di form Vercel, lalu tambahkan:
                  </p>
                  <div className="pl-7 space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-amber-300">GEMINI_API_KEY</span>
                      <span className="text-stone-500">=</span>
                      <span className="text-stone-400">&lt;API-Key-Gemini-Anda&gt;</span>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai! Klik "Deploy"</span>
                  </div>
                  <p className="text-stone-300 text-[11px] pl-6 leading-relaxed">
                    Vercel akan menjalankan build dalam ~30 detik dan memberikan URL live Anda. Setiap kali Anda melakukan perubahan kode dan menekan <code className="text-emerald-300">git push</code>, Vercel akan otomatis memperbarui situs secara langsung tanpa perlu campur tangan manual!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIREBASE HOSTING */}
          {activeTab === 'firebase' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Deployment Otomatis ke Firebase Hosting (Google Cloud)</span>
                  </h4>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Firebase Hosting memberikan hosting SSD berkecepatan tinggi dengan sertifikat SSL otomatis, domain gratis (<code className="text-amber-300">proyek-anda.web.app</code>), dan integrasi langsung dengan GitHub Actions untuk CI/CD otomatis.
                  </p>
                </div>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <span>Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Firebase Steps */}
              <div className="space-y-4">
                {/* Step 1: CLI */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>Pasang Firebase CLI di Komputer / Terminal</span>
                  </div>
                  <div className="pl-7 space-y-1.5">
                    <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-2.5 font-mono text-[11px] text-stone-300 flex items-center justify-between">
                      <code>npm install -g firebase-tools</code>
                      <button
                        onClick={() => handleCopy('npm install -g firebase-tools', 'cliInstall')}
                        className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px]"
                      >
                        {copiedSnippet === 'cliInstall' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Login & Init */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px]">2</span>
                    <span>Login & Inisialisasi Hosting</span>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div className="rounded-xl bg-stone-950 border border-stone-800 p-2.5 font-mono text-[11px] text-stone-300">
                      <div>$ firebase login</div>
                      <div className="pt-1 text-amber-300">$ firebase init hosting</div>
                    </div>
                    <p className="text-stone-400 text-[11px]">
                      Saat muncul pertanyaan konfigurasi, jawab sebagai berikut:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300 text-[11px]">
                      <li><strong>What do you want to use as your public directory?</strong> ketik <code className="text-amber-300 font-mono">dist</code></li>
                      <li><strong>Configure as a single-page app (rewrite all urls to /index.html)?</strong> pilih <code className="text-emerald-400 font-bold">Yes</code></li>
                      <li><strong>Set up automatic builds and deploys with GitHub?</strong> pilih <code className="text-emerald-400 font-bold">Yes</code> (untuk auto-deploy otomatis)</li>
                    </ul>
                  </div>
                </div>

                {/* Step 3: firebase.json */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px]">3</span>
                    <span>Berkas Konfigurasi `firebase.json`</span>
                  </div>
                  <p className="text-stone-400 text-[11px] pl-7">
                    Pastikan isi <code className="text-orange-300">firebase.json</code> Anda seperti di bawah ini:
                  </p>
                  <div className="pl-7 pt-1">
                    <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-3 font-mono text-[11px] text-stone-300 overflow-x-auto">
                      <button
                        onClick={() => handleCopy(firebaseJsonCode, 'firebaseJson')}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedSnippet === 'firebaseJson' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet === 'firebaseJson' ? 'Tersalin' : 'Salin firebase.json'}</span>
                      </button>
                      <pre>{firebaseJsonCode}</pre>
                    </div>
                  </div>
                </div>

                {/* Step 4: GitHub Action for Auto Deploy */}
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px]">4</span>
                    <span>Otomatisasi CI/CD via GitHub Actions</span>
                  </div>
                  <p className="text-stone-400 text-[11px] pl-7">
                    Firebase CLI akan secara otomatis menaruh file workflow di folder <code className="text-stone-200">.github/workflows/firebase-hosting-merge.yml</code>. Setiap kali ada perubahan di branch main, GitHub Actions akan otomatis mem-build dan deploy:
                  </p>
                  <div className="pl-7 pt-1">
                    <div className="relative rounded-xl bg-stone-950 border border-stone-800 p-3 font-mono text-[11px] text-stone-300 overflow-x-auto">
                      <button
                        onClick={() => handleCopy(githubActionFirebaseCode, 'ghActionCode')}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedSnippet === 'ghActionCode' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet === 'ghActionCode' ? 'Tersalin' : 'Salin Workflow YAML'}</span>
                      </button>
                      <pre className="max-h-40 overflow-y-auto">{githubActionFirebaseCode}</pre>
                    </div>
                  </div>
                </div>

                {/* Step 5: Manual Deploy Command */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Perintah Deploy Langsung (Opsional)</span>
                  </div>
                  <p className="text-stone-300 text-[11px] pl-6">
                    Bila ingin langsung deploy dari terminal komputer tanpa menunggu GitHub Actions:
                  </p>
                  <div className="pl-6">
                    <code className="px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 font-mono text-emerald-400 block text-[11px]">
                      npm run build && firebase deploy --only hosting
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RENDER.COM */}
          {activeTab === 'render' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>Deployment Full-Stack Node.js + Express di Render.com</span>
                  </h4>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Sangat direkomendasikan jika Anda ingin server Express API (<code className="text-amber-300">server.ts</code>) berjalan aktif 24/7 untuk persistensi data database lokal dan Gemini API proxy secara mandiri.
                  </p>
                </div>
                <a
                  href="https://render.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <span>Buka Render</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <span className="font-bold text-cyan-400">Parameter Konfigurasi di Render Dashboard:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Environment</span>
                      <div className="font-mono text-stone-200 font-bold">Node</div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Build Command</span>
                      <div className="font-mono text-amber-300 font-bold">npm install && npm run build</div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Start Command</span>
                      <div className="font-mono text-emerald-400 font-bold">npm run start</div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Instance Type</span>
                      <div className="font-mono text-stone-200 font-bold">Free ($0/month)</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950/40 border border-stone-800/80 space-y-2">
                  <span className="font-bold text-cyan-400">Environment Variables yang Dibutuhkan:</span>
                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-amber-300">NODE_ENV</span>
                      <span className="text-stone-300">production</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-amber-300">GEMINI_API_KEY</span>
                      <span className="text-stone-300">&lt;Kunci Gemini Anda&gt;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI STUDIO LIVE */}
          {activeTab === 'aistudio' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/30 via-stone-950 to-stone-900 border border-amber-900/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-stone-100">
                      Tautan Publik Bawaan Google Cloud Run (Sudah Aktif)
                    </h4>
                    <p className="text-xs text-stone-400">
                      Tidak memerlukan setup apapun; dikelola langsung oleh infrastruktur Google AI Studio.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <span className="text-[11px] text-stone-400">Tautan Shared App URL Anda Saat Ini:</span>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-900 border border-amber-900/30 font-mono text-xs text-amber-300">
                    <span className="truncate">https://ais-pre-d6g3hzttdopq4l256cui2c-804833840022.asia-east1.run.app</span>
                    <button
                      onClick={() => handleCopy('https://ais-pre-d6g3hzttdopq4l256cui2c-804833840022.asia-east1.run.app', 'sharedUrl')}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedSnippet === 'sharedUrl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet === 'sharedUrl' ? 'Tersalin' : 'Salin Tautan'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-stone-300 leading-relaxed">
                  <p><strong>Cara Membagikan ke Publik:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1 text-stone-400">
                    <li>Klik tombol <strong>"Share"</strong> di pojok kanan atas jendela Google AI Studio.</li>
                    <li>Ubah setelan visibilitas menjadi <strong>"Public"</strong>.</li>
                    <li>Bagikan URL tersebut ke pengguna, rekan kerja, atau klien Anda.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Pre-flight Checklist */}
          <div className="p-5 rounded-3xl bg-stone-950/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Checklist Kesiapan Deployment Otomatis</span>
              </span>
              <span className="text-[10px] text-stone-400">Centang saat selesai</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'buildPassed' as const, label: 'Kompilasi build lokal berhasil (npm run build)' },
                { key: 'apiKeyReady' as const, label: 'Kunci Gemini API tersimpan di Environment Variables' },
                { key: 'repoCreated' as const, label: 'Repository GitHub terhubung ke Vercel/Firebase' },
                { key: 'spaConfigReady' as const, label: 'File rewrites (vercel.json / firebase.json) terpasang' }
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                    checklist[item.key]
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-stone-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      checklist[item.key]
                        ? 'bg-emerald-500 border-emerald-400 text-stone-950'
                        : 'border-stone-700 bg-stone-950'
                    }`}
                  >
                    {checklist[item.key] && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] leading-tight select-none">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3.5 rounded-2xl bg-stone-950/50 border border-stone-800/80 space-y-1">
                <span className="font-bold text-stone-200">Apakah benar-benar 100% gratis?</span>
                <p className="text-stone-400 leading-relaxed">
                  Ya! Baik Vercel (Hobby plan), Firebase Hosting (Spark plan), maupun AI Studio memberikan kuota bandwidth dan hosting gratis tanpa perlu kartu kredit untuk trafik standar.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-950/50 border border-stone-800/80 space-y-1">
                <span className="font-bold text-stone-200">Bisa pakai domain sendiri (.com / .id)?</span>
                <p className="text-stone-400 leading-relaxed">
                  Bisa. Di dashboard Vercel atau Firebase Hosting, masuk ke menu <strong>Domains &rarr; Add Custom Domain</strong>, lalu arahkan DNS CNAME/A Record Anda. SSL otomatis gratis!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Panduan resmi deployment aplikasi Al-Firasat AI berbasis Kitab Ar-Razi.
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
