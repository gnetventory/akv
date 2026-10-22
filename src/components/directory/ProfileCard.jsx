import React, { useState, useEffect } from 'react';
import {
  Trash2,
  MapPin,
  Linkedin,
  CheckCircle2,
  Download,
  Mail,
  ExternalLink,
  Sparkles,
  FileText,
  Tag,
  Phone,
  Star,
  Copy,
  Check,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  getInitials,
  getAvatarGradient,
  isValidLinkedInUrl,
  formatLinkedInUrl,
  getLinkedInHandle,
  downloadVCardFile,
  getMemberWebsites,
  parseMemberName,
} from '../../utils/helpers';
import { STAGES, getCountryFlag } from '../../utils/constants';
import { deleteMember } from '../../utils/storage';
import { pushMemberDeleteToSheets } from '../../utils/sheetsSync';
import { useApp } from '../../contexts/AppContext';
import { isAdminSession } from '../../utils/session';
import {
  calculateProfileStrength,
  isMemberBookmarked,
  toggleBookmarkId,
} from '../../utils/psychologyHelpers';
import { explainProfileStrength } from '../../utils/explainability';
import { isRecentlyJoined } from '../../utils/welcomeAnnouncements';
import Modal from '../common/Modal';
import ScoreExplainerModal from '../common/ScoreExplainerModal';

export default function ProfileCard({ member, onDeleted, onUpdated, synergyScore = null }) {
  const { notify } = useApp();
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);

  const isAdmin = isAdminSession();
  const stage = STAGES[member.stage] || STAGES.idea;
  const initials = getInitials(member.name);
  const gradient = getAvatarGradient(member.name);
  const flag = getCountryFlag(member.location?.country);
  const websites = getMemberWebsites(member);

  const isLinkedInValid = isValidLinkedInUrl(member.linkedin);
  const linkedInHref = isLinkedInValid ? formatLinkedInUrl(member.linkedin) : null;
  const isNew = isRecentlyJoined(member, 14);

  // Calculate Endowed Progress Profile Strength & Badges
  const profileStrength = explainProfileStrength(member);
  const displayScore = synergyScore !== null ? synergyScore : profileStrength.score;

  useEffect(() => {
    setBookmarked(isMemberBookmarked(member.id));
  }, [member.id]);

  const handleToggleBookmark = (e) => {
    e?.stopPropagation?.();
    const isNowBookmarked = toggleBookmarkId(member.id);
    setBookmarked(isNowBookmarked);
    notify(
      isNowBookmarked
        ? `⭐ Added ${member.name} to your Saved Watchlist`
        : `Removed ${member.name} from Saved Watchlist`
    );
  };

  const handleDelete = () => {
    deleteMember(member.id);
    pushMemberDeleteToSheets(member, 'Deleted by User / Admin in Web App');
    onDeleted?.(member.id);
    notify(`Removed ${member.name} from directory`);
    setConfirmDelete(false);
  };

  const handleDownloadVCard = (e) => {
    e?.stopPropagation?.();
    downloadVCardFile(member, isAdmin);
    notify(`Saved ${member.name}'s contact card (.vcf)`);
  };

  const parseBulletPoints = (text = '') => {
    if (!text || typeof text !== 'string' || !text.trim()) return [];
    return text
      .split(/[,;\n•·]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1)
      .slice(0, 3);
  };

  const offeringItems = parseBulletPoints(member.canHelp);
  const seekingItems = parseBulletPoints(member.lookingFor);

  const locationLabel =
    typeof member.location === 'string'
      ? member.location
      : [member.location?.city || member.location?.district, member.location?.country]
          .filter(Boolean)
          .join(', ');

  const { english, arabic, primary } = parseMemberName(member.name);

  return (
    <>
      {/* ── Glass-Bento Hybrid Member Profile Card ─────────────────────────── */}
      <div
        onClick={() => setShowDetail(true)}
        className="group relative bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl border border-emerald-200/70 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-500/80 p-4 sm:p-5 pt-4 sm:pt-5 shadow-[0_4px_20px_rgba(16,185,129,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.18)] transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden h-full"
      >
        {/* Subtle luminous top border sheen */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent group-hover:via-emerald-500 transition-all duration-300" />

        <div className="space-y-3.5">
          {/* 1. Header: Avatar with gradient ring, Founder Name, Flag, and Synergy Dial */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white font-extrabold text-base flex items-center justify-center shadow-md ring-2 ring-emerald-100 dark:ring-stone-800`}
                >
                  {initials}
                </div>
                {/* Status Dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900 shadow-xs"
                  title="Verified BGM Community Founder"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {english ? (
                    <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {english}
                    </h3>
                  ) : (
                    <h3
                      className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      dir="rtl"
                    >
                      {arabic || primary}
                    </h3>
                  )}
                  {flag && <span className="text-xs shrink-0" title={member.location?.country}>{flag}</span>}
                  {isNew && (
                    <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                      ✨ New
                    </span>
                  )}
                </div>

                {english && arabic && (
                  <p className="text-[11px] font-bold text-stone-600 dark:text-stone-400 truncate" dir="rtl">
                    {arabic}
                  </p>
                )}

                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  {member.role || 'Venture Founder'}
                </p>
              </div>
            </div>

            {/* Synergy Match Dial & Bookmark Star */}
            <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleBookmark}
                  className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-all ${
                    bookmarked
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-stone-300 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title={bookmarked ? 'Saved in Watchlist' : 'Add to Watchlist'}
                >
                  <Star size={14} className={bookmarked ? 'fill-amber-500' : ''} />
                </button>

                <div
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 px-2 py-0.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                  title="Profile Readiness & Ecosystem Synergy Score"
                >
                  <span className="text-[11px] font-mono font-bold">{displayScore}%</span>
                  <span className="text-[9px] font-mono uppercase text-emerald-600 font-bold hidden sm:inline">Score</span>
                </div>
              </div>

              {locationLabel && (
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-700 max-w-[130px] truncate">
                  📍 {locationLabel}
                </span>
              )}
            </div>
          </div>

          {/* 2. Bento Sub-Tiles: Venture & Stage Micro-Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Venture Tile */}
            <div className="p-2.5 rounded-2xl bg-stone-50/80 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                VENTURE
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 text-[11.5px] line-clamp-2 leading-snug">
                {member.business || 'Venture & Strategic Initiative'}
              </span>
            </div>

            {/* Stage Tile */}
            <div className="p-2.5 rounded-2xl bg-stone-50/80 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                STAGE
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[11px] font-bold ${stage.text}`}>
                  {stage.icon} {stage.label}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Bento Needs & Offers Compartments */}
          <div className="space-y-2">
            {seekingItems.length > 0 && (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-2.5 text-xs">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-0.5">
                  <span>🎯</span> <span>LOOKING FOR:</span>
                </div>
                <p className="text-amber-950 dark:text-amber-200 text-[11.5px] font-medium line-clamp-2 leading-relaxed">
                  {seekingItems.join(' · ')}
                </p>
              </div>
            )}

            {offeringItems.length > 0 && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-2.5 text-xs">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-0.5">
                  <span>💡</span> <span>CAN HELP WITH:</span>
                </div>
                <p className="text-emerald-950 dark:text-emerald-200 text-[11.5px] font-medium line-clamp-2 leading-relaxed">
                  {offeringItems.join(' · ')}
                </p>
              </div>
            )}
          </div>

          {/* 4. Sector Tags & Special Recognition Badges */}
          <div className="space-y-1.5">
            {Array.isArray(member.tags) && member.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {member.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50/70 dark:bg-stone-800 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-semibold border border-emerald-200/50 dark:border-stone-700"
                  >
                    #{t}
                  </span>
                ))}
                {member.tags.length > 3 && (
                  <span className="text-[10px] font-bold text-stone-400 self-center">
                    +{member.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {profileStrength.specialBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {profileStrength.specialBadges.map((b) => (
                  <span
                    key={b.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${b.color}`}
                    title={b.description}
                  >
                    <span>{b.icon}</span>
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Aligned Action Footer Toolbar */}
        <div className="pt-3.5 mt-3 border-t border-emerald-100/70 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* LinkedIn */}
            {isLinkedInValid && (
              <a
                href={linkedInHref}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold border border-blue-200/60 dark:border-blue-800 shadow-2xs"
                title="Open LinkedIn"
              >
                <Linkedin size={14} />
              </a>
            )}

            {/* vCard Download */}
            <button
              onClick={handleDownloadVCard}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-2xs cursor-pointer"
              title="Download Contact (.vcf)"
            >
              <Download size={14} />
            </button>

            {/* Website External Links */}
            {websites.slice(0, 1).map((w, idx) => (
              <a
                key={`${w.url}-${idx}`}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-800 hover:text-white transition-all text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-2xs"
                title={`Visit ${w.label} (${w.url})`}
              >
                <ExternalLink size={14} />
              </a>
            ))}

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Delete member profile (Admin)"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* View Details Primary Action */}
          <button
            onClick={() => setShowDetail(true)}
            className="px-3.5 py-2 sm:py-1.5 min-h-[38px] text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Detailed Profile Modal with Glassmorphism ────────────────── */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Verified Member Profile & Synergy Details"
        size="lg"
      >
        <div className="space-y-5 text-stone-900 dark:text-stone-100 text-xs">
          {/* Header Card in Modal */}
          <div className="flex items-start justify-between gap-4 p-5 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-stone-800 dark:to-stone-900 rounded-3xl border border-emerald-200/80 dark:border-stone-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-2 ring-white dark:ring-stone-700`}
              >
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {english ? (
                    <h3 className="text-lg font-extrabold text-stone-950 dark:text-white">
                      {english}
                    </h3>
                  ) : (
                    <h3 className="text-lg font-extrabold text-stone-950 dark:text-white" dir="rtl">
                      {arabic || primary}
                    </h3>
                  )}
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-1 rounded-md ${
                      bookmarked ? 'text-amber-500' : 'text-stone-300 hover:text-amber-500'
                    }`}
                    title={bookmarked ? 'Saved in Watchlist' : 'Save to Watchlist'}
                  >
                    <Star size={16} className={bookmarked ? 'fill-amber-500' : ''} />
                  </button>
                </div>
                {english && arabic && (
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mt-0.5" dir="rtl">
                    {arabic}
                  </p>
                )}
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {member.role || 'Member'}
                </p>
                {member.business && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold mt-0.5">
                    🏢 {member.business}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${stage.bg} ${stage.text} ${stage.border}`}
              >
                {stage.icon} {stage.label}
              </span>
              {locationLabel && (
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  {flag} {locationLabel}
                </span>
              )}
            </div>
          </div>

          {/* Endowed Progress Profile Strength Ribbon */}
          <div className="p-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl border border-stone-800 shadow-md space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{profileStrength.tier.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide block text-white">
                      {profileStrength.tier.name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${profileStrength.tier.color}`}
                    >
                      Tier {profileStrength.tier.level}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Ecosystem Readiness & Discovery Tier
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowScoreExplainer(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/15 text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>📊 Why this score?</span>
                </button>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-emerald-400 block leading-none">
                    {profileStrength.score}%
                  </span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold">
                    Score
                  </span>
                </div>
              </div>
            </div>

            {/* Endowed Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-stone-800 overflow-hidden border border-stone-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${profileStrength.score}%` }}
                />
              </div>
              <p className="text-[10.5px] text-stone-400 italic">
                💡 {profileStrength.nextMilestoneTip}
              </p>
            </div>
          </div>

          {/* Bento Sub-Cards for Detail Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {member.lookingFor && (
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider block">
                  🎯 Looking For
                </span>
                <p className="text-stone-800 dark:text-stone-200 text-xs leading-relaxed" dir="auto">
                  {member.lookingFor}
                </p>
              </div>
            )}

            {member.canHelp && (
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider block">
                  💡 Can Help With
                </span>
                <p className="text-stone-800 dark:text-stone-200 text-xs leading-relaxed" dir="auto">
                  {member.canHelp}
                </p>
              </div>
            )}
          </div>

          {/* Original Intake Submission Text */}
          {member.originalText && (
            <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-500 text-[11px] uppercase tracking-wider block">
                📝 Original Community Bio
              </span>
              <p className="text-stone-700 dark:text-stone-300 text-xs whitespace-pre-wrap leading-relaxed" dir="auto">
                {member.originalText}
              </p>
            </div>
          )}

          {/* Action buttons inside modal */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadVCard}
                className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Save Contact Card (.vcf)</span>
              </button>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-xs hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Score Explainer Modal */}
      <ScoreExplainerModal
        isOpen={showScoreExplainer}
        onClose={() => setShowScoreExplainer(false)}
        member={member}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete Profile Confirmation"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-stone-700 dark:text-stone-300">
              Are you sure you want to remove <strong>{member.name}</strong> from the directory? This action syncs with Google Sheets.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
