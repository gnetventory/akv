import React, { useState } from 'react';
import { FileText, Copy, Sparkles, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateWeeklyDigest } from '../../utils/gemini';
import { isWithinDays, copyToClipboard } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

export default function WeeklyDigest() {
  const { activeMembers: members, apiKey, notify } = useApp();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [digestText, setDigestText] = useState('');
  const [copied, setCopied] = useState(false);

  const recentMembers = members.filter((m) => isWithinDays(m.createdAt, days));

  const handleGenerate = async () => {
    if (recentMembers.length === 0) {
      notify(`No new members added in the last ${days} days`, 'warning');
      return;
    }
    setLoading(true);
    try {
      if (apiKey) {
        const text = await generateWeeklyDigest(recentMembers, `${days} days`);
        setDigestText(text);
      } else {
        const lines = [
          `🌟 *NEW MEMBERS ROUNDUP (Last ${days} Days)* 🌟\n`,
          `Welcome our newest entrepreneurs to the community! Take a moment to reach out:\n`,
        ];
        recentMembers.forEach((m) => {
          lines.push(
            `• *${m.name}* (${m.location?.city || m.location?.country || 'Global'}) — _${m.role}_`
          );
          if (m.lookingFor) lines.push(`  🔍 LF: ${m.lookingFor}`);
          lines.push('');
        });
        lines.push('💬 Say hello and explore synergies in our community directory!');
        setDigestText(lines.join('\n'));
      }
    } catch (err) {
      console.error(err);
      notify('Failed to generate digest text', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(digestText);
    setCopied(true);
    notify('Weekly digest copied! Ready to paste into WhatsApp');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-stone-950 text-white border-[1.5px] border-stone-800 shadow-tactile dark:shadow-tactile-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-600/20 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl flex-shrink-0 border-[1.5px] border-emerald-400 shadow-tactile-sm">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">
              WhatsApp Weekly Digest Generator
            </h2>
            <p className="text-[13.5px] sm:text-sm font-medium text-stone-300 mt-0.5">
              Auto-generate structured WhatsApp broadcast announcements highlighting recent cohort
              joiners and trending needs.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6 sm:p-8 space-y-5 bg-white dark:bg-stone-900 border-[1.5px] border-stone-300 dark:border-stone-800 shadow-tactile-sm dark:shadow-none">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b-[1.5px] border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <label className="label mb-0">Cohort Range:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input py-2 px-4 text-[13.5px] sm:text-sm font-bold w-auto border-[1.5px] border-stone-300 dark:border-stone-700"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <div className="text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-400">
            Found{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-black">
              {recentMembers.length}
            </strong>{' '}
            new member(s)
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || recentMembers.length === 0}
          className="btn-primary text-sm font-bold shadow-tactile-sm"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Sparkles size={18} />}
          {loading ? 'Formatting Digest with AI...' : 'Generate WhatsApp Digest Message'}
        </button>
      </div>

      {/* Digest Output */}
      {digestText && (
        <div className="card p-6 sm:p-8 space-y-5 animate-slide-up bg-white dark:bg-stone-900 border-[1.5px] border-stone-300 dark:border-stone-800 shadow-tactile-sm dark:shadow-none">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-black text-base uppercase tracking-wider text-stone-950 dark:text-stone-100 font-display">
              📲 Ready-to-Post WhatsApp Broadcast Message
            </h3>
            <button
              onClick={handleCopy}
              className="btn-accent text-[13px] font-bold shadow-tactile-sm py-2 px-4"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Format'}
            </button>
          </div>

          <textarea
            rows={11}
            value={digestText}
            onChange={(e) => setDigestText(e.target.value)}
            className="input font-mono text-[13.5px] sm:text-sm leading-relaxed p-5 bg-[#FAFAF7] dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-[1.5px] border-stone-300 dark:border-stone-800 rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
