import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Bookmark,
  Check,
  X,
  Share2,
  MapPin,
  ExternalLink,
  Linkedin,
  RefreshCw,
  Send,
  HeartHandshake,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { explainProfileStrength } from '../../utils/explainability';
import { getInitials, getAvatarGradient, isValidLinkedInUrl, formatLinkedInUrl } from '../../utils/helpers';
import { STAGES, getCountryFlag } from '../../utils/constants';
import { saveQuickMatchBookmark, saveCollabRequest } from '../../utils/storage';
import { pushCollabToSheets } from '../../utils/sheetsSync';
import Modal from '../common/Modal';

export default function QuickMatchDeck() {
  const { activeMembers: members, language = 'en', notify } = useApp();
  const isAr = language === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [collabModalMember, setCollabModalMember] = useState(null);
  const [collabNote, setCollabNote] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Generate today's 5 curated matches from members
  const deckMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    // Sort or filter by high profile strength & complementary asks/offers
    const sorted = [...members].sort((a, b) => {
      const scoreA = explainProfileStrength(a).score;
      const scoreB = explainProfileStrength(b).score;
      return scoreB - scoreA;
    });
    return sorted.slice(0, 10);
  }, [members]);

  const currentMember = deckMembers[currentIndex];
  const hasMore = currentIndex < deckMembers.length;

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleBookmark = () => {
    if (!currentMember) return;
    saveQuickMatchBookmark(currentMember.id);
    notify(
      isAr
        ? `⭐ تم حفظ ${currentMember.name} في قائمتك`
        : `⭐ Saved ${currentMember.name} to your watchlist`
    );
    setCurrentIndex((prev) => prev + 1);
  };

  const handleOpenCollab = () => {
    setCollabModalMember(currentMember);
    setCollabNote('');
  };

  const handleSendCollab = async (e) => {
    e?.preventDefault?.();
    if (!senderEmail || !senderEmail.includes('@')) {
      notify(isAr ? 'يرجى كتابة بريدك الإلكتروني' : 'Please enter your email', 'warning');
      return;
    }
    setIsSending(true);
    const payload = {
      targetMemberId: collabModalMember.id,
      targetMemberName: collabModalMember.name,
      senderEmail: senderEmail.trim().toLowerCase(),
      note: collabNote.trim(),
      createdAt: new Date().toISOString(),
    };
    saveCollabRequest(payload);
    await pushCollabToSheets(payload);
    setIsSending(false);
    notify(
      isAr
        ? `🤝 تم إرسال طلب التواصل إلى ${collabModalMember.name}`
        : `🤝 Sent collaboration request to ${collabModalMember.name}`
    );
    setCollabModalMember(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!currentMember || !hasMore) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
          {isAr ? 'أنت على اطلاع بكل جديد اليوم! 🎉' : "You're all caught up for today! 🎉"}
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          {isAr
            ? 'لقد استعرضت ترشيحات اليوم. عد غداً لاكتشاف 5 مؤسسين جدد، أو تصفح الدليل الكامل.'
            : 'You reviewed all top recommendations for today. Check back tomorrow for fresh founder matches, or explore the full Directory.'}
        </p>
        <button
          type="button"
          onClick={() => setCurrentIndex(0)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>{isAr ? 'إعادة استعراض البطاقات' : 'Review Deck Again'}</span>
        </button>
      </div>
    );
  }

  const initials = getInitials(currentMember.name);
  const gradient = getAvatarGradient(currentMember.name);
  const strength = explainProfileStrength(currentMember);
  const stage = STAGES[currentMember.stage] || STAGES.idea;
  const flag = getCountryFlag(currentMember.location?.country);
  const isLinkedInValid = isValidLinkedInUrl(currentMember.linkedin);
  const linkedInHref = isLinkedInValid ? formatLinkedInUrl(currentMember.linkedin) : null;

  return (
    <div className="max-w-lg mx-auto py-2 sm:py-6 px-2 sm:px-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Deck Info */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-extrabold text-stone-900 dark:text-white uppercase tracking-wider font-display">
            {isAr ? 'ترشيحات اليوم السريعة' : "Today's Quick Matches"}
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">
          {currentIndex + 1} / {deckMembers.length}
        </span>
      </div>

      {/* Main Swipeable-Style Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden transition-all duration-300">
        {/* Luminous Top Gradient */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header: Avatar, Name, Role, Score */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 flex items-center justify-center p-1">
              <svg className="w-16 h-16 -rotate-90 pointer-events-none" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-stone-200 dark:text-stone-800"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="transparent"
                  stroke={strength.score >= 70 ? '#10b981' : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="119.38"
                  strokeDashoffset={119.38 - (119.38 * strength.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div
                className={`absolute inset-2.5 rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-lg flex items-center justify-center shadow-md`}
              >
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 text-sm bg-white dark:bg-stone-900 rounded-full border border-stone-200 dark:border-stone-700 p-0.5 shadow-xs">
                {strength.tier?.icon || '🥉'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-lg font-black text-stone-900 dark:text-white truncate">
                  {currentMember.name}
                </h3>
                {flag && <span className="text-sm">{flag}</span>}
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {currentMember.role || (isAr ? 'مؤسس مشروع' : 'Founder')}
              </p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate mt-0.5">
                {currentMember.business || (isAr ? 'مشروع واعد' : 'Active Venture')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${stage.bg} ${stage.text}`}>
                  {stage.icon} {stage.label}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {isAr ? `قوة الملف ${strength.score}%` : `Profile ${strength.score}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Needs & Offers Match Highlights */}
          <div className="space-y-2.5 pt-1">
            {currentMember.lookingFor && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
                  🎯 {isAr ? 'يبحث عن:' : 'LOOKING FOR:'}
                </span>
                <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                  {currentMember.lookingFor}
                </p>
              </div>
            )}

            {currentMember.canHelp && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block mb-1">
                  💡 {isAr ? 'يمكن المساعدة في:' : 'CAN HELP WITH:'}
                </span>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
                  {currentMember.canHelp}
                </p>
              </div>
            )}
          </div>

          {/* Location & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <MapPin size={13} className="text-emerald-500" />
              <span>
                {currentMember.location?.city || currentMember.location?.country || 'Cairo, Egypt'}
              </span>
            </div>
            {isLinkedInValid && (
              <a
                href={linkedInHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                <Linkedin size={13} />
                <span>LinkedIn</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-stone-50 dark:bg-stone-850/80 px-6 py-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3">
          {/* Pass Button */}
          <button
            type="button"
            onClick={handlePass}
            className="flex-1 py-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
          >
            <X size={16} className="text-stone-400" />
            <span>{isAr ? 'تخطي' : 'Pass'}</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            className="p-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-600 hover:text-amber-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
            title={isAr ? 'حفظ في قائمتك' : 'Save for Later'}
          >
            <Bookmark size={16} />
          </button>

          {/* Connect Button */}
          <button
            type="button"
            onClick={handleOpenCollab}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
          >
            <HeartHandshake size={16} />
            <span>{isAr ? 'تواصل وشراكة' : 'Connect'}</span>
          </button>
        </div>
      </div>

      {/* Internal Collaboration Modal (Zero WhatsApp) */}
      {collabModalMember && (
        <Modal
          isOpen={Boolean(collabModalMember)}
          onClose={() => setCollabModalMember(null)}
          title={
            isAr
              ? `طلب تواصل وشراكة مع ${collabModalMember.name}`
              : `Connect with ${collabModalMember.name}`
          }
          size="sm"
        >
          <form onSubmit={handleSendCollab} className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
            <p className="text-stone-600 dark:text-stone-300">
              {isAr
                ? 'أرسل رسالة تواصل مباشرة على المنصة. سيتم إشعار العضو عبر بريده الإلكتروني.'
                : 'Send an on-platform partnership note. They will be notified directly with your details.'}
            </p>
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-200">
                {isAr ? 'بريدك الإلكتروني:' : 'Your Email:'}
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-200">
                {isAr ? 'رسالتك أو فكرة التعاون:' : 'How would you like to collaborate?'}
              </label>
              <textarea
                rows={3}
                required
                value={collabNote}
                onChange={(e) => setCollabNote(e.target.value)}
                placeholder={
                  isAr
                    ? 'مرحباً، أود التنسيق معك بشأن...'
                    : 'Hi, I saw your profile and would love to explore collaborating on...'
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollabModalMember(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
              >
                <Send size={13} />
                <span>{isSending ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إرسال الطلب' : 'Send Request')}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
