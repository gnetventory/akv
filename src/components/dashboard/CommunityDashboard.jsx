import React, { useMemo, useState } from 'react';
import {
  Users,
  Sparkles,
  ArrowRight,
  MapPin,
  Briefcase,
  Zap,
  Layers,
  Target,
  Flame,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Handshake,
  Download,
  Linkedin,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { STAGES, getCountryFlag } from '../../utils/constants';
import { computeExecutiveAnalytics } from '../../utils/executiveAnalytics';
import { isAdminSession } from '../../utils/session';
import {
  getInitials,
  getAvatarGradient,
  isValidLinkedInUrl,
  formatLinkedInUrl,
  downloadVCardFile,
  getMemberWebsites,
  parseMemberName,
} from '../../utils/helpers';
import Modal from '../common/Modal';
import FounderManifestoCard from './FounderManifestoCard';

export default function CommunityDashboard({ onOpenDiagnostic }) {
  const { activeMembers: members, setActiveTab, setSearchQuery, notify } = useApp();

  // Interactive Modals State
  const [detailMember, setDetailMember] = useState(null);
  const [bilateralPairing, setBilateralPairing] = useState(null);
  const [introLanguage, setIntroLanguage] = useState('ar');
  const [copiedIntro, setCopiedIntro] = useState(false);

  const isAdmin = isAdminSession();
  const analytics = useMemo(() => computeExecutiveAnalytics(members), [members]);

  const handleOpenBilateralModal = (pairing) => {
    setBilateralPairing(pairing);
    setCopiedIntro(false);
  };

  const generateBilateralMessage = (pair, lang = 'ar') => {
    if (!pair) return '';
    const nameA = pair.memberA.name.split(' ')[0];
    const nameB = pair.memberB.name.split(' ')[0];
    const bizA = pair.memberA.business || pair.memberA.role;
    const bizB = pair.memberB.business || pair.memberB.role;

    if (lang === 'ar') {
      return `السلام عليكم أستاذ ${nameA} وأستاذ ${nameB}، تحياتي لكما من مجتمع رواد الأعمال Smart Directory.\n\nيسعدني تعريفكما ببعض لوجود فرص تعاون وتكامل واعدة بين مشروع ${bizA} ومشروع ${bizB}.\n\nأترك لكما المجال للتواصل وبحث الشراكة والتعاون المشترك. بالتوفيق والنجاح الدائم!`;
    }

    return `Hello ${nameA} and ${nameB}, warm greetings from the Smart Directory community!\n\nI wanted to connect you both seeing potential synergies and collaboration opportunities between ${bizA} and ${bizB}.\n\nConnecting you here to explore partnerships and mutual support. Wishing you both continued success!`;
  };

  const handleCopyBilateralMessage = () => {
    const text = generateBilateralMessage(bilateralPairing, introLanguage);
    navigator.clipboard.writeText(text);
    setCopiedIntro(true);
    notify('📋 Intro text copied to clipboard!');
    setTimeout(() => setCopiedIntro(false), 2000);
  };

  // Stage progress bar percentages calculation
  const stageStats = useMemo(() => {
    const counts = analytics.stageCounts || { idea: 0, starting: 0, running: 0, growing: 0 };
    const total = Math.max(1, analytics.total);
    return {
      ideaPct: Math.round((counts.idea / total) * 100),
      startingPct: Math.round((counts.starting / total) * 100),
      runningPct: Math.round((counts.running / total) * 100),
      growingPct: Math.round((counts.growing / total) * 100),
      counts,
    };
  }, [analytics]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* ── 1. COMMUNITY SNAPSHOT HEADER BANNER ──── */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-700/80 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-emerald-400 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Community Snapshot • Curated by BGM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Who Needs What & Gaps We Can Fill Together
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              A transparent, peer-driven snapshot of member ventures, current requests, capability shortages, and upcoming gatherings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('directory')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:scale-102"
            >
              <Users size={15} />
              <span>Browse All Members</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 1.5 FOUNDER MANIFESTO & MICRO-ECOSYSTEM BANNER ──── */}
      <FounderManifestoCard
        onOpenDiagnostic={onOpenDiagnostic}
        onOpenProblemBoard={() => setActiveTab('exchange')}
      />

      {/* ── 2. GROUNDED COMMUNITY KPI RIBBON ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Community Members */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-stone-400 truncate">
              Members
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <Users size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                {analytics.total}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 truncate">
                +{analytics.monthlyVelocity} recent
              </span>
            </div>
            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-stone-400 font-medium mt-1 truncate">
              Egypt & regional hubs
            </p>
          </div>
        </div>

        {/* KPI 2: Reciprocal Fit Rate */}
        <div className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-amber-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2 sm:space-y-3 overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-stone-400 truncate">
              Fit Rate
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
              <Sparkles size={15} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1.5 sm:gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-display">
                {analytics.synergyIndex}%
              </span>
              <span className="text-[9.5px] sm:text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md border border-amber-300 dark:border-amber-800 truncate">
                Reciprocal Fit
              </span>
            </div>
            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-stone-400 font-medium mt-1 truncate">
              Matching needs & offers
            </p>
          </div>
        </div>

        {/* KPI 3: Active Requests & Skills */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-stone-400 truncate">
              Active Asks & Offers
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
              <Target size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-display">
                {analytics.activeAsksCount}
              </span>
              <span className="text-[10.5px] sm:text-xs font-semibold text-slate-500 dark:text-stone-400">
                asks ↔ <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{analytics.activeOffersCount}</strong> offers
              </span>
            </div>
            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-stone-400 font-medium mt-1 truncate">
              Listed by members
            </p>
          </div>
        </div>

        {/* KPI 4: Stage Composition */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-stone-400 truncate">
              Venture Stages
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
              <Layers size={15} />
            </div>
          </div>

          <div>
            <div className="h-2.5 sm:h-3 w-full rounded-full bg-slate-100 dark:bg-stone-800 flex overflow-hidden border border-slate-200 dark:border-stone-700 shadow-2xs mb-2">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${stageStats.ideaPct}%` }}
                title={`Idea: ${stageStats.counts.idea} (${stageStats.ideaPct}%)`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${stageStats.startingPct}%` }}
                title={`Starting: ${stageStats.counts.starting} (${stageStats.startingPct}%)`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${stageStats.runningPct}%` }}
                title={`Running: ${stageStats.counts.running} (${stageStats.runningPct}%)`}
              />
              <div
                className="bg-purple-600 h-full transition-all duration-500"
                style={{ width: `${stageStats.growingPct}%` }}
                title={`Scaling: ${stageStats.counts.growing} (${stageStats.growingPct}%)`}
              />
            </div>

            <div className="grid grid-cols-4 gap-0.5 text-[9.5px] sm:text-[11px] font-semibold text-center truncate">
              <span className="text-blue-700 dark:text-blue-400 truncate">Idea {stageStats.counts.idea}</span>
              <span className="text-emerald-700 dark:text-emerald-400 truncate">Start {stageStats.counts.starting}</span>
              <span className="text-amber-700 dark:text-amber-400 truncate">Run {stageStats.counts.running}</span>
              <span className="text-purple-700 dark:text-purple-400 truncate">Scale {stageStats.counts.growing}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. TODAY'S CURATED PAIRINGS (Admin Only) ───── */}
      {isAdmin && analytics.curatedPairings.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20">
                <Handshake size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Curated Intro Suggestions (Admin)
                </h3>
                <p className="text-xs text-slate-500 dark:text-stone-400 font-medium">
                  High-reciprocity pairings where one member directly needs what another offers.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
              ⚡ 3 Suggestions Ready
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {analytics.curatedPairings.map((pairing, idx) => (
              <div
                key={pairing.id}
                className="p-5 rounded-3xl border border-slate-200/90 dark:border-stone-800 bg-[#FAFAF7] dark:bg-stone-850 hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {pairing.score}% Match
                  </span>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">
                    Mutual Fit
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div
                    onClick={() => setDetailMember(pairing.memberA)}
                    className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-750 cursor-pointer hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-1.5"
                  >
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(pairing.memberA.name)} flex items-center justify-center text-white font-black text-sm ring-2 ring-emerald-400 shadow-xs`}
                    >
                      {getInitials(pairing.memberA.name)}
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate w-full">
                      {pairing.memberA.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate w-full">
                      {pairing.memberA.business || pairing.memberA.role}
                    </div>
                  </div>

                  <div
                    onClick={() => setDetailMember(pairing.memberB)}
                    className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-750 cursor-pointer hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-1.5"
                  >
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(pairing.memberB.name)} flex items-center justify-center text-white font-black text-sm ring-2 ring-amber-400 shadow-xs`}
                    >
                      {getInitials(pairing.memberB.name)}
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate w-full">
                      {pairing.memberB.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate w-full">
                      {pairing.memberB.business || pairing.memberB.role}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 text-xs text-emerald-950 dark:text-emerald-100 leading-snug font-medium">
                  💡 {pairing.rationale}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-stone-800">
                  <button
                    onClick={() => handleOpenBilateralModal(pairing)}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-slate-900 flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Handshake size={14} />
                    <span>Copy Intro Message</span>
                  </button>
                  <button
                    onClick={() => setDetailMember(pairing.memberA)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-200 transition cursor-pointer"
                    title="View Profile Details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. WHO NEEDS WHAT & GAPS WE CAN FILL TOGETHER ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Supply vs Demand Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                <Flame size={18} className="text-orange-500" />
                Who Needs What: Community Supply & Demand
              </h3>
              <p className="text-xs text-slate-500 dark:text-stone-400 font-medium">
                Comparing what members are asking for (Left) vs what members offer (Right).
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 font-bold">
              {analytics.matrix.length} Areas
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {analytics.matrix.map((row) => {
              const isDeficit = row.gap > 0;
              const isSurplus = row.gap < 0;

              return (
                <div key={row.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{row.icon}</span>
                      <span>{row.label}</span>
                    </span>

                    <div>
                      {isDeficit ? (
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-rose-950/50 text-[#991B1B] dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                          <span className="hidden sm:inline">Need: {row.demand} vs Offer: {row.supply} (Shortage: {row.gap})</span>
                          <span className="sm:hidden">Need {row.demand} · Gap -{row.gap}</span>
                        </span>
                      ) : isSurplus ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shrink-0">
                          <span className="hidden sm:inline">Surplus capacity (+{Math.abs(row.gap)})</span>
                          <span className="sm:hidden">Surplus +{Math.abs(row.gap)}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Balanced</span>
                      )}
                    </div>
                  </div>

                  {/* Diverging Bar Container */}
                  <div className="grid grid-cols-2 gap-2 items-center bg-slate-50 dark:bg-stone-850 p-2 rounded-2xl border border-slate-100 dark:border-stone-800">
                    {/* Left: Demand */}
                    <div className="flex items-center justify-end gap-2 pr-1 border-r border-slate-300 dark:border-stone-700">
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                        {row.demand} seeking ({row.demandPct}%)
                      </span>
                      <div className="w-24 sm:w-32 h-2.5 bg-slate-200 dark:bg-stone-800 rounded-full overflow-hidden flex justify-end">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, row.demandPct * 1.6)}%` }}
                        />
                      </div>
                    </div>

                    {/* Right: Supply */}
                    <div className="flex items-center justify-start gap-2 pl-1">
                      <div className="w-24 sm:w-32 h-2.5 bg-slate-200 dark:bg-stone-800 rounded-full overflow-hidden flex justify-start">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, row.supplyPct * 1.6)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {row.supply} offering ({row.supplyPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Gaps We Can Fill Together & Next Gathering */}
        <div className="space-y-4">
          
          {/* Card A: Gaps We Can Fill Together */}
          <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-900/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs">
                <AlertCircle size={15} />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                  Gaps We Can Fill Together
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                  Areas where our members have the biggest unmet needs:
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-800 flex items-start gap-2">
                <span className="text-base">🤝</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    B2B Distribution & Deals (Shortage: 25)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400">
                    38 founders looking for commercial channels & B2B pilot partners.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-800 flex items-start gap-2">
                <span className="text-base">💰</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Funding & Angel Investors (Shortage: 16)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400">
                    31 founders seeking pre-seed & seed angel investors.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-850 border border-amber-200/70 dark:border-stone-800 flex items-start gap-2">
                <span className="text-base">💻</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Tech & Co-Founders (Shortage: 9)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400">
                    28 founders seeking software architects, CTOs & technical talent.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-amber-900/90 dark:text-amber-300 font-medium bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              💡 <em>Have connections or expertise in these areas? Share your knowledge with fellow community members.</em>
            </div>
          </div>

        </div>

      </div>

      {/* ── 5. REGIONAL HUBS & INDUSTRY SECTORS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regional Hubs */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <MapPin size={17} className="text-orange-500" />
              Regional Corridors & Hubs
            </h3>
            <button
              onClick={() => setActiveTab('map')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Atlas <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {analytics.topDistricts.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {item.name}
                  </span>
                  <span className="text-slate-500 dark:text-stone-400">
                    {item.count} founders ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Domains */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <Briefcase size={17} className="text-orange-500" />
              Industry Sectors & Verticals
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              {analytics.topIndustries.length} Sectors
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {analytics.topIndustries.map((ind, idx) => (
              <button
                key={ind.name}
                onClick={() => {
                  setSearchQuery(ind.name);
                  setActiveTab('directory');
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 ${
                  idx === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-700 hover:border-emerald-400'
                }`}
              >
                <span>{ind.name}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/80 dark:bg-stone-700 font-mono text-[10px]">
                  {ind.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. BILATERAL INTRO MODAL (Admin) ─────────────── */}
      {bilateralPairing && (
        <Modal
          isOpen={!!bilateralPairing}
          onClose={() => setBilateralPairing(null)}
          title="Curated Member Introduction"
          size="md"
        >
          <div className="space-y-4 text-xs text-slate-900 dark:text-white">
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="font-extrabold text-emerald-900 dark:text-emerald-200">
                Mutual Complementarity: {bilateralPairing.score || 90}%
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIntroLanguage('ar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    introLanguage === 'ar' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700'
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => setIntroLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    introLanguage === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-700 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap">
              {generateBilateralMessage(bilateralPairing, introLanguage)}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={handleCopyBilateralMessage}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                {copiedIntro ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                <span>{copiedIntro ? 'Copied!' : 'Copy Intro Text'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 8. MEMBER DETAIL MODAL ─────────────────────────────── */}
      {detailMember && (
        <Modal
          isOpen={!!detailMember}
          onClose={() => setDetailMember(null)}
          title="Community Member Profile"
          size="lg"
        >
          {(() => {
            const member = detailMember;
            const { english, arabic, primary } = parseMemberName(member.name);
            const stage = STAGES[member.stage] || STAGES.idea;
            const initials = getInitials(member.name);
            const gradient = getAvatarGradient(member.name);
            const flag = getCountryFlag(member.location?.country);
            const websites = getMemberWebsites(member);
            const isLinkedInValid = isValidLinkedInUrl(member.linkedin);
            const linkedInHref = isLinkedInValid ? formatLinkedInUrl(member.linkedin) : null;

            return (
              <div className="space-y-5 text-slate-900 dark:text-stone-100 text-xs">
                <div className="flex items-start justify-between gap-4 p-5 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-stone-800 dark:to-stone-900 rounded-3xl border border-emerald-200/80 dark:border-stone-700 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-2 ring-white dark:ring-stone-700`}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                        {english || arabic || primary}
                      </h3>
                      {english && arabic && (
                        <p className="text-xs font-bold text-slate-700 dark:text-stone-300 mt-0.5" dir="rtl">
                          {arabic}
                        </p>
                      )}
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {member.role || 'Member'}
                      </p>
                      {member.business && member.business !== member.role && (
                        <p className="text-xs text-slate-600 dark:text-stone-300 font-semibold mt-0.5">
                          🏢 {member.business}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${stage.bg} ${stage.text} ${stage.border}`}
                  >
                    {stage.icon} {stage.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {member.lookingFor && (
                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-1">
                      <span className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider block">
                        🎯 Looking For (Need)
                      </span>
                      <p className="text-slate-800 dark:text-stone-200 text-xs leading-relaxed" dir="auto">
                        {member.lookingFor}
                      </p>
                    </div>
                  )}

                  {member.canHelp && (
                    <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider block">
                        💡 Can Help With (Skill / Offer)
                      </span>
                      <p className="text-slate-800 dark:text-stone-200 text-xs leading-relaxed" dir="auto">
                        {member.canHelp}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        downloadVCardFile(member, false);
                        notify(`Saved ${member.name}'s contact card`);
                      }}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-800 dark:text-stone-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Download size={14} />
                      <span>Save Contact (.vcf)</span>
                    </button>

                    {isLinkedInValid && (
                      <a
                        href={linkedInHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-800"
                      >
                        <Linkedin size={14} />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setDetailMember(null)}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:opacity-90 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

    </div>
  );
}
