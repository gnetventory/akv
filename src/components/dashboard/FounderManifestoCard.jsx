import React, { useState } from 'react';
import {
  Sparkles,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  X,
  Compass,
} from 'lucide-react';

export default function FounderManifestoCard({
  onOpenDiagnostic,
  onOpenProblemBoard,
  onOpenAbout,
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">
            BGM Founder Micro-Ecosystem: Peer support, zero high consulting fees.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDiagnostic}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Growth Diagnostic
          </button>
          <span className="text-stone-400">•</span>
          <button
            onClick={() => setIsDismissed(false)}
            className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
          >
            Show Manifesto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-950 via-stone-900 to-slate-950 text-white border border-emerald-500/30 shadow-xl overflow-hidden transition-all">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
        title="Minimize banner"
        aria-label="Minimize manifesto banner"
      >
        <X size={15} />
      </button>

      <div className="relative z-10 space-y-4 max-w-4xl">
        {/* Header badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
          <Compass size={13} className="text-emerald-400" />
          <span>Why BGM Exists • The Founder Micro-Ecosystem</span>
        </div>

        {/* The Quote & Mission */}
        <div className="space-y-2">
          <blockquote className="text-sm sm:text-base font-medium text-stone-100 leading-relaxed italic">
            &ldquo;I wanted to create a micro-ecosystem where people can actually help each other without needing to pay thousands just to get an outside opinion...
            So no, I don&apos;t want another WhatsApp group where everyone joins and nothing happens 😂.
            I want us to actually meet, exchange ideas, share problems, and build together.&rdquo;
          </blockquote>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <span>— Nia</span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300 font-normal">Founder & Growth Business Consultant</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {/* Action 1: Stuck? 1-on-1 Growth Diagnostic */}
          <button
            onClick={onOpenDiagnostic}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <TrendingUp size={16} className="text-stone-950" />
            <span>Stuck in Business? Book Growth Diagnostic with Nia</span>
            <ArrowRight size={14} />
          </button>

          {/* Action 2: Founder Problem Board */}
          <button
            onClick={onOpenProblemBoard}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <HelpCircle size={15} className="text-emerald-400" />
            <span>Founder Problem Board (Ask a Founder)</span>
          </button>

          {/* Action 3: Read Full Vision */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="text-xs text-stone-300 hover:text-white underline underline-offset-4 font-medium transition cursor-pointer px-2 py-1"
            >
              Read full principles & manifesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
