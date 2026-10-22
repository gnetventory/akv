import React, { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Search,
  Filter,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { computeMemberSynergy, explainSynergy } from '../../utils/executiveAnalytics';
import { STAGES, STAGE_OPTIONS, getCountryFlag } from '../../utils/constants';
import { useDebounce } from '../../utils/useDebounce';
import { enhancedMemberMatchesSearch } from '../../utils/searchEngine';
import ProfileCard from '../directory/ProfileCard';
import EmptyState from '../directory/EmptyState';
import ScoreExplainerModal from '../common/ScoreExplainerModal';

const MY_PROFILE_KEY = 'sed_my_profile_id';

export default function MatchRadarView() {
  const { activeMembers: members, refreshMembers, notify } = useApp();
  
  // Initialize target founder from localStorage if saved
  const [targetMemberId, setTargetMemberId] = useState(() => {
    const saved = localStorage.getItem(MY_PROFILE_KEY);
    return saved && members.some((m) => m.id === saved) ? saved : members[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [explainingCandidate, setExplainingCandidate] = useState(null);
  const [showTopFiveOnly, setShowTopFiveOnly] = useState(true);
  const [minMatchThreshold, setMinMatchThreshold] = useState(35); // 35: minimum real fit

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Selected Target Founder
  const targetMember = useMemo(() => {
    return members.find((m) => m.id === targetMemberId) || members[0] || null;
  }, [members, targetMemberId]);

  // Check if current target is saved as "My Profile"
  const isMyProfile = useMemo(() => {
    return targetMemberId === localStorage.getItem(MY_PROFILE_KEY);
  }, [targetMemberId]);

  const handleSetMyProfile = () => {
    if (!targetMember) return;
    localStorage.setItem(MY_PROFILE_KEY, targetMember.id);
    notify(`👤 Set "${targetMember.name}" as your default profile.`);
  };

  // Ranked Members by Synergy Score with 1-Line Explanation
  const rankedMembers = useMemo(() => {
    if (!targetMember) return [];

    let list = members.filter((m) => m.id !== targetMember.id);

    // Apply stage filter
    if (stageFilter !== 'all') {
      list = list.filter((m) => m.stage === stageFilter);
    }

    // Apply search with multilingual stemming
    if (debouncedSearch) {
      list = list.filter((m) => enhancedMemberMatchesSearch(m, debouncedSearch));
    }

    // Compute calibrated synergy scores and explanations
    const scoredList = list
      .map((m) => {
        const score = computeMemberSynergy(targetMember, m);
        const reason = explainSynergy(targetMember, m);
        return {
          ...m,
          synergyScore: score,
          synergyReason: reason,
        };
      })
      .filter((m) => m.synergyScore >= minMatchThreshold)
      .sort((a, b) => b.synergyScore - a.synergyScore);

    return scoredList;
  }, [members, targetMember, stageFilter, debouncedSearch, minMatchThreshold]);

  // Displayed list (Top 5 vs All)
  const displayedMembers = useMemo(() => {
    if (showTopFiveOnly) {
      return rankedMembers.slice(0, 5);
    }
    return rankedMembers;
  }, [rankedMembers, showTopFiveOnly]);

  const targetFlag = getCountryFlag(targetMember?.location?.country);
  const targetStage = STAGES[targetMember?.stage] || STAGES.idea;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Match Radar Header & Controls ────────── */}
      <div className="space-y-4">
        {/* Header Banner */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800">
              <Radio size={13} className="text-orange-600 animate-pulse" />
              <span>Find Your Match • Reciprocal Synergy Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
              Top Complementary Matches & Synergies
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Matches based on what you are looking for vs what other founders in the directory offer.
            </p>
          </div>

          {/* Anchor: My Profile Indicator / Set Button */}
          <div className="flex items-center gap-2">
            {isMyProfile ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-2xs">
                <Check size={13} className="text-emerald-600" />
                <span>Default: Your Profile</span>
              </span>
            ) : (
              <button
                onClick={handleSetMyProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Save this member as your profile for future visits"
              >
                <UserCheck size={13} className="text-orange-600" />
                <span>Save as My Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Control Card: Target Founder Selector + Thresholds */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-3.5">
          {/* Top Row: Founder Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2 shrink-0">
              <Target size={16} className="text-orange-600 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Finding Matches For:
              </span>
            </div>

            <div className="flex-1 max-w-xl">
              <select
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className="w-full text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.business || m.role || 'Member'} ({m.location?.city || m.location?.country || 'Egypt'})
                  </option>
                ))}
              </select>
            </div>

            {targetMember && (
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className={`badge ${targetStage.bg} ${targetStage.text} text-[10px] font-bold px-2 py-0.5 border ${targetStage.border}`}>
                  {targetStage.icon} {targetStage.label}
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  {targetFlag} {targetMember.location?.city || 'Egypt'}
                </span>
              </div>
            )}
          </div>

          {/* Second Row: Search, Stage Filter & Thresholds */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter potential partners for ${targetMember?.name || 'founder'}...`}
                className="input pl-10 py-1.5 text-xs font-medium rounded-xl w-full"
              />
            </div>

            {/* Threshold & Scope Toggles */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                <button
                  onClick={() => setShowTopFiveOnly(true)}
                  className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                    showTopFiveOnly
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Top 5 Matches
                </button>
                <button
                  onClick={() => setShowTopFiveOnly(false)}
                  className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                    !showTopFiveOnly
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  All Matches ({rankedMembers.length})
                </button>
              </div>

              <select
                value={minMatchThreshold}
                onChange={(e) => setMinMatchThreshold(Number(e.target.value))}
                className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-2 sm:py-1 text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value={35}>Fit: Moderate (35%+)</option>
                <option value={50}>Fit: Strong (50%+)</option>
                <option value={70}>Fit: High Reciprocity (70%+)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ranked Results Grid ──────────────────────────────────────────────── */}
      {displayedMembers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center text-xl">
            🎯
          </div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            No Direct Synergies Above Threshold
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            No members matched with <strong>{targetMember?.name}</strong> at the {minMatchThreshold}% fit threshold. Try switching to <em>Moderate (35%+)</em> or select another founder above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 dark:border-orange-900/40 rounded-2xl flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-orange-500" />
              <span>
                Showing <strong>{displayedMembers.length}</strong> {showTopFiveOnly ? 'top' : ''} complementary partners for <strong>{targetMember?.name}</strong>.
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              Ranked by reciprocal need and capability overlap
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {displayedMembers.map((m) => (
              <div key={m.id} className="flex flex-col space-y-2">
                {/* 1-Line Match Rationale Pill */}
                <div className="p-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs flex items-center justify-between shadow-2xs">
                  <span className="font-bold text-amber-950 dark:text-amber-200 line-clamp-1">
                    ⚡ {m.synergyScore}% Fit: {m.synergyReason}
                  </span>
                  <button
                    onClick={() => setExplainingCandidate(m)}
                    className="ml-2 text-[10.5px] font-bold text-orange-700 dark:text-orange-300 hover:underline shrink-0 cursor-pointer"
                  >
                    Why?
                  </button>
                </div>

                <div className="flex-1">
                  <ProfileCard
                    member={m}
                    synergyScore={m.synergyScore}
                    onDeleted={refreshMembers}
                    onUpdated={refreshMembers}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Synergy Explainer Modal ────────────────────────────────────────── */}
      {explainingCandidate && (
        <ScoreExplainerModal
          isOpen={Boolean(explainingCandidate)}
          onClose={() => setExplainingCandidate(null)}
          type="synergy_match"
          targetMember={targetMember}
          candidateMember={explainingCandidate}
        />
      )}
    </div>
  );
}
