import React, { useState } from 'react';
import { Moon, Sun, Menu, X, Info, ShieldCheck, HeartHandshake, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Modal from '../common/Modal';

export default function Header() {
  const { darkMode, toggleDarkMode, activeMembers: members, sidebarOpen, setSidebarOpen } = useApp();
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 transition-colors">
      {/* Main header bar */}
      <div className="bg-[#F8F9FA]/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-3 sm:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center gap-2.5 sm:gap-4 max-w-[1800px] mx-auto">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 hover:bg-stone-50 transition-all shadow-xs min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Logo mark */}
            <div className="relative shrink-0">
              <img
                src="/bgm-logo.jpg"
                alt="BGM Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover shadow-sm border border-stone-200/80 dark:border-stone-700"
              />
              {/* Subtle emerald live accent dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-950 shadow-xs" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-[17px] font-extrabold text-stone-900 dark:text-white tracking-tight leading-none font-display truncate">
                  SMART DIRECTORY
                </h1>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold uppercase tracking-wider shrink-0">
                  Curated by BGM
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-stone-500 dark:text-stone-400 font-medium mt-0.5 hidden sm:block truncate">
                Peer-to-Peer Network of Egyptian & Regional Founders
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Community Active Member Status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs font-bold shadow-xs transition-all shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span className="text-stone-700 dark:text-stone-300">
              {members?.length || 138} Active Members
            </span>
          </div>

          {/* About This Initiative Button */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-emerald-500 transition-all cursor-pointer shadow-xs min-h-[40px] shrink-0"
            title="About this initiative"
          >
            <Info size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">About</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-xs transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            title="Toggle dark/light mode"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-stone-700" />
            )}
          </button>
        </div>
      </div>

      {/* ── ABOUT THIS INITIATIVE MODAL ──── */}
      {showAboutModal && (
        <Modal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
          title="About Smart Entrepreneurs Directory"
          size="md"
        >
          <div className="space-y-4 text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
            <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-500/20 space-y-1.5">
              <div className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <HeartHandshake size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Why BGM Exists: The Founder Micro-Ecosystem</span>
              </div>
              <p className="text-[12px] text-stone-700 dark:text-stone-300 italic">
                &ldquo;I wanted to create a micro-ecosystem where people can actually help each other without needing to pay thousands just to get an outside opinion... Not another WhatsApp group where everyone joins and nothing happens 😂 — but a place to meet, exchange ideas, share problems, and build together.&rdquo;
              </p>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 pt-0.5">
                — Nia, Founder & Growth Business Consultant
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                Community Principles
              </h4>
              <ul className="space-y-1.5 pl-2 list-disc list-inside text-stone-600 dark:text-stone-300 text-[11.5px]">
                <li><strong className="text-stone-800 dark:text-stone-100">Peer Exchange:</strong> If you face a block in your business, ask here: <em>&ldquo;What do you think the problem is?&rdquo;</em> and offer the same back.</li>
                <li><strong className="text-stone-800 dark:text-stone-100">No Cold Pitching:</strong> Treat fellow founders as collaborators and peers, not as a cold sales leads list.</li>
                <li><strong className="text-stone-800 dark:text-stone-100">Growth Gap Diagnostics:</strong> For working businesses that hit a growth ceiling, Nia provides direct diagnostic sessions to uncover blockers and build growth strategies.</li>
                <li><strong className="text-stone-800 dark:text-stone-100">Respect & Privacy:</strong> Direct phone numbers and personal contact information are kept protected for confirmed members.</li>
              </ul>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-750 text-[11px] text-stone-500 dark:text-stone-400">
              💡 <strong>Profile Updates:</strong> To update your venture info, stage, or what you are currently seeking, reach out directly to Nia or the BGM community team.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}
