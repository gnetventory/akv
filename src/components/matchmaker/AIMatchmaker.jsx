import React, { useState } from 'react';
import { Sparkles, MessageCircle, UserCheck, AlertCircle, Copy, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateMatches, generateOutreachMessage } from '../../utils/gemini';
import { getInitials, getAvatarGradient, buildWhatsAppUrl } from '../../utils/helpers';
import { isAdminSession } from '../../utils/session';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

export default function AIMatchmaker() {
  const { activeMembers: members, apiKey, notify } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const [outreachModal, setOutreachModal] = useState({
    isOpen: false,
    match: null,
    message: '',
    loading: false,
  });

  const isAdmin = isAdminSession();
  const targetMember = members.find((m) => m.id === selectedMemberId);

  const handleFindMatches = async () => {
    if (!targetMember || !apiKey) return;
    setLoading(true);
    setMatches([]);
    try {
      const results = await generateMatches(targetMember, members);
      setMatches(results);
      if (results.length === 0) {
        notify('No suitable matches found in the current directory', 'info');
      }
    } catch (err) {
      console.error(err);
      notify('Matchmaking failed: ' + (err.message || 'Check Gemini API Key'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOutreach = async (matchItem) => {
    setOutreachModal({ isOpen: true, match: matchItem.member, message: '', loading: true });
    try {
      const msg = await generateOutreachMessage(targetMember, matchItem.member);
      setOutreachModal((prev) => ({ ...prev, message: msg, loading: false }));
    } catch (err) {
      console.error(err);
      setOutreachModal((prev) => ({
        ...prev,
        message: `Hi ${matchItem.member.name}, I saw your profile in the Entrepreneurs Directory! I run ${targetMember.business} and would love to connect about potential synergies.`,
        loading: false,
      }));
    }
  };

  const handleCopyOutreach = () => {
    navigator.clipboard.writeText(outreachModal.message);
    setCopiedOutreach(true);
    notify('📋 Outreach message copied to clipboard!');
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-stone-950 text-white border-[1.5px] border-stone-800 shadow-tactile dark:shadow-tactile-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-600/20 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl flex-shrink-0 border-[1.5px] border-emerald-400 shadow-tactile-sm">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">
              AI Collaboration Matchmaker
            </h2>
            <p className="text-[13.5px] sm:text-sm font-medium text-stone-300 mt-0.5">
              Select a member profile to generate top 5 personalized "You Should Meet..." bilateral
              founder recommendations.
            </p>
          </div>
        </div>
      </div>

      {!apiKey && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-[1.5px] border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-[13.5px] sm:text-sm font-bold text-amber-900 dark:text-amber-300 shadow-tactile-sm dark:shadow-none">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          AI Matchmaking requires a Gemini API Key in Admin → Settings to run semantic evaluations.
        </div>
      )}

      {/* Select member dropdown */}
      <div className="card p-6 sm:p-8 space-y-5 bg-white dark:bg-stone-900 border-[1.5px] border-stone-300 dark:border-stone-800 shadow-tactile-sm dark:shadow-none">
        <div>
          <label className="label">Select Member to Match</label>
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              setMatches([]);
            }}
            className="input text-[14.5px] sm:text-base font-bold py-3.5 border-[1.5px] border-stone-300 dark:border-stone-700 rounded-xl"
          >
            <option value="">-- Choose a member profile --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role} · {m.location?.city || m.location?.country || 'Global'})
              </option>
            ))}
          </select>
        </div>

        {targetMember && (
          <div className="p-4 sm:p-5 bg-[#FAFAF7] dark:bg-stone-850 rounded-2xl text-[13.5px] sm:text-sm space-y-2 border-[1.5px] border-stone-200 dark:border-stone-750">
            <div className="font-black text-stone-950 dark:text-stone-50 text-base font-display">
              Selected Founder: {targetMember.name}
            </div>
            <p className="text-stone-800 dark:text-stone-300 font-medium">
              <strong className="text-sky-700 dark:text-sky-400 font-bold">Looking For:</strong>{' '}
              {targetMember.lookingFor || 'Not specified'}
            </p>
            <p className="text-stone-800 dark:text-stone-300 font-medium">
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                Can Help With:
              </strong>{' '}
              {targetMember.canHelp || 'Not specified'}
            </p>
          </div>
        )}

        <button
          onClick={handleFindMatches}
          disabled={loading || !selectedMemberId || !apiKey}
          className="btn-primary w-full sm:w-auto text-sm font-black py-3 px-6 shadow-tactile-sm"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Sparkles size={18} />}
          {loading
            ? `Analyzing synergy across ${members.length - 1} profiles...`
            : 'Reveal High-Synergy AI Matches'}
        </button>
      </div>

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <h3 className="font-black text-xl text-stone-950 dark:text-stone-100 flex items-center gap-2 font-display">
            <UserCheck className="text-emerald-600 dark:text-emerald-400" size={24} /> Top AI
            Matches for {targetMember.name}
          </h3>

          <div className="space-y-4">
            {matches.map((item, idx) => {
              const m = item.member;
              const waUrl = buildWhatsAppUrl(m.phone);
              const scorePercent = (item.score / 10) * 100;
              return (
                <div
                  key={idx}
                  className="card p-6 space-y-4 border-[1.5px] border-stone-300 dark:border-stone-800 border-l-4 border-l-emerald-600 bg-white dark:bg-stone-900 shadow-tactile-sm dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(m.name)} flex items-center justify-center text-white font-black text-xl flex-shrink-0 border-[1.5px] border-stone-900/40 shadow-tactile-sm`}
                      >
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-stone-950 dark:text-stone-50 font-display">
                          {m.name}
                        </h4>
                        <p className="text-[13px] sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {m.role} · {m.location?.city || ''}, {m.location?.country || 'Global'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="badge bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-black px-3 py-1 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                        {item.score}/10 Match Score
                      </span>
                      <div className="w-28 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl text-[13.5px] sm:text-sm space-y-1.5 border-[1.5px] border-emerald-200 dark:border-emerald-900/60">
                    <div className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>💡</span> Synergy Rationale: {item.headline}
                    </div>
                    <p className="text-emerald-950 dark:text-emerald-100 leading-relaxed font-semibold">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                    <div className="text-[13.5px] sm:text-sm font-semibold text-stone-600 dark:text-stone-400">
                      💼 {m.business}
                    </div>
                    <button
                      onClick={() => handleOpenOutreach(item)}
                      className="btn-accent text-[13px] py-2 px-4 font-bold shadow-tactile-sm"
                    >
                      <MessageCircle size={15} /> Draft Contextual Outreach
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outreach Modal */}
      <Modal
        isOpen={outreachModal.isOpen}
        onClose={() =>
          setOutreachModal({ isOpen: false, match: null, message: '', loading: false })
        }
        title={`Draft Intro Message to ${outreachModal.match?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs font-semibold text-stone-500">
            Personalized outreach drafted based on mutual needs and offers:
          </p>

          {outreachModal.loading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner text="Drafting personalized message..." />
            </div>
          ) : (
            <textarea
              rows={6}
              value={outreachModal.message}
              onChange={(e) => setOutreachModal((prev) => ({ ...prev, message: e.target.value }))}
              className="input font-mono text-sm leading-relaxed"
            />
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCopyOutreach}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              {copiedOutreach ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedOutreach ? 'Copied to Clipboard!' : 'Copy Outreach Message'}</span>
            </button>
            {/* Direct WhatsApp only for Admin Session */}
            {isAdmin && outreachModal.match?.phone && (
              <a
                href={`https://wa.me/${outreachModal.match.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  outreachModal.message
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 border-emerald-700"
              >
                <MessageCircle size={14} /> Send on WhatsApp
              </a>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
