import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  ShieldCheck,
  Target,
  Award,
  Lightbulb,
} from 'lucide-react';
import Modal from './Modal';
import { explainProfileStrength, explainMemberSynergy } from '../../utils/explainability';

export default function ScoreExplainerModal({
  isOpen,
  onClose,
  type = 'profile_strength', // 'profile_strength' | 'synergy_match'
  member = null,
  targetMember = null,
  candidateMember = null,
}) {
  if (!isOpen) return null;

  if (type === 'profile_strength') {
    const data = explainProfileStrength(member);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="📊 Profile Strength & Ecosystem Readiness"
        size="md"
      >
        <div className="space-y-5 text-xs text-stone-900 dark:text-stone-100">
          {/* Header Score Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-950 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <span className="text-[10.5px] uppercase font-mono font-black tracking-widest text-orange-400 block">
                Ecosystem Status Tier
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">{data.tier.icon}</span>
                <h3 className="text-base sm:text-lg font-black font-display text-white">
                  {data.tier.name}
                </h3>
              </div>
              <p className="text-[11px] text-stone-300 font-medium">
                {member?.name ? `${member.name}'s Profile Readiness` : 'Alliance Member'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black font-mono font-display text-orange-400">
                {data.score}%
              </div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
                Readiness Score
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-stone-600 dark:text-stone-300">
              <span>Overall Progress</span>
              <span>{data.score}/100 pts</span>
            </div>
            <div className="h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>

          {/* Checklist Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Scoring Breakdown & Checklist:
            </h4>

            <div className="space-y-2">
              {data.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                    item.done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {item.done ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle size={16} className="text-stone-400 dark:text-stone-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        {item.label}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-black shrink-0 px-2 py-0.5 rounded-md ${
                      item.done
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    +{item.points}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Boost Advice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <Lightbulb size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                Actionable Optimization Hint:
              </span>
              <p className="text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                {data.boostAdvice}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Synergy Match Explainer
  if (type === 'synergy_match') {
    const data = explainMemberSynergy(targetMember, candidateMember);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="⚡ AI Collaboration MatchMaker — Synergy Breakdown"
        size="md"
      >
        <div className="space-y-5 text-xs text-stone-900 dark:text-stone-100">
          {/* Pairing Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-orange-100 block">
                Bilateral Synergy Match
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">
                {targetMember?.name} ⇄ {candidateMember?.name}
              </h3>
              <p className="text-[11px] text-orange-100 font-medium mt-0.5">
                {candidateMember?.business || candidateMember?.role}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black font-mono text-white">{data.score}%</div>
              <span className="text-[10px] text-orange-100 uppercase tracking-wider font-bold">
                Compatibility
              </span>
            </div>
          </div>

          {/* Rationale Sentence */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-100 font-medium leading-relaxed">
            💡 <strong>Why this match:</strong> {data.rationale}
          </div>

          {/* 5-Dimension Score Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Scoring Factors Breakdown:
            </h4>

            <div className="space-y-2">
              {data.dimensions.map((dim) => (
                <div
                  key={dim.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                      <span>{dim.icon}</span>
                      <span>{dim.label}</span>
                    </div>
                    <span className="font-mono font-black text-xs text-orange-600 dark:text-orange-400">
                      {dim.score}/{dim.maxScore} pts
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    {dim.description}
                  </p>

                  <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (dim.score / dim.maxScore) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boost Advice */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11.5px] text-blue-900 dark:text-blue-200 font-medium flex items-center gap-2">
            <Zap size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{data.boostAdvice}</span>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}
