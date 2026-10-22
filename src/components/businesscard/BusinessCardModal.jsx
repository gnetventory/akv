import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  Download,
  Linkedin,
  MapPin,
  Briefcase,
  Sparkles,
  Layers,
  RefreshCw,
  Check,
  Smartphone,
  QrCode,
} from 'lucide-react';
import Modal from '../common/Modal';
import { getInitials, getAvatarGradient, downloadVCardFile } from '../../utils/helpers';
import { STAGES, getCountryFlag } from '../../utils/constants';
import { useApp } from '../../contexts/AppContext';
import { isAdminSession } from '../../utils/session';
import { QRCodeSVG } from '../common/QRCodeSVG';

export const CARD_THEMES = [
  {
    id: 'gold_obsidian',
    name: 'Cairo Obsidian & Gold',
    icon: '👑',
    desc: 'Matte obsidian, gold metallic foil & Islamic geometric watermark',
    bg: 'linear-gradient(135deg, #090a0f 0%, #171923 50%, #090a0f 100%)',
    borderColor: '#d4af37',
    textColor: '#fef08a',
    accentColor: '#f59e0b',
    badgeBg: 'rgba(212, 175, 55, 0.15)',
    badgeBorder: 'rgba(212, 175, 55, 0.4)',
    qrBg: '#ffffff',
    pattern: 'gold',
  },
  {
    id: 'nile_emerald',
    name: 'Nile Emerald & Pearl',
    icon: '🌿',
    desc: 'Deep royal emerald, warm pearl highlights & gold trim',
    bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)',
    borderColor: '#34d399',
    textColor: '#a7f3d0',
    accentColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    qrBg: '#ffffff',
    pattern: 'emerald',
  },
  {
    id: 'cyber_gradient',
    name: 'Silicon Nile / Cyber Hologram',
    icon: '🚀',
    desc: 'Tech neon gradient, holographic glow & glassmorphism',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
    borderColor: '#818cf8',
    textColor: '#c7d2fe',
    accentColor: '#fb923c',
    badgeBg: 'rgba(99, 102, 241, 0.25)',
    badgeBorder: 'rgba(99, 102, 241, 0.4)',
    qrBg: '#ffffff',
    pattern: 'cyber',
  },
  {
    id: 'swiss_clean',
    name: 'Executive Minimalist',
    icon: '⚡',
    desc: 'Stark high-contrast layout with warm orange accents',
    bg: 'linear-gradient(135deg, #ffffff 0%, #fbfaf8 100%)',
    borderColor: '#ea580c',
    textColor: '#78350f',
    accentColor: '#ea580c',
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    badgeBorder: 'rgba(249, 115, 22, 0.3)',
    qrBg: '#0f172a',
    isLight: true,
  },
];

export default function BusinessCardModal({ member, isOpen, onClose }) {
  const { notify } = useApp();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [themeId, setThemeId] = useState('gold_obsidian');
  const [cardSide, setCardSide] = useState('front'); // 'front' | 'back'

  if (!member) return null;

  const isAdmin = isAdminSession();
  const stage = STAGES[member.stage] || STAGES.idea;
  const initials = getInitials(member.name);
  const gradient = getAvatarGradient(member.name);
  const flag = getCountryFlag(member.location?.country);
  const currentTheme = CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];

  const linkedinUrl = member.linkedin
    ? member.linkedin.startsWith('http')
      ? member.linkedin
      : `https://${member.linkedin}`
    : `https://www.google.com/search?q=${encodeURIComponent(member.name + ' ' + (member.business || 'Entrepreneur'))}`;

  const linkedinHandle = member.linkedin
    ? member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '').replace(/\/$/, '')
    : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${member.name.replace(/\s+/g, '_')}_${themeId}_${cardSide}.png`;
      link.click();
      notify(`Business Card (${cardSide.toUpperCase()}) downloaded! 🎴`);
    } catch (err) {
      console.error(err);
      notify('Failed to generate card image', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Executive Digital Business Card" size="lg">
      <div className="space-y-6">
        {/* ── Theme Switcher Bar ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" /> Choose Luxury Theme:
            </span>
            {/* Side Toggle: Front / Back */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setCardSide('front')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cardSide === 'front'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Front Side (QR)
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cardSide === 'back'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Back Side (Pitch & Offers)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CARD_THEMES.map((theme) => {
              const isSelected = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  onClick={() => setThemeId(theme.id)}
                  className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between space-y-1.5 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{theme.icon}</span>
                    {isSelected && <Check size={14} className="text-orange-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-stone-900 dark:text-stone-100 leading-tight">
                      {theme.name.split('/')[0].trim()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Card Graphic Canvas Preview ─────────────────────────────────────── */}
        <div className="flex justify-center py-2 overflow-x-auto">
          <div
            ref={cardRef}
            className="w-full max-w-[580px] min-h-[330px] relative overflow-hidden rounded-3xl p-7 shadow-2xl transition-all duration-300 flex flex-col justify-between"
            style={{
              background: currentTheme.bg,
              border: `1.5px solid ${currentTheme.borderColor}55`,
              boxShadow: `0 20px 50px -10px ${currentTheme.accentColor}33`,
            }}
          >
            {/* Geometric watermark / gradient overlays */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Glowing corner halo */}
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: currentTheme.accentColor }}
            />

            {/* Left Accent Border Stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 rounded-l-3xl"
              style={{
                background: `linear-gradient(to bottom, ${currentTheme.accentColor}, ${currentTheme.borderColor})`,
              }}
            />

            {/* ── CARD FRONT SIDE ────────────────────────────────────────────── */}
            {cardSide === 'front' ? (
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                {/* Top Brand Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm"
                      style={{
                        background: currentTheme.accentColor,
                        color: currentTheme.isLight ? '#ffffff' : '#000000',
                      }}
                    >
                      🚀
                    </div>
                    <div>
                      <span
                        className="text-[11px] font-black uppercase tracking-[0.25em] block leading-none"
                        style={{ color: currentTheme.accentColor }}
                      >
                        SMART DIRECTORY
                      </span>
                      <span
                        className="text-[9px] font-semibold opacity-60"
                        style={{ color: currentTheme.isLight ? '#444' : '#fff' }}
                      >
                        Executive Founder Pass
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs"
                    style={{
                      background: currentTheme.badgeBg,
                      borderColor: currentTheme.badgeBorder,
                      color: currentTheme.accentColor,
                    }}
                  >
                    {stage.icon} {stage.label}
                  </span>
                </div>

                {/* Middle: Identity + Live Scannable QR Code */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left Identity */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg border-2`}
                      style={{ borderColor: currentTheme.borderColor }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <h2
                        className="text-2xl font-black tracking-tight leading-none truncate"
                        style={{ color: currentTheme.isLight ? '#0f172a' : '#ffffff' }}
                      >
                        {member.name}
                      </h2>
                      <p
                        className="text-sm font-bold mt-1 truncate"
                        style={{ color: currentTheme.accentColor }}
                      >
                        {member.role || 'Entrepreneur & Founder'}
                      </p>
                      {member.location?.country && (
                        <p
                          className="text-xs mt-1 flex items-center gap-1 font-semibold"
                          style={{ color: currentTheme.isLight ? '#475569' : '#94a3b8' }}
                        >
                          <MapPin size={12} />
                          {flag}{' '}
                          {[member.location.city, member.location.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Live Scannable QR Code Container */}
                  <div className="flex flex-col items-center flex-shrink-0 text-center space-y-1">
                    <div
                      className="p-1.5 rounded-xl shadow-md border"
                      style={{
                        background: '#ffffff',
                        borderColor: currentTheme.borderColor,
                      }}
                    >
                      <QRCodeSVG value={linkedinUrl} size={80} />
                    </div>
                    <span
                      className="text-[9px] font-extrabold uppercase tracking-widest"
                      style={{ color: currentTheme.accentColor }}
                    >
                      Scan to Connect
                    </span>
                  </div>
                </div>

                {/* Card Front Footer */}
                <div
                  className="pt-3 border-t flex items-center justify-between text-[10px] font-semibold"
                  style={{
                    borderColor: `${currentTheme.borderColor}33`,
                    color: currentTheme.isLight ? '#64748b' : '#94a3b8',
                  }}
                >
                  <span className="truncate">International Entrepreneurs Community</span>
                  <div className="flex items-center gap-3">
                    {linkedinHandle && (
                      <span
                        className="font-bold flex items-center gap-1"
                        style={{ color: currentTheme.accentColor }}
                      >
                        <Linkedin size={12} /> in/{linkedinHandle}
                      </span>
                    )}
                    {isAdmin && member.phone && (
                      <span className="font-mono font-bold">{member.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── CARD BACK SIDE ────────────────────────────────────────────── */
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                {/* Header Back */}
                <div
                  className="flex items-center justify-between border-b pb-2.5"
                  style={{ borderColor: `${currentTheme.borderColor}33` }}
                >
                  <div>
                    <h3
                      className="text-base font-black tracking-tight"
                      style={{ color: currentTheme.isLight ? '#0f172a' : '#ffffff' }}
                    >
                      {member.name}
                    </h3>
                    <p className="text-xs font-bold" style={{ color: currentTheme.accentColor }}>
                      {member.business ? 'Venture Overview' : member.role}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold opacity-70"
                    style={{ color: currentTheme.isLight ? '#444' : '#fff' }}
                  >
                    SED ID #{member.id?.slice(0, 6).toUpperCase()}
                  </span>
                </div>

                {/* Business summary */}
                {member.business && (
                  <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{
                      background: currentTheme.badgeBg,
                      borderColor: currentTheme.badgeBorder,
                    }}
                  >
                    <span
                      className="text-[9px] font-black uppercase tracking-widest block"
                      style={{ color: currentTheme.accentColor }}
                    >
                      💼 Executive Pitch
                    </span>
                    <p
                      className="text-xs leading-relaxed font-semibold line-clamp-3"
                      style={{ color: currentTheme.isLight ? '#1e293b' : '#e2e8f0' }}
                    >
                      {member.business}
                    </p>
                  </div>
                )}

                {/* Needs & Offers Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {member.lookingFor && (
                    <div className="p-2.5 rounded-xl border bg-black/10 dark:bg-white/5 border-stone-400/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block mb-0.5">
                        🎯 Looking For
                      </span>
                      <p
                        className="line-clamp-2 font-medium"
                        style={{ color: currentTheme.isLight ? '#334155' : '#cbd5e1' }}
                      >
                        {member.lookingFor}
                      </p>
                    </div>
                  )}
                  {member.canHelp && (
                    <div className="p-2.5 rounded-xl border bg-black/10 dark:bg-white/5 border-stone-400/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                        🤝 Offering
                      </span>
                      <p
                        className="line-clamp-2 font-medium"
                        style={{ color: currentTheme.isLight ? '#334155' : '#cbd5e1' }}
                      >
                        {member.canHelp}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {member.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.tags.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          background: currentTheme.badgeBg,
                          borderColor: currentTheme.badgeBorder,
                          color: currentTheme.accentColor,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Download Actions ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => {
              downloadVCardFile(member, isAdmin);
              notify(`Saved ${member.name}'s contact card (.vcf)`);
            }}
            className="btn-primary px-6 py-3 text-xs font-bold shadow-md flex items-center gap-2"
          >
            <Download size={15} /> Save Contact (.vcf)
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-accent px-6 py-3 text-xs font-bold shadow-lg flex items-center gap-2"
          >
            <Download size={15} />
            {downloading ? 'Exporting High-Res PNG...' : `Export PNG (${cardSide.toUpperCase()})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
