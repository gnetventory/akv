import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  Users,
  Linkedin,
  Trash2,
  Eye,
  ExternalLink,
  Download,
  CheckCircle2,
  FileText,
  Star,
  Sparkles,
  Dices,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  memberMatchesSearch,
  getInitials,
  getAvatarGradient,
  isValidLinkedInUrl,
  formatLinkedInUrl,
  downloadVCardFile,
  getMemberWebsites,
  parseMemberName,
} from '../../utils/helpers';
import { STAGES, STAGE_OPTIONS, getCountryFlag, GOOGLE_FORM_URL, CONTROLLED_SECTORS, getMemberCanonicalSector } from '../../utils/constants';
import { deleteMember } from '../../utils/storage';
import { pushMemberDeleteToSheets } from '../../utils/sheetsSync';
import { useDebounce } from '../../utils/useDebounce';
import { isAdminSession } from '../../utils/session';
import {
  getBookmarkedIds,
  getRandomSynergyFounder,
  isMemberBookmarked,
  toggleBookmarkId,
} from '../../utils/psychologyHelpers';
import { explainSurpriseSynergy } from '../../utils/explainability';
import ProfileCard from './ProfileCard';
import EmptyState from './EmptyState';
import Modal from '../common/Modal';
import NewMemberSpotlight from './NewMemberSpotlight';

function matchesIntentPreset(m, preset) {
  if (!m || preset === 'all') return true;
  if (preset === 'saved') return isMemberBookmarked(m.id);

  const text = [
    m.lookingFor || '',
    m.business || '',
    m.role || '',
    (m.tags || []).join(' '),
    (m.seeking || []).join(' '),
  ].join(' ').toLowerCase();

  switch (preset) {
    case 'sos':
      return (
        text.includes('urgent') ||
        text.includes('عاجل') ||
        text.includes('ضروري') ||
        text.includes('48') ||
        text.includes('sos') ||
        text.includes('سريع')
      );
    case 'cofounder':
      return (
        text.includes('co-founder') ||
        text.includes('cofounder') ||
        text.includes('شريك') ||
        text.includes('شراكة') ||
        text.includes('تأسيس')
      );
    case 'capital':
      return (
        text.includes('استثمار') ||
        text.includes('مستثمر') ||
        text.includes('تمويل') ||
        text.includes('capital') ||
        text.includes('fund') ||
        text.includes('invest') ||
        text.includes('angel') ||
        text.includes('seed') ||
        text.includes('raise')
      );
    case 'distribution':
      return (
        text.includes('توزيع') ||
        text.includes('موزع') ||
        text.includes('مبيعات') ||
        text.includes('وكيل') ||
        text.includes('b2b') ||
        text.includes('distribution') ||
        text.includes('distributor') ||
        text.includes('retail') ||
        text.includes('sales')
      );
    case 'export':
      return (
        text.includes('export') ||
        text.includes('تصدير') ||
        text.includes('توسع') ||
        text.includes('خارجي') ||
        text.includes('سعودية') ||
        text.includes('خليج') ||
        text.includes('expansion')
      );
    default:
      return true;
  }
}

export default function Directory() {
  const {
    activeMembers: members,
    refreshMembers,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    viewMode,
    setViewMode,
    notify,
  } = useApp();

  const [tagFilter, setTagFilter] = useState('');
  const [smartPreset, setSmartPreset] = useState('all'); // 'all' | 'saved' | 'partners' | 'growing' | 'export'
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Serendipity Dice State
  const [serendipityFounder, setSerendipityFounder] = useState(null);
  const [isRollingDice, setIsRollingDice] = useState(false);

  const isAdmin = isAdminSession();

  // Modal states for Compact Table view
  const [detailMember, setDetailMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Bookmarked IDs
  const bookmarkedIds = useMemo(() => getBookmarkedIds(), [members, smartPreset]);

  // Controlled Canonical Sectors with Member Counts
  const sectorCounts = useMemo(() => {
    const counts = {};
    CONTROLLED_SECTORS.forEach((s) => {
      counts[s.label] = 0;
    });
    members.forEach((m) => {
      const sector = getMemberCanonicalSector(m);
      if (counts[sector] !== undefined) {
        counts[sector]++;
      }
    });
    return CONTROLLED_SECTORS.map((s) => ({
      ...s,
      count: counts[s.label] || 0,
    })).filter((s) => s.count > 0);
  }, [members]);

  // High-Signal Intent Preset Counts
  const presetCounts = useMemo(() => {
    const safeMembers = Array.isArray(members) ? members : [];
    return {
      sos: safeMembers.filter((m) => matchesIntentPreset(m, 'sos')).length,
      cofounder: safeMembers.filter((m) => matchesIntentPreset(m, 'cofounder')).length,
      capital: safeMembers.filter((m) => matchesIntentPreset(m, 'capital')).length,
      distribution: safeMembers.filter((m) => matchesIntentPreset(m, 'distribution')).length,
      exportCount: safeMembers.filter((m) => matchesIntentPreset(m, 'export')).length,
      saved: safeMembers.filter((m) => isMemberBookmarked(m.id)).length,
    };
  }, [members, bookmarkedIds]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    let result = Array.isArray(members) ? [...members] : [];

    // 1. High-Signal Intent Presets
    if (smartPreset !== 'all') {
      result = result.filter((m) => matchesIntentPreset(m, smartPreset));
    }

    // 2. Stage filter
    if (stageFilter !== 'all') {
      result = result.filter((m) => m.stage === stageFilter);
    }

    // 3. Controlled Sector filter
    if (tagFilter) {
      result = result.filter((m) => getMemberCanonicalSector(m) === tagFilter);
    }

    // 4. Search query
    if (debouncedSearch) {
      result = result.filter((m) => memberMatchesSearch(m, debouncedSearch));
    }

    // 5. Standard sorting
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'location') {
        valA =
          typeof a.location === 'string'
            ? a.location
            : `${a.location?.city || ''} ${a.location?.country || ''}`;
        valB =
          typeof b.location === 'string'
            ? b.location
            : `${b.location?.city || ''} ${b.location?.country || ''}`;
      }
      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB);
        return sortDir === 'asc' ? comp : -comp;
      }
      return sortDir === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    return result;
  }, [members, smartPreset, stageFilter, tagFilter, debouncedSearch, sortField, sortDir]);

  const handleRollSerendipity = () => {
    setIsRollingDice(true);
    setTimeout(() => {
      const luckyFounder = getRandomSynergyFounder(members);
      setSerendipityFounder(luckyFounder);
      setIsRollingDice(false);
    }, 450);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setTagFilter('');
    setSmartPreset('all');
  };

  const handleDeleteMember = () => {
    if (!memberToDelete) return;
    deleteMember(memberToDelete.id);
    pushMemberDeleteToSheets(memberToDelete, 'Deleted by User in Web App');
    refreshMembers();
    notify(`Removed ${memberToDelete.name} from directory`);
    setMemberToDelete(null);
  };

  const handleDownloadVCard = (e, m) => {
    e?.stopPropagation?.();
    downloadVCardFile(m, isAdmin);
    notify(`Saved ${m.name}'s contact card (.vcf)`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl pb-12">
      {/* Official Google Form Intake & BGM Network Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-4 sm:p-5 border border-stone-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* BGM Logo integration */}
          <div className="relative shrink-0">
            <img
              src="/bgm-logo.jpg"
              alt="BGM Community"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-sm ring-2 ring-emerald-500/40 border border-stone-700"
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-stone-900 shadow-xs" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2 font-display">
                BGM Smart Entrepreneurs Network
              </h3>
              <span className="text-[9.5px] sm:text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Verified Ecosystem
              </span>
            </div>
            <p className="text-xs text-stone-300 font-medium mt-0.5">
              Register new ventures, update looking-for requests, or explore serendipity introductions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Serendipity Dice Button */}
          <button
            onClick={handleRollSerendipity}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-md shadow-sm transition-all cursor-pointer active:scale-95 min-h-[40px]"
            title="Roll the Serendipity Dice for a surprise synergy match!"
          >
            <Dices size={15} className={`text-amber-400 ${isRollingDice ? 'animate-spin' : ''}`} />
            <span>Surprise Synergy</span>
          </button>

          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer active:scale-95 min-h-[40px]"
          >
            <span>Update Profile</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── Sticky Top Container: Glass-Bento Controls ──── */}
      <div className="sticky top-[58px] sm:top-[69px] z-20 space-y-3 bg-[#FAFAF7]/95 dark:bg-stone-950/95 backdrop-blur-md pb-2 pt-1 transition-colors">
        
        {/* ── Glass-Bento Directory Control Panel ──── */}
        <div className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-emerald-200/70 dark:border-stone-800 shadow-[0_4px_24px_rgba(16,185,129,0.06)] space-y-3.5">
          
          {/* Top Row: Title, Counter & View Mode Toggles */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-100/70 dark:border-stone-800 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center gap-2 font-display">
                <Users className="text-emerald-600 dark:text-emerald-400" size={22} />
                Directory Explorer
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                Showing{' '}
                <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {filteredMembers.length}
                </strong>{' '}
                of{' '}
                <strong className="text-stone-900 dark:text-stone-100 font-bold">
                  {members.length}
                </strong>{' '}
                verified founders & strategic operators
              </p>
            </div>

            {/* View Toggle & Clear Filters */}
            <div className="flex items-center gap-2">
              {(smartPreset !== 'all' || stageFilter !== 'all' || tagFilter || searchQuery) && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer mr-2"
                >
                  <RotateCcw size={12} /> Clear filters
                </button>
              )}

              <div className="flex items-center gap-1 bg-emerald-50/60 dark:bg-stone-800 p-1 rounded-2xl border border-emerald-200/60 dark:border-stone-700 self-start md:self-auto shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode !== 'table'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-emerald-600'
                  }`}
                  title="Glass-Bento modular card grid"
                >
                  <LayoutGrid size={14} /> Bento Grid
                </button>

                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-emerald-600'
                  }`}
                  title="High-density scannable table"
                >
                  <TableIcon size={14} /> Table View
                </button>
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search founders, company, role, need, offer, location, skills, or tags..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-2xl border border-emerald-200/70 dark:border-stone-700 bg-white/80 dark:bg-stone-850 focus:bg-white dark:focus:bg-stone-900 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-2xs placeholder:text-stone-400"
            />
          </div>

          {/* 1-Tap High-Signal Intent Discovery Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 shrink-0">
              <Sparkles size={11} className="text-emerald-600" /> Intent:
            </span>

            <button
              onClick={() => setSmartPreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                smartPreset === 'all'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              All Founders ({members.length})
            </button>

            <button
              onClick={() => setSmartPreset('sos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'sos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              }`}
            >
              <span>🚨 Urgent Asks</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.sos}</span>
            </button>

            <button
              onClick={() => setSmartPreset('cofounder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'cofounder'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100'
              }`}
            >
              <span>🤝 Co-Founders</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.cofounder}</span>
            </button>

            <button
              onClick={() => setSmartPreset('capital')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'capital'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
              }`}
            >
              <span>💸 Raising Capital</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.capital}</span>
            </button>

            <button
              onClick={() => setSmartPreset('distribution')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'distribution'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-cyan-50/80 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/60 hover:bg-cyan-100'
              }`}
            >
              <span>📦 B2B Distribution</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.distribution}</span>
            </button>

            <button
              onClick={() => setSmartPreset('export')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'export'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100'
              }`}
            >
              <span>🌍 Export</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.exportCount}</span>
            </button>

            <button
              onClick={() => setSmartPreset('saved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                smartPreset === 'saved'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              <Star size={11} className={smartPreset === 'saved' ? 'fill-white' : 'fill-amber-500 text-amber-500'} />
              <span>Saved Watchlist</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{presetCounts.saved}</span>
            </button>
          </div>

          {/* Filter Badges & Industry Selector */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter size={11} className="text-emerald-600" /> Stage:
            </span>

            {['all', ...STAGE_OPTIONS].map((s) => {
              const stage = STAGES[s];
              const isActive = stageFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isActive
                      ? s === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-stone-900 dark:border-white shadow-xs'
                        : `${stage.bg} ${stage.text} ${stage.border} shadow-xs ring-1 ring-offset-1`
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-emerald-100 dark:border-stone-800 hover:border-emerald-400'
                  }`}
                >
                  {s === 'all' ? '✨ All Stages' : `${stage.icon} ${stage.label}`}
                </button>
              );
            })}

            {/* Controlled Sector Selector */}
            {sectorCounts.length > 0 && (
              <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-between sm:justify-start gap-1.5 pt-1 sm:pt-0">
                <span className="text-xs font-bold text-stone-500 flex items-center gap-1 shrink-0">
                  <SlidersHorizontal size={12} className="text-emerald-600" /> Sector:
                </span>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="flex-1 sm:flex-none text-xs font-bold bg-white dark:bg-stone-900 border border-emerald-200 dark:border-stone-700 rounded-xl px-2.5 py-1 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-2xs"
                >
                  <option value="">All Sectors ({members.length} Members)</option>
                  {sectorCounts.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label} ({s.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 🎉 Welcome New Members Celebration Spotlight ─────────────────── */}
      <NewMemberSpotlight members={members} onSelectMember={setDetailMember} />

      {/* ── View Output ──────────────────────────────────────────────────────── */}
      {filteredMembers.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'table' ? (
        /* ── Compact Table View ─────────────────────────────────────────────── */
        <div className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border border-emerald-200/70 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 dark:bg-stone-850 border-b border-emerald-100 dark:border-stone-800 text-[11px] uppercase tracking-wider font-extrabold text-stone-600 dark:text-stone-400">
                  <th className="py-3.5 px-4">Member / Name</th>
                  <th className="py-3.5 px-4">Role & Venture</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Needs & Offers</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/60 dark:divide-stone-800/60">
                {filteredMembers.map((m) => {
                  const { english, arabic, primary } = parseMemberName(m.name);
                  const stage = STAGES[m.stage] || STAGES.idea;
                  const initials = getInitials(m.name);
                  const gradient = getAvatarGradient(m.name);
                  const isLinkedInValid = isValidLinkedInUrl(m.linkedin);
                  const linkedInHref = isLinkedInValid ? formatLinkedInUrl(m.linkedin) : null;
                  const websites = getMemberWebsites(m);
                  const isSaved = isMemberBookmarked(m.id);
                  const locLabel =
                    typeof m.location === 'string'
                      ? m.location
                      : [m.location?.city, m.location?.country].filter(Boolean).join(', ');

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setDetailMember(m)}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                    >
                      {/* Member / Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {english ? (
                                <span className="font-extrabold text-stone-900 dark:text-stone-100 block text-xs sm:text-sm truncate hover:text-emerald-600 transition-colors">
                                  {english}
                                </span>
                              ) : (
                                <span className="font-extrabold text-stone-900 dark:text-stone-100 block text-xs sm:text-sm truncate hover:text-emerald-600 transition-colors" dir="rtl">
                                  {arabic || primary}
                                </span>
                              )}
                              {isSaved && <Star size={12} className="fill-amber-500 text-amber-500 shrink-0" />}
                            </div>
                            {english && arabic && (
                              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block truncate" dir="rtl">
                                {arabic}
                              </span>
                            )}
                            {isAdmin && m.phone && (
                              <span className="text-[10.5px] text-stone-400 font-mono block">
                                {m.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Company */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs truncate max-w-[200px]">
                          {m.role || 'Member'}
                        </span>
                        <span className="text-[11px] text-stone-500 truncate max-w-[200px] block">
                          {m.business || '—'}
                        </span>
                      </td>

                      {/* Stage Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`badge ${stage.bg} ${stage.text} border ${stage.border} text-[10.5px] font-bold px-2 py-0.5 rounded-full`}
                        >
                          {stage.icon} {stage.label}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 font-medium text-stone-600 dark:text-stone-300 text-xs">
                        {getCountryFlag(m.location?.country)} {locLabel || 'Global'}
                      </td>

                      {/* Needs & Offers */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        {m.lookingFor && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-300 truncate">
                            <strong>Need:</strong> {m.lookingFor}
                          </div>
                        )}
                        {m.canHelp && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                            <strong>Offer:</strong> {m.canHelp}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Bookmark Toggle */}
                          <button
                            onClick={() => {
                              const isNow = toggleBookmarkId(m.id);
                              refreshMembers();
                              notify(isNow ? `⭐ Saved ${m.name}` : `Removed ${m.name}`);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSaved
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                : 'text-stone-300 hover:text-amber-500'
                            }`}
                            title="Toggle Watchlist"
                          >
                            <Star size={13} className={isSaved ? 'fill-amber-500' : ''} />
                          </button>

                          {isLinkedInValid && (
                            <a
                              href={linkedInHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                              title="LinkedIn"
                            >
                              <Linkedin size={13} />
                            </a>
                          )}
                          {websites.map((w, idx) => (
                            <a
                              key={`${w.url}-${idx}`}
                              href={w.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-800 hover:text-white transition-all"
                              title={`Visit ${w.label} (${w.url})`}
                            >
                              <ExternalLink size={13} />
                            </a>
                          ))}
                          <button
                            onClick={() => setDetailMember(m)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-stone-800 text-emerald-700 dark:text-stone-300 hover:bg-emerald-600 hover:text-white font-bold cursor-pointer transition-colors"
                            title="View Full Profile"
                          >
                            <Eye size={13} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setMemberToDelete(m)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                              title="Delete Member (Admin)"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card List View */}
          <div className="md:hidden divide-y divide-emerald-100/70 dark:divide-stone-800">
            {filteredMembers.map((m) => {
              const { english, arabic, primary } = parseMemberName(m.name);
              const stage = STAGES[m.stage] || STAGES.idea;
              const initials = getInitials(m.name);
              const gradient = getAvatarGradient(m.name);
              const isLinkedInValid = isValidLinkedInUrl(m.linkedin);
              const linkedInHref = isLinkedInValid ? formatLinkedInUrl(m.linkedin) : null;
              const websites = getMemberWebsites(m);
              const isSaved = isMemberBookmarked(m.id);
              const locLabel =
                typeof m.location === 'string'
                  ? m.location
                  : [m.location?.city, m.location?.country].filter(Boolean).join(', ');

              return (
                <div
                  key={`mobile-${m.id}`}
                  onClick={() => setDetailMember(m)}
                  className="p-4 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors space-y-3"
                >
                  {/* Row 1: Avatar, Name & Stage Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {english ? (
                            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm truncate">
                              {english}
                            </span>
                          ) : (
                            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm truncate" dir="rtl">
                              {arabic || primary}
                            </span>
                          )}
                          {isSaved && <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />}
                        </div>
                        {english && arabic && (
                          <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block truncate" dir="rtl">
                            {arabic}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`badge ${stage.bg} ${stage.text} border ${stage.border} text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0`}
                    >
                      {stage.icon} {stage.label}
                    </span>
                  </div>

                  {/* Row 2: Role, Business & Location */}
                  <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 gap-2">
                    <div className="truncate">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{m.role || 'Member'}</span>
                      {m.business && <span className="text-stone-500 dark:text-stone-400"> · {m.business}</span>}
                    </div>
                    <div className="shrink-0 text-[11px] text-stone-500 font-medium">
                      {getCountryFlag(m.location?.country)} {locLabel || 'Global'}
                    </div>
                  </div>

                  {/* Row 3: Needs & Offers compact */}
                  {(m.lookingFor || m.canHelp) && (
                    <div className="space-y-1 pt-0.5">
                      {m.lookingFor && (
                        <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-900/40 truncate">
                          <strong className="font-bold">🎯 Need:</strong> {m.lookingFor}
                        </div>
                      )}
                      {m.canHelp && (
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 truncate">
                          <strong className="font-bold">💡 Offer:</strong> {m.canHelp}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 4: Actions Bar with Touch Friendly Targets */}
                  <div
                    className="flex items-center justify-between pt-1 border-t border-emerald-100/50 dark:border-stone-800/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const isNow = toggleBookmarkId(m.id);
                          refreshMembers();
                          notify(isNow ? `⭐ Saved ${m.name}` : `Removed ${m.name}`);
                        }}
                        className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl transition-all ${
                          isSaved
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                            : 'text-stone-400 bg-stone-100 dark:bg-stone-800 hover:text-amber-500'
                        }`}
                        title="Toggle Watchlist"
                      >
                        <Star size={14} className={isSaved ? 'fill-amber-500' : ''} />
                      </button>

                      {isLinkedInValid && (
                        <a
                          href={linkedInHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-200/50 dark:border-blue-900/40"
                          title="LinkedIn"
                        >
                          <Linkedin size={14} />
                        </a>
                      )}

                      {websites.map((w, idx) => (
                        <a
                          key={`mobile-${w.url}-${idx}`}
                          href={w.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white transition-all border border-stone-200 dark:border-stone-700"
                          title={`Visit ${w.label}`}
                        >
                          <ExternalLink size={14} />
                        </a>
                      ))}

                      {isAdmin && (
                        <button
                          onClick={() => setMemberToDelete(m)}
                          className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border border-rose-200/50 dark:border-rose-900/40"
                          title="Delete Member (Admin)"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setDetailMember(m)}
                      className="px-3 py-1.5 min-h-[38px] rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                    >
                      <Eye size={13} />
                      <span>Profile</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Glass-Bento Grid View (Strict 3-Column Responsive Layout) ──────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredMembers.map((m) => (
            <ProfileCard
              key={m.id}
              member={m}
              onDeleted={refreshMembers}
              onUpdated={refreshMembers}
            />
          ))}
        </div>
      )}

      {/* ── 🎲 Serendipity Dice Discovery Modal ───────────────────────────────── */}
      {serendipityFounder && (
        <Modal
          isOpen={!!serendipityFounder}
          onClose={() => setSerendipityFounder(null)}
          title="✨ Serendipity Founder Spotlight"
          size="md"
        >
          <div className="space-y-4 text-xs text-stone-900 dark:text-stone-100">
            <div className="p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                    serendipityFounder.name
                  )} text-white font-black text-base flex items-center justify-center shrink-0 ring-2 ring-white/30`}
                >
                  {getInitials(serendipityFounder.name)}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{serendipityFounder.name}</h4>
                  <p className="text-xs text-emerald-200">{serendipityFounder.role || 'Member'}</p>
                  <p className="text-[11px] text-stone-300 truncate max-w-xs">{serendipityFounder.business}</p>
                </div>
              </div>
              <span className="text-2xl animate-bounce">🎲</span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-[11px] mb-1">
                🌟 Why this serendipity connection?
              </span>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {explainSurpriseSynergy(serendipityFounder)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleRollSerendipity}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 flex items-center gap-1.5"
              >
                <Dices size={13} />
                <span>Roll Again</span>
              </button>
              <button
                onClick={() => {
                  const m = serendipityFounder;
                  setSerendipityFounder(null);
                  setDetailMember(m);
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>View Full Profile</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Member Modal for Table View */}
      {detailMember && (
        <Modal
          isOpen={!!detailMember}
          onClose={() => setDetailMember(null)}
          title="Member Details"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-850 rounded-2xl">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                  detailMember.name
                )} text-white font-bold text-base flex items-center justify-center shrink-0`}
              >
                {getInitials(detailMember.name)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  {detailMember.name}
                </h3>
                <p className="text-xs font-semibold text-emerald-600">{detailMember.role}</p>
                <p className="text-xs text-stone-500">{detailMember.business}</p>
              </div>
            </div>

            {detailMember.lookingFor && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 dark:text-amber-300 block text-[11px] mb-0.5">
                  🎯 Looking For:
                </span>
                <p className="text-stone-800 dark:text-stone-200">{detailMember.lookingFor}</p>
              </div>
            )}

            {detailMember.canHelp && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-[11px] mb-0.5">
                  💡 Can Help With:
                </span>
                <p className="text-stone-800 dark:text-stone-200">{detailMember.canHelp}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDetailMember(null)}
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Member Confirmation Modal for Table */}
      {memberToDelete && (
        <Modal
          isOpen={!!memberToDelete}
          onClose={() => setMemberToDelete(null)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-stone-700 dark:text-stone-300">
              Are you sure you want to remove <strong>{memberToDelete.name}</strong> from the directory?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
